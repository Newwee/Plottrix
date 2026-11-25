import type {
  ProviderVerificationRequest,
  ProviderVerificationResult,
  SlipVerificationProvider,
  EasySlipVerifySuccessData
} from './types.ts'

const EASYSLIP_V2_VERIFY_URL = 'https://api.easyslip.com/v2/verify/bank'
const REQUEST_TIMEOUT_MS = 20000

const ERROR_CATEGORY_MAP: Record<string, ProviderVerificationResult & { ok: false } extends { category: infer C } ? C : never> = {
  INVALID_IMAGE_FORMAT: 'INVALID_INPUT',
  INVALID_IMAGE_TYPE: 'INVALID_INPUT',
  IMAGE_SIZE_TOO_LARGE: 'INVALID_INPUT',
  VALIDATION_ERROR: 'INVALID_INPUT',
  SLIP_NOT_FOUND: 'SLIP_INVALID',
  SLIP_PENDING: 'SLIP_PENDING',
  MISSING_API_KEY: 'PROVIDER_CONFIG',
  INVALID_API_KEY: 'PROVIDER_CONFIG',
  BRANCH_INACTIVE: 'PROVIDER_CONFIG',
  IP_NOT_ALLOWED: 'PROVIDER_CONFIG',
  QUOTA_EXCEEDED: 'PROVIDER_CONFIG',
  SERVICE_BANNED: 'PROVIDER_CONFIG',
  SERVICE_DELETED: 'PROVIDER_CONFIG',
  USER_BANNED: 'PROVIDER_CONFIG',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT',
  API_SERVER_ERROR: 'PROVIDER_UNAVAILABLE'
}

export function sanitizeProviderResponse(data: EasySlipVerifySuccessData) {
  return {
    remark: data.remark ?? null,
    isDuplicate: data.isDuplicate ?? null,
    matchedAccount: data.matchedAccount ?? null,
    amountInOrder: data.amountInOrder ?? null,
    amountInSlip: data.amountInSlip ?? null,
    isAmountMatched: data.isAmountMatched ?? null,
    rawSlip: data.rawSlip
      ? {
          transRef: data.rawSlip.transRef ?? null,
          date: data.rawSlip.date ?? null,
          countryCode: data.rawSlip.countryCode ?? null,
          amount: data.rawSlip.amount ?? null,
          receiver: data.rawSlip.receiver ?? null
        }
      : null
  }
}

export function parseEasySlipErrorCode(rawCode: unknown, httpStatus: number): {
  errorCode: string
  category: 'INVALID_INPUT' | 'SLIP_INVALID' | 'SLIP_PENDING' | 'PROVIDER_CONFIG' | 'RATE_LIMIT' | 'PROVIDER_UNAVAILABLE'
} {
  const normalized = String(rawCode || '').trim().toUpperCase()
  if (normalized && ERROR_CATEGORY_MAP[normalized]) {
    return {
      errorCode: normalized,
      category: ERROR_CATEGORY_MAP[normalized]
    }
  }
  if (httpStatus === 429) {
    return { errorCode: normalized || 'RATE_LIMIT_EXCEEDED', category: 'RATE_LIMIT' }
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return { errorCode: normalized || 'PROVIDER_AUTH_ERROR', category: 'PROVIDER_CONFIG' }
  }
  if (httpStatus === 400) {
    return { errorCode: normalized || 'VALIDATION_ERROR', category: 'INVALID_INPUT' }
  }
  if (httpStatus === 404) {
    return { errorCode: normalized || 'SLIP_NOT_FOUND', category: 'SLIP_INVALID' }
  }
  return { errorCode: normalized || 'API_SERVER_ERROR', category: 'PROVIDER_UNAVAILABLE' }
}

export class EasySlipV2Provider implements SlipVerificationProvider {
  public readonly providerName = 'easyslip_v2'
  private readonly apiKey: string
  private readonly endpointUrl: string
  private readonly fetchFn: typeof fetch

  constructor(options: { apiKey: string; endpointUrl?: string; fetchFn?: typeof fetch }) {
    this.apiKey = (options.apiKey || '').trim()
    this.endpointUrl = options.endpointUrl || EASYSLIP_V2_VERIFY_URL
    this.fetchFn = options.fetchFn || fetch
  }

  private async executeOnce(req: ProviderVerificationRequest): Promise<ProviderVerificationResult> {
    if (!this.apiKey) {
      return {
        ok: false,
        httpStatus: 401,
        errorCode: 'MISSING_API_KEY',
        category: 'PROVIDER_CONFIG',
        rawMessage: 'EASYSLIP_API_KEY is missing'
      }
    }

    const form = new FormData()
    const blob = new Blob([req.imageBytes], { type: req.mimeType })
    form.append('image', blob, req.fileName)
    form.append('matchAccount', 'true')
    form.append('matchAmount', req.expectedAmountDecimal)
    form.append('checkDuplicate', 'true')
    form.append('remark', req.orderCode.slice(0, 255))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await this.fetchFn(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: form,
        signal: controller.signal
      })

      const httpStatus = response.status
      const retryAfterRaw = response.headers.get('Retry-After')
      const retryAfterNum = retryAfterRaw ? Number(retryAfterRaw) : undefined

      let parsed: Record<string, unknown> | null = null
      try {
        parsed = await response.json()
      } catch {
        parsed = null
      }

      if (httpStatus === 200 && parsed && parsed.success === true && parsed.data && typeof parsed.data === 'object') {
        const data = parsed.data as EasySlipVerifySuccessData
        return {
          ok: true,
          httpStatus,
          data,
          sanitizedResponse: sanitizeProviderResponse(data)
        }
      }

      const errorObj = (parsed?.error && typeof parsed.error === 'object' ? parsed.error : {}) as Record<string, unknown>
      const mapped = parseEasySlipErrorCode(errorObj.code, httpStatus)

      return {
        ok: false,
        httpStatus,
        errorCode: mapped.errorCode,
        category: mapped.category,
        retryAfterSeconds: Number.isFinite(retryAfterNum) ? retryAfterNum : undefined,
        rawMessage: String(errorObj.message || parsed?.message || `HTTP ${httpStatus}`)
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      return {
        ok: false,
        httpStatus: 504,
        errorCode: isAbort ? 'PROVIDER_TIMEOUT' : 'NETWORK_ERROR',
        category: 'PROVIDER_UNAVAILABLE',
        rawMessage: isAbort ? 'EasySlip verification timed out' : 'Network communication error'
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  public async verifyBankSlip(req: ProviderVerificationRequest): Promise<ProviderVerificationResult> {
    const firstResult = await this.executeOnce(req)
    if (!firstResult.ok && firstResult.category === 'RATE_LIMIT') {
      const waitSec = firstResult.retryAfterSeconds ?? 1
      if (waitSec > 0 && waitSec <= 2) {
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000))
        return await this.executeOnce(req)
      }
    }
    return firstResult
  }
}
