import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts'
import { requireAuthenticatedUser, sha256Hex } from '../_shared/supabaseAdmin.ts'
import { validateSlipImageBytes } from '../_shared/slipFileValidation.ts'
import { EasySlipV2Provider } from '../_shared/providers/easyslipV2Provider.ts'
import { evaluateEasySlipVerification } from '../_shared/verificationRules.ts'

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method Not Allowed' } }, 405, origin)
  }

  try {
    const auth = await requireAuthenticatedUser(req)
    if (!auth.user || !auth.supabaseAdmin) {
      return jsonResponse({ error: { message: auth.error } }, auth.status, origin)
    }

    const userId = auth.user.id
    const admin = auth.supabaseAdmin
    const contentType = (req.headers.get('content-type') || '').toLowerCase()

    let orderId = ''
    let paymentMethod: 'promptpay' | 'bank_transfer' = 'promptpay'
    let retryPaymentId = ''
    let slipFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      orderId = String(formData.get('orderId') || '').trim()
      const methodRaw = String(formData.get('paymentMethod') || '').trim().toLowerCase()
      if (methodRaw !== 'promptpay' && methodRaw !== 'bank_transfer') {
        return jsonResponse({ error: { message: 'ช่องทางการชำระเงินไม่ถูกต้อง' } }, 400, origin)
      }
      paymentMethod = methodRaw
      const fileEntry = formData.get('slip')
      if (fileEntry instanceof File) {
        slipFile = fileEntry
      }
    } else {
      const body = await req.json().catch(() => ({}))
      orderId = String(body?.orderId || '').trim()
      retryPaymentId = String(body?.retryPaymentId || '').trim()
      const methodRaw = String(body?.paymentMethod || '').trim().toLowerCase()
      if (methodRaw !== 'promptpay' && methodRaw !== 'bank_transfer') {
        return jsonResponse({ error: { message: 'ช่องทางการชำระเงินไม่ถูกต้อง' } }, 400, origin)
      }
      paymentMethod = methodRaw
    }

    if (!orderId) {
      return jsonResponse({ error: { message: 'ไม่พบรหัสคำสั่งซื้อ (Order ID)' } }, 400, origin)
    }

    const { data: orderPrecheck, error: orderFetchErr } = await admin
      .from('membership_orders')
      .select('id, order_code, user_id, amount, amount_satang, currency, status, expires_at')
      .eq('id', orderId)
      .maybeSingle()

    if (orderFetchErr || !orderPrecheck) {
      return jsonResponse({ error: { message: 'ไม่พบคำสั่งซื้อที่ระบุ' } }, 404, origin)
    }

    if (orderPrecheck.user_id !== userId) {
      return jsonResponse({ error: { message: 'คุณไม่มีสิทธิ์ส่งหลักฐานสำหรับคำสั่งซื้อนี้' } }, 403, origin)
    }

    if (orderPrecheck.status === 'PAID') {
      return jsonResponse(
        {
          success: true,
          status: 'VERIFIED',
          orderStatus: 'PAID',
          message: 'ชำระเงินสำเร็จ! Premium Membership ของคุณเปิดใช้งานแล้ว'
        },
        200,
        origin
      )
    }

    if (orderPrecheck.status === 'MANUAL_REVIEW') {
      return jsonResponse(
        {
          success: true,
          status: 'MANUAL_REVIEW',
          orderStatus: 'MANUAL_REVIEW',
          message: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
        },
        200,
        origin
      )
    }

    if (orderPrecheck.status === 'EXPIRED' || orderPrecheck.status === 'CANCELLED' || orderPrecheck.status === 'REJECTED' || new Date(orderPrecheck.expires_at).getTime() <= Date.now()) {
      return jsonResponse(
        {
          error: {
            code: 'ORDER_EXPIRED',
            message: 'คำสั่งซื้อนี้หมดอายุหรือถูกปิดแล้ว กรุณาสร้างคำสั่งซื้อใหม่'
          }
        },
        400,
        origin
      )
    }

    const { data: channelRow } = await admin
      .from('payment_channel_settings')
      .select('id, channel_type, is_enabled, bank_name, account_name, account_number, promptpay_id')
      .eq('channel_type', paymentMethod)
      .maybeSingle()

    if (!channelRow || !channelRow.is_enabled) {
      return jsonResponse(
        { error: { code: 'CHANNEL_DISABLED', message: 'ช่องทางรับชำระเงินนี้ปิดให้บริการอยู่' } },
        400,
        origin
      )
    }

    const { data: channelRuleRow } = await admin
      .from('payment_channel_verification_rules')
      .select('allowed_bank_codes, expected_account_digits, expected_proxy_type, expected_proxy_value, expected_account_name_th, expected_account_name_en')
      .eq('channel_id', channelRow.id)
      .maybeSingle()

    let imageBytes: Uint8Array
    let mimeType = 'image/jpeg'
    let fileName = 'slip.jpg'
    let storagePath = ''
    let slipSha256 = ''
    let uploadedNewStorageFile = false

    if (retryPaymentId && !slipFile) {
      const { data: prevPayment } = await admin
        .from('membership_payments')
        .select('id, order_id, user_id, verification_status, slip_storage_path, slip_sha256')
        .eq('id', retryPaymentId)
        .eq('order_id', orderId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!prevPayment || (prevPayment.verification_status !== 'PENDING_BANK' && prevPayment.verification_status !== 'PROVIDER_ERROR')) {
        return jsonResponse({ error: { message: 'ไม่พบหลักฐานเดิมที่สามารถตรวจสอบซ้ำได้ กรุณาอัปโหลดสลิปใหม่' } }, 400, origin)
      }

      const { data: fileBlob, error: dlErr } = await admin.storage
        .from('membership-payment-slips')
        .download(prevPayment.slip_storage_path)

      if (dlErr || !fileBlob) {
        return jsonResponse({ error: { message: 'ไม่สามารถดึงไฟล์สลิปเดิมได้ กรุณาอัปโหลดใหม่' } }, 400, origin)
      }

      imageBytes = new Uint8Array(await fileBlob.arrayBuffer())
      const validated = validateSlipImageBytes(imageBytes)
      if (!validated.ok) {
        return jsonResponse({ error: { code: validated.code, message: validated.message } }, 400, origin)
      }
      mimeType = validated.mimeType
      fileName = `retry-slip.${validated.extension}`
      storagePath = prevPayment.slip_storage_path
      slipSha256 = prevPayment.slip_sha256 || await sha256Hex(imageBytes)
    } else {
      if (!slipFile) {
        return jsonResponse({ error: { message: 'กรุณาแนบรูปภาพสลิปการโอนเงิน' } }, 400, origin)
      }
      imageBytes = new Uint8Array(await slipFile.arrayBuffer())
      const validated = validateSlipImageBytes(imageBytes)
      if (!validated.ok) {
        return jsonResponse({ error: { code: validated.code, message: validated.message } }, 400, origin)
      }
      mimeType = validated.mimeType
      fileName = `slip.${validated.extension}`
      slipSha256 = await sha256Hex(imageBytes)
      storagePath = `slips/${userId}/${orderId}/${crypto.randomUUID()}.${validated.extension}`

      const { error: uploadErr } = await admin.storage
        .from('membership-payment-slips')
        .upload(storagePath, imageBytes, {
          contentType: mimeType,
          upsert: false
        })

      if (uploadErr) {
        return jsonResponse({ error: { message: 'ไม่สามารถอัปโหลดไฟล์สลิปได้ กรุณาลองใหม่อีกครั้ง' } }, 500, origin)
      }
      uploadedNewStorageFile = true
    }

    const { data: claimData, error: claimErr } = await admin.rpc('claim_payment_verification_attempt', {
      p_order_id: orderId,
      p_user_id: userId,
      p_payment_method: paymentMethod,
      p_slip_storage_path: storagePath,
      p_slip_sha256: slipSha256,
      p_verification_provider: 'easyslip_v2'
    })

    if (claimErr || !claimData || claimData.success !== true) {
      if (uploadedNewStorageFile) {
        await admin.storage.from('membership-payment-slips').remove([storagePath]).catch(() => {})
      }
      const errStatus = Number(claimData?.http_status || 409)
      return jsonResponse(
        { error: { code: claimData?.code || 'CLAIM_FAILED', message: claimData?.error || claimErr?.message || 'ไม่สามารถเริ่มตรวจสอบสลิปได้' } },
        errStatus,
        origin
      )
    }

    const paymentId = String(claimData.payment_id)
    const attemptId = String(claimData.attempt_id)
    const expectedAmountDecimal = (Number(claimData.amount_satang) / 100).toFixed(2)

    let providerRes
    try {
      const easyslipKey = Deno.env.get('EASYSLIP_API_KEY') || ''
      const provider = new EasySlipV2Provider({ apiKey: easyslipKey })
      providerRes = await provider.verifyBankSlip({
        imageBytes,
        mimeType,
        fileName,
        expectedAmountDecimal,
        orderCode: String(claimData.order_code)
      })
    } catch (providerThrow) {
      await admin.rpc('reject_payment_attempt', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_attempt_id: attemptId,
        p_error_code: 'PROVIDER_RUNTIME_ERROR',
        p_failure_reason: providerThrow instanceof Error ? providerThrow.message : 'Unexpected provider error',
        p_detected_trans_ref: null,
        p_provider_response: null,
        p_target_payment_status: 'PROVIDER_ERROR'
      }).catch(() => {})
      return jsonResponse(
        {
          success: false,
          status: 'PROVIDER_ERROR',
          paymentId,
          canRetry: true,
          message: 'ระบบตรวจสอบการชำระเงินขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'
        },
        503,
        origin
      )
    }

    if (!providerRes.ok) {
      if (providerRes.category === 'SLIP_PENDING') {
        const pendingRes = await admin.rpc('reject_payment_attempt', {
          p_order_id: orderId,
          p_payment_id: paymentId,
          p_attempt_id: attemptId,
          p_error_code: providerRes.errorCode,
          p_failure_reason: providerRes.rawMessage,
          p_detected_trans_ref: null,
          p_provider_response: null,
          p_target_payment_status: 'PENDING_BANK'
        })
        return jsonResponse(
          {
            success: false,
            status: 'PENDING_BANK',
            paymentId,
            orderStatus: pendingRes.data?.order_status || 'PENDING',
            canRetry: true,
            message: 'ข้อมูลธุรกรรมจากธนาคารยังไม่พร้อมในขณะนี้ (เช่น ธ.กรุงเทพ อาจใช้เวลา 2–5 นาที) กรุณารอสักครู่แล้วกดตรวจสอบอีกครั้ง'
          },
          202,
          origin
        )
      }

      if (providerRes.category === 'INVALID_INPUT' || providerRes.category === 'SLIP_INVALID') {
        const rejRes = await admin.rpc('reject_payment_attempt', {
          p_order_id: orderId,
          p_payment_id: paymentId,
          p_attempt_id: attemptId,
          p_error_code: providerRes.errorCode,
          p_failure_reason: providerRes.rawMessage,
          p_detected_trans_ref: null,
          p_provider_response: null,
          p_target_payment_status: 'REJECTED'
        })
        return jsonResponse(
          {
            success: false,
            status: 'REJECTED',
            paymentId,
            errorCode: providerRes.errorCode,
            orderStatus: rejRes.data?.order_status || 'PENDING',
            canRetry: Boolean(rejRes.data?.can_retry),
            message: 'ไม่สามารถตรวจสอบสลิปนี้ได้ กรุณาตรวจสอบรูปภาพและลองอีกครั้ง'
          },
          400,
          origin
        )
      }

      const errRes = await admin.rpc('reject_payment_attempt', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_attempt_id: attemptId,
        p_error_code: providerRes.errorCode,
        p_failure_reason: providerRes.rawMessage,
        p_detected_trans_ref: null,
        p_provider_response: null,
        p_target_payment_status: 'PROVIDER_ERROR'
      })
      return jsonResponse(
        {
          success: false,
          status: 'PROVIDER_ERROR',
          paymentId,
          errorCode: providerRes.errorCode,
          orderStatus: errRes.data?.order_status || 'PENDING',
          canRetry: true,
          message: 'ระบบตรวจสอบการชำระเงินขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'
        },
        503,
        origin
      )
    }

    const { data: latestOrder } = await admin
      .from('membership_orders')
      .select('id, user_id, amount_satang, currency, status, expires_at')
      .eq('id', orderId)
      .single()

    const { data: currentPaymentRow } = await admin
      .from('membership_payments')
      .select('id, verification_attempt_id, verification_status')
      .eq('id', paymentId)
      .single()

    if (!currentPaymentRow || currentPaymentRow.verification_attempt_id !== attemptId || currentPaymentRow.verification_status !== 'VERIFYING') {
      return jsonResponse(
        { error: { code: 'STALE_VERIFICATION_ATTEMPT', message: 'คำขอตรวจสอบนี้ถูกแทนที่หรือดำเนินการแล้ว' } },
        409,
        origin
      )
    }

    const rawTransRef = typeof providerRes.data.rawSlip?.transRef === 'string'
      ? providerRes.data.rawSlip.transRef.trim()
      : ''

    let existingRefMatches: Array<{
      paymentId: string
      orderId: string
      verificationStatus: string
      detectedOnly: boolean
    }> = []

    if (rawTransRef) {
      const [verifiedRefRes, detectedRefRes] = await Promise.all([
        admin
          .from('membership_payments')
          .select('id, order_id, verification_status, transaction_reference, detected_trans_ref')
          .neq('id', paymentId)
          .eq('transaction_reference', rawTransRef),
        admin
          .from('membership_payments')
          .select('id, order_id, verification_status, transaction_reference, detected_trans_ref')
          .neq('id', paymentId)
          .eq('detected_trans_ref', rawTransRef)
      ])

      const combinedRows = new Map<string, Record<string, unknown>>()
      for (const r of [...(verifiedRefRes.data || []), ...(detectedRefRes.data || [])]) {
        combinedRows.set(String(r.id), r as Record<string, unknown>)
      }

      existingRefMatches = Array.from(combinedRows.values()).map((r) => ({
        paymentId: String(r.id),
        orderId: String(r.order_id),
        verificationStatus: String(r.verification_status),
        detectedOnly: !r.transaction_reference
      }))
    }

    const decision = evaluateEasySlipVerification({
      order: latestOrder || orderPrecheck,
      authedUserId: userId,
      paymentMethod,
      data: providerRes.data,
      existingRefMatches,
      channelSettings: channelRow,
      channelRules: channelRuleRow
    })

    if (decision.decision === 'IDEMPOTENT_ALREADY_VERIFIED') {
      await admin.rpc('reject_payment_attempt', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_attempt_id: attemptId,
        p_error_code: 'ALREADY_VERIFIED',
        p_failure_reason: 'Duplicate submission for already verified order',
        p_detected_trans_ref: decision.transRef,
        p_provider_response: providerRes.sanitizedResponse,
        p_target_payment_status: 'REJECTED'
      })
      return jsonResponse(
        {
          success: true,
          status: 'VERIFIED',
          orderStatus: 'PAID',
          message: decision.userMessage
        },
        200,
        origin
      )
    }

    if (decision.decision === 'AUTO_APPROVE') {
      const { data: finData, error: finErr } = await admin.rpc('finalize_membership_payment', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_attempt_id: attemptId,
        p_verified_amount_satang: decision.verifiedAmountSatang,
        p_trans_ref: decision.transRef,
        p_provider_response: providerRes.sanitizedResponse
      })

      if (finErr || !finData || finData.success !== true) {
        return jsonResponse(
          { error: { message: finErr?.message || 'ไม่สามารถบันทึกการเปิดใช้งานสมาชิกได้' } },
          409,
          origin
        )
      }

      return jsonResponse(
        {
          success: true,
          status: 'VERIFIED',
          orderStatus: 'PAID',
          paymentId,
          message: decision.userMessage,
          activation: finData
        },
        200,
        origin
      )
    }

    if (decision.decision === 'MANUAL_REVIEW') {
      await admin.rpc('mark_payment_manual_review', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_attempt_id: attemptId,
        p_reason: decision.failureReason,
        p_detected_trans_ref: decision.transRef,
        p_provider_response: providerRes.sanitizedResponse,
        p_error_code: decision.reasonCode
      })

      return jsonResponse(
        {
          success: true,
          status: 'MANUAL_REVIEW',
          orderStatus: 'MANUAL_REVIEW',
          paymentId,
          message: decision.userMessage
        },
        202,
        origin
      )
    }

    const rejRes = await admin.rpc('reject_payment_attempt', {
      p_order_id: orderId,
      p_payment_id: paymentId,
      p_attempt_id: attemptId,
      p_error_code: decision.reasonCode,
      p_failure_reason: decision.failureReason,
      p_detected_trans_ref: decision.transRef,
      p_provider_response: providerRes.sanitizedResponse,
      p_target_payment_status: 'REJECTED'
    })

    return jsonResponse(
      {
        success: false,
        status: 'REJECTED',
        paymentId,
        errorCode: decision.reasonCode,
        orderStatus: rejRes.data?.order_status || 'PENDING',
        canRetry: Boolean(rejRes.data?.can_retry),
        message: decision.userMessage
      },
      400,
      origin
    )
  } catch (err) {
    return jsonResponse(
      { error: { message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบการชำระเงิน' } },
      500,
      origin
    )
  }
})
