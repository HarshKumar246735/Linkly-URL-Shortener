import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// The auth token lives in an HttpOnly cookie, so JavaScript never touches it.
// withCredentials sends that cookie on cross-origin requests; X-Requested-With is the CSRF header the API expects.
export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = error.config?.url || '';
    // A 401 on a normal API call means the session ended; /auth/* calls handle their own 401s.
    if (status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('linkly:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response) return error.response.data?.error?.message || fallback;
  if (error?.request) return 'Cannot reach the server. Check your connection and try again.';
  return fallback;
}

/** Maps API validation details to { fieldName: message } for inline form errors. */
export function getFieldErrors(error) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, { field, message }) => (field && !acc[field] ? { ...acc, [field]: message } : acc), {});
}
