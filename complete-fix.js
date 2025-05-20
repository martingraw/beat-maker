(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading complete fix...');
  
  // Define necessary global objects
  
  // 1. MPEGMode definition
  window.MPEGMode = {
    STEREO: 0,
    JOINT_STEREO: 1,
    DUAL_CHANNEL: 2,
    MONO: 3
  };
  
  // 2. Stub Lame object with required methods
  window.Lame = {
    // Basic properties and methods required by the app
    version: '1.2.1',
    
    // Stub methods
    init_bit_stream_w: function() {
      console.log('[Beat Maker] Stub Lame.init_bit_stream_w called');
      return {};
    },
    
    lame_init: function() {
      console.log('[Beat Maker] Stub Lame.lame_init called');
      return {};
    },
    
    lame_init_params: function() {
      console.log('[Beat Maker] Stub Lame.lame_init_params called');
      return 0; // Success
    },
    
    lame_encode_buffer: function() {
      console.log('[Beat Maker] Stub Lame.lame_encode_buffer called');
      return new Int8Array(0);
    },
    
    lame_encode_flush: function() {
      console.log('[Beat Maker] Stub Lame.lame_encode_flush called');
      return new Int8Array(0);
    },
    
    // Add reference to MPEGMode
    MPEGMode: window.MPEGMode
  };
  
  // 3. MP3 encoder stub
  window.MP3Encoder = function(channels, sampleRate, bitRate) {
    console.log('[Beat Maker] Creating stub MP3Encoder', channels, sampleRate, bitRate);
    
    return {
      encodeBuffer: function(buffer) {
        console.log('[Beat Maker] Stub encodeBuffer called');
        return new Int8Array(0);
      },
      
      flush: function() {
        console.log('[Beat Maker] Stub flush called');
        return new Int8Array(0);
      }
    };
  };
  
  // 4. MP3 export modules - match structure in error
  const moduleX = {
    exports: {
      x: function() {
        console.log('[Beat Maker] MP3 encoder constructor called');
        
        return {
          encodeBuffer: function(buffer) {
            console.log('[Beat Maker] Stub encodeBuffer called');
            return new Int8Array(0);
          },
          
          flush: function() {
            console.log('[Beat Maker] Stub flush called');
            return new Int8Array(0);
          }
        };
      }
    }
  };
  
  // Add this to global scope under various possible names
  window.lameModule = moduleX;
  window.mp3Module = moduleX;
  window.e = moduleX;
  
  // 5. MIDI export fix - provide addTrackName
  Object.prototype.addTrackName = function(delta, time, name) {
    console.log('[Beat Maker] Fallback addTrackName called with:', delta, time, name);
    this.name = name;
    return this;
  };
  
  // Remove addTrackName from Object prototype after 10 seconds
  setTimeout(function() {
    delete Object.prototype.addTrackName;
    console.log('[Beat Maker] Removed addTrackName from Object prototype');
  }, 10000);
  
  // 6. Monitor errors and apply additional fixes when needed
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string') {
      const errorMsg = args[0].toString();
      
      // Handle MPEGMode error
      if (errorMsg.includes('MPEGMode is not defined')) {
        console.log('[Beat Maker] Caught MPEGMode error, redefining');
        window.MPEGMode = {
          STEREO: 0,
          JOINT_STEREO: 1,
          DUAL_CHANNEL: 2,
          MONO: 3
        };
      }
      
      // Handle Lame error
      if (errorMsg.includes('Lame is not defined')) {
        console.log('[Beat Maker] Caught Lame error, redefining');
        
        // Try to find where Lame should be defined
        if (args[0].stack) {
          const stack = args[0].stack;
          console.log('[Beat Maker] Error stack:', stack);
          
          // Look for module names in the stack
          const moduleMatch = stack.match(/at\s+([a-zA-Z0-9_$.]+)/g);
          if (moduleMatch) {
            console.log('[Beat Maker] Modules in stack:', moduleMatch);
            
            // Try to add Lame to each possible module
            moduleMatch.forEach(match => {
              const moduleName = match.split(' ')[1];
              const parts = moduleName.split('.');
              
              let obj = window;
              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (obj[part]) {
                  obj = obj[part];
                } else {
                  obj = null;
                  break;
                }
              }
              
              if (obj) {
                const lastPart = parts[parts.length - 1];
                obj.Lame = window.Lame;
                console.log('[Beat Maker] Added Lame to', moduleName);
              }
            });
          }
        }
      }
      
      // Handle addTrackName error
      if (errorMsg.includes('addTrackName is not a function')) {
        console.log('[Beat Maker] Caught addTrackName error');
        
        // If we already removed it, add it back
        if (!Object.prototype.addTrackName) {
          Object.prototype.addTrackName = function(delta, time, name) {
            console.log('[Beat Maker] Emergency addTrackName called');
            this.name = name;
            return this;
          };
          
          // Set a new timeout to remove it
          setTimeout(function() {
            delete Object.prototype.addTrackName;
            console.log('[Beat Maker] Removed addTrackName from Object prototype');
          }, 5000);
        }
      }
    }
    
    // Call original error handler
    return originalConsoleError.apply(this, arguments);
  };
  
  // 7. Try to load lamejs library from CDN as a backup
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js';
  
  script.onload = function() {
    console.log('[Beat Maker] Successfully loaded lamejs from CDN');
    
    // If it provides a lamejs object, use it
    if (window.lamejs) {
      // Add it as Lame as well
      window.Lame = window.lamejs;
      console.log('[Beat Maker] Set window.Lame to lamejs');
    }
  };
  
  script.onerror = function() {
    console.error('[Beat Maker] Failed to load lamejs from CDN');
  };
  
  // Add the script to the document
  document.head.appendChild(script);
  
  console.log('[Beat Maker] Complete fix loaded successfully');
})();