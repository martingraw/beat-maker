import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { AudioState } from './audioSlice';
import { SequencerState } from './sequencerSlice';
import { UiState } from './uiSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Explicitly typed selectors for each slice
export const useAudioSelector = <T>(selector: (state: AudioState) => T) => 
  useAppSelector(state => selector(state.audio as AudioState));

export const useSequencerSelector = <T>(selector: (state: SequencerState) => T) => 
  useAppSelector(state => selector(state.sequencer as SequencerState));

export const useUiSelector = <T>(selector: (state: UiState) => T) => 
  useAppSelector(state => selector(state.ui as UiState));
