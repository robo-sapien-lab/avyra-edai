# API Integration Documentation

This document describes the API integration changes made to connect the frontend to the Google Cloud backend.

## Overview

The frontend has been updated to use direct `fetch` API calls instead of Supabase Edge Functions. All API calls now connect to the Google Cloud backend endpoints.

## Backend Endpoints

### 1. Ask Question - `/api/ask`
- **Method**: POST
- **Body**: `{ question: string, studentId: string }`
- **Response**: `{ answer: string, sources?: string[], subject?: string, topic?: string, subtopic?: string }`
- **Notes**: This endpoint uses Vertex AI Generative Language Model for LLM-powered responses

### 2. Upload Notes - `/api/upload`
- **Method**: POST
- **Body**: `FormData` with `{ file, studentId, subject?, topic?, subtopic? }`
- **Response**: `{ status: string, fileId: string }`

### 3. View Progress - `/api/progress/:studentId`
- **Method**: GET
- **Response**: `{ progress: {...}, leaderboard: [...] }`

### 4. Quiz Start - `/api/quiz/start`
- **Method**: POST
- **Body**: `{ studentId: string, topic?: string }`
- **Response**: `{ quizId: string, questions: [...] }`

### 5. Quiz Submit - `/api/quiz/submit`
- **Method**: POST
- **Body**: `{ quizId: string, studentId: string, answers: number[] }`
- **Response**: `{ score: number, feedback?: string }`

## Environment Configuration

Set the following environment variable in your `.env` file:

```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

If not set, the frontend will default to relative URLs (assuming the backend is served from the same domain).

## Authentication

All API calls include the `studentId` from the Supabase auth session. The backend should validate this ID and ensure proper authorization.

## Error Handling

Each API call includes proper error handling with:
- HTTP status code validation
- User-friendly error messages via toast notifications
- Console logging for debugging
- Loading states for better UX

## File Changes

The following files were updated:
- `src/pages/Ask.tsx` - Ask question functionality
- `src/pages/Upload.tsx` - File upload functionality  
- `src/pages/Progress.tsx` - Progress tracking and leaderboard
- `src/pages/Quiz.tsx` - Quiz generation and submission
- `src/lib/api.ts` - API configuration and utilities

## Testing

To test the integration:
1. Set up your Google Cloud backend with the specified endpoints
2. Configure the `VITE_API_BASE_URL` environment variable
3. Ensure your backend accepts the expected request formats
4. Test each feature end-to-end

## Notes

- The `/api/ask` endpoint specifically uses Vertex AI for LLM responses
- File uploads use `FormData` for multipart form-data
- All JSON responses are properly parsed and handled
- Loading states and error handling provide good user experience

