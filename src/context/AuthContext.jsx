import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const PRIVATE_STORAGE_KEYS = [
  'plottrix_novels',
  'plottrix_characters',
  'plottrix_dictionary',
  'plottrix_snapshots',
  'plottrix_trix',
  'plottrix_plan',
  'plottrix_plan_tier',
  'plottrix_trial_used',
  'plottrix_trial_started_at',
  'plottrix_trial_ends_at',
  'plottrix_last_claim',
  'plottrix_tour_completed'
]

export function clearPrivateUserStorage() {
  if (typeof window === 'undefined') return
  PRIVATE_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (_) {}
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [oauthError, setOauthError] = useState(null)

  const clearOAuthError = useCallback(() => setOauthError(null), [])

  useEffect(() => {
    // Check OAuth error parameters returned via redirect URL (hash or query)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
      const hashParams = new URLSearchParams(hashStr)
      const errDesc = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error')
      if (errDesc) {
        setOauthError(decodeURIComponent(errDesc.replace(/\+/g, ' ')))
        window.history.replaceState({}, '', window.location.pathname)
      }
    }

    // Initial session
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession)
      setUser(initSession?.user || null)
      if (initSession?.user) {
        fetchProfile(initSession.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      if (newSession?.user) {
        await fetchProfile(newSession.user)
      } else {
        setProfile(null)
        clearPrivateUserStorage()
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function fetchProfile(userObj) {
    const userId = typeof userObj === 'string' ? userObj : userObj?.id
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile:', error.message)
      }

      if (data) {
        setProfile(data)
      } else {
        const meta = (typeof userObj === 'object' ? userObj?.user_metadata : null) || {}
        const fallbackName =
          meta.full_name ||
          meta.global_name ||
          meta.name ||
          meta.user_name ||
          meta.preferred_username ||
          (typeof userObj === 'object' && userObj?.email ? userObj.email.split('@')[0] : '') ||
          'นักเขียน Plottrix'

        const defaultProf = {
          id: userId,
          email: (typeof userObj === 'object' ? userObj?.email : '') || '',
          display_name: fallbackName,
          avatar_url: meta.avatar_url || '',
          plan: 'Free Plan',
          plan_tier: 'free',
          trial_used: false,
          trial_started_at: null,
          trial_ends_at: null,
          trix_balance: 30,
          last_claim_date: ''
        }
        setProfile(defaultProf)
      }
    } catch (err) {
      console.warn('Profile fetch exception:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider, // 'google' | 'discord' | 'github'
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  }

  async function signInWithOtp(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    clearPrivateUserStorage()
    setUser(null)
    setProfile(null)
    setSession(null)
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function uploadAvatar(file) {
    if (!user) throw new Error('User not logged in')
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('plottrix-assets')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('plottrix-assets')
      .getPublicUrl(filePath)

    await updateProfile({ avatar_url: publicUrl })
    return publicUrl
  }

  async function updateProfile(fields) {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (!error && data) {
        setProfile(data)
      } else {
        setProfile(prev => ({ ...prev, ...fields }))
      }
    } catch (err) {
      console.warn('Update profile error:', err)
      setProfile(prev => ({ ...prev, ...fields }))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        oauthError,
        clearOAuthError,
        signIn,
        signUp,
        signInWithOAuth,
        signInWithOtp,
        resetPassword,
        signOut,
        updateProfile,
        uploadAvatar,
        refreshProfile: () => user && fetchProfile(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
