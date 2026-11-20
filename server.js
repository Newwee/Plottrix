/**
 * Plottrix Local Web Server (Node.js)
 * High-Performance Standalone Server with Smart Model Routing, Context Caching Fallback & Guardrails
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = parseInt(process.env.PORT, 10) || 3000;
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || "";

// Smart Model Routing Configuration
const MODEL_ROUTING = {
  light: "gemini-3.5-flash-lite",   // Proofread & Batch Proofread
  core: "gemini-3.8-flash",         // Polish, Continuity, Translation, Plot Branch
  deep: "gemini-4-hydrogen",        // Full-Book Context Analysis (Ultra)
  fallback: "gemini-3.5-flash-lite" // Universal Fallback
};

// Gemini Context Caching Minimum Threshold (~32,768 tokens, approx ~85,000 Thai/English characters)
const CONTEXT_CACHE_MIN_CHARS = 85000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

/**
 * Make HTTPS request to Google Generative Language API
 */
function callGoogleApi(model, apiKey, payload, cachedContentName = null) {
  return new Promise((resolve, reject) => {
    // If cachedContent is provided, attach it; else standard payload
    const bodyToSend = Object.assign({}, payload);
    if (cachedContentName) {
      bodyToSend.cachedContent = cachedContentName;
    }

    const postData = JSON.stringify(bodyToSend);
    const reqOptions = {
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 45000
    };

    const req = https.request(reqOptions, (res) => {
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            raw: rawData,
            error: "Failed to parse JSON response"
          });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request to Google API timed out (45s)"));
    });

    req.write(postData);
    req.end();
  });
}

// IP / Client Request Tracker for Free Plan Cooldown (5 Seconds)
const lastClientCallMap = new Map();

const server = http.createServer((req, res) => {
  // Global CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Client-Plan");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const clientIp = req.socket.remoteAddress || "localhost";

  // 1. Server Status Check
  if (pathname === "/api/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      success: true,
      service: "Plottrix Studio Backend",
      routing: MODEL_ROUTING,
      contextCacheMinChars: CONTEXT_CACHE_MIN_CHARS,
      keyConfigured: Boolean(DEFAULT_API_KEY)
    }));
    return;
  }

  // 2. Ping Test Endpoint
  if (pathname === "/api/test-key" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const bodyJson = body ? JSON.parse(body) : {};
        const key = bodyJson.apiKey || DEFAULT_API_KEY;
        const requestedModel = bodyJson.model || MODEL_ROUTING.core;

        const pingPayload = {
          contents: [{ parts: [{ text: "ทดสอบการเชื่อมต่อ Plottrix AI: ช่วยแนะนำไอเดียเปิดเรื่องนิยายสั้นๆ 1 ประโยค" }] }]
        };

        const startTime = Date.now();
        const models = [requestedModel, MODEL_ROUTING.light, MODEL_ROUTING.core];
        let lastResp = null;

        for (const m of models) {
          try {
            const apiResp = await callGoogleApi(m, key, pingPayload);
            if (apiResp.statusCode === 200 && apiResp.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              const replyText = apiResp.data.candidates[0].content.parts[0].text.trim();
              const latencyMs = Date.now() - startTime;
              res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({
                success: true,
                model: m,
                reply: replyText,
                latencyMs: latencyMs
              }));
              return;
            }
            lastResp = apiResp;
            if (apiResp.statusCode !== 503 && apiResp.statusCode !== 404) break;
          } catch (modelErr) {
            console.warn(`[Ping Test] Model ${m} network error:`, modelErr.message);
          }
        }

        const errMsg = lastResp?.data?.error?.message || "ไม่สามารถดึงข้อมูลจาก Gemini API ได้";
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          success: false,
          error: errMsg,
          details: lastResp?.data
        }));

      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. Proxy Gemini generateContent with Smart Model Routing & Context Caching Fallback
  if ((pathname === "/api/ai/execute" || pathname === "/api/ai" || pathname === "/api/gemini") && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const { processAiRequest } = await import("./api/aiEngine.js");
        const resp = await processAiRequest(parsed, DEFAULT_API_KEY);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(resp));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    });
    return;
  }

  // 4. Static Files
  let targetFile = pathname;
  if (targetFile === "/" || targetFile === "/index.html") {
    targetFile = "index.html";
  } else {
    targetFile = targetFile.replace(/^\/+/, "");
  }

  const filePath = path.join(__dirname, targetFile);

  // Directory traversal check
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 Not Found: /${targetFile}`);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

function listen(port) {
  server.listen(port, () => {
    console.log("===============================================================");
    console.log(`🚀 Plottrix Server กำลังทำงานที่: http://localhost:${port}`);
    console.log(`⚡ Smart Model Routing:`);
    console.log(`   - Light Tasks: ${MODEL_ROUTING.light}`);
    console.log(`   - Core Tasks:  ${MODEL_ROUTING.core}`);
    console.log(`   - Deep Tasks:  ${MODEL_ROUTING.deep}`);
    console.log(`🛡️  Context Caching Fallback: เปิดใช้งาน (< ${CONTEXT_CACHE_MIN_CHARS} ตัวอักษร -> Standard Prompt)`);
    console.log(`⏳ Free Plan Cooldown: 5 วินาที / ครั้ง`);
    console.log(`👉 เปิดเว็บได้ที่: http://localhost:${port}`);
    console.log("===============================================================");
  }).on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`พอร์ต ${port} กำลังถูกใช้งาน กำลังเปลี่ยนไปใช้พอร์ต ${port + 1}...`);
      listen(port + 1);
    } else {
      console.error("เกิดข้อผิดพลาดในการรันเซิร์ฟเวอร์:", err);
    }
  });
}

listen(PORT);
