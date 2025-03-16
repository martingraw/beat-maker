import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Step {
  active: boolean;
  velocity: number;
}

export interface Track {
  id: string;
  sampleId: string | null;
  category: string;
  steps: Step[];
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Record<string, Track>;
}

export interface SequencerState {
  patterns: Record<string, Pattern>;
  currentPatternId: string | null;
  bpm: number;
  swing: number;
  isPlaying: boolean;
  currentStep: number;
  stepCount: number;
  patternHistory: string[]; // For undo/redo
  historyIndex: number;
  trackCount: number;
}

const createEmptyTrack = (id: string, stepCount: number = 16, category: string = 'track'): Track => ({
  id,
  sampleId: null,
  category,
  steps: Array(stepCount).fill(0).map(() => ({ active: false, velocity: 1.0 })),
  volume: 0.8,
  pan: 0,
  mute: false,
  solo: false,
});

const createEmptyPattern = (id: string, name: string, trackCount: number = 8, stepCount: number = 32, withDemo: boolean = false): Pattern => {
  const tracks: Record<string, Track> = {};
  for (let i = 0; i < trackCount; i++) {
    const trackId = `track-${i}`;
    tracks[trackId] = createEmptyTrack(trackId, stepCount);
    
    // Assign default samples and categories to tracks
    if (i === 0) { tracks[trackId].sampleId = 'sample-0'; tracks[trackId].category = 'kick'; }
    if (i === 1) { tracks[trackId].sampleId = 'sample-10'; tracks[trackId].category = 'snare'; }
    if (i === 2) { tracks[trackId].sampleId = 'sample-20'; tracks[trackId].category = 'hihat'; }
    if (i === 3) { tracks[trackId].sampleId = 'sample-30'; tracks[trackId].category = 'percussion'; }
    if (i === 4) { tracks[trackId].sampleId = 'sample-40'; tracks[trackId].category = 'bass'; }
    if (i === 5) { tracks[trackId].sampleId = 'sample-50'; tracks[trackId].category = 'synth'; }
    if (i === 6) { tracks[trackId].sampleId = 'sample-60'; tracks[trackId].category = 'fx'; }
    if (i === 7) { tracks[trackId].sampleId = 'sample-70'; tracks[trackId].category = 'vocal'; }
    
    // Add demo beat pattern if requested
    if (withDemo) {
      if (i === 0) { // Kick on beats 0, 4, 8, 12, 16, 20, 24, 28
        [0, 4, 8, 12, 16, 20, 24, 28].forEach(j => {
          tracks[trackId].steps[j].active = true;
        });
      }
      if (i === 1) { // Snare on beats 4, 12, 20, 28
        [4, 12, 20, 28].forEach(j => {
          tracks[trackId].steps[j].active = true;
        });
      }
      if (i === 2) { // Hihat on every other beat
        for (let j = 0; j < stepCount; j += 2) {
          tracks[trackId].steps[j].active = true;
        }
      }
      if (i === 3) { // Percussion on beats 6, 14, 22, 30
        [6, 14, 22, 30].forEach(j => {
          tracks[trackId].steps[j].active = true;
        });
      }
      if (i === 4) { // Bass on beats 0, 8, 16, 24
        [0, 8, 16, 24].forEach(j => {
          tracks[trackId].steps[j].active = true;
        });
      }
    }
  }
  return { id, name, tracks };
};

const initialState: SequencerState = {
  patterns: {
    'pattern-1': createEmptyPattern('pattern-1', 'Pattern 1', 8, 32, false), // Start with a clean pattern
  },
  currentPatternId: 'pattern-1',
  bpm: 146, // Match the competitor's BPM from the screenshot
  swing: 0,
  isPlaying: false,
  currentStep: 0,
  stepCount: 32,
  patternHistory: ['pattern-1'],
  historyIndex: 0,
  trackCount: 8,
};

