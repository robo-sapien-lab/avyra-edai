// API configuration for Google Cloud backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API endpoints
export const API_ENDPOINTS = {
  ASK: '/api/ask',
  UPLOAD: '/api/upload',
  PROGRESS: '/api/progress',
  QUIZ_START: '/api/quiz/start',
  QUIZ_SUBMIT: '/api/quiz/submit',
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

// Common fetch wrapper with error handling
export const apiFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

