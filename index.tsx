
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import PrivacyPolicy from './components/PrivacyPolicy';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', backgroundColor: 'black', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register the service worker manually
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered!', reg);
    }).catch(err => console.log('SW registration failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// App root rendering
const isPrivacyPolicy = window.location.pathname === '/privacy';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isPrivacyPolicy ? <PrivacyPolicy /> : <App />}
    </ErrorBoundary>
  </React.StrictMode>
);