export const sequencerSlice = createSlice({
  name: 'sequencer',
  initialState,
  reducers: {
    setPattern: (state, action: PayloadAction<Pattern>) => {
      state.patterns[action.payload.id] = action.payload;
    },
    setCurrentPattern: (state, action: PayloadAction<string>) => {
      state.currentPatternId = action.payload;
    },
    setBpm: (state, action: PayloadAction<number>) => {
      state.bpm = action.payload;
    },
    setSwing: (state, action: PayloadAction<number>) => {
      state.swing = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    toggleStep: (state, action: PayloadAction<{ trackId: string; stepIndex: number }>) => {
      const { trackId, stepIndex } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        const step = state.patterns[state.currentPatternId].tracks[trackId].steps[stepIndex];
        step.active = !step.active;
      }
    },
    setStepVelocity: (state, action: PayloadAction<{ trackId: string; stepIndex: number; velocity: number }>) => {
      const { trackId, stepIndex, velocity } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].steps[stepIndex].velocity = velocity;
      }
    },
    setTrackSample: (state, action: PayloadAction<{ trackId: string; sampleId: string | null }>) => {
      const { trackId, sampleId } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].sampleId = sampleId;
      }
    },
    setTrackVolume: (state, action: PayloadAction<{ trackId: string; volume: number }>) => {
      const { trackId, volume } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].volume = volume;
      }
    },
    setTrackPan: (state, action: PayloadAction<{ trackId: string; pan: number }>) => {
      const { trackId, pan } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].pan = pan;
      }
    },
    toggleTrackMute: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].mute = 
          !state.patterns[state.currentPatternId].tracks[trackId].mute;
      }
    },
    toggleTrackSolo: (state, action: PayloadAction<string>) => {
      const trackId = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].solo = 
          !state.patterns[state.currentPatternId].tracks[trackId].solo;
      }
    },
    clearPattern: (state) => {
      if (state.currentPatternId) {
        const pattern = state.patterns[state.currentPatternId];
        Object.keys(pattern.tracks).forEach(trackId => {
          pattern.tracks[trackId].steps.forEach(step => {
            step.active = false;
          });
        });
      }
    },
    createNewPattern: (state, action: PayloadAction<string>) => {
      const newId = `pattern-${Object.keys(state.patterns).length + 1}`;
      state.patterns[newId] = createEmptyPattern(newId, action.payload);
      state.currentPatternId = newId;
    },
    addTrack: (state) => {
      if (state.currentPatternId) {
        const pattern = state.patterns[state.currentPatternId];
        const trackCount = Object.keys(pattern.tracks).length;
        const newTrackId = `track-${trackCount}`;
        pattern.tracks[newTrackId] = createEmptyTrack(newTrackId, state.stepCount, 'track');
        state.trackCount = trackCount + 1;
      }
    },
    addTrackPage: (state) => {
      if (state.currentPatternId) {
        const pattern = state.patterns[state.currentPatternId];
        const trackCount = Object.keys(pattern.tracks).length;
        
        // Add 8 new tracks
        for (let i = 0; i < 8; i++) {
          const newTrackId = `track-${trackCount + i}`;
          pattern.tracks[newTrackId] = createEmptyTrack(newTrackId, state.stepCount, 'track');
        }
        
        state.trackCount = trackCount + 8;
      }
    },
    setTrackCategory: (state, action: PayloadAction<{ trackId: string; category: string }>) => {
      const { trackId, category } = action.payload;
      if (state.currentPatternId && state.patterns[state.currentPatternId]?.tracks[trackId]) {
        state.patterns[state.currentPatternId].tracks[trackId].category = category;
      }
    },
  },
});

export const {
  setPattern,
  setCurrentPattern,
  setBpm,
  setSwing,
  setIsPlaying,
  setCurrentStep,
  toggleStep,
  setStepVelocity,
  setTrackSample,
  setTrackVolume,
  setTrackPan,
  toggleTrackMute,
  toggleTrackSolo,
  clearPattern,
  createNewPattern,
  addTrack,
  addTrackPage,
  setTrackCategory,
} = sequencerSlice.actions;

export default sequencerSlice.reducer;
