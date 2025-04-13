// index.web.js - Entry point for web
import 'expo-router/entry';
import { createRoot } from 'react-dom/client';
import { TamaguiProvider } from 'tamagui';
import config from './tamagui.config';
import { useColorScheme } from 'react-native';
import { StrictMode, useEffect } from 'react';
import App from './App';
import './global.css';


if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-tap-highlight-color: transparent !important;
        outline: none !important;
        -webkit-touch-callout: none !important;
        user-select: none !important;
      }
      
      button, [role="button"], a {
        -webkit-tap-highlight-color: transparent !important;
        outline: none !important;
      }
      
      .tamagui-Button, .tamagui-Card {
        -webkit-tap-highlight-color: transparent !important;
        outline: none !important;
      }
      
      *:focus {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
  }

// We don't need to render anything here since Expo Router handles that
// But we need to import our styles and setup our providers

// Add these styles to head for better web styling
const style = document.createElement('style');
style.textContent = `
html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
`;
document.head.append(style);

// This helps with theme detection
if (typeof document !== 'undefined') {
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.classList.add(`${colorScheme}-theme`);
}

// Force web styling to work properly in production
const injectTamaguiStyles = () => {
  // Create and append Tamagui styles
  if (typeof document !== 'undefined') {
    // Check if styles have already been injected
    if (!document.getElementById('tamagui-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'tamagui-styles';
      styleElement.textContent = `
        [data-tamagui-component] {
          display: flex;
        }
        .tamagui-YStack {
          flex-direction: column;
        }
        .tamagui-XStack {
          flex-direction: row;
        }
        .tamagui-Text {
          position: relative;
          white-space: pre-wrap;
        }
        .tamagui-Button {
          cursor: pointer;
        }
      `;
      document.head.appendChild(styleElement);
    }
  }
};

if (typeof document !== 'undefined') {
    document.addEventListener('click', function(e) {
      if (e.target instanceof HTMLElement) {
        setTimeout(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }, 10);
      }
    }, true);
  }

// Call the style injection
injectTamaguiStyles();