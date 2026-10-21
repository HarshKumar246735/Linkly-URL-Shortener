import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './css/global.css';
import './css/Components.css';
import './css/Home.css';
import './css/Auth.css';
import './css/Dashboard.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" toastOptions={{ duration: 3500, style: { borderRadius: '12px', fontSize: '0.95rem' } }} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
