# URActive Web Application - Setup & Development

## Project Overview

URActive is a modern campus event management web application built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Firebase. It enables University of Regina students to discover events, organizers to create/submit events, and admins to review submissions.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Icons**: Lucide React
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth with email verification
- **Image Storage**: Cloudinary CDN with compression
- **State Management**: React Context

## Project Structure

```
app/                          # Next.js app directory
├── layout.tsx               # Root layout with navigation
├── page.tsx                 # Landing page (home)
├── globals.css              # Tailwind & global styles
├── discover/                # Event browsing page
├── event/[id]/              # Event details & registration
├── my-events/               # User's registered events
├── create-event/            # Event creation form
├── organizer-dashboard/     # Organizer's event management
├── admin/                   # Admin review queue & approved events
├── admin-queue/             # Admin pending reviews
├── login/                   # User login
├── signup/                  # User registration with avatar upload
└── profile/                 # User profile settings

components/
├── navigation.tsx           # Main nav bar with auth-aware menu

lib/
├── firebase.ts             # Firebase config & initialization
├── auth.ts                 # Firebase Auth functions & email verification
├── database.ts             # Firestore CRUD operations
├── cloudinary.ts           # Image upload & compression
├── types.ts                # TypeScript interfaces
└── providers.tsx           # App providers

public/                      # Static assets
firebase.json               # Firebase configuration
firestore.rules             # Firestore security rules
storage.rules               # Cloud Storage security rules
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env.local` with Firebase credentials from [Firebase Console](https://console.firebase.google.com):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 3. Firebase Setup
1. Enable Authentication in Firebase Console
   - Sign-in method: Email/Password
2. Create Firestore Database (Start in production mode)
3. Update security rules with `firestore.rules`

### 4. Run Development Server
```bash
npm run dev
```
Visit http://localhost:3000



## Key Features Implemented

✅ **Authentication & Security**
- Firebase Auth with email/password signup
- Professional error messages (not API errors)
- Auto-redirect for authenticated users
- Secure password storage with Firebase

✅ **User Profile Management**
- Profile settings page with editable fields
- Avatar upload to Cloudinary (250x250 @ 0.5 quality)
- Name, department, bio management
- Profile dropdown in navigation with logout

✅ **Event Management**
- Event creation with title, description, date, time, location
- Event image upload to Cloudinary (800x600 @ 0.6 quality)
- Event registration with attendee tracking
- Attendees count increments/decrements correctly
- Event details page with organizer information

✅ **Event Discovery**
- Browse all approved events
- View event details and organizer info
- Register for events (shows confirmation)
- Organizer avatar display on event cards

✅ **User Dashboards**
- My Events: Shows registered events
- Organizer Dashboard: Create events, view registrations
- Admin Queue: Review pending events with feedback
- Admin Approved: View approved events grouped by category

✅ **Admin Features**
- Review pending event submissions
- Approve, request changes, or reject events
- Add feedback/comments on submissions
- View all approved events by category

✅ **UI/UX**
- Responsive Tailwind CSS design
- Professional color scheme (dark green #2d5a3d, cyan #0ea5e9)
- Icon-based UI with Lucide React
- Click-outside menu close functionality
- Loading states and error handling
- TypeScript: 0 errors

## Current Implementation Notes

✅ **Authentication**: Real Firebase Auth
   - Professional error messages mapped from Firebase error codes
   - Secure login/signup flow
   - User session management

✅ **Database**: Firestore with structured data
   - Users collection with profile data and emailVerified status
   - Events collection with organizer tracking
   - EventRegistrations collection with attendee tracking
   - Admin review tracking with feedback fields

✅ **Image Storage**: Cloudinary CDN
   - Avatar uploads: 250x250 @ 0.5 quality compression
   - Event images: 800x600 @ 0.6 quality compression
   - Automatic URL storage in Firestore

✅ **State Management**: React Context (ready for Zustand)
   - Auth state via Firebase SDK
   - Component-level state with useState
   - Firestore real-time listeners for data

⏳ **Planned for Future**:
   - Email verification with @uregina.ca domain validation
   - Route protection for unverified email users
   - Verification status page (/verify-email)
   - Middleware for auth guards
   - Event Bookmarks and Calendar integration

## Next Steps for Development

1. **Implement Email Verification**
   - Add @uregina.ca domain validation on signup
   - Setup Firebase email verification (requires billing)
   - Create verification status page (/verify-email)
   - Implement route protection for unverified users
   - Add resend verification email functionality

2. **Add Advanced Features**
   - Email notifications for event updates
   - Calendar view for events
   - Event categories/tags
   - User preferences and filters

4. **Optimize Performance**
   - Add pagination to event lists
   - Implement image lazy loading
   - Cache Firestore queries locally

## Common Tasks

### Add a New Page
1. Create folder in `app/` (e.g., `app/about/`)
2. Add `page.tsx` inside
3. Update navigation links

### Create API Endpoint
1. Create file in `app/api/` (e.g., `app/api/events/route.ts`)
2. Export GET, POST, etc. functions
3. Use Supabase client in lib/supabase.ts

### Modify Styles
- Edit `app/globals.css` for global styles
- Use Tailwind classes in components
- Customize theme in `tailwind.config.js`

## Build & Deployment

```bash
npm run build      # Build for production
npm start          # Run production server
npm run lint       # Run linter
npm run type-check # Check TypeScript
```

## Troubleshooting

- **Port 3000 in use**: Change port with `PORT=3001 npm run dev`

- **Build errors**: Run `npm install` and clear `.next/` folder
- **Tailwind not working**: Ensure `tailwind.config.js` content paths are correct
- **Firebase errors**: Check environment variables in `.env.local`
- **Cloudinary upload fails**: Verify cloud name and upload preset credentials

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)


