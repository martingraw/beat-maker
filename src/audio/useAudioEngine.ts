import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAudioSelector, useSequencerSelector } from '../store/hooks';
import { Sample, setSample, setLoading, setError } from '../store/audioSlice';
import { setCurrentStep, setIsPlaying } from '../store/sequencerSlice';
import audioEngine from './audioEngine';

export const useAudioEngine = () => {
  const dispatch = useAppDispatch();
  const masterVolume = useAudioSelector(state => state.masterVolume);
  const bpm = useSequencerSelector(state => state.bpm);
  const swing = useSequencerSelector(state => state.swing);
  const isPlaying = useSequencerSelector(state => state.isPlaying);
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioEngine.initialize();
        audioEngine.setMasterVolume(masterVolume);
        audioEngine.setBpm(bpm);
        audioEngine.setSwing(swing);
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
        dispatch(setError('Failed to initialize audio engine'));
      }
    };

    initAudio();
  }, [dispatch, masterVolume, bpm, swing]);

  // Update audio engine when settings change
  useEffect(() => {
    audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.setSwing(swing);
  }, [swing]);

  // Handle sequencer playback
  useEffect(() => {
    if (isPlaying && currentPatternId) {
      const currentPattern = patterns[currentPatternId];
      if (currentPattern) {
        audioEngine.startSequencer(currentPattern.tracks);
        
        // Update current step from audio engine
        const intervalId = setInterval(() => {
          dispatch(setCurrentStep(audioEngine.getCurrentStep()));
        }, 16); // ~60fps
        
        return () => clearInterval(intervalId);
      }
    } else {
      audioEngine.stopSequencer();
    }
  }, [isPlaying, currentPatternId, patterns, dispatch]);

  // Load a sample
  const loadSample = useCallback(async (sample: Sample, showLoading = false) => {
    // Only show loading screen if explicitly requested
    if (showLoading) {
      dispatch(setLoading(true));
    }
    
    try {
      const buffer = await audioEngine.loadSample(sample);
      const waveform = audioEngine.generateWaveformData(buffer);
      
      // Update sample with buffer and waveform data
      dispatch(setSample({
        ...sample,
        buffer,
        waveform,
      }));
      
      // Only hide loading screen if we showed it
      if (showLoading) {
        dispatch(setLoading(false));
      }
      
      return buffer;
    } catch (error) {
      console.error('Failed to load sample:', error);
      dispatch(setError(`Failed to load sample: ${sample.name}`));
      
      // Only hide loading screen if we showed it
      if (showLoading) {
        dispatch(setLoading(false));
      }
      
      throw error;
    }
  }, [dispatch]);

  // Play a sample
  const playSample = useCallback((sampleId: string, options?: { volume?: number; pan?: number }) => {
    audioEngine.playSample(sampleId, options);
  }, []);

  // Start/stop sequencer
  const togglePlayback = useCallback(() => {
    dispatch(setIsPlaying(!isPlaying));
  }, [dispatch, isPlaying]);

  return {
    loadSample,
    playSample,
    togglePlayback,
    isInitialized: true, // We could add a state for this if needed
  };
};
