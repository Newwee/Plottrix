import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts'
import { requireAuthenticatedUser, sha256Hex } from '../_shared/supabaseAdmin.ts'

const CURRENT_TRIAL_TERMS_VERSION = '2026-11-v1'

const TRIAL_TERMS_SNAPSHOT = {
  version: CURRENT_TRIAL_TERMS_VERSION,
  duration_hours: 72,
  clauses: [
    'ทดลองใช้ฟีเจอร์ระดับ Pro Plan++ ฟรี 3 วัน (72 ชั่วโมง)',
    'ไม่มีค่าใช้จ่ายใดๆ ตลอดช่วงทดลองใช้',
    'ไม่มีการหักเงินอัตโนมัติ',
    'ไม่มีการผูกบัตรเครดิต/เดบิต หรือบัญชีธนาคาร',
    'ไม่มีการต่ออายุอัตโนมัติหลังครบกำหนด',
    'เมื่อครบ 72 ชั่วโมง ระบบจะปรับกลับเป็น Free Plan โดยอัตโนมัติ (หากยังไม่มี Paid Membership ที่ใช้งานอยู่)',
    'สามารถเลือกสมัคร Paid Membership ภายหลังได้ตามความสมัครใจ',
    'จำกัดสิทธิ์การทดลองใช้ 1 ครั้งต่อ 1 บัญชีผู้ใช้'
  ]
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

    const body = await req.json().catch(() => ({}))
    const accepted = body?.accepted === true
    const termsVersion = String(body?.termsVersion || '').trim()

    if (!accepted) {
      return jsonResponse(
        { error: { code: 'TERMS_NOT_ACCEPTED', message: 'กรุณาอ่านและกดยอมรับเงื่อนไขก่อนเริ่มทดลองใช้ฟรี 3 วัน' } },
        400,
        origin
      )
    }

    if (termsVersion !== CURRENT_TRIAL_TERMS_VERSION) {
      return jsonResponse(
        { error: { code: 'INVALID_TERMS_VERSION', message: 'เวอร์ชันของข้อกำหนดไม่ถูกต้อง กรุณารีเฟรชหน้าเว็บและลองใหม่' } },
        400,
        origin
      )
    }

    const userAgent = (req.headers.get('user-agent') || '').slice(0, 500)
    const forwardedIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    const ipHash = forwardedIp ? await sha256Hex(forwardedIp) : ''

    const { data, error } = await auth.supabaseAdmin.rpc('activate_pro_trial_safely', {
      p_user_id: auth.user.id,
      p_terms_version: CURRENT_TRIAL_TERMS_VERSION,
      p_accepted: true,
      p_terms_summary: TRIAL_TERMS_SNAPSHOT,
      p_user_agent: userAgent,
      p_ip_hash: ipHash
    })

    if (error) {
      return jsonResponse(
        { error: { message: error.message || 'ไม่สามารถเปิดใช้งานสิทธิ์ทดลองใช้ได้' } },
        400,
        origin
      )
    }

    if (!data || data.success !== true) {
      return jsonResponse(
        {
          error: {
            code: data?.code || 'TRIAL_ACTIVATION_REJECTED',
            message: data?.error || 'ไม่สามารถเปิดใช้งานสิทธิ์ทดลองใช้ได้'
          }
        },
        400,
        origin
      )
    }

    const { data: entitlements } = await auth.supabaseAdmin
      .from('membership_entitlements')
      .select('entitlement_key, entitlement_value, source_type, is_active, valid_from, valid_until')
      .eq('user_id', auth.user.id)
      .eq('is_active', true)

    return jsonResponse(
      {
        success: true,
        message: 'เปิดใช้งาน Pro Free Trial ฟรี 3 วันสำเร็จ!',
        trial: {
          plan: data.plan,
          plan_tier: data.plan_tier,
          trial_used: data.trial_used,
          trial_started_at: data.trial_started_at,
          trial_ends_at: data.trial_ends_at,
          terms_version: CURRENT_TRIAL_TERMS_VERSION
        },
        trix_balance: data.trix_balance,
        entitlements: entitlements || []
      },
      200,
      origin
    )
  } catch (err) {
    return jsonResponse(
      { error: { message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปิดใช้งาน Trial' } },
      500,
      origin
    )
  }
})
