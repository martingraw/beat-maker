import React from 'react';
import styled from 'styled-components';
import { useAppDispatch, useSequencerSelector } from '../../store/hooks';
import { clearPattern, setPattern, Pattern, Track } from '../../store/sequencerSlice';
import logoImage from '../../icons/beat-maker-logo.png';
import SaveMenu from './SaveMenu';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background-color: #121212;
  border-bottom: 1px solid #333;
  height: 60px;
`;

const LogoImage = styled.img`
  height: 40px;
  margin-right: 15px;
`;

const Logo = styled.h2`
  font-family: 'Arial Black', 'Helvetica Bold', sans-serif;
  font-size: 24px;
  font-weight: 900;
  margin: 0;
  margin-right: 30px;
  color: #ffffff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  white-space: nowrap;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  min-width: 200px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 25px;
  margin-left: 10px;
`;

const BpmControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BpmLabel = styled.span`
  font-size: 14px;
  color: #999;
`;

const BpmValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
`;

const Button = styled.button<{ $primary?: boolean }>`
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

const RightControls = styled.div`
  margin-left: auto;
  display: flex;
  gap: 10px;
`;

interface HeaderProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
}

const Header: React.FC<HeaderProps> = ({ bpm, onBpmChange, onPlayPause, isPlaying }) => {
  const dispatch = useAppDispatch();
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);

  const handleClear = () => {
    dispatch(clearPattern());
  };

  const handleCreateDemo = () => {
    if (currentPatternId) {
      // Import sample data to find appropriate samples
      import('../../data/sampleData').then(({ sampleData }) => {
        // Find sample IDs for each category
        const findSampleIdByCategory = (category: string): string | null => {
          const samples = Object.entries(sampleData).filter(([_, sample]) => sample.category === category);
          return samples.length > 0 ? samples[0][0] : null;
        };
        
        // Find specific samples for each category
        const kickSampleId = findSampleIdByCategory('kick');
        const snareSampleId = findSampleIdByCategory('snare');
        const hihatSampleId = findSampleIdByCategory('hihat');
        
        // Create a demo pattern with the same ID as the current pattern
        const demoPattern: Pattern = {
          id: currentPatternId,
          name: patterns[currentPatternId].name,
          tracks: {} as Record<string, Track>
        };
        
        // Create tracks with demo pattern
        const stepCount = 32;
        for (let i = 0; i < 8; i++) {
          const trackId = `track-${i}`;
          
          // Create empty track
          demoPattern.tracks[trackId] = {
            id: trackId,
            sampleId: null,
            category: 'track',
            steps: Array(stepCount).fill(0).map(() => ({ active: false, velocity: 1.0 })),
            volume: 0.8,
            pan: 0,
            mute: false,
            solo: false
          };
          
          // Assign default samples and categories - using samples from the correct categories
          if (i === 0) { demoPattern.tracks[trackId].sampleId = kickSampleId; demoPattern.tracks[trackId].category = 'kick'; } // Kick sample
          if (i === 1) { demoPattern.tracks[trackId].sampleId = snareSampleId; demoPattern.tracks[trackId].category = 'snare'; } // Snare sample
          if (i === 2) { demoPattern.tracks[trackId].sampleId = hihatSampleId; demoPattern.tracks[trackId].category = 'hihat'; } // Hihat sample
        
          // Keep the rest of the tracks empty but with their categories
          if (i === 3) { demoPattern.tracks[trackId].sampleId = null; demoPattern.tracks[trackId].category = 'percussion'; }
          if (i === 4) { demoPattern.tracks[trackId].sampleId = null; demoPattern.tracks[trackId].category = 'bass'; }
          if (i === 5) { demoPattern.tracks[trackId].sampleId = null; demoPattern.tracks[trackId].category = 'synth'; }
          if (i === 6) { demoPattern.tracks[trackId].sampleId = null; demoPattern.tracks[trackId].category = 'fx'; }
          if (i === 7) { demoPattern.tracks[trackId].sampleId = null; demoPattern.tracks[trackId].category = 'vocal'; }
          
          // Add demo beat pattern - just kick, snare, and hihat
          if (i === 0) { // Kick on beats 0, 4, 8, 12, 16, 20, 24, 28
            [0, 4, 8, 12, 16, 20, 24, 28].forEach(j => {
              demoPattern.tracks[trackId].steps[j].active = true;
            });
          }
          if (i === 1) { // Snare on beats 4, 12, 20, 28
            [4, 12, 20, 28].forEach(j => {
              demoPattern.tracks[trackId].steps[j].active = true;
            });
          }
          if (i === 2) { // Hihat on every other beat
            for (let j = 0; j < stepCount; j += 2) {
              demoPattern.tracks[trackId].steps[j].active = true;
            }
          }
        }
        
        // Set the pattern
        dispatch(setPattern(demoPattern));
      });
    }
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    if (!isNaN(newBpm) && newBpm >= 60 && newBpm <= 200) {
      onBpmChange(newBpm);
    }
  };

  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoImage src={logoImage} alt="Beat Maker Logo" />
        <Logo>Beat Maker</Logo>
      </LogoContainer>
      <Controls>
        <Button $primary onClick={onPlayPause}>
          {isPlaying ? 'Stop' : 'Play'}
        </Button>
        <BpmControl>
          <BpmLabel>BPM:</BpmLabel>
          <BpmValue>{bpm}</BpmValue>
          <input
            type="range"
            min="60"
            max="200"
            value={bpm}
            onChange={handleBpmChange}
          />
        </BpmControl>
      </Controls>
      <RightControls>
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={handleCreateDemo}>Demo Beat</Button>
        <SaveMenu isPlaying={isPlaying} />
      </RightControls>
    </HeaderContainer>
  );
};

export default Header;
