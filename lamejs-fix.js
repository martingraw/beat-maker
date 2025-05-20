// Load Lamejs from CDN
(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading Lamejs fix...');
  
  // Check if Lame is already defined
  if (window.Lame) {
    console.log('[Beat Maker] Lame already defined, skipping load');
    return;
  }
  
  // Create script element to load Lamejs
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js';
  script.onload = function() {
    console.log('[Beat Maker] Successfully loaded Lamejs from CDN');
    
    // Define MPEGMode if needed
    if (typeof window.MPEGMode === 'undefined') {
      window.MPEGMode = {
        STEREO: 0,
        JOINT_STEREO: 1,
        DUAL_CHANNEL: 2,
        MONO: 3
      };
      console.log('[Beat Maker] Defined MPEGMode');
    }
    
    // Make sure global Lame is accessible
    if (typeof window.Lame === 'undefined' && typeof window.lamejs !== 'undefined') {
      window.Lame = window.lamejs;
      console.log('[Beat Maker] Mapped lamejs to Lame');
    }
  };
  
  script.onerror = function() {
    console.error('[Beat Maker] Failed to load Lamejs from CDN');
  };
  
  // Add the script to the document
  document.head.appendChild(script);
})();