import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  background-color: #121212;
  border-top: 1px solid #333;
  height: 30px;
  font-size: 12px;
  color: #888;
`;

const Link = styled.a`
  color: #1DB954;
  text-decoration: none;
  margin-left: 4px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      Copyright © {currentYear} <Link href="https://www.jscalco.com" target="_blank" rel="noopener noreferrer">J.Scalco</Link>
    </FooterContainer>
  );
};

export default Footer;
