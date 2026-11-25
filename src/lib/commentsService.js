/**
 * Story & Chapter Comments Service
 * Handles persistent reading feedback using Supabase `story_comments` table.
 * Restricted strictly to authenticated members (`userId` required).
 */

import { supabase } from './supabaseClient'

/**
 * Fetch comments for a story (or specific chapter)
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
      console.warn('[CommentsService] Supabase fetch notice:', error.message)
      return []
    }

    return data || []
  } catch (err) {
    console.warn('[CommentsService] Fetch exception:', err)
    return []
  }
}

/**
 * Add a new comment to Supabase (Authenticated Members Only)
 */
export async function addComment({ storyId, chapterId = null, userId = null, commenterName, content }) {
  if (!userId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนจึงจะสามารถแสดงความคิดเห็นได้' }
  }

  if (!storyId || !content?.trim() || !commenterName?.trim()) {
    return { success: false, error: 'กรุณากรอกชื่อและเนื้อหาความคิดเห็นให้ครบถ้วน' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const activeUid = sessionData?.session?.user?.id
  if (!activeUid || activeUid !== userId) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อแสดงความคิดเห็น' }
  }

  const commentPayload = {
    story_id: storyId,
    chapter_id: chapterId || null,
    user_id: activeUid,
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
      return { success: false, error: error.message || 'ไม่สามารถบันทึกความคิดเห็นได้' }
    }

    return { success: true, data }
  } catch (err) {
    console.error('[CommentsService] Exception:', err)
    return { success: false, error: err.message }
  }
}
