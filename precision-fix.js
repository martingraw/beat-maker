(function() {
  'use strict';
  
  console.log('[Beat Maker Fix] Initializing ultimate fix...');
  
  // 1. Define MPEGMode globally right away
  window.MPEGMode = {
    STEREO: 0,
    JOINT_STEREO: 1,
    DUAL_CHANNEL: 2,
    MONO: 3
  };
  
  // 2. Define alternative names that might be used
  window.MPEG_MODE = window.MPEGMode;
  window.Mp3MPEGMode = window.MPEGMode;
  window.LameMode = window.MPEGMode;
  
  // 3. Monitor error messages to apply targeted fixes
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Check if this is our specific error
    if (args[0] && typeof args[0] === 'string' && args[0].includes('MPEGMode is not defined')) {
      console.log('[Beat Maker Fix] Caught MPEGMode error, applying targeted fix');
      
      // Look at the error location (exportUtils.ts:85:22)
      window.MPEGMode = {
        STEREO: 0,
        JOINT_STEREO: 1,
        DUAL_CHANNEL: 2,
        MONO: 3
      };
      
      // More aggressive approach - inject into all possible scopes
      injectMPEGModeEverywhere();
    }
    
    // Check for MIDI error
    if (args[0] && typeof args[0] === 'string' && args[0].includes('addTrackName is not a function')) {
      console.log('[Beat Maker Fix] Caught addTrackName error, applying MIDI fix');
      
      // Apply our MIDI fix
      fixMIDIExport();
    }
    
    // Always call the original
    return originalConsoleError.apply(this, args);
  };
  
  // 4. Extremely aggressive approach - define MPEGMode in all possible scopes
  function injectMPEGModeEverywhere() {
    // Define it on every object we can find
    for (const key in window) {
      try {
        if (typeof window[key] === 'object' && window[key] !== null) {
          if (!window[key].MPEGMode) {
            window[key].MPEGMode = window.MPEGMode;
          }
        }
      } catch (e) {
        // Ignore errors accessing some properties
      }
    }
    
    // Try to find the problematic module
    try {
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        if (script.src && script.src.includes('main.')) {
          console.log('[Beat Maker Fix] Found main script:', script.src);
          
          // Fetch the script content to examine it
          fetch(script.src)
            .then(response => response.text())
            .then(content => {
              // Look for MPEGMode usage
              const mpegModeIndex = content.indexOf('MPEGMode');
              if (mpegModeIndex !== -1) {
                const contextBefore = content.substring(Math.max(0, mpegModeIndex - 100), mpegModeIndex);
                const contextAfter = content.substring(mpegModeIndex, mpegModeIndex + 100);
                
                console.log('[Beat Maker Fix] Found MPEGMode usage:');
                console.log('Before:', contextBefore);
                console.log('After:', contextAfter);
                
                // Try to identify the module or function
                const moduleMatch = contextBefore.match(/[a-zA-Z0-9_$]+\s*=\s*function/);
                if (moduleMatch) {
                  const moduleName = moduleMatch[0].split('=')[0].trim();
                  console.log('[Beat Maker Fix] Potential module:', moduleName);
                  
                  // Try to inject into this module
                  if (window[moduleName]) {
                    window[moduleName].MPEGMode = window.MPEGMode;
                    console.log('[Beat Maker Fix] Injected MPEGMode into module:', moduleName);
                  }
                }
              }
            })
            .catch(error => {
              console.error('[Beat Maker Fix] Error fetching script:', error);
            });
        }
      }
    } catch (e) {
      console.error('[Beat Maker Fix] Error analyzing scripts:', e);
    }
  }
  
  // 5. Fix for MIDI export
  function fixMIDIExport() {
    // Add addTrackName to Object prototype temporarily
    if (!Object.prototype.addTrackName) {
      Object.prototype.addTrackName = function(delta, time, name) {
        console.log('[Beat Maker Fix] Emergency addTrackName called with:', delta, time, name);
        this.name = name;
        return this;
      };
      
      // Remove after 10 seconds to avoid polluting the prototype
      setTimeout(() => {
        delete Object.prototype.addTrackName;
      }, 10000);
    }
    
    // Try to find and patch the cn function more directly
    for (const key in window) {
      if (typeof window[key] === 'function') {
        const funcStr = window[key].toString();
        
        // Look for the specific function pattern
        if (funcStr.includes('addTrackName') && funcStr.includes('Beat Maker Pattern')) {
          console.log('[Beat Maker Fix] Found MIDI export function:', key);
          
          // Store the original function
          const originalFn = window[key];
          
          // Replace with our patched version
          window[key] = function() {
            try {
              // Before calling the original, ensure all objects have addTrackName
              for (let i = 0; i < arguments.length; i++) {
                if (arguments[i] && typeof arguments[i] === 'object' && !arguments[i].addTrackName) {
                  arguments[i].addTrackName = function(delta, time, name) {
                    this.name = name;
                    return this;
                  };
                }
              }
              
              return originalFn.apply(this, arguments);
            } catch (e) {
              console.error('[Beat Maker Fix] Error in patched MIDI function:', e);
              return null;
            }
          };
          
          console.log('[Beat Maker Fix] Successfully patched MIDI export function');
          break;
        }
      }
    }
  }
  
  // 6. Monitor specific DOM elements for export actions
  function monitorExportButtons() {
    // MutationObserver to watch for new elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(node => {
            // Check if this is an element
            if (node.nodeType === 1) {
              // Look for export buttons
              const buttons = node.querySelectorAll('button');
              buttons.forEach(button => {
                if (button.textContent && 
                    (button.textContent.toLowerCase().includes('export') || 
                     button.textContent.toLowerCase().includes('mp3') ||
                     button.textContent.toLowerCase().includes('midi'))) {
                  
                  console.log('[Beat Maker Fix] Found potential export button:', button.textContent);
                  
                  // Add a click handler to ensure our fixes are applied
                  button.addEventListener('click', () => {
                    console.log('[Beat Maker Fix] Export button clicked, ensuring fixes are applied');
                    
                    // Redefine MPEGMode
                    window.MPEGMode = {
                      STEREO: 0,
                      JOINT_STEREO: 1,
                      DUAL_CHANNEL: 2,
                      MONO: 3
                    };
                    
                    // Apply MIDI fix
                    fixMIDIExport();
                    
                    // More aggressive approach
                    injectMPEGModeEverywhere();
                  }, true); // Use capture to run before the app's handler
                }
              });
            }
          });
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also look for existing buttons
    const existingButtons = document.querySelectorAll('button');
    existingButtons.forEach(button => {
      if (button.textContent && 
          (button.textContent.toLowerCase().includes('export') || 
           button.textContent.toLowerCase().includes('mp3') ||
           button.textContent.toLowerCase().includes('midi'))) {
        
        console.log('[Beat Maker Fix] Found existing export button:', button.textContent);
        
        // Add a click handler
        button.addEventListener('click', () => {
          console.log('[Beat Maker Fix] Export button clicked, ensuring fixes are applied');
          
          // Redefine MPEGMode
          window.MPEGMode = {
            STEREO: 0,
            JOINT_STEREO: 1,
            DUAL_CHANNEL: 2,
            MONO: 3
          };
          
          // Apply MIDI fix
          fixMIDIExport();
          
          // More aggressive approach
          injectMPEGModeEverywhere();
        }, true); // Use capture to run before the app's handler
      }
    });
  }
  
  // Run our fixes
  injectMPEGModeEverywhere();
  fixMIDIExport();
  
  // Set up monitoring
  monitorExportButtons();
  
  // Apply fixes again after a delay
  setTimeout(() => {
    console.log('[Beat Maker Fix] Reapplying fixes after delay');
    injectMPEGModeEverywhere();
    fixMIDIExport();
    monitorExportButtons();
  }, 3000);
  
  // Load additional script for direct Lame support
  function loadLameScript() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
    script.onload = function() {
      console.log('[Beat Maker Fix] Loaded lamejs library');
      
      // Make sure MPEGMode is defined globally
      if (typeof window.MPEGMode === 'undefined') {
        window.MPEGMode = {
          STEREO: 0,
          JOINT_STEREO: 1,
          DUAL_CHANNEL: 2,
          MONO: 3
        };
      }
      
      // If the library provides its own MPEGMode, use that
      if (window.lamejs && window.lamejs.MPEGMode) {
        window.MPEGMode = window.lamejs.MPEGMode;
        console.log('[Beat Maker Fix] Using lamejs MPEGMode');
      }
    };
    script.onerror = function() {
      console.error('[Beat Maker Fix] Failed to load lamejs library');
    };
    document.head.appendChild(script);
  }
  
  // Load Lame script as a backup
  loadLameScript();
  
  console.log('[Beat Maker Fix] Ultimate fix initialization complete');
})();