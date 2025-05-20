(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading export fix...');
  
  // Fix for MP3 export
  if (typeof window.MPEGMode === 'undefined') {
    window.MPEGMode = {
      STEREO: 0,
      JOINT_STEREO: 1,
      DUAL_CHANNEL: 2,
      MONO: 3
    };
    console.log('[Beat Maker] Fixed MPEGMode definition');
  }
  
  // Fix for MIDI export
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
    
    console.log('[Beat Maker] MIDI patching complete');
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
  
  // Run our fix on page load and after a delay to catch late-loading scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', implementAddTrackName);
  } else {
    implementAddTrackName();
  }
  
  // Run again after a delay to catch dynamically loaded libraries
  setTimeout(implementAddTrackName, 2000);
})();