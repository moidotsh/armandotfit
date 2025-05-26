// index.web.js - Updated with Constrained View Support
import 'expo-router/entry';
import './global.css';

// Storage key for constrained view setting
const CONSTRAINED_VIEW_KEY = 'armandotfit_constrained_view';

// Add debounced resize handler for better performance
let resizeTimer;
window.addEventListener('resize', () => {
  // Clear previous timer
  clearTimeout(resizeTimer);
  
  // Set new timer with debounce
  resizeTimer = setTimeout(() => {
    // Get current width
    const width = window.innerWidth;
    const MAX_WIDTH = 480;
    const BUFFER_ZONE = 5;
    
    // If we're in the danger zone, apply a small nudge to escape it
    if (Math.abs(width - MAX_WIDTH) <= BUFFER_ZONE) {
      if (width < MAX_WIDTH) {
        document.body.style.width = `${MAX_WIDTH - BUFFER_ZONE - 1}px`;
      } else {
        document.body.style.width = `${MAX_WIDTH + BUFFER_ZONE + 1}px`;
      }
      setTimeout(() => {
        document.body.style.width = '';
      }, 100);
    }
    
    checkConstrainedViewSetting();
  }, 150); // Debounce period to avoid rapid changes
});

// Ensure light mode on web
if (typeof document !== 'undefined') {
  // Force light mode
  document.documentElement.classList.remove('dark-theme');
  document.documentElement.classList.add('light-theme');
  document.documentElement.setAttribute('data-theme', 'light');
  
  // Change document title for web
  document.title = 'Arman.fit - Workout Tracker';
  
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
  
  // Check for constrained view setting and apply appropriate styles
  const checkConstrainedViewSetting = async () => {
    try {
      const constrainedViewSetting = localStorage.getItem(CONSTRAINED_VIEW_KEY);
      // Default to true if not set (better desktop experience)
      const isConstrained = constrainedViewSetting === null ? true : constrainedViewSetting === 'true';
      
      // Apply or remove the constrained view attribute
      document.body.setAttribute('data-constrained-view', String(isConstrained));
      
      // Add modal constraint styles if constrained view is enabled
      if (isConstrained) {
        const modalStylesElement = document.createElement('style');
        modalStylesElement.id = 'modal-constraint-styles-armandotfit';
        modalStylesElement.textContent = `
          /* Ensure modal containers are constrained for Arman.fit */
          [role="dialog"],
          .ReactModalPortal,
          div[role="presentation"] > div[role="dialog"],
          .modal-container,
          .react-modal-overlay,
          .fixed, 
          .inset-0,
          [data-overlay-container="true"] {
            max-width: 480px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            left: 0 !important;
            right: 0 !important;
          }
          
          /* Target internal modal content */
          [role="dialog"] > div, 
          [role="dialog"] > div > div,
          [data-overlay-container="true"] > div {
            max-width: 100% !important;
          }
          
          /* Make background overlay full width but center content */
          .ReactModalPortal > div,
          div[role="presentation"],
          div[tabindex="-1"][aria-modal="true"] {
            width: 100vw !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-end !important;
          }
          
          /* Mobile viewport meta adjustment to ensure modals look right */
          @media only screen {
            .ReactModalPortal {
              position: fixed;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
              display: flex;
              justify-content: center;
              z-index: 1000;
            }
          }
          
          /* Special handling for RN Web Modal internals */
          [data-sheet="true"],
          [aria-modal="true"],
          [role="dialog"] > div {
            max-width: 480px !important;
            width: 100% !important;
          }
        `;
        document.head.appendChild(modalStylesElement);
      } else {
        // Remove modal constraint styles if they exist
        const existingModalStyles = document.getElementById('modal-constraint-styles-armandotfit');
        if (existingModalStyles) {
          existingModalStyles.remove();
        }
      }
      
      // Listen for storage changes to update the UI immediately when settings change
      window.addEventListener('storage', (event) => {
        if (event.key === CONSTRAINED_VIEW_KEY) {
          const newIsConstrained = event.newValue === 'true' || event.newValue === null;
          document.body.setAttribute('data-constrained-view', String(newIsConstrained));
          
          // Update modal styles based on new setting
          const existingModalStyles = document.getElementById('modal-constraint-styles-armandotfit');
          if (newIsConstrained && !existingModalStyles) {
            checkConstrainedViewSetting(); // Re-apply styles
          } else if (!newIsConstrained && existingModalStyles) {
            existingModalStyles.remove();
          }
        }
      });
    } catch (error) {
      console.error('Error checking constrained view setting:', error);
      // Default to true if there's an error (better UX)
      document.body.setAttribute('data-constrained-view', 'true');
    }
  };
  
  // Check the setting when the app loads
  checkConstrainedViewSetting();
  
  // Add MutationObserver to watch for dynamically added modals
  const addModalObserver = () => {
    // Target the body to watch for added nodes
    const targetNode = document.body;
    
    // Observer configuration
    const config = { childList: true, subtree: true };
    
    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for modal-like elements
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              const element = node;
              
              // Check if this looks like a modal
              if (
                element.getAttribute('role') === 'dialog' ||
                element.classList.contains('ReactModalPortal') ||
                element.getAttribute('aria-modal') === 'true' ||
                element.getAttribute('data-overlay-container') === 'true'
              ) {
                // Re-apply constraints if needed
                checkConstrainedViewSetting();
              }
              
              // Also look for modal-like children
              const modalChildren = element.querySelectorAll(
                '[role="dialog"], .ReactModalPortal, [aria-modal="true"], [data-overlay-container="true"]'
              );
              
              if (modalChildren.length > 0) {
                checkConstrainedViewSetting();
              }
            }
          });
        }
      }
    };
    
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  };
  
  // Start observing for dynamically added modals
  setTimeout(addModalObserver, 1000);
}