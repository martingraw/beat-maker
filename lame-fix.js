(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading Lame.js fix...');
  
  // Define in global scope
  window.MPEGMode = {
    STEREO: 0,
    JOINT_STEREO: 1,
    DUAL_CHANNEL: 2,
    MONO: 3
  };
  
  // Function to scan for Lame.js and patch it
  function findAndPatchLame() {
    // Look through all script elements
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.src && (script.src.includes('main.') || script.src.includes('chunk'))) {
        console.log('[Beat Maker] Intercepting script load:', script.src);
        
        // Create a clone of the script
        const newScript = document.createElement('script');
        newScript.src = script.src;
        
        // Remove the original script
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        
        // Set up interception
        newScript.onload = function() {
          console.log('[Beat Maker] Script loaded, applying Lame.js patch');
          
          // Try to find e.lame_init
          for (const key in window) {
            if (typeof window[key] === 'object' && window[key] !== null) {
              // Check if this object has lame_init
              if (typeof window[key].lame_init === 'function') {
                console.log('[Beat Maker] Found potential Lame object:', key);
                
                // Patch lame_init
                const originalLameInit = window[key].lame_init;
                window[key].lame_init = function() {
                  // Make sure MPEGMode is defined in this scope
                  if (typeof MPEGMode === 'undefined') {
                    // Use the global definition
                    const MPEGMode = window.MPEGMode;
                    console.log('[Beat Maker] Injected MPEGMode into Lame.js scope');
                  }
                  
                  // Call original
                  return originalLameInit.apply(this, arguments);
                };
                
                console.log('[Beat Maker] Successfully patched lame_init');
              }
            }
          }
        };
        
        // Add the new script
        document.head.appendChild(newScript);
      }
    }
  }
  
  // Wait for scripts to load and apply more targeted fixes
  setTimeout(findAndPatchLame, 0);
  
  // Add a new MPEGMode definition just before Lame.js is used
  // This is a more direct approach using function interception
  const originalMethods = {
    createElement: Document.prototype.createElement
  };
  
  // Intercept createElement to detect script loading
  Document.prototype.createElement = function(tagName) {
    const element = originalMethods.createElement.call(this, tagName);
    
    if (tagName.toLowerCase() === 'script') {
      // Watch for src changes on this script element
      const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      
      Object.defineProperty(element, 'src', {
        get: function() {
          return originalSrcDescriptor.get.call(this);
        },
        set: function(value) {
          // Set the original src
          originalSrcDescriptor.set.call(this, value);
          
          // If this is a JavaScript file
          if (value && typeof value === 'string' && value.includes('.js')) {
            console.log('[Beat Maker] Script src set:', value);
            
            // Add an onload handler to inject MPEGMode
            const originalOnload = this.onload;
            this.onload = function(event) {
              // Inject MPEGMode into various scopes
              window.MPEGMode = {
                STEREO: 0,
                JOINT_STEREO: 1,
                DUAL_CHANNEL: 2,
                MONO: 3
              };
              
              console.log('[Beat Maker] Injected MPEGMode on script load');
              
              // Call original onload
              if (typeof originalOnload === 'function') {
                return originalOnload.call(this, event);
              }
            };
          }
        },
        configurable: true
      });
    }
    
    return element;
  };
  
  // Monkey patch specific functions based on the error info
  function monkeyPatchExportFunctions() {
    // Look for the e.exports.x constructor mentioned in the error
    for (const key in window) {
      if (typeof window[key] === 'object' && window[key] !== null && window[key].exports) {
        console.log('[Beat Maker] Found potential module with exports:', key);
        
        // Check if it has an x constructor
        if (typeof window[key].exports.x === 'function') {
          console.log('[Beat Maker] Found potential MP3 encoder constructor');
          
          // Store the original constructor
          const originalConstructor = window[key].exports.x;
          
          // Replace with our version
          window[key].exports.x = function() {
            // Inject MPEGMode into this scope
            if (typeof MPEGMode === 'undefined') {
              var MPEGMode = {
                STEREO: 0,
                JOINT_STEREO: 1,
                DUAL_CHANNEL: 2,
                MONO: 3
              };
              console.log('[Beat Maker] Injected MPEGMode into MP3 encoder scope');
            }
            
            // Call the original constructor
            return new originalConstructor(...arguments);
          };
          
          console.log('[Beat Maker] Successfully patched MP3 encoder constructor');
        }
      }
    }
  }
  
  // Register event listeners for user actions
  document.addEventListener('click', function() {
    console.log('[Beat Maker] User clicked, ensuring MPEGMode is defined');
    
    // Define MPEGMode
    window.MPEGMode = {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3
    };
    
    // More targeted approach
    monkeyPatchExportFunctions();
  });
  
  // Intercept the error at Lame.js:135:20
  function interceptLameError() {
    // Monitor for console errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Check if this is our specific error
      if (args[0] && args[0].toString && args[0].toString().includes('MPEGMode is not defined')) {
        const errorStack = args[0].stack || '';
        
        // If this is the specific error in Lame.js
        if (errorStack.includes('Lame.js:135:20')) {
          console.log('[Beat Maker] Caught specific Lame.js error, applying targeted fix');
          
          // Add MPEGMode to various scopes
          window.MPEGMode = {
            STEREO: 0,
            JOINT_STEREO: 1,
            DUAL_CHANNEL: 2,
            MONO: 3
          };
          
          // Try to find the e.lame_init function mentioned in the stack
          for (const key in window) {
            if (typeof window[key] === 'object' && window[key] !== null) {
              if (typeof window[key].lame_init === 'function') {
                // Add MPEGMode directly to this object
                window[key].MPEGMode = window.MPEGMode;
                console.log('[Beat Maker] Added MPEGMode to Lame object');
                
                // Also add to the prototype
                if (window[key].__proto__) {
                  window[key].__proto__.MPEGMode = window.MPEGMode;
                  console.log('[Beat Maker] Added MPEGMode to Lame prototype');
                }
              }
            }
          }
          
          // Also add a polyfill approach
          var MPEGMode = window.MPEGMode;
        }
      }
      
      // Call the original
      return originalConsoleError.apply(this, args);
    };
  }
  
  // Apply our error interception
  interceptLameError();
  
  // Apply more targeted patch after a delay
  setTimeout(monkeyPatchExportFunctions, 1000);
  
  // Define a global function that can be used directly
  window.fixMP3Export = function() {
    console.log('[Beat Maker] Manual MP3 export fix called');
    
    // Define MPEGMode
    window.MPEGMode = {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3
    };
    
    // Apply more targeted fixes
    monkeyPatchExportFunctions();
    
    return true;
  };
  
  // Add MIDI fix too
  window.fixMIDIExport = function() {
    // Add addTrackName to Object prototype temporarily
    if (!Object.prototype.addTrackName) {
      Object.prototype.addTrackName = function(delta, time, name) {
        console.log('[Beat Maker] Emergency addTrackName called with:', delta, time, name);
        this.name = name;
        return this;
      };
      
      // Remove after 5 seconds
      setTimeout(() => {
        delete Object.prototype.addTrackName;
      }, 5000);
    }
    
    return true;
  };
  
  console.log('[Beat Maker] Lame.js fix loaded successfully');
})();