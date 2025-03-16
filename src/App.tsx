import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAudioSelector, useSequencerSelector, useUiSelector } from './store/hooks';
import { 
  setLoading, 
  setSample
} from './store/audioSlice';
import { setBpm, setIsPlaying } from './store/sequencerSlice';
import { sampleData } from './data/sampleData';
import Header from './components/Controls/Header';
import Grid from './components/Grid/Grid';
import SampleLibrary from './components/SampleLibrary/SampleLibrary';
import Footer from './components/Controls/Footer';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import audioEngine from './audio/audioEngine';
import './App.css';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #ffffff;
  font-family: 'Arial', sans-serif;
  min-width: 768px;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  position: relative;
  padding: 0 20px;
`;

interface AppProps {
  onAppReady?: () => void;
}

function App({ onAppReady }: AppProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAudioSelector(state => state.isLoading);
  const bpm = useSequencerSelector(state => state.bpm);
  const sampleLibraryOpen = useUiSelector(state => state.sampleLibraryOpen);

  // Initialize audio engine on user interaction
  const initializeAudio = useCallback(async () => {
    try {
      await audioEngine.initialize();
      console.log('Audio engine initialized by user interaction');
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }, []);

  // Handle spacebar for play/stop
  const isPlaying = useSequencerSelector(state => state.isPlaying);
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);

  const handlePlayPause = useCallback(() => {
    const newIsPlaying = !isPlaying;
    dispatch(setIsPlaying(newIsPlaying));
    
    if (newIsPlaying && currentPatternId && patterns[currentPatternId]) {
      // Get the current pattern's tracks
      const currentPattern = patterns[currentPatternId];
      
      // Set the BPM in the audio engine
      audioEngine.setBpm(bpm);
      
      // Start the sequencer
      audioEngine.startSequencer(currentPattern.tracks);
    } else {
      // Stop the sequencer
      audioEngine.stopSequencer();
    }
  }, [isPlaying, currentPatternId, patterns, dispatch, bpm]);

  useEffect(() => {
    // Initialize app - just load sample metadata, not actual audio data
    const loadSampleMetadata = () => {
      try {
        // Only load sample metadata into Redux store, not actual audio data
        // This will be much faster and won't block the UI
        Object.values(sampleData).forEach(sample => {
          dispatch(setSample(sample));
        });
      } catch (error) {
        console.error('Error loading sample metadata:', error);
      }
    };

    // Load sample metadata immediately
    loadSampleMetadata();
    
    // Set loading to false only once after a short delay to ensure a smooth transition
    const loadingTimer = setTimeout(() => {
      dispatch(setLoading(false));
      
      // Notify that the app is ready to be displayed
      if (onAppReady) {
        onAppReady();
      }
    }, 500);
    
    // Add event listeners to initialize audio on user interaction
    document.addEventListener('click', initializeAudio);
    document.addEventListener('keydown', initializeAudio);
    document.addEventListener('touchstart', initializeAudio);

    return () => {
      clearTimeout(loadingTimer);
      document.removeEventListener('click', initializeAudio);
      document.removeEventListener('keydown', initializeAudio);
      document.removeEventListener('touchstart', initializeAudio);
    };
  }, [dispatch, initializeAudio, onAppReady]);

  // Add spacebar event listener for play/stop
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key is spacebar and no input element is focused
      if (event.code === 'Space' && 
          !(event.target instanceof HTMLInputElement || 
            event.target instanceof HTMLTextAreaElement)) {
        // Prevent default spacebar behavior (scrolling)
        event.preventDefault();
        handlePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePlayPause]);

  // Load samples in the background without showing a loading screen
  useEffect(() => {
    // Initialize app - load sample metadata and initialize audio engine
    const initializeApp = async () => {
      try {
        console.log('Initializing audio engine...');
        // Don't show loading screen during background initialization
        await audioEngine.initialize();
        console.log('Audio engine initialized successfully');
        
        // Import the useAudioEngine hook's loadSample function
        const { loadSample } = await import('./audio/useAudioEngine').then(
          module => ({ loadSample: module.useAudioEngine().loadSample })
        );
        
        // Preload a few essential samples in the background
        const essentialCategories = ['kick', 'snare'];
        const essentialSamples = Object.values(sampleData)
          .filter(sample => essentialCategories.includes(sample.category))
          .slice(0, 4);
        
        // Load samples in the background without blocking the UI
        setTimeout(() => {
          essentialSamples.forEach(sample => {
            // Use false for showLoading parameter to avoid loading screen flicker
            loadSample(sample, false).catch(error => {
              console.error(`Error loading sample ${sample.id}:`, error);
            });
          });
        }, 1000);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    // Start initialization
    initializeApp();
  }, [dispatch]);

  // Handle loading screen completion
  const handleLoadingComplete = useCallback(() => {
    // This is called when the loading screen animation is complete
    console.log('Loading screen animation complete');
    // We don't need to do anything here since the loading screen
    // will be removed when isLoading becomes false
  }, []);

  return (
    <AppContainer onClick={initializeAudio}>
      {isLoading ? (
        <LoadingScreen 
          onComplete={handleLoadingComplete}
        />
      ) : (
        <>
          <Header 
            bpm={bpm} 
            onBpmChange={(newBpm: number) => dispatch(setBpm(newBpm))}
            onPlayPause={handlePlayPause}
            isPlaying={isPlaying}
          />
          <MainContent>
            <Grid />
          </MainContent>
          {sampleLibraryOpen && <SampleLibrary />}
          <Footer />
        </>
      )}
    </AppContainer>
  );
}

export default App;
