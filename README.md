# URActive - Campus Event Management Platform

A modern, professional web application for discovering, creating, and managing campus events at the University of Regina. Built with Next.js 14, React 18, TypeScript, Firebase, and Cloudinary.

## Features

### For Student Attendees
- ✅ Browse and discover upcoming campus events with images
- ✅ View detailed event information with organizer details
- ✅ Register/RSVP for events with confirmation
- ✅ Track registered events in "My Events" dashboard
- ✅ View real-time attendee count for each event
- ✅ Unregister from events if needed

### For Event Organizers
- ✅ Create events with title, description, date, time, location, capacity, and images
- ✅ Upload event images with automatic compression (800x600 @ 0.6 quality)
- ✅ Submit events for admin review
- ✅ Track event status (Pending, Approved, Changes Needed, Rejected)
- ✅ View organizer dashboard with event statistics
  - Total events count
  - Approved events count
  - Pending review count
  - Total registrations count
- ✅ View who registered for each event (registrations modal with names, emails, dates)
- ✅ **Edit submitted events** with all details and image updates
- ✅ Delete events
- ✅ Receive admin feedback on submissions

### For Administrators
- ✅ Review pending event submissions in a dedicated queue
- ✅ Approve events with feedback
- ✅ Request changes with detailed comments
- ✅ Reject events with reason
- ✅ View all approved events grouped by category
- ✅ See event details: title, description, date, location, organizer, attendees, capacity
- ✅ Manage event publication status

### User Management
- ✅ User authentication with Firebase (email/password)
- ✅ User profile with editable fields:
  - Name
  - Department
  - Bio
  - Avatar with Cloudinary upload (250x250 @ 0.5 quality)
- ✅ Avatar display in navigation bar (image or letter initial)
- ✅ Profile settings page
- ✅ Logout functionality
- ✅ Professional error messages (not API errors)

## Tech Stack

