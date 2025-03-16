import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  selectedSampleId: string | null;
  selectedTrackId: string | null;
  selectedPatternId: string | null;
  sampleLibraryOpen: boolean;
  mixerOpen: boolean;
  effectsOpen: boolean;
  currentView: 'sequencer' | 'grid' | 'mixer';
  sampleFilter: {
    category: string | null;
    subcategory: string | null;
    search: string;
  };
  sampleLibrarySidebar: {
    visible: boolean;
    expandedCategories: string[];
  };
  zoomLevel: number;
  tutorialStep: number;
  tutorialActive: boolean;
  currentTrackPage: number;
  tracksPerPage: number;
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }[];
}

const initialState: UiState = {
  selectedSampleId: null,
  selectedTrackId: null,
  selectedPatternId: null,
  sampleLibraryOpen: true,
  mixerOpen: false,
  effectsOpen: false,
  currentView: 'sequencer',
  sampleFilter: {
    category: null,
    subcategory: null,
    search: '',
  },
  sampleLibrarySidebar: {
    visible: true,
    expandedCategories: ['808'], // Only expand the first category by default
  },
  zoomLevel: 1,
  tutorialStep: 0,
  tutorialActive: false,
  currentTrackPage: 0, // Page A = 0, Page B = 1, etc.
  tracksPerPage: 8,    // 8 tracks per page
  notifications: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedSample: (state, action: PayloadAction<string | null>) => {
      state.selectedSampleId = action.payload;
    },
    setSelectedTrack: (state, action: PayloadAction<string | null>) => {
      state.selectedTrackId = action.payload;
    },
    setSelectedPattern: (state, action: PayloadAction<string | null>) => {
      state.selectedPatternId = action.payload;
    },
    toggleSampleLibrary: (state) => {
      state.sampleLibraryOpen = !state.sampleLibraryOpen;
    },
    toggleMixer: (state) => {
      state.mixerOpen = !state.mixerOpen;
    },
    toggleEffects: (state) => {
      state.effectsOpen = !state.effectsOpen;
    },
    setCurrentView: (state, action: PayloadAction<'sequencer' | 'grid' | 'mixer'>) => {
      state.currentView = action.payload;
    },
    setSampleFilterCategory: (state, action: PayloadAction<string | null>) => {
      state.sampleFilter.category = action.payload;
      // Reset subcategory when changing category
      if (action.payload === null) {
        state.sampleFilter.subcategory = null;
      }
    },
    setSampleFilterSubcategory: (state, action: PayloadAction<string | null>) => {
      state.sampleFilter.subcategory = action.payload;
    },
    setSampleFilterSearch: (state, action: PayloadAction<string>) => {
      state.sampleFilter.search = action.payload;
    },
    toggleSampleLibrarySidebar: (state) => {
      state.sampleLibrarySidebar.visible = !state.sampleLibrarySidebar.visible;
    },
    toggleCategoryExpanded: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      const index = state.sampleLibrarySidebar.expandedCategories.indexOf(category);
      if (index === -1) {
        state.sampleLibrarySidebar.expandedCategories.push(category);
      } else {
        state.sampleLibrarySidebar.expandedCategories.splice(index, 1);
      }
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    setTutorialStep: (state, action: PayloadAction<number>) => {
      state.tutorialStep = action.payload;
    },
    setTutorialActive: (state, action: PayloadAction<boolean>) => {
      state.tutorialActive = action.payload;
    },
    setCurrentTrackPage: (state, action: PayloadAction<number>) => {
      state.currentTrackPage = action.payload;
    },
    addNotification: (state, action: PayloadAction<{ message: string; type: 'info' | 'success' | 'warning' | 'error' }>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        message: action.payload.message,
        type: action.payload.type,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setSelectedSample,
  setSelectedTrack,
  setSelectedPattern,
  toggleSampleLibrary,
  toggleMixer,
  toggleEffects,
  setCurrentView,
  setSampleFilterCategory,
  setSampleFilterSubcategory,
  setSampleFilterSearch,
  toggleSampleLibrarySidebar,
  toggleCategoryExpanded,
  setZoomLevel,
  setTutorialStep,
  setTutorialActive,
  setCurrentTrackPage,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
