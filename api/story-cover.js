/**
 * Vercel Serverless Function: /api/story-cover
 * Serves direct binary image or redirects to cover image URL for social media link preview (LINE, Facebook, Discord, Twitter).
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jqgbgqlhztixhkrqdwtf.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BE_MPg4wcaBIr5eFEHqAbg_U-qOrLTQ'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  const { id } = req.query || {}

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (!id) {
    return res.redirect(302, 'https://plottrix.vercel.app/Logo/PlottrixFullLogo.png')
  }

  try {
    const { data: novel, error } = await supabase
      .from('novels')
      .select('id, cover_url, cover_images')
      .eq('id', id)
      .single()

    if (error || !novel) {
      return res.redirect(302, 'https://plottrix.vercel.app/Logo/PlottrixFullLogo.png')
    }

    const cover = (Array.isArray(novel.cover_images) && novel.cover_images[0]) || novel.cover_url || ''

    // 1. If base64 data image URL
    if (cover.startsWith('data:image/')) {
      const match = cover.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
      if (match) {
        const mimeType = match[1]
        const base64Data = match[2]
        const imgBuffer = Buffer.from(base64Data, 'base64')

        res.setHeader('Content-Type', mimeType)
        res.setHeader('Content-Length', imgBuffer.length)
        return res.status(200).send(imgBuffer)
      }
    }

    // 2. If valid HTTP / HTTPS URL
    if (cover.startsWith('http://') || cover.startsWith('https://')) {
      return res.redirect(302, cover)
    }

    // 3. Fallback to Plottrix logo
    return res.redirect(302, 'https://plottrix.vercel.app/Logo/PlottrixFullLogo.png')
  } catch (err) {
    console.error('[StoryCover] Error:', err)
    return res.redirect(302, 'https://plottrix.vercel.app/Logo/PlottrixFullLogo.png')
  }
}
