import { supabase } from './supabaseClient';

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

// Enhanced fetch wrapper with JWT authentication and error handling
export const apiFetch = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    // Build full URL
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Authorization': `Bearer ${session.access_token}`,
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
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    // Return parsed JSON for successful responses
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

