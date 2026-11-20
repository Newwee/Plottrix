import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
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
        // Create fallback profile if trigger hasn't run yet
        const defaultProf = {
          id: userId,
          email: user?.email || '',
          display_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'นักเขียน',
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
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
        signIn,
        signUp,
        signInWithOAuth,
        signInWithOtp,
        resetPassword,
        signOut,
        updateProfile,
        uploadAvatar,
        refreshProfile: () => user && fetchProfile(user.id)
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
