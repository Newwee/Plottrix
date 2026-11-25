import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export function getSupabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL') || ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase server credentials')
  }
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export async function requireAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return { user: null, error: 'ต้องเข้าสู่ระบบก่อนจึงจะใช้งานส่วนนี้ได้', status: 401 }
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return { user: null, error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง', status: 401 }
  }

  return { user, supabaseAdmin, error: null, status: 200 }
}

export async function getUserAdminRole(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<'owner' | 'admin' | null> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  if (data.role === 'owner' || data.role === 'admin') {
    return data.role
  }
  return null
}

export async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
