import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class PreviewErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Pettalopo preview startup error:', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return <div style={{minHeight:'100vh',padding:24,background:'#e51c24',color:'#fff',fontFamily:'system-ui,sans-serif'}}>
        <h1 style={{fontSize:22,fontWeight:700}}>Pettalopo Mobile</h1>
        <p style={{marginTop:12}}>Pratinjau mengalami kendala saat dibuka.</p>
        <pre style={{marginTop:16,padding:12,background:'rgba(0,0,0,.2)',whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontSize:12}}>{this.state.error.message}</pre>
        <button onClick={() => window.location.reload()} style={{marginTop:20,padding:'12px 18px',borderRadius:10,background:'#fff',color:'#b91c1c',fontWeight:700}}>Muat ulang pratinjau</button>
      </div>;
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  const app = <React.StrictMode><App /></React.StrictMode>;
  // This diagnostic wrapper is exclusive to GitHub Pages; native APK rendering remains unchanged.
  createRoot(root).render(import.meta.env.BASE_URL.startsWith('/Pettalopo-Mobile/')
    ? <PreviewErrorBoundary>{app}</PreviewErrorBoundary>
    : app
  );
}
