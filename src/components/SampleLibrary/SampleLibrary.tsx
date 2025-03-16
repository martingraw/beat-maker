import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch, useAudioSelector, useSequencerSelector, useUiSelector } from '../../store/hooks';
import { Sample, addToFavorites, removeFromFavorites } from '../../store/audioSlice';
import { setTrackSample } from '../../store/sequencerSlice';
import { useAudioEngine } from '../../audio/useAudioEngine';
import { toggleSampleLibrarySidebar, setSampleFilterCategory, setSampleFilterSubcategory } from '../../store/uiSlice';
import { filterSamples, organizeSamples } from '../../utils/sampleUtils';
import SampleLibrarySidebar from './SampleLibrarySidebar';
import audioEngine from '../../audio/audioEngine';

const LibraryContainer = styled.div`
  background-color: #121212;
  border-top: 1px solid #333;
  display: flex;
  height: 100%;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const LibraryHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  border-bottom: 1px solid #333;
  gap: 15px;
`;

const HeaderTopRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const HeaderBottomRow = styled.div`
  display: flex;
  width: 100%;
`;

const SelectedTrackIndicator = styled.div`
  background-color: #2a2a2a;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 15px 20px 10px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid #1DB954;
`;

const SelectedTrackContent = styled.div`
  display: flex;
  align-items: center;
`;

const SelectedTrackText = styled.div`
  font-size: 14px;
  color: #fff;
  margin-right: 12px;
`;

const SelectedTrackInfo = styled.div`
  font-size: 12px;
  color: #999;
`;

const CreditLink = styled.a`
  font-size: 12px;
  color: #1DB954;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  margin: 0;
  margin-right: 20px;
`;

const SearchInput = styled.input`
  background-color: #333;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 12px;
  margin-right: 20px;
  width: 250px;
  font-size: 14px;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.5);
  }
  
  @media (max-width: 900px) {
    width: 100%;
    margin-right: 0;
  }
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const CategoryButtonContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  background-color: ${props => props.$active ? '#1DB954' : '#333'};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 80px;

  &:hover {
    background-color: ${props => props.$active ? '#1ED760' : '#444'};
  }
`;

const DropdownIcon = styled.span`
  margin-left: 8px;
  font-size: 10px;
  display: flex;
  align-items: center;
`;

const DropdownMenu = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background-color: #222;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
  display: ${props => props.$visible ? 'block' : 'none'};
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.div<{ $active: boolean }>`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  background-color: ${props => props.$active ? '#1a1a1a' : 'transparent'};
  color: ${props => props.$active ? '#1DB954' : 'white'};
  
  &:hover {
    background-color: #2a2a2a;
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

const SamplesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 20px;
  flex: 1;
  align-content: flex-start; /* Prevents stretching to fill container */
  overflow-y: auto; /* Allows scrolling when there are many samples */
`;

const SubcategorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SubcategoryHeader = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  padding: 5px 0;
  border-bottom: 1px solid #333;
`;

const SamplesRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
`;

const SubcategoryFilterContainer = styled.div`
  margin-left: 10px;
`;

const SubcategorySelect = styled.select`
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.5);
  }

  &:hover {
    background-color: #444;
  }
`;

const SampleCard = styled.div<{ $color: string; $isRecommended?: boolean; $isLoading?: boolean }>`
  background-color: ${props => props.$isRecommended ? '#2a2a2a' : '#333'};
  border-radius: 4px;
  padding: 10px;
  cursor: ${props => props.$isLoading ? 'wait' : 'pointer'};
  position: relative;
  border-left: 4px solid ${props => props.$color};
  transition: background-color 0.2s;
  opacity: ${props => props.$isLoading ? 0.7 : 1};
  height: 120px; /* Fixed height for consistency */
  display: flex;
  flex-direction: column;

  &:hover {
    background-color: #444;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  border-radius: 4px;
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid #333;
  border-top: 3px solid #1DB954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SampleName = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SampleInfo = styled.div`
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
`;

const SampleWaveform = styled.div`
  height: 40px;
  background-color: #222;
  margin: 10px 0;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`;

const WaveformCanvas = styled.div<{ $data: number[] }>`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WaveformBar = styled.div<{ $height: number }>`
  background-color: #1DB954;
  width: 2px;
  height: ${props => props.$height * 100}%;
`;

const FavoriteButton = styled.button<{ $active: boolean }>`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  border: none;
  color: ${props => props.$active ? '#1DB954' : '#999'};
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  
  &:hover {
    color: ${props => props.$active ? '#1ED760' : '#ccc'};
  }
`;

// Sample colors for different categories
const categoryColors: Record<string, string> = {
  'kick': '#4CAF50',
  'snare': '#F44336',
  'hihat': '#2196F3',
  'percussion': '#FF9800',
  'bass': '#9C27B0',
  'synth': '#00BCD4',
  'fx': '#607D8B',
  'vocal': '#E91E63',
  '808': '#FFC107',
  'track': '#777777',
};

