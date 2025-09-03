# Avyra UI - AI-Powered Learning Platform

A modern, React-based learning platform that provides AI-powered tutoring, adaptive quizzes, and progress tracking for students. Built with TypeScript, Supabase authentication, and a robust API integration system.

## 🚀 Features

- **🤖 AI-Powered Q&A** - Ask questions and get intelligent responses based on your learning materials
- **📚 Document Upload & Processing** - Upload PDFs, images, and documents to build your knowledge base
- **🧠 Adaptive Quizzes** - AI-generated quizzes tailored to your learning progress
- **📊 Progress Tracking** - Monitor your learning journey with detailed analytics
- **🔐 Secure Authentication** - Built-in user management with Supabase
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Authentication**: Supabase Auth with JWT
- **State Management**: Zustand + Custom React Hooks
- **Styling**: Tailwind CSS + Framer Motion
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm

## 📋 Prerequisites

- Node.js 18+ ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or pnpm
- Supabase account and project
- Google Cloud Run backend (for API endpoints)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd avyra-ui
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Configuration
VITE_API_BASE_URL=https://your-cloud-run-backend.com/api
```

**Important**: Replace the placeholder values with your actual Supabase and backend URLs.

### 4. Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Project Structure

```
avyra-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Layout.tsx      # Main layout component
│   │   └── ExampleUsage.tsx # Example component with auth
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.tsx     # Authentication hook
│   │   └── use-mobile.tsx  # Mobile detection hook
│   ├── lib/                # Utility libraries
│   │   ├── api.ts          # API client with JWT auth
│   │   ├── supabase.ts # Supabase client
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Application pages
│   │   ├── Ask.tsx         # AI Q&A interface
│   │   ├── Upload.tsx      # Document upload
│   │   ├── Quiz.tsx        # Adaptive quizzes
│   │   ├── Progress.tsx    # Learning progress
│   │   └── Auth.tsx        # Authentication
│   ├── store/              # State management
│   │   └── authStore.ts    # Legacy auth store (being migrated)
│   └── integrations/       # Third-party integrations
│       └── supabase/       # Supabase types and config
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
└── vite.config.ts          # Vite configuration
```

## 🔐 Authentication System

### Supabase Authentication Pattern

The app uses Supabase Authentication for secure user management and JWT token generation. This provides robust authentication with built-in session management.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
```

**Benefits:**
- ✅ Built-in session persistence
- ✅ Automatic token refresh
- ✅ URL-based session detection
- ✅ Memory efficient and consistent state across the app

### useAuth Hook

A React hook that provides authentication state and actions:

```typescript
import { useAuth } from '@/hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {user?.email}!</div>;
};
```

**Features:**
- ✅ **Automatic Session Management** - No manual token handling
- ✅ **Real-time Updates** - Listens to auth state changes
- ✅ **Profile Management** - Fetches and updates user profiles
- ✅ **Loading States** - Proper loading indicators
- ✅ **Error Handling** - Graceful error management
- ✅ **Memory Safe** - Proper cleanup of subscriptions

## 🌐 API Integration

### Automatic JWT Authentication

All API calls automatically include JWT tokens from Supabase. This provides secure authentication with automatic token management.

```typescript
import { apiFetch } from '@/lib/api';

// JWT automatically included, no manual token handling needed
const result = await apiFetch('/ask', {
  method: 'POST',
  body: JSON.stringify({
    question: 'What is React?',
    studentId: user.id
  })
});
```

**Benefits:**
- ✅ **Automatic JWT Inclusion** - No manual token management
- ✅ **Smart Content-Type** - Handles FormData correctly
- ✅ **Enhanced Error Messages** - Clear, actionable errors
- ✅ **URL Construction** - Prevents double `/api/api/` issues

### Supported Endpoints

- `POST /ask` - Submit questions for AI-powered responses
- `POST /upload` - Upload learning materials
- `GET /progress/:studentId` - Retrieve learning progress
- `POST /quiz/start` - Generate adaptive quizzes
- `POST /quiz/submit` - Submit quiz answers

### Backend Requirements

The backend expects these specific request formats:

#### **For `/api/ask` (POST):**
```typescript
{
  "question": "What is the main concept discussed in my notes?",
  "studentId": "user-uuid-from-supabase" // Must match JWT token user ID
}
```

#### **For `/api/upload` (POST):**
```typescript
// FormData with:
- file: File object (PDF, JPEG, PNG, etc.)
- studentId: "user-uuid-from-supabase"
- subject: "Mathematics" (optional)
- topic: "Algebra" (optional)
- subtopic: "Linear Equations" (optional)
```

#### **For `/api/quiz/start` (POST):**
```typescript
{
  "studentId": "user-uuid-from-supabase",
  "topic": "Algebra" // optional
}
```

#### **For `/api/progress/:studentId` (GET):**
```typescript
// URL parameter must match authenticated user ID
GET /api/progress/USER_UUID_FROM_JWT
```

## 🎨 UI Components

Built with shadcn/ui and Tailwind CSS for a modern, accessible design:

- **Responsive Layout** - Adapts to all screen sizes
- **Dark/Light Mode** - Built-in theme support
- **Accessibility** - WCAG compliant components
- **Animations** - Smooth transitions with Framer Motion

## 📱 Available Pages

### Ask Page (`/ask`)
- AI-powered question answering
- Real-time responses
- Question history tracking
- Automatic JWT authentication

