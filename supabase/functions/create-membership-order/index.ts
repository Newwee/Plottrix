import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts'
import { requireAuthenticatedUser } from '../_shared/supabaseAdmin.ts'

function generateOrderCode(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const randBytes = new Uint8Array(3)
  crypto.getRandomValues(randBytes)
  const suffix = Array.from(randBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `PTX-${y}${m}${d}-${suffix}`
}

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
    const body = await req.json().catch(() => ({}))

    const planSlug = String(body?.planSlug || '').trim().toLowerCase()
    const planId = String(body?.planId || '').trim()
    const selectedChannel = body?.channel ? String(body.channel).trim().toLowerCase() : null

    if (!planSlug && !planId) {
      return jsonResponse({ error: { message: 'กรุณาเลือกแพ็กเกจสมาชิกที่ต้องการสมัคร' } }, 400, origin)
    }

    if (selectedChannel && selectedChannel !== 'promptpay' && selectedChannel !== 'bank_transfer') {
      return jsonResponse({ error: { message: 'ช่องทางการชำระเงินไม่ถูกต้อง' } }, 400, origin)
    }

    await admin.rpc('process_expiring_and_expired_memberships', { p_user_id: userId })

    let planQuery = admin
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)

    planQuery = planId ? planQuery.eq('id', planId) : planQuery.eq('slug', planSlug)
    const { data: targetPlan, error: planErr } = await planQuery.maybeSingle()

    if (planErr || !targetPlan) {
      return jsonResponse({ error: { message: 'ไม่พบแพ็กเกจสมาชิกที่เปิดจำหน่ายอยู่ในระบบ' } }, 404, origin)
    }

    if (Number(targetPlan.price) <= 0 || Number(targetPlan.duration_days) <= 0) {
      return jsonResponse({ error: { message: 'แพ็กเกจนี้ไม่มีค่าใช้จ่าย ไม่จำเป็นต้องสร้างคำสั่งซื้อ' } }, 400, origin)
    }

    const { data: activeSub } = await admin
      .from('user_subscriptions')
      .select('id, plan_id, expires_at, membership_plans(id, slug, name, tier_rank, price_satang)')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (activeSub && activeSub.membership_plans) {
      const currentRank = Number((activeSub.membership_plans as Record<string, unknown>).tier_rank || 0)
      if (Number(targetPlan.tier_rank) < currentRank) {
        return jsonResponse(
          {
            error: {
              code: 'NO_DOWNGRADE_ALLOWED',
              message: 'ไม่สามารถลดระดับแพ็กเกจขณะที่แพ็กเกจเดิมยังไม่หมดอายุได้ตามนโยบายระบบ (Strict No-Downgrade)'
            }
          },
          403,
          origin
        )
      }
    }

    const { data: publicChannels } = await admin.rpc('get_public_payment_channels')
    const enabledChannels = (publicChannels || []) as Array<Record<string, unknown>>

    if (enabledChannels.length === 0) {
      return jsonResponse(
        {
          error: {
            code: 'NO_PAYMENT_CHANNEL_ENABLED',
            message: 'ขณะนี้ยังไม่มีช่องทางการรับชำระเงินที่เปิดให้บริการ กรุณาติดต่อผู้ดูแลระบบ'
          }
        },
        503,
        origin
      )
    }

    if (selectedChannel && !enabledChannels.some(c => c.channel_type === selectedChannel)) {
      return jsonResponse(
        {
          error: {
            code: 'CHANNEL_DISABLED',
            message: 'ช่องทางการชำระเงินที่เลือกยังไม่เปิดให้บริการในขณะนี้'
          }
        },
        400,
        origin
      )
    }

    const orderCode = generateOrderCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const amountNum = Number(targetPlan.price)
    const amountSatang = Number(targetPlan.price_satang)

    const planSnapshot = {
      id: targetPlan.id,
      slug: targetPlan.slug,
      name: targetPlan.name,
      description: targetPlan.description,
      price: amountNum,
      price_satang: amountSatang,
      currency: targetPlan.currency,
      duration_days: targetPlan.duration_days,
      trix_grant: targetPlan.trix_grant,
      tier_rank: targetPlan.tier_rank,
      features: targetPlan.features,
      entitlements_config: targetPlan.entitlements_config
    }

    const { data: createdOrder, error: orderErr } = await admin
      .from('membership_orders')
      .insert({
        order_code: orderCode,
        user_id: userId,
        plan_id: targetPlan.id,
        amount: amountNum,
        amount_satang: amountSatang,
        currency: 'THB',
        plan_snapshot: planSnapshot,
        selected_channel: selectedChannel || (enabledChannels[0].channel_type as string),
        status: 'PENDING',
        expires_at: expiresAt
      })
      .select('*')
      .single()

    if (orderErr || !createdOrder) {
      return jsonResponse({ error: { message: orderErr?.message || 'ไม่สามารถสร้างคำสั่งซื้อได้' } }, 500, origin)
    }

    await Promise.all([
      admin.from('payment_audit_logs').insert({
        order_id: createdOrder.id,
        user_id: userId,
        actor_id: userId,
        actor_type: 'USER',
        event_type: 'ORDER_CREATED',
        details: {
          order_code: orderCode,
          plan_slug: targetPlan.slug,
          amount_satang: amountSatang,
          expires_at: expiresAt
        }
      }),
      admin.from('notifications').insert({
        user_id: userId,
        type: 'ORDER_CREATED',
        title: `สร้างคำสั่งซื้อ ${orderCode} สำเร็จ`,
        message: `แพ็กเกจ ${targetPlan.name} ยอดชำระ ฿${amountNum.toFixed(2)} กรุณาชำระเงินและส่งสลิปภายใน 30 นาที`,
        metadata: { order_id: createdOrder.id, order_code: orderCode, amount: amountNum },
        dedup_key: `order_${createdOrder.id}`
      })
    ])

    const channelsWithQr = await Promise.all(
      enabledChannels.map(async (ch) => {
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

    let estimatedExpiresAt: string
    const nowMs = Date.now()
    if (activeSub && activeSub.membership_plans) {
      const prevPlan = activeSub.membership_plans as Record<string, unknown>
      const prevRank = Number(prevPlan.tier_rank || 0)
      const prevPriceSatang = Math.max(1, Number(prevPlan.price_satang || 24900))
      const prevEndMs = new Date(activeSub.expires_at).getTime()
      const baseMs = Number(targetPlan.duration_days) * 86400 * 1000
      if (Number(targetPlan.tier_rank) === prevRank) {
        estimatedExpiresAt = new Date(prevEndMs + baseMs).toISOString()
      } else {
        const remSecs = Math.max(0, (prevEndMs - nowMs) / 1000)
        const bonusSecs = Math.floor(remSecs * (prevPriceSatang / amountSatang))
        estimatedExpiresAt = new Date(nowMs + baseMs + bonusSecs * 1000).toISOString()
      }
    } else {
      estimatedExpiresAt = new Date(nowMs + Number(targetPlan.duration_days) * 86400 * 1000).toISOString()
    }

    return jsonResponse(
      {
        success: true,
        order: createdOrder,
        estimatedMembershipExpiresAt: estimatedExpiresAt,
        channels: channelsWithQr
      },
      201,
      origin
    )
  } catch (err) {
    return jsonResponse(
      { error: { message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' } },
      500,
      origin
    )
  }
})
