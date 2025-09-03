import { supabase } from './supabase';

// API configuration for Google Cloud backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  ASK: '/ask',
  UPLOAD: '/upload',
  PROGRESS: '/progress',
  QUIZ_START: '/quiz/start',
  QUIZ_SUBMIT: '/quiz/submit',
} as const;

// Utility function to build full API URLs
export const buildApiUrl = (endpoint: string, pathParams?: Record<string, string>) => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  return url;
};

// Enhanced fetch wrapper with Supabase JWT authentication and error handling
export const apiFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<unknown> => {
  try {
    // Get current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('Authentication required. Please log in to continue.');
    }

    // Get Supabase JWT token
    const token = session.access_token;
    
    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Only set Content-Type if not already set and not FormData
    if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please log in again.');
      } else if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}`);
      } else {
        throw new Error(`Request failed: ${response.status} - ${response.statusText}`);
      }
    }

    // Return parsed JSON for successful responses
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
};

// Helper function to check if user is authenticated before making API calls
export const requireAuth = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  return session.access_token;
};

