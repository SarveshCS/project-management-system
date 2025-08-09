# Project Nexus - College Project Management System

A comprehensive project management system built with Next.js, Firebase, and Tailwind CSS v4, designed for college students and teachers to streamline project submissions, grading, and feedback.

## 🚀 Features

### For Students
- **Google Authentication**: Secure sign-in with Google accounts
- **Project Submissions**: Upload and submit projects with descriptions
- **Assignment to Teachers**: Select specific teachers for grading
- **Real-time Status Tracking**: Monitor submission status (pending/graded)
- **Grade & Feedback Viewing**: Access grades and detailed teacher feedback
- **File Management**: Download submitted files anytime

### For Teachers
- **Grading Dashboard**: View all assigned submissions
- **Secure Grading**: Grade submissions with numerical scores (0-100)
- **Detailed Feedback**: Provide comprehensive written feedback
- **Submission Review**: Download and review student files
- **Status Management**: Track graded vs pending submissions

### Technical Features
- **Firebase Integration**: Authentication, Firestore database, and file storage
- **Responsive Design**: Tailwind CSS v4 with dark/light mode support
- **Type Safety**: Full TypeScript implementation
- **Form Validation**: Zod schema validation with react-hook-form
- **Real-time Updates**: Live status updates and notifications
- **Secure API**: Firebase Admin SDK for server-side operations

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Forms**: React Hook Form + Zod
- **Icons**: Material-UI Icons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with:
  - Authentication (Google provider enabled)
  - Firestore Database
  - Firebase Storage
  - Firebase Admin SDK service account

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project-management-system
npm install
```

### 2. Firebase Configuration

#### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication in Authentication > Sign-in method
4. Create Firestore Database
5. Enable Firebase Storage

#### Get Configuration Keys
1. Go to Project Settings > General
2. In "Your apps" section, add a Web app
3. Copy the Firebase config object
4. Go to Project Settings > Service accounts
5. Generate new private key for Firebase Admin SDK

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:
```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (Server-side only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
```

### 4. Firestore Security Rules
Apply these security rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      allow read: if request.auth != null && 
        (resource.data.studentUid == request.auth.uid || 
         resource.data.assignedTeacherUid == request.auth.uid);
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.studentUid;
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.assignedTeacherUid;
    }
  }
}
```

### 5. Firebase Storage Rules
Apply these security rules to Firebase Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /submissions/{studentUid}/{submissionId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == studentUid;
    }
  }
}
```

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

### Users Collection (`users`)
```typescript
{
  uid: string;           // Firebase Auth UID
  fullName: string;      // User's display name
  email: string;         // User's email
  role: 'student' | 'teacher';  // User role
}
```

### Submissions Collection (`submissions`)
```typescript
{
  id: string;            // Auto-generated document ID
  title: string;         // Project title
  description: string;   // Project description
  status: 'pending' | 'graded';  // Submission status
  submittedAt: Date;     // Submission timestamp
  studentUid: string;    // Student's Firebase UID
  studentName: string;   // Student's display name
  assignedTeacherUid: string;  // Teacher's Firebase UID
  fileUrl: string;       // Firebase Storage download URL
  fileName: string;      // Original filename
  grade?: number;        // Grade (0-100, optional)
  feedback?: string;     // Teacher feedback (optional)
}
```

## 🎯 User Flows

### Student Flow
1. **Login**: Sign in with Google account
2. **Profile Creation**: System creates student profile automatically
3. **New Submission**: Navigate to "New Submission" page
4. **Form Completion**: Fill title, description, select teacher, upload file
5. **Submit**: File uploads to Firebase Storage, document created in Firestore
6. **Track Status**: View submissions in dashboard with real-time status updates
7. **View Results**: Access grades and feedback when available

### Teacher Flow
1. **Login**: Sign in with Google account (role: teacher)
2. **Dashboard**: View assigned submissions needing grading
3. **Grade Submission**: Click submission to open grading page
4. **Review**: Download and review student's submitted file
5. **Evaluate**: Provide numerical grade (0-100) and written feedback
6. **Submit Grade**: Secure API call updates submission status to 'graded'

## 🔒 Security Features

- **Authentication**: Firebase Auth with Google provider
- **Authorization**: Role-based access control (student/teacher)
- **API Security**: Firebase Admin SDK validates tokens server-side
- **Data Validation**: Zod schemas for all forms and API inputs
- **File Security**: Secure Firebase Storage with access rules
- **CSRF Protection**: Built-in Next.js security features

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
Ensure all environment variables from `.env.local` are set in your production environment.

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section below

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Configuration Errors**
   - Verify all environment variables are correctly set
   - Ensure Firebase project has all required services enabled

2. **Authentication Issues**
   - Check if Google provider is enabled in Firebase Auth
   - Verify domain is added to authorized domains

3. **File Upload Failures**
   - Check Firebase Storage rules
   - Verify storage bucket configuration

4. **Permission Denied Errors**
   - Review Firestore security rules
   - Ensure user roles are correctly set

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```
