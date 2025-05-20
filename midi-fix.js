(function() {
  'use strict';
  
  console.log('[Beat Maker] Loading MIDI export fix...');
  
  // Load a reliable MIDI library from CDN
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/tonejs-midi@2.0.28/build/Midi.min.js';
  
  script.onload = function() {
    console.log('[Beat Maker] Loaded Tonejs Midi library');
    
    // Create a global reference to the Midi constructor
    window.ToneMidi = Midi;
    
    // Implement our own track name functionality
    if (window.ToneMidi && window.ToneMidi.Track) {
      // Add the missing addTrackName method to Track prototype
      window.ToneMidi.Track.prototype.addTrackName = function(time, name) {
        this.name = name;
        return this;
      };
      
      console.log('[Beat Maker] Added addTrackName to Tonejs Midi Track');
    }
    
    // Replace the app's MIDI export function
    window.exportMIDI = function(tracks, bpm) {
      console.log('[Beat Maker] Custom MIDI export function called', tracks, bpm);
      
      try {
        // Create a new MIDI file
        const midi = new window.ToneMidi();
        midi.header.setTempo(bpm || 120);
        
        // Process each track
        tracks.forEach((trackData, index) => {
          const track = midi.addTrack();
          
          // Add track name if available
          if (trackData.name) {
            track.name = trackData.name;
          } else {
            track.name = `Track ${index + 1}`;
          }
          
          // Add notes
          if (trackData.notes && Array.isArray(trackData.notes)) {
            trackData.notes.forEach(note => {
              track.addNote({
                midi: note.midi || note.pitch || 60,
                time: note.time || note.startTime || 0,
                duration: note.duration || 0.5,
                velocity: note.velocity || 0.7
              });
            });
          }
        });
        
        // Convert to array buffer and return as blob
        const arrayBuffer = midi.toArray();
        return new Blob([arrayBuffer], { type: 'audio/midi' });
      } catch (e) {
        console.error('[Beat Maker] Error in custom MIDI export:', e);
        return null;
      }
    };
    
    // Monkey patch addTrackName onto any object that might need it
    setTimeout(function() {
      // Look for all objects that might be MIDI tracks
      Object.keys(window).forEach(key => {
        const obj = window[key];
        
        // If this looks like a constructor with prototype
        if (typeof obj === 'function' && obj.prototype) {
          // If it has properties that suggest it's a track but missing addTrackName
          if ((obj.prototype.addNote || obj.prototype.addEvent) && !obj.prototype.addTrackName) {
            obj.prototype.addTrackName = function(time, name) {
              this.name = name;
              return this;
            };
            console.log('[Beat Maker] Added addTrackName to', key);
          }
        }
      });
    }, 2000);
  };
  
  script.onerror = function() {
    console.error('[Beat Maker] Failed to load Tonejs Midi library');
    
    // Even if we can't load the library, we can still try to fix the addTrackName issue
    setTimeout(function() {
      // Create a generic addTrackName function to add to any object
      window.fixAddTrackName = function(obj) {
        if (obj && !obj.addTrackName) {
          obj.addTrackName = function(time, name) {
            this.name = name;
            return this;
          };
          return true;
        }
        return false;
      };
      
      // Directly fix the error by monitoring for it
      const originalError = console.error;
      console.error = function(...args) {
        // Check if this is our specific error
        if (args[0] && args[0].toString().includes('addTrackName is not a function')) {
          // The error happened, so "a" is probably in the call stack
          // We can try to find it by checking recent objects
          try {
            // Get the error stack
            const stack = args[0].stack;
            
            // Try to extract variables from the current scope
            // This is hacky but might work
            for (let i = 0; i < 10; i++) {
              const varName = String.fromCharCode(97 + i); // a, b, c, d, ...
              if (window[varName] && typeof window[varName] === 'object') {
                window.fixAddTrackName(window[varName]);
              }
            }
          } catch (e) {
            // Ignore errors in our error handler
          }
        }
        
        // Call the original error function
        return originalError.apply(this, args);
      };
    }, 1000);
  };
  
  document.head.appendChild(script);
})();