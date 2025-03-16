import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store } from './store';

// Add a style to the document head to prevent flash of black screen
const style = document.createElement('style');
style.innerHTML = `
  body {
    background-color: #1e1e1e;
    color: #ffffff;
  }
  
  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  
  .app-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: #121212;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  }
`;
document.head.appendChild(style);

// Create a loading element that will be shown immediately
const loadingElement = document.createElement('div');
loadingElement.className = 'app-loading';
loadingElement.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <div style="margin-bottom: 30px; filter: drop-shadow(0 0 10px rgba(29, 185, 84, 0.5));">
      <div style="animation: pulse 2s ease-in-out infinite;">
        <!-- Use the correct logo from public directory -->
        <img 
          src="beat-maker-logo.png" 
          alt="Beat Maker Logo" 
          style="width: 220px; height: auto; filter: drop-shadow(0 0 15px rgba(29, 185, 84, 0.7));"
        />
      </div>
    </div>
    <div style="width: 50px; height: 50px; border: 5px solid rgba(29, 185, 84, 0.3); 
                border-radius: 50%; border-top-color: #1DB954; 
                animation: spin 1s linear infinite;"></div>
  </div>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 0.6; transform: scale(0.98); }
      50% { opacity: 1; transform: scale(1.02); }
      100% { opacity: 0.6; transform: scale(0.98); }
    }
    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-10px); }
    }
  </style>
`;
document.body.appendChild(loadingElement);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the app
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App onAppReady={() => {
        // Add fade-out animation to the loading element
        if (loadingElement) {
          loadingElement.style.transition = 'opacity 0.5s ease-out';
          loadingElement.style.opacity = '0';
          
          // Remove the loading element after the animation completes
          setTimeout(() => {
            if (loadingElement.parentNode) {
              loadingElement.parentNode.removeChild(loadingElement);
            }
          }, 500);
        }
      }} />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