- **Framework**: Next.js 14.2.35 with App Router
- **Language**: TypeScript (strict mode)
- **Frontend**: React 18 with 'use client' pattern
- **Styling**: Tailwind CSS 3.4.3 with custom components
- **UI Icons**: Lucide React 0.368.0
- **Authentication**: Firebase Auth (email/password)
- **Database**: Firebase Firestore (NoSQL)
- **Image Storage**: Cloudinary CDN with compression
- **State Management**: React Context + Hooks
- **Build Tool**: Next.js built-in (Webpack)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (free tier available at https://firebase.google.com)
- Cloudinary account (free tier available at https://cloudinary.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd URActive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file in the root directory:
   ```bash
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   ```

4. **Set up Firebase**

   - Create a Firebase project at https://firebase.google.com
   - Enable Authentication (Email/Password sign-in method)
   - Create Firestore Database (Start in production mode)
   - Copy your Firebase config credentials to `.env.local`

5. **Set up Cloudinary**

   - Create a Cloudinary account at https://cloudinary.com
   - Create an unsigned upload preset for public uploads
   - Add credentials to `.env.local`

6. **Set up Firestore Collections**

   Create the following collections in Firestore:
   
   **users** collection:
   ```
   - uid (string) - Primary key from Firebase Auth
   - email (string)
   - name (string)
   - role (string) - 'student', 'organizer', 'admin'
   - department (string)
   - bio (string)
   - avatar (string) - Cloudinary URL
   - createdAt (timestamp)
   - updatedAt (timestamp)
   ```

   **events** collection:
   ```
   - id (string) - Document ID
   - title (string)
   - description (string)
   - date (string) - YYYY-MM-DD
   - time (string) - HH:MM
   - location (string)
   - capacity (number)
   - organizer (string) - Organizer name
   - organizerId (string) - User UID
   - image (string) - Cloudinary URL
   - status (string) - 'pending', 'approved', 'rejected', 'changes_requested'
   - attendees (number)
   - adminFeedback (string)
   - createdAt (timestamp)
   - updatedAt (timestamp)
   ```

   **eventRegistrations** collection:
   ```
   - id (string) - Document ID
   - userId (string)
   - eventId (string)
   - registeredAt (timestamp)
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
URActive/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Home/landing page
│   ├── globals.css             # Global Tailwind styles
│   ├── discover/
│   │   └── page.tsx            # Event discovery page
│   ├── event/
│   │   └── [id]/
│   │       └── page.tsx        # Event details & registration
│   ├── my-events/
│   │   └── page.tsx            # User's registered events
│   ├── create-event/
│   │   └── page.tsx            # Create new event form
│   ├── organizer-dashboard/
│   │   └── page.tsx            # Organizer stats & management (with edit feature)
│   ├── admin/
│   │   └── page.tsx            # Admin review queue & approved events
│   ├── admin-queue/
│   │   └── page.tsx            # Pending events queue
│   ├── profile/
│   │   └── page.tsx            # User profile settings
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── signup/
│       └── page.tsx            # Registration page
├── components/
│   └── navigation.tsx          # Main navigation bar with auth menu
├── lib/
│   ├── auth.ts                 # Firebase authentication functions
│   ├── database.ts             # Firestore CRUD operations
│   ├── firebase.ts             # Firebase configuration
│   ├── cloudinary.ts           # Cloudinary image upload
│   ├── types.ts                # TypeScript interfaces
│   └── providers.tsx           # App providers
├── public/                     # Static assets
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── storage.rules               # Cloud Storage security rules
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## Key Pages & Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing page with features overview | Public |
| `/signup` | User registration | Public |
| `/login` | User login | Public |
| `/discover` | Browse all approved events | Authenticated |
| `/event/[id]` | Event details & registration | Authenticated |
| `/create-event` | Create new event (submit for review) | Authenticated (Organizers) |
| `/my-events` | View registered events | Authenticated |
| `/profile` | User profile & settings | Authenticated |
| `/organizer-dashboard` | Event management & registrations | Authenticated (Organizers) |
| `/admin` | Event review queue & management | Authenticated (Admins) |


## Database Schema

### Users Collection
- `uid`: Firebase Auth user ID (primary key)
- `email`: User email address
- `name`: Full name
- `role`: 'student', 'organizer', or 'admin'
- `department`: User's department/faculty
- `bio`: User biography
- `avatar`: Cloudinary image URL
- `createdAt`: Account creation timestamp
- `updatedAt`: Last profile update timestamp

### Events Collection
- `id`: Firestore document ID
- `title`: Event title
- `description`: Event description
- `date`: Event date (YYYY-MM-DD format)
- `time`: Event time (HH:MM format)
- `location`: Event location
- `capacity`: Maximum attendees
- `organizer`: Organizer's name
- `organizerId`: Organizer's Firebase UID
- `image`: Cloudinary image URL
- `status`: 'pending', 'approved', 'rejected', or 'changes_requested'
- `attendees`: Current registration count
- `adminFeedback`: Admin's feedback comments
- `createdAt`: Event creation timestamp
- `updatedAt`: Last event update timestamp

### Event Registrations Collection
- `id`: Firestore document ID
- `userId`: Registered user's Firebase UID
- `eventId`: Event document ID
- `registeredAt`: Registration timestamp

## Development

### Build for production
```bash
npm run build
npm start
```

### Run development server
```bash
npm run dev
```
Runs on [http://localhost:3000](http://localhost:3000)

### Type checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Key Implementation Details

### Authentication Flow
1. Users signup/login with Firebase Auth
2. User profile created in Firestore `users` collection
3. Authentication state managed via Firebase SDK
4. Protected routes check `getCurrentUser()` before rendering

### Image Storage
- **Avatars**: Compressed to 250x250 @ 0.5 quality
- **Event Images**: Compressed to 800x600 @ 0.6 quality
- All images hosted on Cloudinary CDN
- URLs stored in Firestore documents

### Event Submission Flow
1. Organizer creates event via `/create-event`
2. Event saved to Firestore with status='pending'
3. Admin reviews in `/admin` queue
4. Admin approves, rejects, or requests changes
5. Organizer receives feedback via dashboard
6. **Can edit event details and re-submit if changes requested**

### Error Handling
- Professional error messages (not API errors)
- Firebase error codes mapped to user-friendly messages
- Form validation on client-side
- User feedback via alerts and success messages

### UI Components
- Custom Tailwind CSS components (btn-primary, btn-secondary, btn-outline, card, etc.)
- Lucide React icons for visual indicators
- Responsive design for mobile/tablet/desktop
- Modal dialogs for confirmations and complex interactions

## Future Enhancements

- [ ] Email verification with @uregina.ca domain validation
- [ ] Email/Push notifications for event updates
- [ ] Calendar view for events
- [ ] Advanced search and filtering
- [ ] Event categories and tags
- [ ] Attendance tracking and check-in
- [ ] Event analytics dashboard for organizers
- [ ] Map integration for event locations
- [ ] Social sharing features (Twitter, Facebook, etc.)
- [ ] Ticket system for paid events
- [ ] Event ratings and reviews from attendees
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Mobile app (React Native)


## License

MIT License - Feel free to use this project for your own purposes.

## Support & Contribution

Found a bug or have a feature request? Please create an issue on the repository.

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

For questions or inquiries, please reach out to the development team.

---

**Status**: Production Ready ✅

Last Updated: June 2026
Version: 1.0.0
