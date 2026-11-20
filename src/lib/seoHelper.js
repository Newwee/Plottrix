/**
 * SEO & Social Share Helper
 * Manages dynamic document title, Open Graph, Twitter Cards, and Social Sharing
 */

export function updatePageMeta({
  title,
  description,
  image,
  url,
  author,
  type = 'book'
}) {
  if (typeof document === 'undefined') return

  // 1. Update Title
  if (title) {
    document.title = author ? `${title} | โดย ${author} — Plottrix` : `${title} — Plottrix`
  }

  // 2. Helper to set or create meta tag
  const setMetaTag = (selector, attributeName, attributeValue, content) => {
    if (!content) return
    let el = document.querySelector(selector)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attributeName, attributeValue)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  const cleanDesc = description ? description.replace(/\s+/g, ' ').substring(0, 200) : ''
  const fullTitle = author ? `${title} | โดย ${author}` : title

  // Standard Meta
  setMetaTag('meta[name="description"]', 'name', 'description', cleanDesc)
  setMetaTag('meta[name="author"]', 'name', 'author', author || 'Plottrix')

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle)
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', cleanDesc)
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', type)
  if (url) setMetaTag('meta[property="og:url"]', 'property', 'og:url', url)
  if (image) {
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image)
    setMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', image)
  }

  // Twitter Card
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', cleanDesc)
  if (image) setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image)
}

/**
 * Copy text with cross-browser fallback
 */
export async function copyToClipboard(text) {
  if (typeof window === 'undefined') return false

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('[Clipboard] writeText failed, using fallback:', err)
    }
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('[Clipboard] Fallback execCommand failed:', err)
    return false
  }
}

/**
 * Generate 1-click share intent URLs for popular chat & social apps
 */
export function getSocialShareUrls(url, title, author = '') {
  const encodedUrl = encodeURIComponent(url)
  const shareText = `อ่านนิยายเรื่อง "${title}" ${author ? `โดย ${author}` : ''} บน Plottrix`
  const encodedText = encodeURIComponent(shareText)

  return {
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`
  }
}
