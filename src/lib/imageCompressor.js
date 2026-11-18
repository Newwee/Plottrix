import { supabase } from './supabaseClient'

/**
 * Compresses an image file client-side using HTML5 Canvas to WebP format
 * @param {File|Blob} file 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export function compressImageToWebP(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas WebP compression failed'))
            }
          },
          'image/webp',
          quality
        )
      }
      img.onerror = (err) => reject(err)
      img.src = e.target.result
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an image to Supabase Storage bucket 'plottrix-assets' after compressing to WebP
 * @param {File} file 
 * @param {string} folder 'covers' | 'avatars'
 * @param {string} userId 
 * @returns {Promise<string>} Public URL of the uploaded image
 */
export async function uploadImageToSupabase(file, folder = 'covers', userId = 'public') {
  try {
    const compressedBlob = await compressImageToWebP(file, 800, 800, 0.82)
    const fileName = `${folder}/${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`

    const { data, error } = await supabase.storage
      .from('plottrix-assets')
      .upload(fileName, compressedBlob, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.warn('Supabase storage upload error:', error.message)
      // Fallback: create an object URL or data URL for local display if offline/unconfigured
      return URL.createObjectURL(compressedBlob)
    }

    const { data: urlData } = supabase.storage
      .from('plottrix-assets')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (err) {
    console.error('Image compression & upload failed:', err)
    // Fallback: return data URL
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }
}
