import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getUserAdminRole, requireAuthenticatedUser } from '../_shared/supabaseAdmin.ts'
import { validateSlipImageBytes } from '../_shared/slipFileValidation.ts'

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

    const admin = auth.supabaseAdmin
    const adminRole = await getUserAdminRole(admin, auth.user.id)
    if (!adminRole) {
      return jsonResponse({ error: { message: 'Forbidden: Admin access required' } }, 403, origin)
    }

    const contentType = (req.headers.get('content-type') || '').toLowerCase()

    if (contentType.includes('multipart/form-data')) {
      if (adminRole !== 'owner') {
        return jsonResponse({ error: { message: 'Forbidden: Only owner can update PromptPay QR images' } }, 403, origin)
      }

      const formData = await req.formData()
      const channelType = String(formData.get('channelType') || 'promptpay').trim().toLowerCase()
      const qrFile = formData.get('qrImage')
      if (channelType !== 'promptpay' && channelType !== 'bank_transfer') {
        return jsonResponse({ error: { message: 'Invalid channelType' } }, 400, origin)
      }
      if (!(qrFile instanceof File)) {
        return jsonResponse({ error: { message: 'Missing qrImage file' } }, 400, origin)
      }

      const imageBytes = new Uint8Array(await qrFile.arrayBuffer())
      const validated = validateSlipImageBytes(imageBytes)
      if (!validated.ok) {
        return jsonResponse({ error: { message: validated.message } }, 400, origin)
      }

      const storagePath = `channel-qr/${channelType}-${crypto.randomUUID()}.${validated.extension}`
      const { error: uploadErr } = await admin.storage
        .from('membership-payment-slips')
        .upload(storagePath, imageBytes, { contentType: validated.mimeType, upsert: false })

      if (uploadErr) {
        return jsonResponse({ error: { message: uploadErr.message } }, 500, origin)
      }

      const { error: updateErr } = await admin
        .from('payment_channel_settings')
        .update({ qr_storage_path: storagePath, updated_at: new Date().toISOString() })
        .eq('channel_type', channelType)

      if (updateErr) {
        return jsonResponse({ error: { message: updateErr.message } }, 500, origin)
      }

      await admin.from('payment_audit_logs').insert({
        user_id: auth.user.id,
        actor_id: auth.user.id,
        actor_type: 'ADMIN',
        event_type: 'CHANNEL_SETTINGS_UPDATED',
        details: { channel_type: channelType, action: 'qr_uploaded', qr_storage_path: storagePath }
      })

      const { data: signed } = await admin.storage
        .from('membership-payment-slips')
        .createSignedUrl(storagePath, 900)

      return jsonResponse({ success: true, qr_storage_path: storagePath, qr_signed_url: signed?.signedUrl || null }, 200, origin)
    }

    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '').trim()

    if (action === 'dashboard_summary') {
      const [ordersRes, paymentsRes, activeSubsRes, activeTrialsRes] = await Promise.all([
        admin.from('membership_orders').select('id, status, amount'),
        admin.from('membership_payments').select('id, verification_status, amount'),
        admin.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE').gt('expires_at', new Date().toISOString()),
        admin.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'pro_trial').gt('trial_ends_at', new Date().toISOString())
      ])

      const orders = ordersRes.data || []
      const payments = paymentsRes.data || []
      const paidOrders = orders.filter(o => o.status === 'PAID')
      const totalPaidRevenue = paidOrders.reduce((acc, o) => acc + Number(o.amount || 0), 0)

      return jsonResponse(
        {
          success: true,
          adminRole,
          summary: {
            totalOrders: orders.length,
            paidOrdersCount: paidOrders.length,
            totalPaidRevenueThb: totalPaidRevenue,
            pendingReviewCount: payments.filter(p => p.verification_status === 'MANUAL_REVIEW' || p.verification_status === 'PENDING_BANK').length,
            rejectedOrFailedCount: payments.filter(p => p.verification_status === 'REJECTED' || p.verification_status === 'PROVIDER_ERROR').length,
            activePremiumSubscribers: activeSubsRes.count || 0,
            activeTrials: activeTrialsRes.count || 0
          }
        },
        200,
        origin
      )
    }

    if (action === 'list_payments') {
      const statusFilter = body?.statusFilter ? String(body.statusFilter).trim() : null
      let payQuery = admin
        .from('membership_payments')
        .select('id, order_id, user_id, payment_method, amount, expected_amount_satang, verified_amount_satang, currency, verification_provider, verification_status, transaction_reference, detected_trans_ref, slip_storage_path, provider_error_code, failure_reason, provider_response, reviewed_by, review_note, verified_at, created_at, membership_orders(order_code, status, plan_snapshot, expires_at, paid_at)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (statusFilter && statusFilter !== 'ALL') {
        payQuery = payQuery.eq('verification_status', statusFilter)
      }

      const { data: payments, error: payErr } = await payQuery
      if (payErr) {
        return jsonResponse({ error: { message: payErr.message } }, 500, origin)
      }

      const userIds = Array.from(new Set((payments || []).map(p => p.user_id).filter(Boolean)))
      let profileMap: Record<string, Record<string, unknown>> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, email, display_name, plan, plan_tier')
          .in('id', userIds)
        for (const prof of profiles || []) {
          profileMap[String(prof.id)] = prof
        }
      }

      const { data: audits } = await admin
        .from('payment_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      const enriched = (payments || []).map(p => ({
        ...p,
        userProfile: profileMap[String(p.user_id)] || null
      }))

      return jsonResponse({ success: true, adminRole, payments: enriched, auditLogs: audits || [] }, 200, origin)
    }

    if (action === 'get_slip_signed_url') {
      const paymentId = String(body?.paymentId || '').trim()
      const { data: payment } = await admin
        .from('membership_payments')
        .select('id, slip_storage_path')
        .eq('id', paymentId)
        .maybeSingle()

      if (!payment || !payment.slip_storage_path) {
        return jsonResponse({ error: { message: 'ไม่พบไฟล์สลิป' } }, 404, origin)
      }

      const { data: signed, error: signErr } = await admin.storage
        .from('membership-payment-slips')
        .createSignedUrl(payment.slip_storage_path, 120)

      if (signErr || !signed?.signedUrl) {
        return jsonResponse({ error: { message: 'ไม่สามารถสร้างลิงก์ดูสลิปได้' } }, 500, origin)
      }

      return jsonResponse({ success: true, signedUrl: signed.signedUrl, expiresInSeconds: 120 }, 200, origin)
    }

    if (action === 'manual_approve') {
      const paymentId = String(body?.paymentId || '').trim()
      const reviewNote = String(body?.reviewNote || '').trim()
      const overrideTransRef = body?.overrideTransRef ? String(body.overrideTransRef).trim() : null

      if (!paymentId || !reviewNote) {
        return jsonResponse({ error: { message: 'กรุณาระบุ Payment ID และหมายเหตุการตรวจสอบ' } }, 400, origin)
      }

      const { data, error } = await admin.rpc('admin_approve_membership_payment', {
        p_payment_id: paymentId,
        p_admin_id: auth.user.id,
        p_review_note: reviewNote,
        p_override_trans_ref: overrideTransRef
      })

      if (error) {
        return jsonResponse({ error: { message: error.message } }, 400, origin)
      }
      return jsonResponse({ success: true, activation: data }, 200, origin)
    }

    if (action === 'manual_reject') {
      const paymentId = String(body?.paymentId || '').trim()
      const reviewNote = String(body?.reviewNote || '').trim()
      if (!paymentId || !reviewNote) {
        return jsonResponse({ error: { message: 'กรุณาระบุ Payment ID และเหตุผลการปฏิเสธ' } }, 400, origin)
      }

      const { data, error } = await admin.rpc('admin_reject_membership_payment', {
        p_payment_id: paymentId,
        p_admin_id: auth.user.id,
        p_review_note: reviewNote
      })

      if (error) {
        return jsonResponse({ error: { message: error.message } }, 400, origin)
      }
      return jsonResponse({ success: true, result: data }, 200, origin)
    }

    if (action === 'get_channel_settings') {
      if (adminRole !== 'owner') {
        return jsonResponse({ error: { message: 'Forbidden: Only owner can manage payment channels' } }, 403, origin)
      }

      const { data: channels } = await admin
        .from('payment_channel_settings')
        .select('*, payment_channel_verification_rules(*)')
        .order('channel_type', { ascending: true })

      const enriched = await Promise.all(
        (channels || []).map(async (ch: Record<string, unknown>) => {
          let qrSignedUrl: string | null = null
          if (ch.qr_storage_path && typeof ch.qr_storage_path === 'string') {
            const { data: signed } = await admin.storage
              .from('membership-payment-slips')
              .createSignedUrl(ch.qr_storage_path, 900)
            qrSignedUrl = signed?.signedUrl || null
          }
          return { ...ch, qr_signed_url: qrSignedUrl }
        })
      )

      return jsonResponse({ success: true, channels: enriched }, 200, origin)
    }

    if (action === 'update_channel_settings') {
      if (adminRole !== 'owner') {
        return jsonResponse({ error: { message: 'Forbidden: Only owner can update payment channels' } }, 403, origin)
      }

      const channelType = String(body?.channelType || '').trim().toLowerCase()
      if (channelType !== 'promptpay' && channelType !== 'bank_transfer') {
        return jsonResponse({ error: { message: 'Invalid channelType' } }, 400, origin)
      }

      const isEnabled = Boolean(body?.isEnabled)
      const displayName = String(body?.displayName || (channelType === 'promptpay' ? 'PromptPay QR Code' : 'โอนเงินผ่านบัญชีธนาคาร')).trim()
      const bankName = String(body?.bankName || '').trim()
      const accountName = String(body?.accountName || '').trim()
      const accountNumber = String(body?.accountNumber || '').trim()
      const promptpayId = String(body?.promptpayId || '').trim()
      const instructions = String(body?.instructions || '').trim()

      const { data: currentCh } = await admin
        .from('payment_channel_settings')
        .select('id, qr_storage_path')
        .eq('channel_type', channelType)
        .maybeSingle()

      if (!currentCh) {
        return jsonResponse({ error: { message: 'ไม่พบข้อมูลช่องทางการชำระเงินที่ระบุ' } }, 404, origin)
      }

      if (isEnabled) {
        if (!accountName) {
          return jsonResponse({ error: { message: 'กรุณากรอกชื่อบัญชีผู้รับเงินก่อนเปิดใช้งานช่องทาง' } }, 400, origin)
        }
        if (channelType === 'promptpay' && !promptpayId && !currentCh.qr_storage_path) {
          return jsonResponse({ error: { message: 'กรุณาอัปโหลดรูป PromptPay QR หรือระบุ PromptPay ID ก่อนเปิดใช้งาน' } }, 400, origin)
        }
        if (channelType === 'bank_transfer' && (!bankName || !accountNumber)) {
          return jsonResponse({ error: { message: 'กรุณากรอกชื่อธนาคารและเลขบัญชีก่อนเปิดใช้งาน' } }, 400, origin)
        }
      }

      const { error: chUpdErr } = await admin
        .from('payment_channel_settings')
        .update({
          is_enabled: isEnabled,
          display_name: displayName,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          promptpay_id: promptpayId,
          instructions
        })
        .eq('id', currentCh.id)

      if (chUpdErr) {
        return jsonResponse({ error: { message: chUpdErr.message } }, 500, origin)
      }

      const allowedBankCodes = Array.isArray(body?.allowedBankCodes)
        ? body.allowedBankCodes.map((s: unknown) => String(s).trim().toUpperCase()).filter(Boolean)
        : String(body?.allowedBankCodes || '')
            .split(',')
            .map(s => s.trim().toUpperCase())
            .filter(Boolean)

      const expectedDigits = String(body?.expectedAccountDigits || accountNumber || '').replace(/[^0-9]/g, '')
      const expectedProxyType = String(body?.expectedProxyType || '').trim().toUpperCase()
      const expectedProxyValue = String(body?.expectedProxyValue || promptpayId || '').trim()

      const { error: ruleErr } = await admin
        .from('payment_channel_verification_rules')
        .upsert(
          {
            channel_id: currentCh.id,
            allowed_bank_codes: allowedBankCodes,
            expected_account_digits: expectedDigits,
            expected_proxy_type: expectedProxyType,
            expected_proxy_value: expectedProxyValue,
            expected_account_name_th: String(body?.expectedAccountNameTh || accountName).trim(),
            expected_account_name_en: String(body?.expectedAccountNameEn || '').trim(),
            updated_by: auth.user.id
          },
          { onConflict: 'channel_id' }
        )

      if (ruleErr) {
        return jsonResponse({ error: { message: ruleErr.message } }, 500, origin)
      }

      await admin.from('payment_audit_logs').insert({
        user_id: auth.user.id,
        actor_id: auth.user.id,
        actor_type: 'ADMIN',
        event_type: 'CHANNEL_SETTINGS_UPDATED',
        details: { channel_type: channelType, is_enabled: isEnabled }
      })

      return jsonResponse({ success: true }, 200, origin)
    }

    return jsonResponse({ error: { message: 'Unknown admin action' } }, 400, origin)
  } catch (err) {
    return jsonResponse(
      { error: { message: err instanceof Error ? err.message : 'Admin request error' } },
      500,
      origin
    )
  }
})
