export type EasySlipMatchedAccount = {
  bank?: {
    nameTh?: string
    nameEn?: string
    code?: string
    shortCode?: string
  } | null
  nameTh?: string | null
  nameEn?: string | null
  type?: string | null
  bankNumber?: string | null
  proxy?: {
    type?: string | null
    account?: string | null
  } | null
}

export type EasySlipRawSlip = {
  payload?: string | null
  transRef?: string | null
  date?: string | null
  countryCode?: string | null
  amount?: {
    amount?: number | string | null
    local?: {
      amount?: number | string | null
      currency?: string | null
    } | null
  } | null
  sender?: Record<string, unknown> | null
  receiver?: {
    bank?: {
      id?: string | null
      name?: string | null
      short?: string | null
    } | null
    account?: {
      name?: {
        th?: string | null
        en?: string | null
      } | null
      bank?: {
        account?: string | null
      } | null
      proxy?: {
        type?: string | null
        value?: string | null
      } | null
    } | null
  } | null
}

export type EasySlipVerifySuccessData = {
  remark?: string | null
  isDuplicate?: boolean
  matchedAccount?: EasySlipMatchedAccount | null
  amountInOrder?: number | string | null
  amountInSlip?: number | string | null
  isAmountMatched?: boolean
  rawSlip?: EasySlipRawSlip | null
}

export type ProviderVerificationRequest = {
  imageBytes: Uint8Array
  mimeType: string
  fileName: string
  expectedAmountDecimal: string
  orderCode: string
}

export type ProviderVerificationResult =
  | {
      ok: true
      httpStatus: number
      data: EasySlipVerifySuccessData
      sanitizedResponse: Record<string, unknown>
    }
  | {
      ok: false
      httpStatus: number
      errorCode: string
      category:
        | 'INVALID_INPUT'
        | 'SLIP_INVALID'
        | 'SLIP_PENDING'
        | 'PROVIDER_CONFIG'
        | 'RATE_LIMIT'
        | 'PROVIDER_UNAVAILABLE'
      retryAfterSeconds?: number
      rawMessage: string
    }

export interface SlipVerificationProvider {
  readonly providerName: string
  verifyBankSlip(req: ProviderVerificationRequest): Promise<ProviderVerificationResult>
}
