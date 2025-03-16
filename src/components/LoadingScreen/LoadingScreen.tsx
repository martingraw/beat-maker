import React from 'react';
import styled from 'styled-components';
import beatMakerLogo from '../../icons/beat-maker-logo.png';

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #121212;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Logo = styled.img`
  width: 180px;
  height: auto;
  margin-bottom: 20px;
`;

const LoadingText = styled.div`
  font-size: 18px;
  color: #999;
  text-align: center;
  margin-top: 20px;
`;

interface LoadingScreenProps {
  onComplete?: () => void;
  onClick?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, onClick }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <LoadingContainer onClick={onClick}>
      <Logo src={beatMakerLogo} alt="Beat Maker Logo" />
      <LoadingText>
        Loading...
      </LoadingText>
    </LoadingContainer>
  );
};

export default LoadingScreen;
