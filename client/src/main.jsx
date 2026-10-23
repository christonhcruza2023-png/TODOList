import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <ToastProvider>
            <TaskProvider>
              <App />
            </TaskProvider>
          </ToastProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
