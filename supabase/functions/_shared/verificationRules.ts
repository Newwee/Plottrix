import type { EasySlipMatchedAccount, EasySlipRawSlip, EasySlipVerifySuccessData } from './providers/types.ts'

export type ChannelVerificationRule = {
  allowed_bank_codes?: string[] | null
  expected_account_digits?: string | null
  expected_proxy_type?: string | null
  expected_proxy_value?: string | null
  expected_account_name_th?: string | null
  expected_account_name_en?: string | null
}

export type ChannelSettingRecord = {
  channel_type: 'promptpay' | 'bank_transfer'
  is_enabled: boolean
  bank_name?: string | null
  account_name?: string | null
  account_number?: string | null
  promptpay_id?: string | null
}

export type ExistingPaymentRefMatch = {
  paymentId: string
  orderId: string
  verificationStatus: string
  detectedOnly: boolean
}

export type VerificationDecision =
  | {
      decision: 'AUTO_APPROVE'
      transRef: string
      verifiedAmountSatang: number
      userMessage: string
    }
  | {
      decision: 'IDEMPOTENT_ALREADY_VERIFIED'
      transRef: string
      userMessage: string
    }
  | {
      decision: 'MANUAL_REVIEW'
      transRef: string | null
      reasonCode: string
      failureReason: string
      userMessage: string
    }
  | {
      decision: 'REJECT'
      transRef: string | null
      reasonCode: string
      failureReason: string
      userMessage: string
    }

export function toSatang(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

export function normalizeDigits(value: unknown): string {
  return String(value || '').replace(/[^0-9]/g, '')
}

export function normalizeMaskString(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s-]/g, '')
    .trim()
}

function normalizePromptPayPrefix(val: string): string {
  return val.replace(/^66(?=[0-9x*•]{9}$)/, '0')
}

export function doesMaskedIdentifierMatch(observedMasked: unknown, expectedPlain: unknown): 'MATCH' | 'MISMATCH' | 'AMBIGUOUS' {
  const obs = normalizePromptPayPrefix(normalizeMaskString(observedMasked))
  const exp = normalizePromptPayPrefix(normalizeMaskString(expectedPlain))
  if (!obs || !exp) return 'AMBIGUOUS'

  const obsDigitsOnly = obs.replace(/[^0-9a-z]/g, '')
  const expDigitsOnly = exp.replace(/[^0-9a-z]/g, '')
  if (!obsDigitsOnly || !expDigitsOnly) return 'AMBIGUOUS'

  if (obs === exp) return 'MATCH'

  const visibleChars = obs.replace(/[x*•]/g, '')
  if (visibleChars.length < 3) {
    return 'AMBIGUOUS'
  }

  if (obs.length === exp.length) {
    for (let i = 0; i < obs.length; i++) {
      const ch = obs[i]
      if (ch === 'x' || ch === '*' || ch === '•') continue
      if (ch !== exp[i]) return 'MISMATCH'
    }
    return 'MATCH'
  }

  const trailingClean = obs.match(/^[x*•]+([0-9a-wyz]{3,})$/)
  if (trailingClean) {
    if (exp.endsWith(trailingClean[1])) return 'MATCH'
    return 'MISMATCH'
  }

  const leadingClean = obs.match(/^([0-9a-wyz]{3,})[x*•]+$/)
  if (leadingClean) {
    if (exp.startsWith(leadingClean[1])) return 'MATCH'
    return 'MISMATCH'
  }

  return 'AMBIGUOUS'
}

const ALLOWED_THB_CURRENCIES = new Set(['THB', '764', 'บาท', 'BAHT', '฿'])

export function isThaiBahtCurrency(value: unknown): boolean {
  const normalized = String(value || '').trim().toUpperCase()
  return ALLOWED_THB_CURRENCIES.has(normalized)
}

