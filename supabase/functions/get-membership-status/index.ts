import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getUserAdminRole, requireAuthenticatedUser } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: buildCorsHeaders(origin) })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method Not Allowed' } }, 405, origin)
  }

  try {
    const auth = await requireAuthenticatedUser(req)
    if (!auth.user || !auth.supabaseAdmin) {
      return jsonResponse({ error: { message: auth.error } }, auth.status, origin)
    }

    const userId = auth.user.id
    const admin = auth.supabaseAdmin

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body?.action === 'mark_notification_read' && body?.notificationId) {
        await admin
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', body.notificationId)
          .eq('user_id', userId)
        return jsonResponse({ success: true }, 200, origin)
      }
      if (body?.action === 'mark_all_notifications_read') {
        await admin
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_read', false)
        return jsonResponse({ success: true }, 200, origin)
      }
    }

    await admin.rpc('process_expiring_and_expired_memberships', { p_user_id: userId })

    const [
      profileRes,
      subRes,
      plansRes,
      entitlementsRes,
      ordersRes,
      notifRes,
      channelsRes,
      consentRes,
      adminRole
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('id, plan, plan_tier, trial_used, trial_started_at, trial_ends_at, trix_balance, last_claim_date')
        .eq('id', userId)
        .single(),
      admin
        .from('user_subscriptions')
        .select('id, plan_id, order_id, starts_at, expires_at, status, trix_granted, created_at, membership_plans(id, slug, name, price, duration_days, trix_grant, tier_rank)')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('membership_plans')
        .select('id, slug, name, description, price, currency, duration_days, trix_grant, tier_rank, features, entitlements_config, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      admin
        .from('membership_entitlements')
        .select('entitlement_key, entitlement_value, source_type, is_active, valid_from, valid_until')
        .eq('user_id', userId)
        .eq('is_active', true),
      admin
        .from('membership_orders')
        .select('id, order_code, plan_id, amount, currency, plan_snapshot, selected_channel, status, attempt_count, expires_at, paid_at, created_at, membership_payments(id, payment_method, verification_status, failure_reason, transaction_reference, verified_at, created_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15),
      admin
        .from('notifications')
        .select('id, type, title, message, metadata, is_read, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30),
      admin.rpc('get_public_payment_channels'),
      admin
        .from('user_consents')
        .select('terms_version, accepted_at')
        .eq('user_id', userId)
        .eq('consent_type', 'PRO_FREE_TRIAL_TERMS')
        .maybeSingle(),
      getUserAdminRole(admin, userId)
    ])

    const rawChannels = channelsRes.data || []
    const publicChannels = await Promise.all(
      rawChannels.map(async (ch: Record<string, unknown>) => {
        let qrSignedUrl: string | null = null
        if (ch.qr_storage_path && typeof ch.qr_storage_path === 'string') {
          const { data: signed } = await admin.storage
            .from('membership-payment-slips')
            .createSignedUrl(ch.qr_storage_path, 900)
          qrSignedUrl = signed?.signedUrl || null
        }
        return {
          id: ch.id,
          channel_type: ch.channel_type,
          display_name: ch.display_name,
          bank_name: ch.bank_name,
          account_name: ch.account_name,
          account_number: ch.account_number,
          promptpay_id: ch.promptpay_id,
          qr_signed_url: qrSignedUrl,
          instructions: ch.instructions
        }
      })
    )

    return jsonResponse(
      {
        success: true,
        profile: profileRes.data || null,
        activeSubscription: subRes.data || null,
        plans: plansRes.data || [],
        entitlements: entitlementsRes.data || [],
        recentOrders: ordersRes.data || [],
        notifications: notifRes.data || [],
        publicChannels,
        trialConsent: consentRes.data || null,
        adminRole,
        isAdmin: adminRole === 'owner' || adminRole === 'admin'
      },
      200,
      origin
    )
  } catch (err) {
    return jsonResponse(
      { error: { message: err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลสมาชิกได้' } },
      500,
      origin
    )
  }
})
