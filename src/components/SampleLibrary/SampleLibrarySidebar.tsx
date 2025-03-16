import React from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAudioSelector, useUiSelector } from '../../store/hooks';
import { toggleCategoryExpanded, setSampleFilterCategory, setSampleFilterSubcategory } from '../../store/uiSlice';
import { SampleHierarchy } from '../../utils/sampleUtils';
import { organizeSamples } from '../../utils/sampleUtils';
import { categoryColors } from '../../data/sampleData';

const SidebarContainer = styled.div<{ $visible: boolean }>`
  width: ${props => props.$visible ? '250px' : '0'};
  overflow: hidden;
  transition: width 0.3s ease;
  background-color: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
`;

const SidebarContent = styled.div`
  width: 250px;
  overflow-y: auto;
  flex: 1;
`;

const SidebarHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #fff;
`;

const CategoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CategoryItem = styled.li`
  border-bottom: 1px solid #222;
`;

const CategoryHeader = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  background-color: #222;
  transition: background-color 0.2s;
  border-left: 4px solid ${props => props.$color};
  
  &:hover {
    background-color: #2a2a2a;
  }
`;

const CategoryName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
`;

const CategoryIcon = styled.span`
  margin-right: 10px;
  font-size: 12px;
`;

const SubcategoryList = styled.ul<{ $expanded: boolean }>`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: ${props => props.$expanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const SubcategoryItem = styled.li<{ $active: boolean; $color: string }>`
  padding: 8px 15px 8px 35px;
  cursor: pointer;
  font-size: 13px;
  background-color: ${props => props.$active ? '#2a2a2a' : 'transparent'};
  border-left: ${props => props.$active ? `4px solid ${props.$color}` : '4px solid transparent'};
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2a2a2a;
  }
`;

const ToggleButton = styled.button`
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #444;
  }
`;

interface SampleLibrarySidebarProps {
  onToggle: () => void;
}

const SampleLibrarySidebar: React.FC<SampleLibrarySidebarProps> = ({ onToggle }) => {
  const dispatch = useAppDispatch();
  const samples = useAudioSelector(state => state.samples);
  const { visible, expandedCategories } = useUiSelector(state => state.sampleLibrarySidebar);
  const { category: selectedCategory, subcategory: selectedSubcategory } = useUiSelector(state => state.sampleFilter);
  
  // Organize samples by category and subcategory
  const sampleHierarchy: SampleHierarchy = organizeSamples(samples);
  
  const handleCategoryClick = (category: string) => {
    dispatch(toggleCategoryExpanded(category));
    
    // If the category is not already selected, select it
    if (selectedCategory !== category.toLowerCase()) {
      dispatch(setSampleFilterCategory(category.toLowerCase()));
      dispatch(setSampleFilterSubcategory(null));
    }
  };
  
  const handleSubcategoryClick = (category: string, subcategory: string) => {
    dispatch(setSampleFilterCategory(category.toLowerCase()));
    dispatch(setSampleFilterSubcategory(subcategory === 'all' ? null : subcategory.toLowerCase()));
  };
  
  return (
    <SidebarContainer $visible={visible}>
      <SidebarHeader>
        <SidebarTitle>Categories</SidebarTitle>
        <ToggleButton onClick={onToggle}>
          {visible ? '◀' : '▶'}
        </ToggleButton>
      </SidebarHeader>
      <SidebarContent>
        <CategoryList>
          {Object.entries(sampleHierarchy.categories).map(([categoryKey, category]) => {
            const isExpanded = expandedCategories.includes(categoryKey);
            const color = categoryColors[categoryKey.toLowerCase()] || '#777777';
            
            return (
              <CategoryItem key={categoryKey}>
                <CategoryHeader 
                  onClick={() => handleCategoryClick(categoryKey)}
                  $color={color}
                >
                  <CategoryIcon>{isExpanded ? '▼' : '▶'}</CategoryIcon>
                  <CategoryName>{category.name}</CategoryName>
                </CategoryHeader>
                <SubcategoryList $expanded={isExpanded}>
                  {Object.entries(category.subcategories).map(([subcategoryKey, subcategory]) => (
                    <SubcategoryItem 
                      key={subcategoryKey}
                      onClick={() => handleSubcategoryClick(categoryKey, subcategoryKey)}
                      $active={selectedCategory === categoryKey.toLowerCase() && selectedSubcategory === subcategoryKey.toLowerCase()}
                      $color={color}
                    >
                      {subcategoryKey === 'all' ? 'All' : subcategory.name} ({subcategory.samples.length})
                    </SubcategoryItem>
                  ))}
                </SubcategoryList>
              </CategoryItem>
            );
          })}
        </CategoryList>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default SampleLibrarySidebar;
