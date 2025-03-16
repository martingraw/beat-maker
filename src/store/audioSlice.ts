import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { sampleData } from '../data/sampleData';

export interface Sample {
  id: string;
  name: string;
  url: string;
  category: string;
  buffer?: AudioBuffer;
  waveform?: number[];
  color?: string;
  metadata?: {
    bpm?: number;
    key?: string;
    creator?: string;
    subcategory?: string;
  };
}

export interface AudioState {
  samples: Record<string, Sample>;
  masterVolume: number;
  isLoading: boolean;
  loadingProgress: number;
  loadingStatus: string;
  error: string | null;
  favorites: string[];
}

const initialState: AudioState = {
  samples: sampleData,
  masterVolume: 0.8,
  isLoading: false, // Skip loading screen completely
  loadingProgress: 0,
  loadingStatus: 'Initializing...',
  error: null,
  favorites: ['kick-1', 'snare-1'],
};

export const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    setSample: (state, action: PayloadAction<Sample>) => {
      state.samples[action.payload.id] = action.payload;
    },
    removeSample: (state, action: PayloadAction<string>) => {
      delete state.samples[action.payload];
    },
    setMasterVolume: (state, action: PayloadAction<number>) => {
      state.masterVolume = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLoadingProgress: (state, action: PayloadAction<number>) => {
      state.loadingProgress = action.payload;
    },
    setLoadingStatus: (state, action: PayloadAction<string>) => {
      state.loadingStatus = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addToFavorites: (state, action: PayloadAction<string>) => {
      if (!state.favorites.includes(action.payload)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(id => id !== action.payload);
    },
  },
});

export const {
  setSample,
  removeSample,
  setMasterVolume,
  setLoading,
  setLoadingProgress,
  setLoadingStatus,
  setError,
  addToFavorites,
  removeFromFavorites,
} = audioSlice.actions;

export default audioSlice.reducer;
