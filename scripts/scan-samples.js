const fs = require('fs');
const path = require('path');

// Function to recursively scan a directory for WAV files
function scanDirectory(dir, baseDir = '') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      const subFiles = scanDirectory(itemPath, baseDir);
      files.push(...subFiles);
    } else if (stat.isFile() && item.toLowerCase().endsWith('.wav')) {
      // Add WAV files to the list
      const relativePath = path.relative(baseDir, itemPath);
      // Convert Windows backslashes to forward slashes for web paths
      const webPath = '/' + relativePath.replace(/\\/g, '/');
      files.push(webPath);
    }
  }
  
  return files;
}

// Scan the samples directory
const samplesDir = path.join(__dirname, '../public/samples');
const sampleFiles = scanDirectory(samplesDir, path.join(__dirname, '../public'));

// Sort the files for better organization
sampleFiles.sort();

// Generate the output
const output = `import { Sample } from '../store/audioSlice';
import { formatSampleName } from '../utils/sampleUtils';

// Sample colors for different categories
export const categoryColors: Record<string, string> = {
  'kick': '#4CAF50',
  'snare': '#F44336',
  'hihat': '#2196F3',
  'highhat': '#2196F3', // Alternative spelling
  'percussion': '#FF9800',
  'bass': '#9C27B0',
  'synth': '#00BCD4',
  'fx': '#607D8B',
  'vocal': '#E91E63',
  '808': '#FFC107',
  'claps': '#FF5722',
  'default': '#777777',
};

// List of sample files from the public/samples directory
export const sampleFiles = [
  ${sampleFiles.map(file => `  '${file}'`).join(',\n')}
];

// Mock API endpoint for scanning samples directory
export const scanSamplesDirectory = async (): Promise<string[]> => {
  return Promise.resolve(sampleFiles);
};

// Generate sample data from the sample files
export const generateSampleData = (): Record<string, Sample> => {
  const samples: Record<string, Sample> = {};
  
  sampleFiles.forEach((filePath, index) => {
    const id = \`sample-\${index}\`;
    const pathParts = filePath.split('/');
    let category = pathParts[2].toLowerCase();
    const filename = pathParts[pathParts.length - 1];
    const name = formatSampleName(filename);
    
    // Special case for bass samples in the synth directory
    if (category === 'synth' && filename.toLowerCase().includes('bass')) {
      category = 'bass';
    }
    
    // Special case for hihat samples
    if (category === 'highhat') {
      category = 'hihat';
    }
    
    // Determine subcategory if available
    let subcategory = '';
    if (pathParts.length > 4) {
      subcategory = pathParts[3];
    }
    
    // Generate a simple waveform based on the filename
    // This ensures consistent waveforms for the same sample
    const seed = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const waveform = Array(50).fill(0).map((_, i) => {
      // Use a simple algorithm to generate a waveform-like pattern
      const x = i / 50;
      const value = Math.sin(x * 10 + seed) * 0.3 + 0.5;
      return Math.max(0.1, Math.min(0.9, value));
    });
    
    samples[id] = {
      id,
      name,
      url: filePath,
      category,
      color: categoryColors[category] || categoryColors.default,
      waveform,
      metadata: {
        subcategory: subcategory || undefined,
      },
    };
  });
  
  return samples;
};

// Sample data for the application
export const sampleData: Record<string, Sample> = generateSampleData();

// Mock API endpoint for getting samples
export const getSamples = async (): Promise<Record<string, Sample>> => {
  return Promise.resolve(sampleData);
};
`;

// Write the output to the sampleData.ts file
fs.writeFileSync(path.join(__dirname, '../src/data/sampleData.ts'), output);

console.log(`Found ${sampleFiles.length} sample files.`);
console.log('Updated sampleData.ts successfully!');
