/**
 * Convert Firebase error codes to user-friendly messages
 */
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || ''

  const errorMessages: { [key: string]: string } = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email. Please sign up first.',
    'auth/email-already-in-use': 'This email is already registered. Please log in or use a different email.',
    'auth/weak-password': 'Password is too weak. Please use at least 8 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password login is not enabled. Please contact support.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  }

  // Check if it's a Firebase error code
  if (errorCode.startsWith('auth/')) {
    return errorMessages[errorCode] || 'Authentication failed. Please try again.'
  }

  // Check if the error message already contains user-friendly text
  if (
    error?.message?.includes('@uregina.ca') ||
    error?.message?.includes('Only') ||
    error?.message?.includes('University')
  ) {
    return error.message
  }

  // Default fallback
  return error?.message || 'An error occurred. Please try again.'
}
