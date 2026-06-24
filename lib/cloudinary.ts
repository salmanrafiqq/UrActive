// Cloudinary Image Upload Utilities

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.error('Cloudinary configuration is missing in .env.local')
}

/**
 * Compress image before upload
 */
const compressImage = async (
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.6
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // If file is already small, skip compression
    if (file.size < 500000) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'))
            return
          }
          resolve(blob)
        }, 'image/jpeg', quality)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Upload avatar to Cloudinary
 */
export const uploadAvatarImage = async (file: File, userId: string): Promise<string> => {
  try {
    console.log(`Starting avatar upload for user: ${userId}`)

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image size must be less than 10MB')
    }

    // Compress avatar
    console.log('Compressing avatar...')
    const compressedBlob = await compressImage(file, 250, 250, 0.5)
    const compressedFile = new File([compressedBlob], 'avatar.jpg', { type: 'image/jpeg' })
    console.log(`Avatar compressed: ${compressedFile.size} bytes`)

    // Prepare form data
    const formData = new FormData()
    formData.append('file', compressedFile)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '')
    formData.append('folder', `uractive/avatars/${userId}`)
    formData.append('resource_type', 'auto')

    // Upload to Cloudinary
    console.log(`Uploading avatar to Cloudinary...`)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Upload failed')
    }

    const data = await response.json()
    if (data.secure_url) {
      console.log(`✅ Avatar uploaded successfully`)
      console.log(`   URL: ${data.secure_url}`)
      return data.secure_url
    } else {
      throw new Error('No URL returned from Cloudinary')
    }
  } catch (error: any) {
    console.error('❌ Avatar upload error:', error.message)
    throw error
  }
}

/**
 * Upload event image to Cloudinary
 */
export const uploadEventImage = async (file: File, eventTitle: string): Promise<string> => {
  try {
    console.log(`Starting event image upload for: ${eventTitle}`)

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file')
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('Image size must be less than 20MB')
    }

    // Compress image
    console.log('Compressing image...')
    const compressedBlob = await compressImage(file, 800, 600, 0.6)
    const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })
    console.log(`Image compressed: ${compressedFile.size} bytes`)

    // Prepare form data
    const formData = new FormData()
    formData.append('file', compressedFile)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '')
    formData.append('folder', `uractive/events/${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`)
    formData.append('resource_type', 'auto')

    // Upload to Cloudinary
    console.log(`Uploading event image to Cloudinary...`)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Upload failed')
    }

    const data = await response.json()
    console.log(`Event image uploaded successfully: ${data.secure_url}`)
    return data.secure_url
  } catch (error: any) {
    console.error('Event image upload error:', error)
    throw new Error(`Image upload failed: ${error.message}`)
  }
}
