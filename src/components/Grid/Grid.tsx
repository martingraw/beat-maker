import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown, faMusic, faTimes } from '@fortawesome/free-solid-svg-icons';
// Import custom icons
import kickIcon from '../../icons/kick.webp';
import snareIcon from '../../icons/snare.webp';
import closedHatIcon from '../../icons/closed-hat.webp';
import openHatIcon from '../../icons/open-hat.webp';
import percussionIcon from '../../icons/percussion.webp';
import bassIcon from '../../icons/bass.png';
import keysIcon from '../../icons/keys.webp';
import fxIcon from '../../icons/fx.webp';
import midTomIcon from '../../icons/mid-tom.webp';
import icon808 from '../../icons/808.png';
import vocalIcon from '../../icons/vocal.png';
import trackIcon from '../../icons/track.webp';
import { useAppDispatch, useAudioSelector, useSequencerSelector, useUiSelector } from '../../store/hooks';
import { toggleStep, addTrack, addTrackPage, setTrackCategory } from '../../store/sequencerSlice';
import { setCurrentTrackPage, setSelectedTrack, toggleSampleLibrary } from '../../store/uiSlice';
import type { Step as SequencerStep } from '../../store/sequencerSlice';
import audioEngine from '../../audio/audioEngine';

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  flex: 1;
  max-width: 100%;
`;

const TrackRow = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
  background-color: ${props => props.$active ? '#2a2a2a' : 'transparent'};
  border-radius: 4px;
  cursor: pointer;
`;

const TrackNumber = styled.div`
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #888;
  width: 15px;
  text-align: center;
`;

const TrackInfo = styled.div`
  width: 110px;
  display: flex;
  align-items: center;
  padding-left: 25px;
  position: relative;
`;

const Tooltip = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 40px;
  background-color: #333;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  pointer-events: none;
`;

const TrackIcon = styled.div<{ $color: string; $active: boolean }>`
  width: 50px;
  height: 36px;
  border-radius: 4px;
  background-color: ${props => props.$active ? props.$color : '#555'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: white;
  cursor: pointer;
`;

const CustomIcon = styled.img`
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: brightness(1.5);
`;

const CategoryButton = styled.div`
  position: absolute;
  bottom: 3px;
  right: 3px;
  font-size: 10px;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }
`;

const CategoryDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #222;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 100;
  width: 120px;
  max-height: 200px;
  overflow-y: auto;
`;

const CloseButton = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  color: #aaa;
  
  &:hover {
    background-color: #444;
    color: white;
  }
`;

const CategoryOption = styled.div<{ $color: string }>`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-left: 4px solid ${props => props.$color};
  
  &:hover {
    background-color: #333;
  }
  
  .icon {
    margin-right: 8px;
  }
  
  .name {
    font-size: 12px;
    text-transform: capitalize;
  }
`;

const StepsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  gap: 2px;
  width: 100%;
`;

const StepButton = styled.div<{ $active: boolean; $color: string; $current: boolean; $trackActive: boolean }>`
  aspect-ratio: 1;
  border-radius: 4px;
  background-color: ${props => {
    if (props.$active) return props.$color;
    return props.$trackActive ? '#3a3a3a' : '#333';
  }};
  border: ${props => props.$current ? '2px solid #fff' : 'none'};
  cursor: pointer;
  transition: background-color 0.1s;

  &:hover {
    background-color: ${props => props.$active ? props.$color : '#444'};
  }
`;

const AddTrackButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 36px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  background-color: #555;
  border-radius: 4px;
  
  &:hover {
    background-color: #666;
  }
`;

const SampleLibraryButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 36px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  background-color: #1DB954;
  border-radius: 4px;
  margin-left: 10px;
  
  &:hover {
    background-color: #1ED760;
  }
`;

const PageButtonsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const NumbersContainer = styled.div`
  display: flex;
  margin-top: 0;
  background-color: #222;
  border-radius: 4px;
  padding: 6px 0;
`;

const PageButtonsNumberRow = styled.div`
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
`;

const StepNumbersRow = styled.div`
  display: grid;
  grid-template-columns: repeat(32, 1fr);
  gap: 2px;
  width: 100%;
  padding: 0 4px;
  align-items: center;
  height: 24px;
`;

const StepNumber = styled.div`
  font-size: 11px;
  color: #777;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:nth-child(4n+1) {
    color: #aaa;
    font-weight: bold;
  }
`;

const InstructionsContainer = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  background-color: rgba(29, 185, 84, 0.1);
  border-left: 3px solid #1DB954;
  border-radius: 4px;
  color: #aaa;
  font-size: 13px;
  text-align: center;
`;

const PageButton = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background-color: ${props => props.$active ? '#444' : '#333'};
  color: ${props => props.$active ? '#fff' : '#aaa'};
  font-size: 14px;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};
  border-radius: 4px;
  margin-right: 5px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$active ? '#555' : '#3a3a3a'};
  }
`;

