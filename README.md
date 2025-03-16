# Beat Maker

An online beat maker application built with React, Redux, and Web Audio API.

![Beat Maker Screenshot](screenshot.png)

## Features

- 32-pad grid (4x8) with drag-and-drop functionality
- Visual waveform display on each pad
- Color-coded sample categories (kicks, snares, etc.)
- Sample metadata display (BPM/key/creator)
- Categorized sound library with search/filter
- 32-step sequencer with pattern chaining
- BPM control (60-200 BPM)
- Per-pad volume/pan controls
- Sample preview with click
- Favorites system with local storage

## Technologies Used

- React.js with TypeScript
- Redux Toolkit for state management
- Web Audio API for audio processing
- Styled Components for styling
- Tone.js for advanced audio capabilities
- WaveSurfer.js for waveform visualization

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/beat-maker.git
   cd beat-maker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Creating a Beat

1. **Select a track**: Click on any track in the grid.
2. **Choose a sample**: Browse the sample library at the bottom and click on a sample to assign it to the selected track.
3. **Create a pattern**: Click on the step buttons in the grid to activate/deactivate steps for each track.
4. **Adjust BPM**: Use the BPM slider in the top control bar to set the tempo.
5. **Play/Stop**: Click the Play button to hear your beat, and Stop to pause playback.

### Sample Library

- **Search**: Use the search box to find specific samples by name.
- **Filter by category**: Click on category buttons to filter samples by type (Kick, Snare, etc.).
- **Favorites**: Click the star icon on any sample to add it to your favorites for quick access.

### Keyboard Shortcuts

- **Space**: Play/Stop
- **C**: Clear current pattern
- **1-8**: Select track 1-8
- **+/-**: Increase/decrease BPM

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by popular beat making software like Ableton Live, FL Studio, and MPC
- Sample sounds from various free sample packs
