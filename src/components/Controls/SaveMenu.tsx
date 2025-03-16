import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAudioSelector, useSequencerSelector } from '../../store/hooks';
import { setIsPlaying } from '../../store/sequencerSlice';
import { exportAsMP3, exportAsMIDI, downloadFile } from '../../utils/exportUtils';
import audioEngine from '../../audio/audioEngine';

const SaveMenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MenuButton = styled.button<{ $primary?: boolean }>`
  background-color: ${props => props.$primary ? '#1DB954' : '#333'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$primary ? '#1ED760' : '#444'};
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #222;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  min-width: 160px;
  z-index: 100;
  display: ${props => props.isOpen ? 'block' : 'none'};
  margin-top: 5px;
`;

const MenuItem = styled.div`
  padding: 10px 15px;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333;
  }

  &:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  &:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top: 5px solid #1DB954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  margin-top: 20px;
  color: white;
  font-size: 16px;
`;

interface SaveMenuProps {
  isPlaying: boolean;
}

const SaveMenu: React.FC<SaveMenuProps> = ({ isPlaying }) => {
  const dispatch = useAppDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);
  const bpm = useSequencerSelector(state => state.bpm);
  const samples = useAudioSelector(state => state.samples);
  
  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const handleExportMP3 = async () => {
    if (!currentPatternId || !patterns[currentPatternId]) return;
    
    setIsOpen(false);
    setIsExporting(true);
    setExportStatus('Recording pattern...');
    
    try {
      // Start playback if not already playing
      const wasPlaying = isPlaying;
      if (!wasPlaying) {
        dispatch(setIsPlaying(true));
        
        // Get the current pattern's tracks
        const currentPattern = patterns[currentPatternId];
        
        // Set the BPM in the audio engine
        audioEngine.setBpm(bpm);
        
        // Start the sequencer
        audioEngine.startSequencer(currentPattern.tracks);
        
        // Wait a moment for playback to start
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Export as MP3
      const patternName = patterns[currentPatternId].name || 'Pattern';
      setExportStatus('Converting to MP3...');
      const url = await exportAsMP3(patternName);
      
      // Stop playback if it wasn't playing before
      if (!wasPlaying) {
        dispatch(setIsPlaying(false));
        audioEngine.stopSequencer();
      }
      
      // Download the file
      const filename = `${patternName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.mp3`;
      downloadFile(url, filename);
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting MP3:', error);
      setExportStatus('Error exporting MP3');
      setTimeout(() => {
        setIsExporting(false);
      }, 2000);
    }
  };
  
  const handleExportMIDI = () => {
    if (!currentPatternId || !patterns[currentPatternId]) return;
    
    setIsOpen(false);
    setIsExporting(true);
    setExportStatus('Creating MIDI file...');
    
    try {
      // Export as MIDI
      const pattern = patterns[currentPatternId];
      const patternName = pattern.name || 'Pattern';
      const url = exportAsMIDI(pattern, samples, bpm, patternName);
      
      // Download the file
      const filename = `${patternName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.mid`;
      downloadFile(url, filename);
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting MIDI:', error);
      setExportStatus('Error exporting MIDI');
      setTimeout(() => {
        setIsExporting(false);
      }, 2000);
    }
  };
  
  return (
    <SaveMenuContainer ref={menuRef}>
      <MenuButton onClick={toggleMenu}>Save</MenuButton>
      <DropdownMenu isOpen={isOpen}>
        <MenuItem onClick={handleExportMP3}>Export as MP3</MenuItem>
        <MenuItem onClick={handleExportMIDI}>Export as MIDI</MenuItem>
      </DropdownMenu>
      
      {isExporting && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>{exportStatus}</LoadingText>
        </LoadingOverlay>
      )}
    </SaveMenuContainer>
  );
};

export default SaveMenu;
