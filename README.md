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
VITE_SUPABASE_URL=https://your-project.supabase.co
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
│   │   └── Layout.tsx      # Main layout component
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.tsx     # Authentication hook
│   │   └── use-mobile.tsx  # Mobile detection hook
│   ├── lib/                # Utility libraries
│   │   ├── api.ts          # API client with JWT auth
│   │   ├── supabaseClient.ts # Supabase singleton client
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

### Supabase Singleton Pattern

The app uses a singleton pattern for the Supabase client to prevent multiple instances and ensure consistent authentication state across the application.

```typescript
// src/lib/supabaseClient.ts
import { getSupabaseClient } from '@/lib/supabaseClient';

// Always use the singleton instance
export const supabase = getSupabaseClient();
```

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

## 🌐 API Integration

### Automatic JWT Authentication

All API calls automatically include JWT tokens from Supabase:

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

### Supported Endpoints

- `POST /ask` - Submit questions for AI-powered responses
- `POST /upload` - Upload learning materials
- `GET /progress/:studentId` - Retrieve learning progress
- `POST /quiz/start` - Generate adaptive quizzes
- `POST /quiz/submit` - Submit quiz answers

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

### Upload Page (`/upload`)
- Drag & drop file uploads
- Multiple file formats (PDF, images)
- Progress tracking
- Subject/topic categorization

### Quiz Page (`/quiz`)
- AI-generated adaptive quizzes
- Multiple choice questions
- Score tracking
- Explanations for answers

### Progress Page (`/progress`)
- Learning analytics dashboard
- Subject mastery tracking
- Weak topic identification
- Achievement badges

## 🚀 Deployment

### Build for Production

```bash
npm run build
# or
pnpm build
```

### Deploy Options

1. **Vercel** - Recommended for React apps
2. **Netlify** - Great for static sites
3. **GitHub Pages** - Free hosting for open source
4. **Custom Domain** - Connect your own domain

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

### Common Issues

**"Multiple GoTrueClient instances detected"**
- ✅ Fixed with singleton pattern in `src/lib/supabaseClient.ts`

**"No authentication token available"**
- ✅ Fixed with automatic JWT management in `src/lib/api.ts`

**404 errors on API calls**
- ✅ Fixed with proper URL construction and environment variables

**Authentication not working**
- Check your `.env` file has correct Supabase credentials
- Ensure user is logged in before making API calls

### Environment Variables

Make sure these are set in your `.env` file:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_API_BASE_URL` - Your backend API base URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [API_INTEGRATION.md](API_INTEGRATION.md) and [SUPABASE_SINGLETON_FIX.md](SUPABASE_SINGLETON_FIX.md) files
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join the conversation in GitHub Discussions

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for authentication and backend services
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling
- [Vite](https://vitejs.dev) for fast development and building

---

**Built with ❤️ using modern web technologies**
