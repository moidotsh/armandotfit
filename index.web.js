// index.web.js - Fixed entry point for web
import 'expo-router/entry';
import './global.css';

// Ensure proper theme application
if (typeof document !== 'undefined') {
  // Function to set theme class on root element
  const applyTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  };

  // Initial theme application
  applyTheme();
  
  // Watch for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  
  // Inject important baseline styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
    
    [data-is-tamagui="true"] {
      display: flex;
    }
    
    body, #root {
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Disable focus rings for non-keyboard focus
  document.addEventListener('mousedown', () => {
    document.body.classList.add('using-mouse');
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.remove('using-mouse');
    }
  });
}