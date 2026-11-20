/**
 * Public Stories Service
 * Queries published novels and chapters from Supabase in real time.
 * Supports public read access and handles 5-chapter guest limits on the server/client boundary.
 */

import { supabase } from './supabaseClient'

/**
 * Fetch all published stories from Supabase
 * @returns {Promise<Array>} List of published stories
 */
export async function fetchPublishedStories() {
  try {
    // 1. Fetch stories where is_published is true
    const { data: stories, error } = await supabase
      .from('novels')
      .select('id, user_id, title, synopsis, genre, pov, cover_url, is_published, published_at, author_display_name, updated_at, created_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[StoriesService] Fetch error:', error.message)
      return []
    }

    if (!stories || stories.length === 0) {
      return []
    }

    // 2. Fetch chapter counts for each published novel
    const storyIds = stories.map(s => s.id)
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('id, novel_id')
      .in('novel_id', storyIds)

    const chapterCountMap = {}
    if (chaptersData) {
      chaptersData.forEach(ch => {
        chapterCountMap[ch.novel_id] = (chapterCountMap[ch.novel_id] || 0) + 1
      })
    }

    return stories.map(s => ({
      ...s,
      chapterCount: chapterCountMap[s.id] || 0,
      authorName: s.author_display_name || 'นักเขียน Plottrix',
      publishedDate: s.published_at
        ? new Date(s.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'เมื่อสักครู่'
    }))
  } catch (err) {
    console.warn('[StoriesService] Exception:', err)
    return []
  }
}

/**
 * Fetch a single story by ID (for Reader page)
 * @param {string} storyId
 */
export async function fetchStoryById(storyId) {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .eq('id', storyId)
      .single()

    if (error || !data) {
      console.warn('[StoriesService] Story not found:', error?.message)
      return null
    }

    return {
      ...data,
      authorName: data.author_display_name || 'นักเขียน Plottrix',
      cover: data.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'
    }
  } catch (err) {
    console.warn('[StoriesService] Error fetching story:', err)
    return null
  }
}

/**
 * Fetch chapters of a story with strict 5-chapter guest limit
 * @param {string} storyId
 * @param {boolean} isAuthenticated
 */
export async function fetchStoryChapters(storyId, isAuthenticated = false) {
  try {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('id, novel_id, chapter_number, title, pages, word_count, created_at')
      .eq('novel_id', storyId)
      .order('chapter_number', { ascending: true })

    if (error || !chapters) {
      console.warn('[StoriesService] Error fetching chapters:', error?.message)
      return []
    }

    return chapters.map((ch, idx) => {
      const chapterNumber = ch.chapter_number || idx + 1
      const isLocked = !isAuthenticated && chapterNumber > 5

      // Parse pages safely
      let parsedPages = ['']
      if (Array.isArray(ch.pages)) {
        parsedPages = ch.pages
      } else if (typeof ch.pages === 'string') {
        try {
          parsedPages = JSON.parse(ch.pages)
        } catch {
          parsedPages = [ch.pages]
        }
      }

      // If locked for guest reader: redact the full text payload
      if (isLocked) {
        return {
          id: ch.id,
          novel_id: ch.novel_id,
          number: chapterNumber,
          title: ch.title || `บทที่ ${chapterNumber}`,
          pages: ['[เนื้อหาตอนนี้สงวนสิทธิ์สำหรับสมาชิก Plottrix เท่านั้น กรุณาสมัครสมาชิกหรือเข้าสู่ระบบเพื่ออ่านต่อฟรี]'],
          isLocked: true,
          wordCount: ch.word_count || 0
        }
      }

      return {
        id: ch.id,
        novel_id: ch.novel_id,
        number: chapterNumber,
        title: ch.title || `บทที่ ${chapterNumber}`,
        pages: parsedPages,
        isLocked: false,
        wordCount: ch.word_count || 0
      }
    })
  } catch (err) {
    console.warn('[StoriesService] Error loading chapters:', err)
    return []
  }
}

/**
 * Toggle Publish / Unpublish a story directly in Supabase
 * @param {string} storyId
 * @param {boolean} isPublished
 * @param {object} metadata
 */
export async function togglePublishStory(storyId, isPublished, metadata = {}) {
  try {
    const payload = {
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }

    if (metadata.title) payload.title = metadata.title
    if (metadata.genre) payload.genre = metadata.genre
    if (metadata.synopsis !== undefined) payload.synopsis = metadata.synopsis
    if (metadata.author_display_name) payload.author_display_name = metadata.author_display_name
    if (metadata.cover_url) payload.cover_url = metadata.cover_url

    const { data, error } = await supabase
      .from('novels')
      .update(payload)
      .eq('id', storyId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('[StoriesService] Error toggling publish state:', err)
    return { success: false, error: err.message }
  }
}