// Sample colors and icons for different track types
const trackInfo: Record<string, { color: string; icon: string; name: string }> = {
  'kick': { color: '#4CAF50', icon: kickIcon, name: 'Kick' },
  'snare': { color: '#F44336', icon: snareIcon, name: 'Snare' },
  'hihat': { color: '#2196F3', icon: closedHatIcon, name: 'Hihat' },
  'percussion': { color: '#FF9800', icon: percussionIcon, name: 'Percussion' },
  'bass': { color: '#9C27B0', icon: bassIcon, name: 'Bass' },
  'synth': { color: '#00BCD4', icon: keysIcon, name: 'Synth' },
  'fx': { color: '#607D8B', icon: fxIcon, name: 'FX' },
  'vocal': { color: '#E91E63', icon: vocalIcon, name: 'Vocal' },
  '808': { color: '#FFC107', icon: icon808, name: '808' },
  'track': { color: '#777777', icon: trackIcon, name: 'Track' },
};

const categoryList = Object.keys(trackInfo);

const Grid: React.FC = () => {
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);
  const dispatch = useAppDispatch();
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);
  const currentStep = useSequencerSelector(state => state.currentStep);
  const samples = useAudioSelector(state => state.samples);
  const currentTrackPage = useUiSelector(state => state.currentTrackPage);
  const tracksPerPage = useUiSelector(state => state.tracksPerPage);
  const selectedTrackId = useUiSelector(state => state.selectedTrackId);
  const sampleLibraryOpen = useUiSelector(state => state.sampleLibraryOpen);
  
  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openCategoryDropdown && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenCategoryDropdown(null);
      }
    };

    if (openCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openCategoryDropdown]);

  // Select the first track by default if no track is selected
  useEffect(() => {
    if (!selectedTrackId && currentPatternId && patterns[currentPatternId]) {
      const trackIds = Object.keys(patterns[currentPatternId].tracks);
      if (trackIds.length > 0) {
        dispatch(setSelectedTrack(trackIds[0]));
      }
    }
  }, [selectedTrackId, currentPatternId, patterns, dispatch]);

  if (!currentPatternId || !patterns[currentPatternId]) {
    return <div>No pattern selected</div>;
  }

  const currentPattern = patterns[currentPatternId];
  const trackIds = Object.keys(currentPattern.tracks);

  const handleStepClick = (trackId: string, stepIndex: number) => {
    dispatch(toggleStep({ trackId, stepIndex }));
    
    // Select the track when a step is clicked
    if (selectedTrackId !== trackId) {
      dispatch(setSelectedTrack(trackId));
    }
    
    // Play the sample when the step is clicked
    const track = currentPattern.tracks[trackId];
    if (track.sampleId) {
      audioEngine.playSample(track.sampleId);
    }
  };
  
  const handleTrackSelect = (trackId: string) => {
    dispatch(setSelectedTrack(trackId));
  };
  
  const getTrackInfo = (trackId: string): { color: string; icon: any } => {
    const track = currentPattern.tracks[trackId];
    
    // First check if the track has a category
    if (track.category && trackInfo[track.category.toLowerCase()]) {
      return {
        color: trackInfo[track.category.toLowerCase()].color,
        icon: trackInfo[track.category.toLowerCase()].icon
      };
    }
    
    // Fallback to sample category if available
    if (track.sampleId && samples[track.sampleId]) {
      const sample = samples[track.sampleId];
      if (trackInfo[sample.category.toLowerCase()]) {
        return trackInfo[sample.category.toLowerCase()];
      }
    }
    
    // Default fallback
    return { color: '#555', icon: trackIcon };
  };

  const getTrackName = (trackId: string): string => {
    const track = currentPattern.tracks[trackId];
    if (!track.sampleId || !samples[track.sampleId]) {
      return 'Empty';
    }
    
    return samples[track.sampleId].name;
  };

  const handleAddTrack = () => {
    // Add a full page of 8 tracks at once
    dispatch(addTrackPage());
    
    // Switch to the new page (current page + 1)
    const newPage = currentTrackPage + 1;
    dispatch(setCurrentTrackPage(newPage));
    
    // Select the first track of the new page
    // Calculate the ID of the first track on the new page
    const firstTrackIdOnNewPage = `track-${newPage * tracksPerPage}`;
    dispatch(setSelectedTrack(firstTrackIdOnNewPage));
    
    // Close the sample library if it's open to ensure the new tracks are visible
    if (sampleLibraryOpen) {
      dispatch(toggleSampleLibrary());
    }
  };
  
  const handleToggleSampleLibrary = () => {
    dispatch(toggleSampleLibrary());
  };
  
  const handlePageChange = (pageIndex: number) => {
    dispatch(setCurrentTrackPage(pageIndex));
    
    // Select the first track of the new page if no track on that page is currently selected
    const allTrackIds = Object.keys(currentPattern.tracks);
    const pageStartIdx = pageIndex * tracksPerPage;
    const pageEndIdx = Math.min(pageStartIdx + tracksPerPage, allTrackIds.length);
    const pageTrackIds = allTrackIds.slice(pageStartIdx, pageEndIdx);
    
    // Check if the currently selected track is on the new page
    const isSelectedTrackOnNewPage = selectedTrackId && pageTrackIds.includes(selectedTrackId);
    
    // If not, select the first track of the new page
    if (!isSelectedTrackOnNewPage && pageTrackIds.length > 0) {
      dispatch(setSelectedTrack(pageTrackIds[0]));
    }
  };
  
  const handleCategoryChange = (trackId: string, category: string) => {
    dispatch(setTrackCategory({ trackId, category }));
    setOpenCategoryDropdown(null);
  };
  
  const toggleCategoryDropdown = (trackId: string) => {
    // If the dropdown for this track is already open, close it
    if (openCategoryDropdown === trackId) {
      setOpenCategoryDropdown(null);
    } else {
      // Otherwise, open the dropdown for this track
      setOpenCategoryDropdown(trackId);
    }
  };

  // Calculate how many pages we need based on track count
  const getPageCount = () => {
    if (!currentPattern) return 1;
    return Math.ceil(Object.keys(currentPattern.tracks).length / tracksPerPage);
  };
  
  // Get the tracks for the current page
  const getTracksForCurrentPage = () => {
    if (!currentPattern) return [];
    const allTrackIds = Object.keys(currentPattern.tracks);
    const startIdx = currentTrackPage * tracksPerPage;
    const endIdx = startIdx + tracksPerPage;
    return allTrackIds.slice(startIdx, endIdx);
  };

  return (
    <GridContainer>
      {getTracksForCurrentPage().map((trackId, idx) => {
        const track = currentPattern.tracks[trackId];
        const { color: trackColor, icon: trackIcon } = getTrackInfo(trackId);
        const trackName = getTrackName(trackId);
        const globalTrackIndex = currentTrackPage * tracksPerPage + idx;
        
        return (
          <TrackRow 
            key={trackId} 
            $active={selectedTrackId === trackId}
            onClick={() => handleTrackSelect(trackId)}
          >
            <TrackNumber>{globalTrackIndex + 1}</TrackNumber>
            <TrackInfo>
              <TrackIcon 
                $color={trackColor}
                $active={selectedTrackId === trackId}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTrackSelect(trackId);
                }}
              >
                <CustomIcon src={trackIcon} alt={track.category} />
                <CategoryButton
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only open the dropdown, never close it with this button
                    if (openCategoryDropdown !== trackId) {
                      setOpenCategoryDropdown(trackId);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </CategoryButton>
                
                {openCategoryDropdown === trackId && (
                  <CategoryDropdown ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                    <CloseButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCategoryDropdown(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </CloseButton>
                    {categoryList.map(category => (
                      <CategoryOption 
                        key={category}
                        $color={trackInfo[category].color}
                        onClick={() => handleCategoryChange(trackId, category)}
                      >
                        <span className="icon">
                          <CustomIcon src={trackInfo[category].icon} alt={category} />
                        </span>
                        <span className="name">{trackInfo[category].name}</span>
                      </CategoryOption>
                    ))}
                  </CategoryDropdown>
                )}
              </TrackIcon>
            </TrackInfo>
            <StepsContainer>
              {track.steps.map((step: SequencerStep, index: number) => (
                <StepButton
                  key={index}
                  $active={step.active}
                  $color={trackColor}
                  $current={index === currentStep}
                  $trackActive={selectedTrackId === trackId}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepClick(trackId, index);
                  }}
                />
              ))}
            </StepsContainer>
          </TrackRow>
        );
      })}
      {/* Add track button row */}
      <TrackRow>
        <TrackNumber>+</TrackNumber>
        <TrackInfo>
          <div style={{ display: 'flex' }}>
            <AddTrackButton onClick={handleAddTrack}>
              <FontAwesomeIcon icon={faPlus} />
            </AddTrackButton>
            <SampleLibraryButton onClick={handleToggleSampleLibrary}>
              <FontAwesomeIcon icon={sampleLibraryOpen ? faTimes : faMusic} />
            </SampleLibraryButton>
          </div>
        </TrackInfo>
        <StepsContainer>
          {/* Empty steps for the add track row */}
        </StepsContainer>
      </TrackRow>
      
      {/* Step numbers row with A/B buttons */}
      <NumbersContainer>
        <PageButtonsNumberRow>
          {getPageCount() > 1 && (
            <PageButtonsContainer>
              {Array.from({ length: getPageCount() }).map((_, pageIdx) => (
                <PageButton 
                  key={pageIdx} 
                  $active={currentTrackPage === pageIdx}
                  onClick={() => handlePageChange(pageIdx)}
                >
                  {String.fromCharCode(65 + pageIdx)} {/* A, B, C, etc. */}
                </PageButton>
              ))}
            </PageButtonsContainer>
          )}
        </PageButtonsNumberRow>
        <StepNumbersRow>
          {Array.from({ length: 32 }).map((_, idx) => (
            <StepNumber key={idx}>{idx + 1}</StepNumber>
          ))}
        </StepNumbersRow>
      </NumbersContainer>
      
      {/* Instructions for users */}
      <InstructionsContainer>
        Click a track, then click a sample below to apply it to the track
      </InstructionsContainer>
    </GridContainer>
  );
};

export default Grid;
