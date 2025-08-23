import axios from 'axios';

// Create a configured Axios instance for API communication
export const api = axios.create({
  // This sets the base URL for all API requests to '/api',
  // which correctly targets the Next.js backend routes.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// This setup allows other parts of the app to dynamically set the
// authorization token after login, like this:
// api.defaults.headers.Authorization = `Bearer ${token}`;