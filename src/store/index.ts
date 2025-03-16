import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './audioSlice';
import sequencerReducer from './sequencerSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    audio: audioReducer,
    sequencer: sequencerReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Needed for audio buffers which aren't serializable
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
