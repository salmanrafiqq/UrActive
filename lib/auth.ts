import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile } from './database'
import { getFirebaseErrorMessage } from './errorHandler'

export const signUp = async (email: string, password: string, userData?: any) => {
  try {
    // Validate that email is a uregina.ca email
    if (!email.toLowerCase().endsWith('@uregina.ca')) {
      throw new Error('Only @uregina.ca email addresses are allowed to register')
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create user profile in Firestore
    if (user) {
      await createUserProfile(user.uid, {
        email: user.email || email,
        name: userData?.name || '',
        role: userData?.role || 'student',
        department: userData?.department || '',
        bio: '',
        avatar: '',
      })
    }

    return user
  } catch (error: any) {
    // Use friendly error message if it's a Firebase error, otherwise use the error message as is
    const message = error?.code ? getFirebaseErrorMessage(error) : error.message
    throw new Error(message)
  }
}

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(getFirebaseErrorMessage(error))
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}
