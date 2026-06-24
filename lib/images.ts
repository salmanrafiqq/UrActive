// Utility to fetch suggested images for events

export const getGoogleImagesUrl = (query: string): string => {
  const encodedQuery = encodeURIComponent(query)
  return `https://www.google.com/search?tbm=isch&q=${encodedQuery}`
}

// Use Unsplash API for free high-quality images
const UNSPLASH_API_URL = 'https://api.unsplash.com'
const UNSPLASH_ACCESS_KEY = 'xYS1LEn0TXqJdRgZMzb0KdCrjH-OlQZ9E7XFW1PwNjE'

export interface SuggestedImage {
  url: string
  thumb: string
  photographer: string
  source: string
}

export const getSuggestedImages = async (eventTitle: string): Promise<SuggestedImage[]> => {
  try {
    if (!eventTitle || eventTitle.length < 2) {
      return []
    }

    // Extract main keywords from title
    const keywords = eventTitle.split(' ').slice(0, 3).join(' ')
    
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(keywords)}&per_page=4&client_id=${UNSPLASH_ACCESS_KEY}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.warn('Unsplash API not available')
      return []
    }

    const data = await response.json()
    
    if (!data.results || data.results.length === 0) {
      return []
    }

    return data.results.map((photo: any) => ({
      url: photo.urls.regular,
      thumb: photo.urls.small,
      photographer: photo.user?.name || 'Unsplash',
      source: 'Unsplash',
    }))
  } catch (error) {
    console.warn('Error fetching suggested images:', error)
    return []
  }
}

export const downloadImageFromUrl = async (imageUrl: string): Promise<File> => {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit',
    })
    const blob = await response.blob()
    return new File([blob], 'suggested-image.jpg', { type: 'image/jpeg' })
  } catch (error) {
    console.error('Failed to download image:', error)
    throw new Error(`Failed to download image: ${error}`)
  }
}

