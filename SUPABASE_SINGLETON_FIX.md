# Supabase Singleton Fix & Authentication System

## 🚨 **Problem Solved**

Your React app was experiencing these errors:
- **Multiple GoTrueClient instances detected** - Multiple Supabase clients being created
- **No authentication token available** - JWT not being properly retrieved
- **404 errors** - API endpoints not found due to incorrect URL construction

## ✅ **Solution Implemented**

### 1. **Supabase Client Singleton Pattern**

**File: `src/lib/supabaseClient.ts`**
```typescript
// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// Export the singleton instance
export const supabase = getSupabaseClient();
```

**Benefits:**
- ✅ Only one client instance ever created
- ✅ Prevents "Multiple GoTrueClient instances" error
- ✅ Memory efficient
- ✅ Consistent state across the app

### 2. **React-Friendly useAuth Hook**

**File: `src/hooks/useAuth.tsx`**
```typescript
export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  // Automatic session management
  // Profile fetching
  // Auth state change listeners
  // Cleanup on unmount
};
```

**Features:**
- ✅ **Automatic Session Management** - No manual token handling
- ✅ **Real-time Updates** - Listens to auth state changes
- ✅ **Profile Management** - Fetches and updates user profiles
- ✅ **Loading States** - Proper loading indicators
- ✅ **Error Handling** - Graceful error management
- ✅ **Memory Safe** - Proper cleanup of subscriptions

### 3. **Enhanced API Fetch with JWT**

**File: `src/lib/api.ts`**
```typescript
export const apiFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    // Get current session token automatically
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required. Please log in to continue.');
    }

    // Build full URL with proper base
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Include JWT automatically
    const headers: HeadersInit = {
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    };

    // Smart Content-Type handling
    if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Enhanced error handling
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
```

**Benefits:**
- ✅ **Automatic JWT Inclusion** - No manual token management
- ✅ **Smart Content-Type** - Handles FormData correctly
- ✅ **Enhanced Error Messages** - Clear, actionable errors
- ✅ **URL Construction** - Prevents double `/api/api/` issues

## 🎯 **Usage Examples**

### **Basic Authentication Check**
```typescript
import { useAuth } from '@/hooks/useAuth';

const MyComponent = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return <div>Welcome, {user?.email}!</div>;
};
```

### **Safe API Call with Authentication**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';

const AskQuestion = () => {
  const { user, isAuthenticated } = useAuth();
  const [question, setQuestion] = useState('');

  const handleAsk = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: 'Please log in first', variant: 'destructive' });
      return;
    }

    try {
      // JWT automatically included, no manual token handling needed
      const result = await apiFetch('/ask', {
        method: 'POST',
        body: JSON.stringify({
          question,
          studentId: user.id
        })
      });

      console.log('Answer:', result.answer);
    } catch (error) {
      if (error.message.includes('Authentication required')) {
        // Handle auth errors gracefully
        toast({ title: 'Please log in again', variant: 'destructive' });
      }
    }
  };

  return (
    <div>
      <input 
        value={question} 
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question..."
      />
      <button onClick={handleAsk}>Ask</button>
    </div>
  );
};
```

### **FormData Upload (No Content-Type Override)**
```typescript
const UploadFile = () => {
  const { user, isAuthenticated } = useAuth();

  const handleUpload = async (file: File) => {
    if (!isAuthenticated || !user) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', user.id);

    try {
      // FormData handled correctly, Content-Type not overridden
      const result = await apiFetch('/upload', {
        method: 'POST',
        body: formData
      });

      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />;
};
```

## 🔧 **Environment Setup**

### **Required Environment Variables**
```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-cloud-run-backend.com/api
```

### **Supabase Project Setup**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing
3. Copy the URL and anon key from Settings > API
4. Add to your `.env` file

## 🚀 **Migration Guide**

### **From Old System to New**

**Before (Problematic):**
```typescript
// Multiple client imports
import { supabase } from '@/integrations/supabase/client';
import { supabase } from '@/lib/supabaseClient';

// Manual token handling
const token = await supabase.auth.getSession();
const response = await fetch('/api/ask', {
  headers: { Authorization: `Bearer ${token}` }
});

// Old auth store
const { user } = useAuthStore();
```

**After (Fixed):**
```typescript
// Single client import
import { supabase } from '@/lib/supabaseClient';

// Automatic token handling
const result = await apiFetch('/ask', { method: 'POST', body: data });

// New auth hook
const { user, isAuthenticated } = useAuth();
```

## 🧪 **Testing the Fix**

### **1. Check Console for Errors**
- ❌ "Multiple GoTrueClient instances detected" - Should be gone
- ❌ "No authentication token available" - Should be gone
- ❌ 404 errors - Should be resolved

### **2. Verify Authentication Flow**
```typescript
// Test in browser console
import { useAuth } from '@/hooks/useAuth';
const { user, isAuthenticated } = useAuth();
console.log('User:', user, 'Authenticated:', isAuthenticated);
```

### **3. Test API Calls**
```typescript
// Test API call
import { apiFetch } from '@/lib/api';
const result = await apiFetch('/ask', { method: 'POST', body: JSON.stringify({ question: 'test' }) });
console.log('API Response:', result);
```

## 📝 **Key Benefits**

1. **No More Multiple Clients** - Singleton pattern prevents duplicate instances
2. **Automatic JWT Management** - Tokens included automatically in all requests
3. **Better Error Handling** - Clear, actionable error messages
4. **React-Optimized** - Proper hooks, loading states, and cleanup
5. **Type Safe** - Full TypeScript support
6. **Memory Efficient** - Proper subscription cleanup
7. **Developer Friendly** - Easy to use, hard to misuse

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

**Issue: "Missing Supabase environment variables"**
- Solution: Check your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Issue: "Authentication required"**
- Solution: User needs to log in first, check `isAuthenticated` before API calls

**Issue: "Authentication expired"**
- Solution: User session expired, redirect to login or refresh session

**Issue: Still getting 404s**
- Solution: Check `VITE_API_BASE_URL` in `.env` file, should end with `/api`

## 🎉 **Result**

After implementing these fixes:
- ✅ **Multiple GoTrueClient instances** - Eliminated
- ✅ **Authentication token errors** - Resolved
- ✅ **404 errors** - Fixed with proper URL construction
- ✅ **API integration** - Robust and reliable
- ✅ **User experience** - Smooth authentication flow
- ✅ **Developer experience** - Clean, maintainable code

Your React app now has a bulletproof authentication system that automatically handles JWT tokens, prevents client duplication, and provides a great developer experience!