const categories = [
  'All',
  'Favorites',
  'Kick',
  'Snare',
  'Hihat',
  'Percussion',
  'Bass',
  'Synth',
  'FX',
  'Vocal',
  '808',
];

// Interface to track loading state of samples
interface SampleLoadingState {
  [sampleId: string]: boolean;
}

const SampleLibrary: React.FC = () => {
  const dispatch = useAppDispatch();
  const samples = useAudioSelector(state => state.samples);
  const favorites = useAudioSelector(state => state.favorites);
  const currentPatternId = useSequencerSelector(state => state.currentPatternId);
  const patterns = useSequencerSelector(state => state.patterns);
  const selectedTrackId = useUiSelector(state => state.selectedTrackId);
  const { playSample } = useAudioEngine();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStates, setLoadingStates] = useState<SampleLoadingState>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { category: selectedCategory, subcategory: selectedSubcategory } = useUiSelector(state => state.sampleFilter);
  
  // Reference to detect clicks outside of dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update loading states based on audioEngine's sample status
  useEffect(() => {
    const updateLoadingStates = () => {
      const newLoadingStates: SampleLoadingState = {};
      
      Object.values(samples).forEach(sample => {
        const status = audioEngine.getSampleStatus(sample.id);
        if (status) {
          newLoadingStates[sample.id] = status.isLoading;
        }
      });
      
      setLoadingStates(newLoadingStates);
    };
    
    // Initial update
    updateLoadingStates();
    
    // Set up interval to check loading states
    const intervalId = setInterval(updateLoadingStates, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [samples]);

  const handleSampleClick = (sample: Sample) => {
    // Set loading state
    setLoadingStates(prev => ({
      ...prev,
      [sample.id]: true
    }));
    
    // Play the sample
    playSample(sample.id);
    
    // If a track is selected, assign the sample to it
    if (selectedTrackId && currentPatternId) {
      dispatch(setTrackSample({ trackId: selectedTrackId, sampleId: sample.id }));
    }
    
    // Update loading state after a delay (in case the sample loads quickly)
    setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
        [sample.id]: false
      }));
    }, 1000);
  };

  const toggleFavorite = (e: React.MouseEvent, sampleId: string) => {
    e.stopPropagation();
    if (favorites.includes(sampleId)) {
      dispatch(removeFromFavorites(sampleId));
    } else {
      dispatch(addToFavorites(sampleId));
    }
  };

  // Use the filterSamples utility function
  const filteredSamples = filterSamples(
    samples,
    selectedCategory === 'All' ? null : selectedCategory,
    selectedSubcategory === 'all' ? null : selectedSubcategory,
    searchTerm,
    favorites
  );

  // Get the selected track's information
  const selectedTrack = selectedTrackId && currentPatternId 
    ? patterns[currentPatternId]?.tracks[selectedTrackId] 
    : null;

  const handleToggleSidebar = () => {
    dispatch(toggleSampleLibrarySidebar());
  };

  return (
    <LibraryContainer>
      <SampleLibrarySidebar onToggle={handleToggleSidebar} />
      
      <MainContent>
        <LibraryHeader>
          <HeaderTopRow>
            <Title>Sample Library</Title>
            <SearchInput
              type="text"
              placeholder="Search samples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </HeaderTopRow>
          <HeaderBottomRow>
            <CategoryFilter ref={dropdownRef}>
              {categories.map(category => {
                const isActive = (category === 'All' && selectedCategory === null) || 
                  (selectedCategory === category.toLowerCase());
                
                // Skip dropdown for "All" category
                if (category === 'All') {
                  return (
                    <CategoryButtonContainer key={category}>
                      <CategoryButton
                        $active={isActive}
                        onClick={() => {
                          dispatch(setSampleFilterCategory(null));
                          dispatch(setSampleFilterSubcategory(null));
                          setOpenDropdown(null);
                        }}
                      >
                        All
                      </CategoryButton>
                    </CategoryButtonContainer>
                  );
                }
                
                // Get subcategories for this category
                const categoryData = Object.entries(organizeSamples(samples).categories)
                  .find(([cat]) => cat.toLowerCase() === category.toLowerCase())?.[1];
                
                const subcategories = categoryData?.subcategories ? 
                  Object.entries(categoryData.subcategories)
                    .filter(([subcat]) => subcat !== 'all')
                    .map(([subcat, subcatData]) => ({
                      id: subcat,
                      name: subcatData.name,
                      count: subcatData.samples.length
                    })) : [];
                
                const isOpen = openDropdown === category;
                
                return (
                  <CategoryButtonContainer key={category}>
                    <CategoryButton
                      $active={isActive}
                      onClick={() => {
                        dispatch(setSampleFilterCategory(category.toLowerCase()));
                        dispatch(setSampleFilterSubcategory(null));
                        setOpenDropdown(null);
                      }}
                    >
                      <span>{category}</span>
                      {subcategories.length > 0 && (
                        <DropdownIcon 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(isOpen ? null : category);
                          }}
                        >
                          <FontAwesomeIcon icon={faChevronDown} />
                        </DropdownIcon>
                      )}
                    </CategoryButton>
                    
                    {subcategories.length > 0 && (
                      <DropdownMenu $visible={isOpen}>
                        <DropdownItem
                          $active={isActive && !selectedSubcategory}
                          onClick={() => {
                            dispatch(setSampleFilterCategory(category.toLowerCase()));
                            dispatch(setSampleFilterSubcategory(null));
                            setOpenDropdown(null);
                          }}
                        >
                          All {category}
                        </DropdownItem>
                        
                        {subcategories.map(subcategory => (
                          <DropdownItem
                            key={subcategory.id}
                            $active={isActive && selectedSubcategory === subcategory.id.toLowerCase()}
                            onClick={() => {
                              dispatch(setSampleFilterCategory(category.toLowerCase()));
                              dispatch(setSampleFilterSubcategory(subcategory.id.toLowerCase()));
                              setOpenDropdown(null);
                            }}
                          >
                            {subcategory.name} ({subcategory.count})
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    )}
                  </CategoryButtonContainer>
                );
              })}
            </CategoryFilter>
          </HeaderBottomRow>
        </LibraryHeader>
        
        {selectedTrack && (
          <SelectedTrackIndicator>
            <SelectedTrackContent>
              <SelectedTrackText>
                Selected Track: {selectedTrackId && (parseInt(selectedTrackId.replace('track-', '')) + 1)}
              </SelectedTrackText>
              <SelectedTrackInfo>
                {selectedTrack.category} 
                {selectedTrack.sampleId && samples[selectedTrack.sampleId] ? 
                  ` • ${samples[selectedTrack.sampleId].name}` : 
                  ` • Click any sample below to assign it to this track`}
              </SelectedTrackInfo>
            </SelectedTrackContent>
            <CreditLink 
              href="https://www.echosoundworks.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Samples by Echo Sound Works
            </CreditLink>
          </SelectedTrackIndicator>
        )}
        
        <SamplesGrid>
          {filteredSamples.length > 0 ? (
            (() => {
              // Group samples by subcategory
              const samplesBySubcategory: Record<string, Sample[]> = {};
              
              filteredSamples.forEach(sample => {
                const urlParts = sample.url.split('/');
                let subcategory = 'Other';
                
                if (urlParts.length > 4) {
                  subcategory = urlParts[3];
                }
                
                if (!samplesBySubcategory[subcategory]) {
                  samplesBySubcategory[subcategory] = [];
                }
                
                samplesBySubcategory[subcategory].push(sample);
              });
              
              // Sort subcategories alphabetically
              const sortedSubcategories = Object.keys(samplesBySubcategory).sort();
              
              return sortedSubcategories.map(subcategory => (
                <SubcategorySection key={subcategory}>
                  <SubcategoryHeader>
                    {subcategory}
                  </SubcategoryHeader>
                  <SamplesRow>
                    {samplesBySubcategory[subcategory].map(sample => {
                      const isLoading = loadingStates[sample.id] || false;
                      
                      return (
                        <SampleCard
                          key={sample.id}
                          $color={categoryColors[sample.category.toLowerCase()] || '#555'}
                          $isRecommended={!!selectedTrack && sample.category.toLowerCase() === selectedTrack.category.toLowerCase()}
                          $isLoading={isLoading}
                          onClick={() => handleSampleClick(sample)}
                        >
                          {isLoading && (
                            <LoadingOverlay>
                              <LoadingSpinner />
                            </LoadingOverlay>
                          )}
                          <SampleName>{sample.name}</SampleName>
                          <SampleWaveform>
                            {sample.waveform && (
                              <WaveformCanvas $data={sample.waveform}>
                                {sample.waveform.map((value: number, index: number) => (
                                  <WaveformBar key={index} $height={value} />
                                ))}
                              </WaveformCanvas>
                            )}
                          </SampleWaveform>
                          <SampleInfo>
                            <span>{sample.category}</span>
                            {sample.metadata?.subcategory && (
                              <span>{sample.metadata.subcategory}</span>
                            )}
                            {sample.metadata?.bpm && <span>{sample.metadata.bpm} BPM</span>}
                          </SampleInfo>
                          <FavoriteButton
                            $active={favorites.includes(sample.id)}
                            onClick={(e) => toggleFavorite(e, sample.id)}
                          >
                            ★
                          </FavoriteButton>
                        </SampleCard>
                      );
                    })}
                  </SamplesRow>
                </SubcategorySection>
              ));
            })()
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              No samples found. Try adjusting your filters.
            </div>
          )}
        </SamplesGrid>
      </MainContent>
    </LibraryContainer>
  );
};

export default SampleLibrary;