export function normalizeName(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function verifyAccountMatch(params: {
  paymentMethod: 'promptpay' | 'bank_transfer'
  matchedAccount: EasySlipMatchedAccount | null | undefined
  rawReceiver: EasySlipRawSlip['receiver'] | null | undefined
  channelSettings: ChannelSettingRecord | null | undefined
  channelRules: ChannelVerificationRule | null | undefined
}): { status: 'MATCH' | 'MISMATCH' | 'MANUAL_REVIEW'; code: string; reason: string } {
  const { paymentMethod, matchedAccount, rawReceiver, channelSettings, channelRules } = params

  if (!matchedAccount || typeof matchedAccount !== 'object') {
    return {
      status: 'MISMATCH',
      code: 'RECEIVER_ACCOUNT_MISMATCH',
      reason: 'EasySlip matchedAccount is null'
    }
  }

  if (!channelSettings || !channelSettings.is_enabled) {
    return {
      status: 'MANUAL_REVIEW',
      code: 'CHANNEL_DISABLED_OR_MISSING',
      reason: 'Payment channel setting unavailable during verification'
    }
  }

  const rules = channelRules || {}

  if (paymentMethod === 'bank_transfer') {
    const allowedBanks = (rules.allowed_bank_codes || []).map(b => String(b).trim().toUpperCase()).filter(Boolean)
    const expectedDigits = normalizeDigits(rules.expected_account_digits || channelSettings.account_number)
    const matchedBankShort = String(matchedAccount.bank?.shortCode || '').trim().toUpperCase()
    const matchedBankCode = String(matchedAccount.bank?.code || '').trim().toUpperCase()

    if (allowedBanks.length === 0 || !expectedDigits) {
      return {
        status: 'MANUAL_REVIEW',
        code: 'BANK_RULES_NOT_CONFIGURED',
        reason: 'Owner bank verification rules not configured completely'
      }
    }

    const bankMatches = allowedBanks.includes(matchedBankShort) || allowedBanks.includes(matchedBankCode)
    if (!bankMatches) {
      return {
        status: 'MISMATCH',
        code: 'BANK_CODE_MISMATCH',
        reason: `Matched bank ${matchedBankShort || matchedBankCode} not in allowed list`
      }
    }

    const observedNumber = matchedAccount.bankNumber || rawReceiver?.account?.bank?.account || ''
    const digitMatch = doesMaskedIdentifierMatch(observedNumber, expectedDigits)
    if (digitMatch === 'MISMATCH') {
      return {
        status: 'MISMATCH',
        code: 'ACCOUNT_NUMBER_MISMATCH',
        reason: 'Matched bank number does not match configured owner account'
      }
    }
    if (digitMatch === 'AMBIGUOUS') {
      return {
        status: 'MANUAL_REVIEW',
        code: 'ACCOUNT_NUMBER_AMBIGUOUS',
        reason: 'Bank account digits masked too heavily for automatic confirmation'
      }
    }

    return { status: 'MATCH', code: 'BANK_MATCHED', reason: 'Bank account matched' }
  }

  const expectedProxyType = String(rules.expected_proxy_type || '').trim().toUpperCase()
  const expectedProxyValue = String(rules.expected_proxy_value || channelSettings.promptpay_id || '').trim()
  const expectedBankDigits = normalizeDigits(rules.expected_account_digits || channelSettings.account_number)
  const allowedBanks = (rules.allowed_bank_codes || []).map(b => String(b).trim().toUpperCase()).filter(Boolean)

  if (!expectedProxyValue && (!expectedBankDigits || allowedBanks.length === 0)) {
    return {
      status: 'MANUAL_REVIEW',
      code: 'PROMPTPAY_RULES_NOT_CONFIGURED',
      reason: 'Owner PromptPay verification rules not configured completely'
    }
  }

  const matchedProxyType = String(matchedAccount.proxy?.type || rawReceiver?.account?.proxy?.type || '').trim().toUpperCase()
  const matchedProxyVal = matchedAccount.proxy?.account || rawReceiver?.account?.proxy?.value || ''

  if (expectedProxyValue && matchedProxyVal) {
    if (expectedProxyType && matchedProxyType && expectedProxyType !== matchedProxyType) {
      return {
        status: 'MISMATCH',
        code: 'PROMPTPAY_PROXY_TYPE_MISMATCH',
        reason: `Proxy type ${matchedProxyType} does not match ${expectedProxyType}`
      }
    }
    const proxyCheck = doesMaskedIdentifierMatch(matchedProxyVal, expectedProxyValue)
    if (proxyCheck === 'MISMATCH') {
      return {
        status: 'MISMATCH',
        code: 'PROMPTPAY_PROXY_MISMATCH',
        reason: 'PromptPay proxy identifier does not match owner PromptPay ID'
      }
    }
    if (proxyCheck === 'MATCH') {
      return { status: 'MATCH', code: 'PROMPTPAY_PROXY_MATCHED', reason: 'PromptPay proxy matched' }
    }
    return {
      status: 'MANUAL_REVIEW',
      code: 'PROMPTPAY_PROXY_AMBIGUOUS',
      reason: 'PromptPay proxy identifier masked ambiguously'
    }
  }

  if (expectedBankDigits && allowedBanks.length > 0 && matchedAccount.bankNumber) {
    const matchedBankShort = String(matchedAccount.bank?.shortCode || '').trim().toUpperCase()
    const matchedBankCode = String(matchedAccount.bank?.code || '').trim().toUpperCase()
    if (!allowedBanks.includes(matchedBankShort) && !allowedBanks.includes(matchedBankCode)) {
      return {
        status: 'MISMATCH',
        code: 'PROMPTPAY_LINKED_BANK_MISMATCH',
        reason: 'PromptPay linked bank does not match owner configuration'
      }
    }
    const bankCheck = doesMaskedIdentifierMatch(matchedAccount.bankNumber, expectedBankDigits)
    if (bankCheck === 'MATCH') {
      return { status: 'MATCH', code: 'PROMPTPAY_LINKED_ACCOUNT_MATCHED', reason: 'PromptPay linked account matched' }
    }
    if (bankCheck === 'MISMATCH') {
      return {
        status: 'MISMATCH',
        code: 'PROMPTPAY_LINKED_ACCOUNT_MISMATCH',
        reason: 'PromptPay linked bank number mismatch'
      }
    }
  }

  return {
    status: 'MANUAL_REVIEW',
    code: 'PROMPTPAY_RECEIVER_UNCLEAR',
    reason: 'PromptPay receiver details incomplete for automatic confirmation'
  }
}

export function evaluateEasySlipVerification(input: {
  order: {
    id: string
    user_id: string
    amount_satang: number
    currency: string
    status: string
    expires_at: string
  }
  authedUserId: string
  paymentMethod: 'promptpay' | 'bank_transfer'
  data: EasySlipVerifySuccessData
  existingRefMatches: ExistingPaymentRefMatch[]
  channelSettings: ChannelSettingRecord | null | undefined
  channelRules: ChannelVerificationRule | null | undefined
  nowMs?: number
}): VerificationDecision {
  const {
    order,
    authedUserId,
    paymentMethod,
    data,
    existingRefMatches,
    channelSettings,
    channelRules,
    nowMs = Date.now()
  } = input

  if (order.user_id !== authedUserId) {
    return {
      decision: 'REJECT',
      transRef: null,
      reasonCode: 'ORDER_OWNERSHIP_MISMATCH',
      failureReason: 'Order does not belong to authenticated user',
      userMessage: 'คำสั่งซื้อไม่ตรงกับบัญชีผู้ใช้ของคุณ'
    }
  }

  if (order.status === 'PAID') {
    const sameRef = String(data.rawSlip?.transRef || '').trim()
    const sameOrderVerified = existingRefMatches.find(m => m.orderId === order.id && m.verificationStatus === 'VERIFIED')
    if (sameOrderVerified) {
      return {
        decision: 'IDEMPOTENT_ALREADY_VERIFIED',
        transRef: sameOrderVerified.paymentId,
        userMessage: 'ชำระเงินสำเร็จ! Premium Membership ของคุณเปิดใช้งานแล้ว'
      }
    }
    return {
      decision: 'REJECT',
      transRef: sameRef || null,
      reasonCode: 'ORDER_ALREADY_PAID',
      failureReason: 'Order is already marked as PAID',
      userMessage: 'คำสั่งซื้อนี้ได้รับการชำระเงินแล้ว'
    }
  }

  if (new Date(order.expires_at).getTime() <= nowMs) {
    return {
      decision: 'REJECT',
      transRef: String(data.rawSlip?.transRef || '').trim() || null,
      reasonCode: 'ORDER_EXPIRED',
      failureReason: 'Order expired before verification completed',
      userMessage: 'คำสั่งซื้อนี้หมดอายุแล้ว กรุณาสร้างคำสั่งซื้อใหม่'
    }
  }

  const transRef = typeof data.rawSlip?.transRef === 'string' ? data.rawSlip.transRef.trim() : ''
  if (!transRef) {
    return {
      decision: 'MANUAL_REVIEW',
      transRef: null,
      reasonCode: 'MISSING_TRANS_REF',
      failureReason: 'EasySlip response missing rawSlip.transRef',
      userMessage: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
    }
  }

  const otherOrderMatch = existingRefMatches.find(m => m.orderId !== order.id)
  if (otherOrderMatch) {
    return {
      decision: 'REJECT',
      transRef,
      reasonCode: 'DUPLICATE_SLIP_OTHER_ORDER',
      failureReason: 'Transaction reference already associated with another order',
      userMessage: 'สลิปนี้ถูกใช้ในระบบแล้ว'
    }
  }

  const sameOrderVerifiedMatch = existingRefMatches.find(
    m => m.orderId === order.id && m.verificationStatus === 'VERIFIED'
  )
  if (sameOrderVerifiedMatch) {
    return {
      decision: 'IDEMPOTENT_ALREADY_VERIFIED',
      transRef,
      userMessage: 'ชำระเงินสำเร็จ! Premium Membership ของคุณเปิดใช้งานแล้ว'
    }
  }

  if (data.isDuplicate !== false) {
    return {
      decision: 'MANUAL_REVIEW',
      transRef,
      reasonCode: 'DUPLICATE_SLIP_AMBIGUOUS',
      failureReason: 'EasySlip reported isDuplicate=true without verified match on this order',
      userMessage: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
    }
  }

  const localObj = data.rawSlip?.amount?.local
  if (!localObj || localObj.amount === null || localObj.amount === undefined) {
    return {
      decision: 'MANUAL_REVIEW',
      transRef,
      reasonCode: 'MISSING_LOCAL_AMOUNT',
      failureReason: 'EasySlip response missing rawSlip.amount.local.amount for THB validation',
      userMessage: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
    }
  }

  const localCurrencyRaw = String(localObj.currency || '').trim()
  if (!isThaiBahtCurrency(localCurrencyRaw)) {
    return {
      decision: 'REJECT',
      transRef,
      reasonCode: 'UNSUPPORTED_SLIP_CURRENCY',
      failureReason: `Slip local currency ${localCurrencyRaw || 'UNKNOWN'} is not THB`,
      userMessage: 'สกุลเงินในสลิปไม่รองรับ (ต้องเป็นเงินบาท THB / บาท เท่านั้น)'
    }
  }

  const localSatang = toSatang(localObj.amount)
  const orderInRespSatang = toSatang(data.amountInOrder)
  const slipSatang = toSatang(data.amountInSlip)

  if (localSatang === null || orderInRespSatang === null || slipSatang === null) {
    return {
      decision: 'MANUAL_REVIEW',
      transRef,
      reasonCode: 'INVALID_AMOUNT_FORMAT',
      failureReason: 'Unable to parse satang integer amount from EasySlip response',
      userMessage: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
    }
  }

  if (
    data.isAmountMatched !== true ||
    localSatang !== order.amount_satang ||
    orderInRespSatang !== order.amount_satang ||
    slipSatang !== order.amount_satang
  ) {
    return {
      decision: 'REJECT',
      transRef,
      reasonCode: 'AMOUNT_MISMATCH',
      failureReason: `Expected ${order.amount_satang} satang, got local=${localSatang}, order=${orderInRespSatang}, slip=${slipSatang}, matched=${String(data.isAmountMatched)}`,
      userMessage: 'ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ'
    }
  }

  const accountCheck = verifyAccountMatch({
    paymentMethod,
    matchedAccount: data.matchedAccount,
    rawReceiver: data.rawSlip?.receiver,
    channelSettings,
    channelRules
  })

  if (accountCheck.status === 'MISMATCH') {
    return {
      decision: 'REJECT',
      transRef,
      reasonCode: accountCheck.code,
      failureReason: accountCheck.reason,
      userMessage: 'บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีของ Plottrix'
    }
  }

  if (accountCheck.status === 'MANUAL_REVIEW') {
    return {
      decision: 'MANUAL_REVIEW',
      transRef,
      reasonCode: accountCheck.code,
      failureReason: accountCheck.reason,
      userMessage: 'ได้รับหลักฐานการชำระเงินแล้ว กำลังตรวจสอบเพิ่มเติม'
    }
  }

  return {
    decision: 'AUTO_APPROVE',
    transRef,
    verifiedAmountSatang: localSatang,
    userMessage: 'ชำระเงินสำเร็จ! Premium Membership ของคุณเปิดใช้งานแล้ว'
  }
}
