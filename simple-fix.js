(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading simple fix...');
  
  // 1. Fix for MPEGMode
  if (typeof window.MPEGMode === 'undefined') {
    window.MPEGMode = {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3
    };
    console.log('[Beat Maker] Defined MPEGMode object');
  }
  
  // 2. Fix for addTrackName
  // Create a global helper function
  window.fixAddTrackName = function(obj) {
    if (obj && typeof obj === 'object' && !obj.addTrackName) {
      obj.addTrackName = function(delta, time, name) {
        console.log('[Beat Maker] Added addTrackName to object');
        this.name = name;
        return this;
      };
      return true;
    }
    return false;
  };
  
  // Monitor errors to apply just-in-time fixes
  const originalError = console.error;
  console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string') {
      // MPEGMode error
      if (args[0].includes('MPEGMode is not defined')) {
        console.log('[Beat Maker] Caught MPEGMode error, redefining');
        window.MPEGMode = {
          STEREO: 0,
          JOINT_STEREO: 1,
          DUAL_CHANNEL: 2,
          MONO: 3
        };
      }
      
      // addTrackName error
      if (args[0].includes('addTrackName is not a function')) {
        console.log('[Beat Maker] Caught addTrackName error');
        
        // Temporary Object prototype method (removed after 5 seconds)
        if (!Object.prototype.addTrackName) {
          Object.prototype.addTrackName = function(delta, time, name) {
            console.log('[Beat Maker] Emergency addTrackName called');
            this.name = name;
            return this;
          };
          
          setTimeout(function() {
            delete Object.prototype.addTrackName;
          }, 5000);
        }
      }
    }
    
    // Call original error handler
    return originalError.apply(this, args);
  };
  
  console.log('[Beat Maker] Simple fix loaded successfully');
})();