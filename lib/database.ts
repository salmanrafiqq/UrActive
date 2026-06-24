import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Query,
  DocumentData,
  Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

// Image compression utility - Fast version
const compressImage = async (file: File, maxWidth = 800, maxHeight = 600, quality = 0.6): Promise<Blob> => {
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
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Upload with timeout
const uploadWithTimeout = async (storageRef: any, file: File, timeoutMs = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Upload timed out. Please check your internet connection.'))
    }, timeoutMs)

    uploadBytes(storageRef, file)
      .then(() => {
        clearTimeout(timeout)
        resolve()
      })
      .catch((err) => {
        clearTimeout(timeout)
        reject(err)
      })
  })
}

// Image uploads are now handled by Cloudinary - see lib/cloudinary.ts
// Previously used Firebase Storage, now using Cloudinary for better performance

// Events Collection
export const eventsCollection = collection(db, 'events')

export const addEvent = async (eventData: any) => {
  try {
    const dataToSave = {
      ...eventData,
      createdAt: Timestamp.now(),
      status: eventData.status || 'pending',
    }
    
    const docRef = await addDoc(eventsCollection, dataToSave)
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getEventById = async (eventId: string) => {
  try {
    const eventDoc = await getDoc(doc(eventsCollection, eventId))
    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() }
    }
    return null
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getAllEvents = async (): Promise<any> => {
  try {
    const q = query(eventsCollection, orderBy('date', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.status === 'approved')
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getPendingEvents = async (): Promise<any> => {
  try {
    const q = query(eventsCollection, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.status === 'pending')
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getEventsByCategory = async (category: string) => {
  try {
    const q = query(
      eventsCollection,
      where('category', '==', category),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((doc: any) => doc.status === 'approved')
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getEventsByOrganizer = async (organizerId: string) => {
  try {
    const q = query(
      eventsCollection,
      where('organizerId', '==', organizerId)
    )
    const querySnapshot = await getDocs(q)
    const events = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    // Sort by createdAt descending on client side
    return events.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })
  } catch (error: any) {
    console.error('Error fetching organizer events:', error)
    throw new Error(error.message)
  }
}

export const updateEvent = async (eventId: string, eventData: any) => {
  try {
    await updateDoc(doc(eventsCollection, eventId), eventData)
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(eventsCollection, eventId))
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Event Registrations Collection
export const registrationsCollection = collection(db, 'eventRegistrations')

export const registerForEvent = async (userId: string, eventId: string) => {
  try {
    // Add registration
    const docRef = await addDoc(registrationsCollection, {
      userId,
      eventId,
      registeredAt: new Date(),
    })
    
    // Increment event attendee count
    const eventDocRef = doc(db, 'events', eventId)
    const eventSnap = await getDoc(eventDocRef)
    if (eventSnap.exists()) {
      const currentAttendees = eventSnap.data().attendees || 0
      await updateDoc(eventDocRef, {
        attendees: currentAttendees + 1,
      })
    }
    
    return docRef.id
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getUserRegistrations = async (userId: string) => {
  try {
    const q = query(registrationsCollection, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => doc.data().eventId)
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const unregisterFromEvent = async (userId: string, eventId: string) => {
  try {
    const q = query(
      registrationsCollection,
      where('userId', '==', userId),
      where('eventId', '==', eventId)
    )
    const querySnapshot = await getDocs(q)
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })
    
    // Decrement event attendee count
    const eventDocRef = doc(db, 'events', eventId)
    const eventSnap = await getDoc(eventDocRef)
    if (eventSnap.exists()) {
      const currentAttendees = eventSnap.data().attendees || 0
      await updateDoc(eventDocRef, {
        attendees: Math.max(0, currentAttendees - 1),
      })
    }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const isUserRegisteredForEvent = async (userId: string, eventId: string): Promise<boolean> => {
  try {
    const q = query(
      registrationsCollection,
      where('userId', '==', userId),
      where('eventId', '==', eventId)
    )
    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getEventRegistrations = async (eventId: string) => {
  try {
    const q = query(registrationsCollection, where('eventId', '==', eventId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// User Profiles Collection
export const usersCollection = collection(db, 'users')

export const createUserProfile = async (userId: string, userData: any) => {
  try {
    await addDoc(usersCollection, {
      uid: userId,
      ...userData,
      createdAt: new Date(),
    })
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getUserProfile = async (userId: string): Promise<any> => {
  try {
    const q = query(usersCollection, where('uid', '==', userId))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() }
    }
    return null
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const q = query(usersCollection, where('uid', '==', userId))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id
      const userDocRef = doc(usersCollection, docId)
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date(),
      })
      return { id: docId, ...updates }
    } else {
      throw new Error('User profile not found')
    }
  } catch (error: any) {
    throw new Error(error.message)
  }
}
