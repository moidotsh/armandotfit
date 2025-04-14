// index.web.js - Enforce Light Mode
import 'expo-router/entry';
import './global.css';

// Ensure light mode on web
if (typeof document !== 'undefined') {
  // Force light mode
  document.documentElement.classList.remove('dark-theme');
  document.documentElement.classList.add('light-theme');
  document.documentElement.setAttribute('data-theme', 'light');
  
  // Inject essential styles
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    body, html, #root {
      background-color: #F5F5F5 !important;
      color: #000000 !important;
    }
    
    * {
      -webkit-tap-highlight-color: transparent !important;
    }
    
    [data-is-tamagui="true"] {
      display: flex;
    }
    
    .tamagui-YStack {
      flex-direction: column;
    }
    
    .tamagui-XStack {
      flex-direction: row;
    }
  `;
  document.head.appendChild(styleElement);
  
  // Prevent theme auto-detection
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQueryList.addEventListener('change', () => {
    // Always force light theme when system preference changes
    document.documentElement.classList.remove('dark-theme');
    document.documentElement.classList.add('light-theme');
    document.documentElement.setAttribute('data-theme', 'light');
  });
}