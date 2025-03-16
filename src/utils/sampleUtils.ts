import { Sample } from '../store/audioSlice';

export interface SampleSubcategory {
  name: string;
  samples: Sample[];
}

export interface SampleCategory {
  name: string;
  subcategories: Record<string, SampleSubcategory>;
}

export interface SampleHierarchy {
  categories: Record<string, SampleCategory>;
}

/**
 * Formats a filename to be more readable by removing hyphens, underscores, and file extensions
 */
export const formatSampleName = (filename: string): string => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace hyphens and underscores with spaces
  return nameWithoutExt.replace(/[-_]/g, ' ');
};

/**
 * Organizes samples into a hierarchical structure by category and subcategory
 */
export const organizeSamples = (samples: Record<string, Sample>): SampleHierarchy => {
  const hierarchy: SampleHierarchy = { categories: {} };

  Object.values(samples).forEach(sample => {
    const category = sample.category.toLowerCase();
    const url = sample.url;
    
    // Extract subcategory from URL
    // URL format: /samples/category/subcategory/filename.wav
    // or: /samples/category/filename.wav
    const urlParts = url.split('/');
    let subcategory = 'all';
    
    if (urlParts.length > 4) {
      subcategory = urlParts[3].toLowerCase();
    }
    
    // Initialize category if it doesn't exist
    if (!hierarchy.categories[category]) {
      hierarchy.categories[category] = {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        subcategories: {}
      };
    }
    
    // Initialize subcategory if it doesn't exist
    if (!hierarchy.categories[category].subcategories[subcategory]) {
      hierarchy.categories[category].subcategories[subcategory] = {
        name: subcategory.charAt(0).toUpperCase() + subcategory.slice(1),
        samples: []
      };
    }
    
    // Add sample to subcategory
    hierarchy.categories[category].subcategories[subcategory].samples.push(sample);
  });

  return hierarchy;
};

/**
 * Scans the public/samples directory and returns a list of sample files
 */
export const scanSamplesDirectory = async (): Promise<string[]> => {
  try {
    // Use the mock API endpoint from sampleData.ts
    const { scanSamplesDirectory } = await import('../data/sampleData');
    return scanSamplesDirectory();
  } catch (error) {
    console.error('Error scanning samples directory:', error);
    return [];
  }
};

/**
 * Creates a sample object from a file path
 */
export const createSampleFromPath = (
  filePath: string, 
  id: string, 
  categoryColors: Record<string, string>
): Sample => {
  // Extract category from path
  const pathParts = filePath.split('/');
  const category = pathParts[2].toLowerCase();
  
  // Extract filename
  const filename = pathParts[pathParts.length - 1];
  const name = formatSampleName(filename);
  
  return {
    id,
    name,
    url: filePath,
    category,
    color: categoryColors[category] || '#555555',
    waveform: Array(50).fill(0).map(() => Math.random() * 0.8 + 0.2),
  };
};

/**
 * Loads samples from the public/samples directory
 */
export const loadSamplesFromDirectory = async (
  categoryColors: Record<string, string>
): Promise<Record<string, Sample>> => {
  const sampleFiles = await scanSamplesDirectory();
  const samples: Record<string, Sample> = {};
  
  sampleFiles.forEach((filePath, index) => {
    const id = `sample-${index}`;
    samples[id] = createSampleFromPath(filePath, id, categoryColors);
  });
  
  return samples;
};

/**
 * Filters samples based on category, subcategory, search term, and favorites
 */
export const filterSamples = (
  samples: Record<string, Sample>,
  category: string | null,
  subcategory: string | null,
  searchTerm: string,
  favorites: string[] = []
): Sample[] => {
  return Object.values(samples).filter(sample => {
    // Filter by favorites if "favorites" category is selected
    if (category === 'favorites' && !favorites.includes(sample.id)) {
      return false;
    }
    
    // Filter by category (skip if "favorites" is selected since we already filtered above)
    if (category && category !== 'favorites' && sample.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    
    // Filter by subcategory
    if (subcategory && subcategory !== 'all') {
      const urlParts = sample.url.split('/');
      if (urlParts.length > 4) {
        const sampleSubcategory = urlParts[3].toLowerCase();
        if (sampleSubcategory !== subcategory.toLowerCase()) {
          return false;
        }
      } else {
        // If the sample doesn't have a subcategory and we're filtering by a specific subcategory
        // (not 'all'), exclude it
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm && !sample.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};
