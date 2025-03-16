import { Pattern, Track, Step } from '../store/sequencerSlice';
import { Sample } from '../store/audioSlice';
import audioEngine from '../audio/audioEngine';
import Lamejs from 'lamejs';
import RecordRTC from 'recordrtc';
import jsmidgen from 'jsmidgen';

// MP3 Export Functions
export interface RecordingOptions {
  sampleRate?: number;
  bitRate?: number;
}

let mediaRecorder: any | null = null;
let audioChunks: Blob[] = [];

/**
 * Start recording audio from the audio context
 */
export const startRecording = async (): Promise<void> => {
  if (mediaRecorder) {
    stopRecording();
  }

  audioChunks = [];
  
  try {
    // Get the audio stream from the audio context
    const audioContext = audioEngine.getAudioContext();
    const destination = audioContext.createMediaStreamDestination();
    audioEngine.getAnalyserNode().connect(destination);
    
    // Create a new media recorder
    mediaRecorder = new RecordRTC(destination.stream, {
      type: 'audio',
      mimeType: 'audio/webm',
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 2,
      desiredSampRate: 44100,
    });
    
    // Start recording
    mediaRecorder.startRecording();
    
    console.log('Recording started');
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
};

/**
 * Stop recording and return the recorded audio blob
 */
export const stopRecording = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No recording in progress'));
      return;
    }
    
    mediaRecorder.stopRecording(() => {
      const blob = mediaRecorder.getBlob();
      mediaRecorder = null;
      console.log('Recording stopped');
      resolve(blob);
    });
  });
};

/**
 * Convert audio blob to MP3 format
 */
export const convertToMp3 = async (
  audioBlob: Blob,
  options: RecordingOptions = {}
): Promise<Blob> => {
  const { sampleRate = 44100, bitRate = 128 } = options;
  
  // Convert audio blob to array buffer
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioData = new Float32Array(arrayBuffer);
  
  // Initialize MP3 encoder
  const mp3Encoder = new Lamejs.Mp3Encoder(2, sampleRate, bitRate);
  
  // Process audio data in chunks
  const chunkSize = 1152; // Must be a multiple of 576 for MP3 encoding
  const mp3Data: Int8Array[] = [];
  
  for (let i = 0; i < audioData.length; i += chunkSize) {
    const chunk = audioData.slice(i, i + chunkSize);
    const mp3Chunk = mp3Encoder.encodeBuffer(chunk);
    if (mp3Chunk.length > 0) {
      mp3Data.push(mp3Chunk);
    }
  }
  
  // Finalize encoding
  const finalChunk = mp3Encoder.flush();
  if (finalChunk.length > 0) {
    mp3Data.push(finalChunk);
  }
  
  // Combine chunks into a single MP3 blob
  const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
  return mp3Blob;
};

/**
 * Export the current pattern as an MP3 file
 */
export const exportAsMP3 = async (
  patternName: string,
  options: RecordingOptions = {}
): Promise<string> => {
  try {
    // Start recording
    await startRecording();
    
    // Wait for the pattern to play through
    const bpm = audioEngine.getBpm();
    const stepCount = 32; // Assuming 32 steps per pattern
    const durationMs = (60 / bpm) * 4 * (stepCount / 4) * 1000; // Duration in milliseconds
    
    // Wait for the pattern to finish playing
    await new Promise(resolve => setTimeout(resolve, durationMs + 500)); // Add a small buffer
    
    // Stop recording
    const audioBlob = await stopRecording();
    
    // Convert to MP3
    const mp3Blob = await convertToMp3(audioBlob, options);
    
    // Create a download URL
    const url = URL.createObjectURL(mp3Blob);
    
    // Create a safe filename
    const safePatternName = patternName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safePatternName}_${new Date().toISOString().slice(0, 10)}.mp3`;
    
    return url;
  } catch (error) {
    console.error('Error exporting as MP3:', error);
    throw error;
  }
};

// MIDI Export Functions

// MIDI note mapping for different instrument categories
const midiNoteMapping: Record<string, number> = {
  'kick': 36, // Bass Drum 1
  'snare': 38, // Acoustic Snare
  'hihat': 42, // Closed Hi-Hat
  'percussion': 47, // Mid Tom 1
  'bass': 35, // Acoustic Bass Drum
  'synth': 81, // Lead 1 (square)
  'fx': 55, // Splash Cymbal
  'vocal': 53, // Ride Bell
  '808': 35, // Acoustic Bass Drum
  'claps': 39, // Hand Clap
  'default': 60, // Middle C
};

/**
 * Convert a pattern to a MIDI file
 */
export const patternToMidi = (
  pattern: Pattern,
  samples: Record<string, Sample>,
  bpm: number
): Uint8Array => {
  // Create a new MIDI file with one track per instrument
  const file = new jsmidgen.File();
  file.addTrackName(0, 0, pattern.name || 'Beat Maker Pattern');
  file.addTempo(0, 0, bpm);
  
  // Process each track
  Object.entries(pattern.tracks).forEach(([trackId, track], trackIndex) => {
    const midiTrack = new jsmidgen.Track();
    file.addTrack(midiTrack);
    
    // Skip tracks with no sample assigned
    if (!track.sampleId) return;
    
    // Get the sample for this track
    const sample = samples[track.sampleId];
    if (!sample) return;
    
    // Determine MIDI note number based on category
    const noteNumber = midiNoteMapping[sample.category] || midiNoteMapping.default;
    
    // Add notes for each active step
    track.steps.forEach((step, stepIndex) => {
      if (step.active) {
        // Convert step index to MIDI ticks (assuming 16th notes)
        const ticks = stepIndex * 128; // 128 ticks per 16th note
        
        // Calculate note velocity based on step velocity and track volume
        const velocity = Math.round(step.velocity * track.volume * 127);
        
        // Add note (note number, duration in ticks, position in ticks, velocity)
        midiTrack.addNote(0, noteNumber, 64, ticks, velocity);
      }
    });
  });
  
  // Generate the MIDI file data
  return file.toBytes();
};

/**
 * Export the current pattern as a MIDI file
 */
export const exportAsMIDI = (
  pattern: Pattern,
  samples: Record<string, Sample>,
  bpm: number,
  patternName: string
): string => {
  try {
    // Convert pattern to MIDI
    const midiData = patternToMidi(pattern, samples, bpm);
    
    // Create a Blob from the MIDI data
    const midiBlob = new Blob([midiData], { type: 'audio/midi' });
    
    // Create a download URL
    const url = URL.createObjectURL(midiBlob);
    
    // Create a safe filename
    const safePatternName = patternName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safePatternName}_${new Date().toISOString().slice(0, 10)}.mid`;
    
    return url;
  } catch (error) {
    console.error('Error exporting as MIDI:', error);
    throw error;
  }
};

/**
 * Download a file from a URL
 */
export const downloadFile = (url: string, filename: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up the URL object
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};
