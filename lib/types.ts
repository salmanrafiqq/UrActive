export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'organizer' | 'admin'
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  organizer_id: string
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  user_id: string
  event_id: string
  created_at: string
}

export interface Review {
  id: string
  event_id: string
  reviewer_id: string
  status: 'approved' | 'rejected' | 'changes_requested'
  feedback: string
  created_at: string
}
