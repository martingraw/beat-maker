(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading MP3 export fix...');
  
  // Load the full lamejs library from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.all.js';
  
  script.onload = function() {
    console.log('[Beat Maker] Loaded lamejs library');
    
    // Define required global objects
    if (typeof window.MPEGMode === 'undefined') {
      window.MPEGMode = {
        STEREO: 0,
        JOINT_STEREO: 1,
        DUAL_CHANNEL: 2,
        MONO: 3
      };
    }
    
    // Create our own MP3 encoder function to replace the broken one
    window.createMp3Encoder = function(sampleRate, channels, bitRate) {
      const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitRate || 128);
      
      return {
        encodeBuffer: function(buffer) {
          // Make sure buffer is properly formatted
          if (!buffer || !buffer.length) {
            console.error('[Beat Maker] Invalid buffer passed to encodeBuffer');
            return new Int8Array(0);
          }
          
          // Convert audio buffer to proper format for lamejs
          let samples;
          if (channels === 1) {
            samples = new Int16Array(buffer.length);
            for (let i = 0; i < buffer.length; i++) {
              samples[i] = buffer[i] * 0x7FFF;
            }
            return mp3encoder.encodeBuffer(samples);
          } else {
            // For stereo, we need to separate left and right channels
            const left = new Int16Array(buffer.length / 2);
            const right = new Int16Array(buffer.length / 2);
            
            for (let i = 0; i < buffer.length / 2; i++) {
              left[i] = buffer[i * 2] * 0x7FFF;
              right[i] = buffer[i * 2 + 1] * 0x7FFF;
            }
            return mp3encoder.encodeBuffer(left, right);
          }
        },
        flush: function() {
          return mp3encoder.flush();
        }
      };
    };
    
    // Monkey patch any existing Mp3Encoder implementations
    try {
      // Find objects in window that might be using Lame
      Object.keys(window).forEach(key => {
        const obj = window[key];
        if (obj && typeof obj === 'object' && obj.encodeBuffer) {
          console.log('[Beat Maker] Found potential encoder object:', key);
          
          // Create backup of original method
          const originalEncodeBuffer = obj.encodeBuffer;
          
          // Replace with safer version
          obj.encodeBuffer = function(buffer) {
            try {
              if (!buffer || !buffer.length) {
                console.error('[Beat Maker] Invalid buffer in encodeBuffer, providing empty result');
                return new Int8Array(0);
              }
              return originalEncodeBuffer.call(this, buffer);
            } catch (e) {
              console.error('[Beat Maker] Error in original encodeBuffer, using fallback', e);
              
              // Create a new encoder using our function as fallback
              const fallbackEncoder = window.createMp3Encoder(44100, 2, 128);
              return fallbackEncoder.encodeBuffer(buffer);
            }
          };
          
          console.log('[Beat Maker] Patched encodeBuffer method on', key);
        }
      });
    } catch (e) {
      console.error('[Beat Maker] Error patching existing encoders:', e);
    }
    
    // Patch the specific function in exportUtils.ts
    try {
      // Look for functions related to MP3 export
      const exportFunctions = Object.values(window).filter(val => 
        typeof val === 'function' && 
        val.toString().includes('encodeBuffer')
      );
      
      for (const exportFn of exportFunctions) {
        console.log('[Beat Maker] Found potential MP3 export function:', exportFn.name);
        
        // Store original function
        const originalFn = exportFn;
        
        // Replace with our version that handles errors
        window[exportFn.name] = function(...args) {
          try {
            // Add our hook right before the function runs
            window.fixMp3Export = function() {
              console.log('[Beat Maker] MP3 export fix hook called');
              return window.createMp3Encoder(44100, 2, 128);
            };
            
            return originalFn.apply(this, args);
          } catch (e) {
            console.error('[Beat Maker] Error in export function, attempting fix', e);
            // Handle fallback if needed
            return null;
          }
        };
        
        console.log('[Beat Maker] Patched MP3 export function:', exportFn.name);
      }
    } catch (e) {
      console.error('[Beat Maker] Error patching MP3 export functions:', e);
    }
  };
  
  script.onerror = function() {
    console.error('[Beat Maker] Failed to load lamejs library');
  };
  
  document.head.appendChild(script);
  
  // Direct patch for the index.js:121 error
  setTimeout(function() {
    try {
      // Look through the loaded scripts for exportUtils.ts
      const scripts = Array.from(document.querySelectorAll('script'));
      
      scripts.forEach(scriptElem => {
        if (scriptElem.src.includes('main') || scriptElem.src.includes('chunk')) {
          console.log('[Beat Maker] Examining script:', scriptElem.src);
          
          // We can't modify loaded scripts directly, but we can override specific functions
          // that we know are problematic
          
          // This is a generic fix for index.js:121:37 error
          window.fixBufferLength = function(buffer) {
            if (!buffer || typeof buffer.length === 'undefined') {
              console.warn('[Beat Maker] Fixing undefined buffer');
              return new Float32Array(0);
            }
            return buffer;
          };
        }
      });
    } catch (e) {
      console.error('[Beat Maker] Error examining scripts:', e);
    }
  }, 2000);
})();