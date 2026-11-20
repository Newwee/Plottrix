/**
 * Vercel Serverless Function: /api/og-preview
 * Serves dynamic Open Graph and Twitter Card HTML for social crawlers (LINE, Facebook, Discord, Twitter/X, Telegram).
 * When shared in chat apps, generates high-res cover image preview and story title.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jqgbgqlhztixhkrqdwtf.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BE_MPg4wcaBIr5eFEHqAbg_U-qOrLTQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default async function handler(req, res) {
  const { id, type = 'story' } = req.query || {}

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const baseUrl = 'https://plottrix.vercel.app'
  const fallbackCover = `${baseUrl}/Logo/PlottrixFullLogo.png`

  let title = 'Plottrix — พื้นที่เขียนนิยายอัจฉริยะที่นักเขียนคุมเกมเอง'
  let description = 'แพลตฟอร์มเขียนและอ่านนิยายออนไลน์ พร้อมระบบ AI ช่วยขัดเกลาสำนวน ตรวจคำผิด และคุม Story Bible'
  let author = 'นักเขียน Plottrix'
  let genre = 'นิยายออนไลน์'
  let coverUrl = fallbackCover
  let targetUrl = id ? `${baseUrl}/story/${encodeURIComponent(id)}` : baseUrl

  if (id) {
    try {
      const { data: novel } = await supabase
        .from('novels')
        .select('id, title, synopsis, author_display_name, genre, cover_url, cover_images')
        .eq('id', id)
        .single()

      if (novel) {
        if (novel.title) title = novel.title
        if (novel.author_display_name) author = novel.author_display_name
        if (novel.genre) genre = novel.genre
        if (novel.synopsis) {
          description = novel.synopsis.replace(/\s+/g, ' ').trim()
          if (description.length > 220) {
            description = description.substring(0, 217) + '...'
          }
        }
        // Use our dedicated dynamic cover endpoint so base64 or external covers both work cleanly in chat apps
        coverUrl = `${baseUrl}/api/story-cover?id=${encodeURIComponent(id)}`
      }
    } catch (err) {
      console.warn('[OG Preview] Supabase fetch warning:', err?.message)
    }
  }

  const pageTitle = `${title} | โดย ${author} — Plottrix`
  const safeTitle = escapeHtml(pageTitle)
  const safeOgTitle = escapeHtml(`${title} | โดย ${author}`)
  const safeDesc = escapeHtml(description)
  const safeCover = escapeHtml(coverUrl)
  const safeUrl = escapeHtml(targetUrl)
  const safeGenre = escapeHtml(genre)

  const html = `<!doctype html>
<html lang="th" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="theme-color" content="#7c3aed">
  <link rel="icon" type="image/png" href="${baseUrl}/Logo/PlottrixSingleLogo.png">

  <!-- Open Graph / Facebook / LINE / Messenger / WhatsApp -->
  <meta property="og:site_name" content="Plottrix — พื้นที่เขียนนิยายอัจฉริยะ">
  <meta property="og:type" content="book">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:title" content="${safeOgTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeCover}">
  <meta property="og:image:secure_url" content="${safeCover}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta property="og:locale" content="th_TH">

  <!-- Twitter Card / Discord -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@plottrix">
  <meta name="twitter:url" content="${safeUrl}">
  <meta name="twitter:title" content="${safeOgTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeCover}">
  <meta name="twitter:image:alt" content="${escapeHtml(title)}">

  <!-- Seamless Redirect for human browsers -->
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace(${JSON.stringify(targetUrl)});
    }
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=${safeUrl}">
  </noscript>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090713;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .preview-card {
      max-width: 480px;
      width: 100%;
      background: #140d2b;
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.8);
      text-align: center;
    }
    .cover {
      width: 160px;
      height: 220px;
      object-fit: cover;
      border-radius: 16px;
      margin: 0 auto 16px;
      box-shadow: 0 10px 30px rgba(168,85,247,0.4);
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
      line-height: 1.4;
    }
    .meta {
      font-size: 13px;
      color: #c084fc;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 20px;
      text-align: left;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #9333ea, #4f46e5);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border-radius: 14px;
      box-shadow: 0 10px 25px rgba(147, 51, 234, 0.4);
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="preview-card">
    <img src="${safeCover}" alt="${escapeHtml(title)}" class="cover" onerror="this.src='${fallbackCover}'" />
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">โดย ${escapeHtml(author)} · ${safeGenre}</div>
    <p class="desc">${safeDesc}</p>
    <a href="${safeUrl}" class="btn">🚀 เข้าอ่านนิยายบน Plottrix</a>
  </div>
</body>
</html>`

  return res.status(200).send(html)
}
