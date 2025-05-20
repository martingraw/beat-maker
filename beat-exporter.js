(function() {
  'use strict';
  
  console.log('[Beat Exporter] Initializing...');
  
  // Add required libraries
  function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    script.onerror = function() {
      console.error('[Beat Exporter] Failed to load script:', url);
    };
    document.head.appendChild(script);
  }
  
  // First, load the necessary libraries
  loadScript('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.all.js', function() {
    console.log('[Beat Exporter] Loaded lamejs');
    loadScript('https://cdn.jsdelivr.net/npm/tonejs-midi@2.0.28/build/Midi.min.js', function() {
      console.log('[Beat Exporter] Loaded Tonejs Midi');
      initializeExporter();
    });
  });
  
  function initializeExporter() {
    // Create a container for our exporter UI
    const exporterContainer = document.createElement('div');
    exporterContainer.id = 'beat-exporter-container';
    exporterContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #fff;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 10px;
      z-index: 10000;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
      display: none;
    `;
    
    exporterContainer.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>Beat Exporter</span>
        <button id="beat-exporter-close" style="background: none; border: none; cursor: pointer; font-size: 16px;">✕</button>
      </div>
      <div style="margin-bottom: 8px;">
        <button id="beat-exporter-midi" style="padding: 5px 10px; margin-right: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Export MIDI
        </button>
        <button id="beat-exporter-mp3" style="padding: 5px 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Export MP3
        </button>
      </div>
      <div id="beat-exporter-status" style="font-size: 12px; color: #666;"></div>
    `;
    
    document.body.appendChild(exporterContainer);
    
    // Add event listeners
    document.getElementById('beat-exporter-close').addEventListener('click', function() {
      exporterContainer.style.display = 'none';
    });
    
    document.getElementById('beat-exporter-midi').addEventListener('click', exportMIDI);
    document.getElementById('beat-exporter-mp3').addEventListener('click', exportMP3);
    
    // Add a toggle button to show/hide the exporter
    const toggleButton = document.createElement('button');
    toggleButton.id = 'beat-exporter-toggle';
    toggleButton.textContent = 'Export';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 16px;
      background-color: #ff5722;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    toggleButton.addEventListener('click', function() {
      if (exporterContainer.style.display === 'none') {
        exporterContainer.style.display = 'block';
        toggleButton.style.display = 'none';
      }
    });
    
    document.body.appendChild(toggleButton);
    
    console.log('[Beat Exporter] UI initialized');
  }
  
  // Extract song data from the app
  function extractSongData() {
    try {
      // Try to find the app's store or state
      let songData = null;
      
      // Look for objects in the window that might contain song data
      for (const key in window) {
        if (typeof window[key] === 'object' && window[key] !== null) {
          const obj = window[key];
          
          // Check if this object has tracks, patterns, or notes properties
          if (obj.tracks || obj.patterns || obj.notes || 
              (obj.state && (obj.state.tracks || obj.state.patterns || obj.state.notes))) {
            console.log('[Beat Exporter] Possible song data found in', key);
            songData = obj.state || obj;
            break;
          }
          
          // Check for Redux store
          if (obj.getState && typeof obj.getState === 'function') {
            try {
              const state = obj.getState();
              if (state && (state.tracks || state.patterns || state.notes)) {
                console.log('[Beat Exporter] Found Redux store in', key);
                songData = state;
                break;
              }
            } catch (e) {
              // Ignore errors when checking for Redux store
            }
          }
        }
      }
      
      if (!songData) {
        // Try to find data in the DOM
        const appElement = document.querySelector('#root') || document.querySelector('.app');
        if (appElement && appElement._reactRootContainer) {
          console.log('[Beat Exporter] Found React root container');
          // React's internal data might be accessible
        }
      }
      
      // If we still don't have song data, try intercepting save function
      if (!songData) {
        // Watch for save actions
        const originalJSON = JSON.stringify;
        JSON.stringify = function(obj) {
          // Check if this object looks like song data
          if (obj && (obj.tracks || obj.patterns || obj.notes)) {
            console.log('[Beat Exporter] Captured song data during stringify');
            songData = obj;
          }
          return originalJSON.apply(this, arguments);
        };
        
        // Trigger a fake save to capture the data
        const saveButtons = Array.from(document.querySelectorAll('button'))
          .filter(button => button.textContent && button.textContent.toLowerCase().includes('save'));
        
        if (saveButtons.length > 0) {
          console.log('[Beat Exporter] Found', saveButtons.length, 'save buttons');
        }
      }
      
      return songData || { tracks: [], bpm: 120 };
    } catch (e) {
      console.error('[Beat Exporter] Error extracting song data:', e);
      return { tracks: [], bpm: 120 };
    }
  }
  
  // Export as MIDI
  function exportMIDI() {
    try {
      const statusElement = document.getElementById('beat-exporter-status');
      statusElement.textContent = 'Exporting MIDI...';
      statusElement.style.color = '#666';
      
      const songData = extractSongData();
      console.log('[Beat Exporter] Song data for MIDI export:', songData);
      
      // Create a new MIDI file
      const midi = new Midi();
      midi.header.setTempo(songData.bpm || 120);
      
      // Create tracks
      if (songData.tracks && Array.isArray(songData.tracks)) {
        songData.tracks.forEach((track, i) => {
          const midiTrack = midi.addTrack();
          midiTrack.name = track.name || `Track ${i + 1}`;
          
          // Add notes
          const notes = track.notes || [];
          notes.forEach(note => {
            midiTrack.addNote({
              midi: note.midi || note.pitch || 60,
              time: note.time || note.startTime || 0,
              duration: note.duration || 0.5,
              velocity: note.velocity || 0.7
            });
          });
        });
      }
      
      // Convert to array buffer and create a download link
      const arrayBuffer = midi.toArray();
      const blob = new Blob([arrayBuffer], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      
      // Create and click a download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'beat-maker-song.mid';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      statusElement.textContent = 'MIDI exported successfully!';
      statusElement.style.color = '#4CAF50';
    } catch (e) {
      console.error('[Beat Exporter] Error exporting MIDI:', e);
      const statusElement = document.getElementById('beat-exporter-status');
      statusElement.textContent = 'Error exporting MIDI: ' + e.message;
      statusElement.style.color = '#F44336';
    }
  }
  
  // Export as MP3
  function exportMP3() {
    try {
      const statusElement = document.getElementById('beat-exporter-status');
      statusElement.textContent = 'Exporting MP3... This might take a moment.';
      statusElement.style.color = '#666';
      
      // Try to get audio data from the app
      // This is tricky because we need to access the actual audio buffer
      
      // Option 1: Look for audio context
      let audioContext = null;
      for (const key in window) {
        if (typeof window[key] === 'object' && window[key] !== null) {
          if (window[key] instanceof (window.AudioContext || window.webkitAudioContext)) {
            audioContext = window[key];
            console.log('[Beat Exporter] Found AudioContext in', key);
            break;
          }
          
          // Check if it has an audioContext property
          if (window[key].audioContext instanceof (window.AudioContext || window.webkitAudioContext)) {
            audioContext = window[key].audioContext;
            console.log('[Beat Exporter] Found AudioContext property in', key);
            break;
          }
        }
      }
      
      if (!audioContext) {
        // If we can't find an existing context, create a new one
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('[Beat Exporter] Created new AudioContext');
      }
      
      // Since we can't directly access the app's audio, we'll provide a recording function
      statusElement.textContent = 'Please play your beat. Click "Stop Recording" when finished.';
      
      // Create a recorder UI
      const recorderElement = document.createElement('div');
      recorderElement.style.cssText = `
        margin-top: 10px;
        padding: 8px;
        background-color: #ffebee;
        border-radius: 4px;
      `;
      
      recorderElement.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Recording...</div>
        <div id="recording-time" style="margin-bottom: 5px;">00:00</div>
        <button id="stop-recording" style="padding: 5px 10px; background: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Stop Recording
        </button>
      `;
      
      document.getElementById('beat-exporter-status').parentNode.appendChild(recorderElement);
      
      // Set up recording
      let mediaRecorder;
      const chunks = [];
      let startTime;
      let timerInterval;
      
      // Get the audio stream
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
          };
          
          mediaRecorder.onstop = function() {
            // Stop the timer
            clearInterval(timerInterval);
            
            // Process the recording
            const blob = new Blob(chunks, { type: 'audio/webm' });
            convertToMp3(blob);
            
            // Clean up
            recorderElement.remove();
            stream.getTracks().forEach(track => track.stop());
          };
          
          // Start recording
          mediaRecorder.start();
          startTime = Date.now();
          
          // Update the timer
          timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('recording-time').textContent = `${minutes}:${seconds}`;
          }, 1000);
          
          // Set up stop button
          document.getElementById('stop-recording').addEventListener('click', function() {
            mediaRecorder.stop();
          });
        })
        .catch(error => {
          console.error('[Beat Exporter] Error starting recording:', error);
          statusElement.textContent = 'Error starting recording: ' + error.message;
          statusElement.style.color = '#F44336';
          recorderElement.remove();
        });
    } catch (e) {
      console.error('[Beat Exporter] Error preparing MP3 export:', e);
      const statusElement = document.getElementById('beat-exporter-status');
      statusElement.textContent = 'Error preparing MP3 export: ' + e.message;
      statusElement.style.color = '#F44336';
    }
  }
  
  // Convert audio blob to MP3
  function convertToMp3(blob) {
    const statusElement = document.getElementById('beat-exporter-status');
    statusElement.textContent = 'Converting to MP3...';
    
    // Convert the blob to an audio buffer
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
      const arrayBuffer = this.result;
      
      // Create an audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Decode the audio
      audioContext.decodeAudioData(arrayBuffer)
        .then(audioBuffer => {
          // Convert to MP3 using lamejs
          const mp3Data = encodeAudioBufferToMp3(audioBuffer);
          
          // Create a download link
          const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
          const url = URL.createObjectURL(mp3Blob);
          
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'beat-maker-song.mp3';
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
          
          statusElement.textContent = 'MP3 exported successfully!';
          statusElement.style.color = '#4CAF50';
        })
        .catch(error => {
          console.error('[Beat Exporter] Error decoding audio:', error);
          statusElement.textContent = 'Error converting to MP3: ' + error.message;
          statusElement.style.color = '#F44336';
        });
    };
    
    fileReader.readAsArrayBuffer(blob);
  }
  
  // Encode audio buffer to MP3 using lamejs
  function encodeAudioBufferToMp3(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    
    // Use a bitrate of 128 (good quality)
    const bitRate = 128;
    
    // Create the MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitRate);
    
    // Process the audio in chunks
    const mp3Data = [];
    const sampleBlockSize = 1152; // must be a multiple of 576 for mono or 1152 for stereo
    
    // Get samples
    let leftSamples, rightSamples;
    if (channels === 1) {
      // Mono
      leftSamples = samples;
      rightSamples = null;
    } else {
      // Stereo
      leftSamples = audioBuffer.getChannelData(0);
      rightSamples = audioBuffer.getChannelData(1);
    }
    
    // Convert to 16-bit PCM
    const leftPcm = new Int16Array(leftSamples.length);
    const rightPcm = channels > 1 ? new Int16Array(rightSamples.length) : null;
    
    for (let i = 0; i < leftSamples.length; i++) {
      // Convert float32 to int16
      leftPcm[i] = leftSamples[i] * 0x7FFF;
      if (channels > 1) {
        rightPcm[i] = rightSamples[i] * 0x7FFF;
      }
    }
    
    // Encode in chunks
    for (let i = 0; i < leftPcm.length; i += sampleBlockSize) {
      const leftChunk = leftPcm.subarray(i, i + sampleBlockSize);
      let mp3buf;
      
      if (channels > 1) {
        const rightChunk = rightPcm.subarray(i, i + sampleBlockSize);
        mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = mp3encoder.encodeBuffer(leftChunk);
      }
      
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    
    // Get the last part
    const lastMp3buf = mp3encoder.flush();
    if (lastMp3buf.length > 0) {
      mp3Data.push(new Int8Array(lastMp3buf));
    }
    
    return mp3Data;
  }
})();