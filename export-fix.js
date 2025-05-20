(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading export fix...');
  
  // Create a check function to run repeatedly until libraries are loaded
  function checkAndFixExports() {
    // Fix for Lame not defined
    if (typeof window.Lame === 'undefined') {
      // Try to find Lame in global objects
      const possibleLames = Object.keys(window).filter(key => 
        key.toLowerCase().includes('lame') || 
        (window[key] && typeof window[key] === 'object' && window[key].lame_init)
      );
      
      if (possibleLames.length > 0) {
        window.Lame = window[possibleLames[0]];
        console.log('[Beat Maker] Found and assigned Lame from global object');
      } else {
        // Create a minimal Lame stub
        window.Lame = {
          init_bit_stream_w: function() { 
            console.log('[Beat Maker] Stubbed Lame.init_bit_stream_w called');
            return {}; 
          },
          lame_init: function() { 
            console.log('[Beat Maker] Stubbed Lame.lame_init called');
            return {}; 
          },
          lame_init_params: function() {
            console.log('[Beat Maker] Stubbed Lame.lame_init_params called');
            return {};
          }
        };
        console.log('[Beat Maker] Created stub Lame object');
      }
    }
    
    // Fix for MPEGMode not defined
    if (typeof window.MPEGMode === 'undefined') {
      window.MPEGMode = {
        STEREO: 0,
        JOINT_STEREO: 1,
        DUAL_CHANNEL: 2,
        MONO: 3
      };
      console.log('[Beat Maker] Fixed MPEGMode definition');
    }
    
    // Fix BitStream if needed
    if (typeof window.BitStream === 'undefined' && typeof window.h === 'object') {
      window.BitStream = window.h;
      console.log('[Beat Maker] Fixed BitStream reference');
    }
    
    // MIDI Export Fix
    implementAddTrackName();
  }
  
  function implementAddTrackName() {
    const addTrackNameFix = function(time, name) {
      console.log('[Beat Maker] addTrackName called with:', time, name);
      
      // Try different methods based on what properties this object has
      if (this.addEvent && typeof this.addEvent === 'function') {
        // jsmidgen style
        return this.addEvent({
          type: 0x03, // META_TRACK_NAME
          data: name
        }, time);
      } else if (this.addMetaEvent && typeof this.addMetaEvent === 'function') {
        // MidiWriter style
        return this.addMetaEvent({
          type: 'trackName',
          data: name,
          delta: time
        });
      } else {
        // Tone.js/Midi style or fallback
        this.name = name;
        return this;
      }
    };
    
    // Check for common MIDI libraries
    const targets = [
      window.JZZ?.MIDI?.SMF?.MTrk?.prototype,
      window.Midi?.Track?.prototype,
      window.MidiWriter?.Track?.prototype
    ];
    
    for (const target of targets) {
      if (target && !target.addTrackName) {
        target.addTrackName = addTrackNameFix;
        console.log('[Beat Maker] Patched MIDI Track object with addTrackName');
      }
    }
    
    // Look for Track objects that might not be directly accessible
    try {
      const trackConstructors = Object.values(window).filter(val => 
        typeof val === 'function' && 
        val.prototype && 
        (val.name === 'Track' || 
        val.name === 'MidiTrack' || 
        val.name?.includes('Track'))
      );
      
      for (const constructor of trackConstructors) {
        if (constructor.prototype && !constructor.prototype.addTrackName) {
          constructor.prototype.addTrackName = addTrackNameFix;
          console.log('[Beat Maker] Patched', constructor.name, 'prototype with addTrackName');
        }
      }
    } catch (e) {
      console.error('[Beat Maker] Error patching Track constructors:', e);
    }
    
    // Patch via monkey patching exportUtils.ts
    try {
      // Look for functions that might be the MIDI export function
      const exportFunctions = Object.values(window).filter(val => 
        typeof val === 'function' && 
        val.toString().includes('addTrackName')
      );
      
      for (const exportFn of exportFunctions) {
        const originalFn = exportFn;
        window[exportFn.name] = function(...args) {
          // Before calling the original function, add our fixes
          // This gives us a chance to patch objects created inside the function
          window.fixMidiAddTrackName = function(obj) {
            if (!obj.addTrackName) {
              obj.addTrackName = addTrackNameFix.bind(obj);
              return true;
            }
            return false;
          };
          
          return originalFn.apply(this, args);
        };
        console.log('[Beat Maker] Monkey patched export function:', exportFn.name);
      }
    } catch (e) {
      console.error('[Beat Maker] Error monkey patching export functions:', e);
    }
  }
  
  // Add a global function that can be called directly
  window.fixMidiAddTrackName = function(midiTrackObject) {
    if (!midiTrackObject.addTrackName) {
      midiTrackObject.addTrackName = function(time, name) {
        console.log('[Beat Maker] Direct addTrackName fix called');
        this.name = name;
        return this;
      };
      return true;
    }
    return false;
  };
  
  // Run our fix on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      checkAndFixExports();
    });
  } else {
    checkAndFixExports();
  }
  
  // Run again after a delay to catch dynamically loaded libraries
  setTimeout(checkAndFixExports, 1000);
  setTimeout(checkAndFixExports, 2000);
  setTimeout(checkAndFixExports, 5000);
  
  // Add more robust hotpatching
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const result = originalFetch.apply(this, args);
    result.then(() => {
      // When a resource is fetched, try patching again
      setTimeout(checkAndFixExports, 500);
    });
    return result;
  };
  
  // Patch XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(...args) {
    const result = originalOpen.apply(this, args);
    this.addEventListener('load', function() {
      // When an XHR completes, try patching again
      setTimeout(checkAndFixExports, 500);
    });
    return result;
  };
  
  // More direct method - add script to load Lamejs directly
  try {
    // Create a script element to load Lamejs from a CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js';
    script.onload = function() {
      console.log('[Beat Maker] Loaded Lamejs from CDN');
      checkAndFixExports();
    };
    document.head.appendChild(script);
  } catch (e) {
    console.error('[Beat Maker] Error loading Lamejs from CDN:', e);
  }
})();