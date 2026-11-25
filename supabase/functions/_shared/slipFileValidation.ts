export const MAX_SLIP_BYTES = 4 * 1024 * 1024

export const ALLOWED_SLIP_FORMATS = new Set(['jpeg', 'png', 'gif', 'webp'])

export type ValidatedSlipFile = {
  ok: true
  format: 'jpeg' | 'png' | 'gif' | 'webp'
  mimeType: string
  extension: string
  sizeBytes: number
} | {
  ok: false
  code: 'EMPTY_FILE' | 'FILE_TOO_LARGE' | 'INVALID_IMAGE_FORMAT'
  message: string
}

export function detectImageFormatFromBytes(bytes: Uint8Array): 'jpeg' | 'png' | 'gif' | 'webp' | null {
  if (!bytes || bytes.length < 12) return null

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg'
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png'
  }

  const gifHeader = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
  if (gifHeader === 'GIF87a' || gifHeader === 'GIF89a') {
    return 'gif'
  }

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'webp'
  }

  return null
}

export function validateSlipImageBytes(bytes: Uint8Array): ValidatedSlipFile {
  if (!bytes || bytes.length === 0) {
    return {
      ok: false,
      code: 'EMPTY_FILE',
      message: 'ไม่พบไฟล์รูปภาพสลิป กรุณาเลือกไฟล์ใหม่อีกครั้ง'
    }
  }

  if (bytes.length > MAX_SLIP_BYTES) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: 'ขนาดไฟล์สลิปต้องไม่เกิน 4 MB'
    }
  }

  const detected = detectImageFormatFromBytes(bytes)
  if (!detected || !ALLOWED_SLIP_FORMATS.has(detected)) {
    return {
      ok: false,
      code: 'INVALID_IMAGE_FORMAT',
      message: 'รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG, GIF และ WebP เท่านั้น'
    }
  }

  const mimeMap: Record<'jpeg' | 'png' | 'gif' | 'webp', { mimeType: string; extension: string }> = {
    jpeg: { mimeType: 'image/jpeg', extension: 'jpg' },
    png: { mimeType: 'image/png', extension: 'png' },
    gif: { mimeType: 'image/gif', extension: 'gif' },
    webp: { mimeType: 'image/webp', extension: 'webp' }
  }

  return {
    ok: true,
    format: detected,
    mimeType: mimeMap[detected].mimeType,
    extension: mimeMap[detected].extension,
    sizeBytes: bytes.length
  }
}