### Upload Page (`/upload`)
- Drag & drop file uploads
- Multiple file formats (PDF, images)
- Progress tracking
- Subject/topic categorization
- FormData handling without Content-Type override

### Quiz Page (`/quiz`)
- AI-generated adaptive quizzes
- Multiple choice questions
- Score tracking
- Explanations for answers
- Session-based quiz management

### Progress Page (`/progress`)
- Learning analytics dashboard
- Subject mastery tracking
- Weak topic identification
- Achievement badges
- Real-time data updates

## 🚀 Deployment

### Build for Production

```bash
npm run build
# or
pnpm build
```

### Deploy to Vercel

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project" and import your repository

2. **Set Environment Variables**
   In your Vercel project settings, add these environment variables:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_API_BASE_URL=https://your-backend-api-url.com/api
   ```

3. **Deploy**
   - Vercel will automatically detect this as a Vite project
   - The build will run automatically on every push to your main branch

### Other Deploy Options

1. **Netlify** - Great for static sites
2. **GitHub Pages** - Free hosting for open source
3. **Custom Domain** - Connect your own domain

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Code Quality

- **ESLint** - Code linting and formatting
- **TypeScript** - Type safety and IntelliSense
- **Prettier** - Code formatting (via ESLint)

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **"Multiple GoTrueClient instances detected"**
- ✅ **Resolved** by using single Supabase client instance
- **Cause**: Multiple Supabase client instances created
- **Solution**: Use the singleton client from `src/lib/supabase.ts`

#### **"No authentication token available"**
- ✅ **Resolved** with Supabase JWT management in `src/lib/api.ts`
- **Cause**: JWT tokens not being automatically included in requests
- **Solution**: `apiFetch` function automatically gets Supabase access tokens

#### **404 errors on API calls**
- ✅ **Fixed** with proper URL construction and environment variables
- **Cause**: Incorrect endpoint paths or missing base URL
- **Solution**: Endpoints use `/ask` instead of `/api/ask` to prevent double `/api/api/...`

#### **"Authorization Failed" Errors**
- **Cause**: JWT token issues or student ID mismatches
- **Solutions**:
  - Ensure user is logged in before making API calls
  - Check that `studentId` matches JWT token user ID
  - Verify JWT token hasn't expired
  - Check `.env` file has correct backend URL

### Environment Variables

Make sure these are set in your `.env` file:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_API_BASE_URL` - Your backend API base URL (should end with `/api`)

### Debugging Authorization Issues

#### **1. Check JWT Token Payload**
```typescript
// Add this to apiFetch function temporarily
const token = session.access_token;
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', {
  userId: payload.sub,
  expires: new Date(payload.exp * 1000),
  currentTime: new Date()
});
console.log('Supabase user.id:', user.id);
```

#### **2. Verify Request Headers**
```typescript
// Add this logging
console.log('Request headers:', headers);
console.log('Full request:', {
  url,
  method: options.method,
  headers,
  body: options.body
});
```

#### **3. Check Backend Error Response**
Look for specific error codes:
- `UNAUTHORIZED`: Missing or invalid Authorization header
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: JWT token is malformed
- `ACCESS_DENIED`: Student ID doesn't match JWT user ID

## 🔍 **Why Authorization Errors Occur**

### **Common Causes:**

#### **1. Student ID Mismatch**
```typescript
// ❌ WRONG - Student ID doesn't match JWT token user ID
{
  "studentId": "different-user-id", // Must match JWT token user ID
  "question": "Hello"
}

// ✅ CORRECT - Student ID matches JWT token user ID
{
  "studentId": "same-user-id-as-jwt", // Must match JWT token user ID
  "question": "Hello"
}
```

#### **2. Missing Authorization Header**
```typescript
// ❌ WRONG - No authorization header
fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question: "Hello", studentId: "123" })
});

// ✅ CORRECT - With authorization header
fetch('/api/ask', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ question: "Hello", studentId: "123" })
});
```

#### **3. Invalid JWT Token Format**
```typescript
// ❌ WRONG - Missing "Bearer " prefix
headers: {
  'Authorization': 'YOUR_JWT_TOKEN'
}

// ✅ CORRECT - With "Bearer " prefix
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 🎯 **Key Points to Remember**

1. **Every request needs `Authorization: Bearer JWT_TOKEN`**
2. **Student ID must match the user ID in the JWT token**
3. **JWT tokens expire and need refreshing**
4. **Use Supabase's built-in JWT tokens, not custom ones**
5. **Check both frontend headers and backend error logs**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join the conversation in GitHub Discussions

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for authentication and backend services
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Vite](https://vitejs.dev) for fast development and building

---

**Built with ❤️ using modern web technologies**

## 📚 **Additional Resources**

### **API Integration Documentation**
- All API calls use the `apiFetch` function for automatic JWT inclusion
- FormData uploads work correctly without Content-Type override
- Error messages are descriptive and include HTTP status text

### **Authentication Flow**
- Users sign in/up through Supabase Auth
- JWT tokens are automatically managed and included in requests
- Session state is maintained across the application
- Profile data is fetched and updated automatically

### **Development Best Practices**
- Use the `useAuth` hook for authentication state
- Always check `isAuthenticated` before making API calls
- Handle loading states and errors gracefully
- Use TypeScript for type safety and better development experience

