/**
 * Story & Chapter Comments Service
 * Handles persistent reading feedback using Supabase `story_comments` table.
 * Open to all visitors (both authenticated users and guests).
 */

import { supabase } from './supabaseClient'

/**
 * Fetch comments for a story (or specific chapter)
 * @param {string} storyId
 * @param {string|null} chapterId
 * @returns {Promise<Array>}
 */
export async function fetchComments(storyId, chapterId = null) {
  if (!storyId) return []

  try {
    let query = supabase
      .from('story_comments')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false })

    if (chapterId) {
      query = query.eq('chapter_id', chapterId)
    }

    const { data, error } = await query

    if (error) {
      // Table might not exist yet; check localStorage cache fallback
      console.warn('[CommentsService] Supabase fetch notice:', error.message)
      const cached = localStorage.getItem(`plottrix_comments_${storyId}`)
      if (cached) {
        try {
          const list = JSON.parse(cached)
          return chapterId ? list.filter(c => c.chapter_id === chapterId) : list
        } catch {
          return []
        }
      }
      return []
    }

    // Cache locally as backup
    if (data) {
      localStorage.setItem(`plottrix_comments_${storyId}`, JSON.stringify(data))
    }

    return data || []
  } catch (err) {
    console.warn('[CommentsService] Fetch exception:', err)
    return []
  }
}

/**
 * Add a new comment to Supabase
 * @param {object} param0
 * @param {string} param0.storyId
 * @param {string|null} param0.chapterId
 * @param {string|null} param0.userId
 * @param {string} param0.commenterName
 * @param {string} param0.content
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function addComment({ storyId, chapterId = null, userId = null, commenterName, content }) {
  if (!storyId || !content?.trim() || !commenterName?.trim()) {
    return { success: false, error: 'กรุณากรอกชื่อและเนื้อหาความคิดเห็นให้ครบถ้วน' }
  }

  const commentPayload = {
    story_id: storyId,
    chapter_id: chapterId || null,
    user_id: userId || null,
    commenter_name: commenterName.trim(),
    content: content.trim(),
    created_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('story_comments')
      .insert(commentPayload)
      .select()
      .single()

    if (error) {
      console.warn('[CommentsService] Supabase insert fallback:', error.message)
      // Save to localStorage so comments still persist if table isn't created yet
      const key = `plottrix_comments_${storyId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const fallbackItem = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ...commentPayload
      }
      localStorage.setItem(key, JSON.stringify([fallbackItem, ...existing]))
      return { success: true, data: fallbackItem }
    }

    // Update local cache
    const key = `plottrix_comments_${storyId}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    localStorage.setItem(key, JSON.stringify([data, ...existing]))

    return { success: true, data }
  } catch (err) {
    console.error('[CommentsService] Exception:', err)
    return { success: false, error: err.message }
  }
}
