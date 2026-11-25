import { supabase } from './supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jqgbgqlhztixhkrqdwtf.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BE_MPg4wcaBIr5eFEHqAbg_U-qOrLTQ'

export const MAX_SLIP_SIZE_BYTES = 4 * 1024 * 1024
export const ALLOWED_SLIP_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
])

export const CURRENT_TRIAL_TERMS_VERSION = '2026-11-v1'

export const TRIAL_TERMS_CLAUSES = [
  'ทดลองใช้สิทธิ์ระดับ Pro Plan++ ฟรี 3 วัน (72 ชั่วโมงเต็ม)',
  'ไม่มีค่าใช้จ่ายใดๆ ตลอดระยะเวลาทดลองใช้งาน',
  'ไม่มีการหักเงินอัตโนมัติทั้งระหว่างทดลองและหลังหมดอายุ',
  'ไม่มีการบังคับผูกบัตรเครดิต/เดบิต หรือข้อมูลบัญชีธนาคาร',
  'ไม่มีการต่ออายุอัตโนมัติเมื่อครบกำหนด 72 ชั่วโมง',
  'เมื่อครบกำหนดระบบจะปรับบัญชีกลับเป็น Free Plan โดยอัตโนมัติ (ยกเว้นกรณีที่มี Paid Membership ที่ยังใช้งานอยู่)',
  'คุณสามารถเลือกสมัคร Paid Membership ภายหลังได้ตามความสมัครใจ',
  'จำกัดสิทธิ์การทดลองใช้ฟรีเพียง 1 ครั้งต่อ 1 บัญชีผู้ใช้'
]

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || ''
}

async function callEdgeFunction(fnName, options = {}) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนดำเนินการ')
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: options.method || 'POST',
    headers,
    body: options.isFormData
      ? options.body
      : options.body !== undefined
      ? JSON.stringify(options.body)
      : undefined
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok && payload?.error?.message) {
    const err = new Error(payload.error.message)
    err.code = payload.error.code
    err.status = response.status
    err.payload = payload
    throw err
  }
  return { ok: response.ok, status: response.status, data: payload }
}

export async function validateClientSlipFile(file) {
  if (!file) {
    return { valid: false, message: 'กรุณาเลือกไฟล์รูปภาพสลิป' }
  }

  if (file.size <= 0) {
    return { valid: false, message: 'ไฟล์รูปภาพไม่สมบูรณ์ กรุณาเลือกใหม่' }
  }

  if (file.size > MAX_SLIP_SIZE_BYTES) {
    return { valid: false, message: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 4 MB' }
  }

  if (file.type && !ALLOWED_SLIP_MIME_TYPES.has(file.type.toLowerCase())) {
    return { valid: false, message: 'รองรับเฉพาะไฟล์ JPEG, PNG, GIF และ WebP เท่านั้น' }
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (head.length < 12) {
    return { valid: false, message: 'ไฟล์รูปภาพไม่ถูกต้อง' }
  }

  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
  const isPng =
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a &&
    head[6] === 0x1a &&
    head[7] === 0x0a
  const gifSig = String.fromCharCode(head[0], head[1], head[2], head[3], head[4], head[5])
  const isGif = gifSig === 'GIF87a' || gifSig === 'GIF89a'
  const riff = String.fromCharCode(head[0], head[1], head[2], head[3])
  const webp = String.fromCharCode(head[8], head[9], head[10], head[11])
  const isWebp = riff === 'RIFF' && webp === 'WEBP'

  if (!isJpeg && !isPng && !isGif && !isWebp) {
    return { valid: false, message: 'รูปแบบเนื้อหาไฟล์ไม่ใช่รูปภาพ JPEG, PNG, GIF หรือ WebP ที่ถูกต้อง' }
  }

  return { valid: true }
}

export async function fetchMembershipStatus() {
  const res = await callEdgeFunction('get-membership-status', { method: 'GET' })
  return res.data
}

export async function markNotificationRead(notificationId) {
  const res = await callEdgeFunction('get-membership-status', {
    method: 'POST',
    body: { action: 'mark_notification_read', notificationId }
  })
  return res.data
}

export async function markAllNotificationsRead() {
  const res = await callEdgeFunction('get-membership-status', {
    method: 'POST',
    body: { action: 'mark_all_notifications_read' }
  })
  return res.data
}

export async function activateProTrialWithConsent({ accepted, termsVersion = CURRENT_TRIAL_TERMS_VERSION }) {
  const res = await callEdgeFunction('activate-pro-trial', {
    method: 'POST',
    body: { accepted: Boolean(accepted), termsVersion }
  })
  return res.data
}

export async function createMembershipOrder({ planSlug, planId, channel }) {
  const res = await callEdgeFunction('create-membership-order', {
    method: 'POST',
    body: { planSlug, planId, channel }
  })
  return res.data
}

export async function verifyPaymentSlip({ orderId, paymentMethod, file, retryPaymentId }) {
  if (retryPaymentId && !file) {
    const res = await callEdgeFunction('verify-membership-payment', {
      method: 'POST',
      body: { orderId, paymentMethod, retryPaymentId }
    })
    return { httpStatus: res.status, ...res.data }
  }

  const formData = new FormData()
  formData.append('orderId', orderId)
  formData.append('paymentMethod', paymentMethod)
  formData.append('slip', file)

  const token = await getAccessToken()
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนดำเนินการ')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-membership-payment`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    },
    body: formData
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok && !payload?.status) {
    throw new Error(payload?.error?.message || payload?.message || `HTTP ${response.status}`)
  }

  return { httpStatus: response.status, ...payload }
}

export async function invokeAdminMembership(action, params = {}) {
  const res = await callEdgeFunction('admin-membership', {
    method: 'POST',
    body: { action, ...params }
  })
  return res.data
}

export async function uploadAdminChannelQr(channelType, file) {
  const formData = new FormData()
  formData.append('channelType', channelType)
  formData.append('qrImage', file)
  const res = await callEdgeFunction('admin-membership', {
    method: 'POST',
    isFormData: true,
    body: formData
  })
  return res.data
}
