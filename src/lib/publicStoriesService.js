/**
 * Public Stories Service
 * Queries published novels and chapters from Supabase in real time.
 * Supports public read access and handles 5-chapter guest limits on the server/client boundary.
 */

import { supabase } from './supabaseClient'

/**
 * Format timestamp to Thai Buddhist Era d/m/y (e.g. 20/11/2569)
 */
export function formatDmy(dateInput) {
  if (!dateInput) return '-'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return '-'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear() + 543
    return `${day}/${month}/${year}`
  } catch {
    return '-'
  }
}

/**
 * Format timestamp to d/m/y / 00:00 น. (e.g. 20/11/2569 / 21:30 น.)
 */
export function formatDmyTime(dateInput) {
  if (!dateInput) return '-'
  try {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return '-'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear() + 543
    const hours = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} / ${hours}:${mins} น.`
  } catch {
    return '-'
  }
}

/**
 * Get or create an anonymous device identifier for guest view/follow deduplication
 */
export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'server-device'
  let id = localStorage.getItem('plottrix_device_id')
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem('plottrix_device_id', id)
  }
  return id
}

/**
 * Record a real view for a novel (deduplicated per browser session)
 */
export async function recordStoryView(storyId) {
  if (!storyId || typeof window === 'undefined') return
  const sessionKey = `plottrix_viewed_${storyId}`
  if (sessionStorage.getItem(sessionKey)) return

  try {
    sessionStorage.setItem(sessionKey, '1')
    await supabase.rpc('increment_novel_views', { target_novel_id: storyId })
  } catch (err) {
    console.warn('[StoriesService] Record view notice:', err?.message)
  }
}

/**
 * Check if the current user or device is following a novel
 */
export async function checkStoryFollowing(storyId, userId = null, deviceId = null) {
  if (!storyId) return false
  const devId = deviceId || getOrCreateDeviceId()

  try {
    let query = supabase.from('story_followers').select('id').eq('novel_id', storyId)
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('device_id', devId)
    }
    const { data } = await query.limit(1)
    return Boolean(data && data.length > 0)
  } catch (err) {
    console.warn('[StoriesService] Check following notice:', err?.message)
    return false
  }
}

/**
 * Toggle following a novel (returns { is_following, follower_count })
 */
export async function toggleStoryFollow(storyId, userId = null, deviceId = null) {
  if (!storyId) return { is_following: false, follower_count: 0 }
  const devId = deviceId || getOrCreateDeviceId()

  try {
    const { data, error } = await supabase.rpc('toggle_novel_follow', {
      target_novel_id: storyId,
      p_user_id: userId || null,
      p_device_id: devId
    })
    if (error) throw error
    return data || { is_following: false, follower_count: 0 }
  } catch (err) {
    console.warn('[StoriesService] Toggle follow error:', err?.message)
    return { is_following: false, follower_count: 0 }
  }
}

/**
 * Fetch all published stories from Supabase
 * @returns {Promise<Array>} List of published stories
 */
export async function fetchPublishedStories() {
  try {
    // 1. Fetch stories where is_published is true (select specific fields with 8s timeout guard)
    const fetchPromise = supabase
      .from('novels')
      .select('id, title, genre, pov, synopsis, author_display_name, cover_url, cover_images, tags, view_count, follower_count, is_published, published_at, published_arc, published_snapshot, created_at, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase fetch query timed out')), 8000)
    )

    const { data: stories, error } = await Promise.race([fetchPromise, timeoutPromise])

    if (error) {
      console.warn('[StoriesService] Fetch error:', error.message)
      return []
    }

    if (!stories || stories.length === 0) {
      return []
    }

    const storyIds = stories.map(s => s.id)

    // 2. Fetch chapter counts
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

    // 3. Fetch real comment counts from story_comments
    const { data: commentsData } = await supabase
      .from('story_comments')
      .select('story_id')
      .in('story_id', storyIds)

    const commentCountMap = {}
    if (commentsData) {
      commentsData.forEach(c => {
        commentCountMap[c.story_id] = (commentCountMap[c.story_id] || 0) + 1
      })
    }

    return stories.map(s => {
      // Prioritize published_snapshot count to isolate unreleased drafts
      const snapshotChapters = s.published_snapshot?.chapters
      const snapshotCount = Array.isArray(snapshotChapters) ? snapshotChapters.length : null
      const totalCount = snapshotCount !== null ? snapshotCount : (chapterCountMap[s.id] || 0)

      // Gallery of up to 5 covers
      const coverImages = Array.isArray(s.cover_images) && s.cover_images.length > 0
        ? s.cover_images.filter(Boolean)
        : [s.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80']

      // Tags
      const tags = Array.isArray(s.tags) ? s.tags : []

      return {
        ...s,
        chapterCount: totalCount,
        published_arc: s.published_arc || s.published_snapshot?.arc_name || '',
        authorName: s.author_display_name || 'นักเขียน Plottrix',
        cover_images: coverImages,
        cover_url: coverImages[0] || s.cover_url,
        tags,
        view_count: Number(s.view_count) || 0,
        follower_count: Number(s.follower_count) || 0,
        commentCount: commentCountMap[s.id] || 0,
        publishedDate: formatDmy(s.published_at || s.created_at),
        publishedDateTime: formatDmyTime(s.published_at || s.created_at),
        updatedDateTime: formatDmyTime(s.updated_at || s.published_at)
      }
    })
  } catch (err) {
    console.warn('[StoriesService] Exception:', err)
    return []
  }
}

/**
 * Fetch a single story by ID (for Reader page & Story Details page)
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

    // Fetch real comment count
    const { count: commentCount } = await supabase
      .from('story_comments')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId)

    const coverImages = Array.isArray(data.cover_images) && data.cover_images.length > 0
      ? data.cover_images.filter(Boolean)
      : [data.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80']

    return {
      ...data,
      authorName: data.author_display_name || 'นักเขียน Plottrix',
      cover: coverImages[0] || data.cover_url,
      cover_url: coverImages[0] || data.cover_url,
      cover_images: coverImages,
      tags: Array.isArray(data.tags) ? data.tags : [],
      view_count: Number(data.view_count) || 0,
      follower_count: Number(data.follower_count) || 0,
      commentCount: Number(commentCount) || 0,
      publishedDate: formatDmy(data.published_at || data.created_at),
      createdDate: formatDmy(data.created_at),
      updatedDateTime: formatDmyTime(data.updated_at || data.published_at)
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
export async function fetchStoryChapters(storyId, isAuthenticated = false, preloadedStory = null) {
  try {
    let storyData = preloadedStory
    if (!storyData) {
      storyData = await fetchStoryById(storyId)
    }

    // 1. If story has a frozen published_snapshot with chapters, serve that snapshot!
    // This completely isolates the author's live Studio edits/drafts from what readers see.
    const snapshotChapters = storyData?.published_snapshot?.chapters
    if (Array.isArray(snapshotChapters) && snapshotChapters.length > 0) {
      return snapshotChapters.map((ch, idx) => {
        const chapterNumber = ch.number || ch.chapter_number || idx + 1
        const isLocked = !isAuthenticated && chapterNumber > 5

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

        if (isLocked) {
          return {
            id: ch.id || `snap-ch-${idx}`,
            novel_id: storyId,
            number: chapterNumber,
            title: ch.title || `บทที่ ${chapterNumber}`,
            pages: ['[เนื้อหาตอนนี้สงวนสิทธิ์สำหรับสมาชิก Plottrix เท่านั้น กรุณาสมัครสมาชิกหรือเข้าสู่ระบบเพื่ออ่านต่อฟรี]'],
            isLocked: true,
            wordCount: ch.word_count || ch.wordCount || 0
          }
        }

        return {
          id: ch.id || `snap-ch-${idx}`,
          novel_id: storyId,
          number: chapterNumber,
          title: ch.title || `บทที่ ${chapterNumber}`,
          pages: parsedPages,
          isLocked: false,
          wordCount: ch.word_count || ch.wordCount || 0
        }
      })
    }

    // 2. Fallback: Query live chapters table if no snapshot exists
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
    if (metadata.cover_images !== undefined) payload.cover_images = metadata.cover_images
    if (metadata.tags !== undefined) payload.tags = metadata.tags
    if (metadata.published_arc !== undefined) payload.published_arc = metadata.published_arc
    if (metadata.published_snapshot !== undefined) payload.published_snapshot = metadata.published_snapshot
    if (metadata.publish_history !== undefined) payload.publish_history = metadata.publish_history

    let { data, error } = await supabase
      .from('novels')
      .update(payload)
      .eq('id', storyId)
      .select()
      .single()

    // Gracefully handle missing optional columns in schema cache
    if (error && (error.message?.includes('published_snapshot') || error.message?.includes('published_arc') || error.message?.includes('author_display_name') || error.message?.includes('publish_history'))) {
      console.warn('[StoriesService] Optional publishing column missing in schema cache, retrying without new columns...', error.message)
      delete payload.published_snapshot
      delete payload.published_arc
      delete payload.author_display_name
      delete payload.publish_history
      const retry = await supabase
        .from('novels')
        .update(payload)
        .eq('id', storyId)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('[StoriesService] Error toggling publish state:', err)
    return { success: false, error: err.message }
  }
}
