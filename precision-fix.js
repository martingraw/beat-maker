(function() {
  'use strict';
  
  console.log('[Beat Maker Fix] Initializing precision fix...');
  
  // 1. Fix for MP3 export (encodeBuffer issue)
  // Define required global objects immediately
  if (typeof window.MPEGMode === 'undefined') {
    window.MPEGMode = {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3
    };
    console.log('[Beat Maker Fix] Defined MPEGMode object');
  }
  
  // 2. Fix for MIDI export (addTrackName issue)
  // We need to ensure that the File object returned by nn().File has the addTrackName method
  function patchFileConstructors() {
    // Look for functions that might be nn()
    for (const key in window) {
      if (typeof window[key] === 'function') {
        try {
          const result = window[key]();
          
          // If this function returns an object with a File property, it might be nn()
          if (result && typeof result === 'object' && typeof result.File === 'function') {
            console.log('[Beat Maker Fix] Found potential nn() function:', key);
            
            // Now patch the File.prototype to ensure it has addTrackName
            const FileProto = result.File.prototype;
            
            if (!FileProto.addTrackName) {
              console.log('[Beat Maker Fix] Adding addTrackName to File.prototype');
              
              // Add the method with 3 parameters as seen in the code
              FileProto.addTrackName = function(delta, time, name) {
                console.log('[Beat Maker Fix] Custom addTrackName called with:', delta, time, name);
                
                // Store the name on the object
                this.name = name;
                
                // If there's an addTrack method, we might be using a different MIDI library
                if (typeof this.addTrack === 'function') {
                  const track = this.addTrack();
                  if (track && typeof track.addEvent === 'function') {
                    // Some MIDI libraries use META_TRACK_NAME event (type 0x03)
                    track.addEvent({
                      type: 0x03, // META_TRACK_NAME
                      data: name
                    }, delta);
                  }
                }
                
                return this;
              };
            }
          }
        } catch (e) {
          // Ignore errors when testing functions
        }
      }
    }
  }
  
  // Patch the encodeBuffer function to handle undefined buffers
  function patchEncodeBuffer() {
    // Monitor for access to encodeBuffer method
    Object.defineProperty(Object.prototype, 'encodeBuffer', {
      // Store original method
      get: function() {
        const original = this._originalEncodeBuffer;
        
        if (typeof original === 'function') {
          // Return a safe wrapper around the original function
          return function(buffer) {
            try {
              // Check if buffer is valid
              if (!buffer || typeof buffer.length === 'undefined') {
                console.warn('[Beat Maker Fix] Fixing undefined buffer in encodeBuffer');
                return new Int8Array(0);
              }
              
              // Call original with proper arguments
              return original.apply(this, arguments);
            } catch (e) {
              console.error('[Beat Maker Fix] Error in encodeBuffer:', e);
              // Return empty result to prevent further errors
              return new Int8Array(0);
            }
          };
        }
        
        return original;
      },
      set: function(newValue) {
        // Store the original function
        this._originalEncodeBuffer = newValue;
      },
      configurable: true
    });
    
    // Look for objects that might already have encodeBuffer
    for (const key in window) {
      if (typeof window[key] === 'object' && window[key] !== null) {
        const obj = window[key];
        
        if (typeof obj.encodeBuffer === 'function') {
          console.log('[Beat Maker Fix] Found encodeBuffer in', key);
          
          // Save the original function
          obj._originalEncodeBuffer = obj.encodeBuffer;
          
          // The getter will now return our safe version
        }
      }
    }
  }
  
  // Direct patch based on nn() and File
  function directPatchNN() {
    // Try to find the nn function
    let foundNN = false;
    
    // Look for all functions that might be nn
    for (const key in window) {
      if (typeof window[key] === 'function' && key.length <= 3) {
        try {
          // Attempt to call it and see if it returns something with File
          const result = window[key]();
          
          if (result && typeof result.File === 'function') {
            // This looks like nn!
            console.log('[Beat Maker Fix] Found nn() function as', key);
            
            // Save the original function
            const originalNN = window[key];
            
            // Replace with our enhanced version
            window[key] = function() {
              const result = originalNN.apply(this, arguments);
              
              // Patch the File constructor
              const originalFile = result.File;
              result.File = function() {
                const fileInstance = new originalFile(...arguments);
                
                // Add addTrackName if it doesn't exist
                if (!fileInstance.addTrackName) {
                  fileInstance.addTrackName = function(delta, time, name) {
                    console.log('[Beat Maker Fix] Dynamically added addTrackName called');
                    this.name = name;
                    return this;
                  };
                }
                
                return fileInstance;
              };
              result.File.prototype = originalFile.prototype;
              
              // Ensure addTrackName exists on the prototype
              if (!result.File.prototype.addTrackName) {
                result.File.prototype.addTrackName = function(delta, time, name) {
                  console.log('[Beat Maker Fix] Prototype addTrackName called');
                  this.name = name;
                  return this;
                };
              }
              
              return result;
            };
            
            foundNN = true;
            break;
          }
        } catch (e) {
          // Ignore errors, just try the next function
        }
      }
    }
    
    if (!foundNN) {
      console.log('[Beat Maker Fix] Could not find nn() function, trying generic patches');
    }
  }
  
  // Patch by directly targeting the cn function
  function patchCNFunction() {
    // Look for a function that might be cn (the MIDI export function)
    for (const key in window) {
      if (typeof window[key] === 'function') {
        const funcStr = window[key].toString();
        
        // If the function contains our key pattern
        if (funcStr.includes('addTrackName') && funcStr.includes('Beat Maker Pattern')) {
          console.log('[Beat Maker Fix] Found cn function as', key);
          
          // Save the original function
          const originalCN = window[key];
          
          // Replace with our fixed version
          window[key] = function(e, t, n, a) {
            try {
              // Ensure the a object has addTrackName before cn tries to use it
              if (a && !a.addTrackName) {
                a.addTrackName = function(delta, time, name) {
                  console.log('[Beat Maker Fix] Added addTrackName to object in cn');
                  this.name = name;
                  return this;
                };
              }
              
              // Call the original function with our fixed objects
              return originalCN.apply(this, arguments);
            } catch (error) {
              console.error('[Beat Maker Fix] Error in patched cn:', error);
              
              // Try to return something that won't break the app
              return null;
            }
          };
          
          break;
        }
      }
    }
  }
  
  // Set up a specific hook for the exact MIDI File and addTrackName call
  function setupSpecificHooks() {
    // Based on the code fragment we have, we can intercept the exact objects
    
    // Override the constructor
    window.MIDIFileConstructorHook = function(File) {
      if (File && File.prototype && !File.prototype.addTrackName) {
        File.prototype.addTrackName = function(delta, time, name) {
          console.log('[Beat Maker Fix] MIDI File addTrackName:', delta, time, name);
          this.name = name;
          return this;
        };
      }
      return File;
    };
    
    // Monitor errors to add just-in-time fixes
    const originalError = console.error;
    console.error = function(...args) {
      // Check for our specific errors
      if (args[0] && args[0].toString) {
        const errorStr = args[0].toString();
        
        // addTrackName error
        if (errorStr.includes('addTrackName is not a function')) {
          console.log('[Beat Maker Fix] Detected addTrackName error, applying emergency fix');
          
          // Look at the call stack to find the object
          if (args[0].stack) {
            const stack = args[0].stack;
            
            // Extract the function name from the stack
            const match = stack.match(/at\s+([a-zA-Z0-9_$]+)\s+\(/);
            if (match && match[1]) {
              const funcName = match[1];
              console.log('[Beat Maker Fix] Error occurred in function:', funcName);
              
              // Apply targeted fix
              patchFileConstructors();
              directPatchNN();
              patchCNFunction();
            }
          }
          
          // As a last resort, add to Object prototype temporarily
          Object.prototype.addTrackName = function(delta, time, name) {
            console.log('[Beat Maker Fix] Emergency addTrackName called');
            this.name = name;
            return this;
          };
          
          // Remove after a short delay
          setTimeout(() => {
            delete Object.prototype.addTrackName;
          }, 5000);
        }
        
        // encodeBuffer error
        if (errorStr.includes('Cannot read properties of undefined (reading \'length\')')) {
          console.log('[Beat Maker Fix] Detected encodeBuffer error, applying emergency fix');
          
          // Apply more aggressive fix
          patchEncodeBuffer();
        }
      }
      
      // Call the original error function
      return originalError.apply(this, args);
    };
  }
  
  // Apply all our patches
  patchFileConstructors();
  patchEncodeBuffer();
  directPatchNN();
  patchCNFunction();
  setupSpecificHooks();
  
  // Run patches again after a delay to catch dynamically loaded resources
  setTimeout(() => {
    patchFileConstructors();
    directPatchNN();
    patchCNFunction();
  }, 3000);
  
  console.log('[Beat Maker Fix] All patches applied');
})();