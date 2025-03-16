import { Sample } from '../store/audioSlice';
import { Step, Track } from '../store/sequencerSlice';

// Interface for tracking sample loading status
interface SampleLoadingStatus {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  lastUsed: number; // timestamp for cache management
}

class AudioEngine {
  private context: AudioContext;
  private masterGainNode: GainNode;
  private analyserNode: AnalyserNode;
  private samples: Map<string, AudioBuffer>;
  private sampleStatus: Map<string, SampleLoadingStatus>;
  private isInitialized: boolean;
  private schedulerIntervalId: number | null;
  private nextNoteTime: number;
  private currentStep: number;
  private stepDuration: number;
  private swing: number;
  private bpm: number;
  private lookAhead: number; // ms
  private scheduleAheadTime: number; // seconds
  private maxCacheSize: number; // maximum number of samples to keep in memory
  private loadingCallbacks: Map<string, ((buffer: AudioBuffer | null, error?: Error) => void)[]>;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGainNode = this.context.createGain();
    this.analyserNode = this.context.createAnalyser();
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.context.destination);
    
    this.samples = new Map();
    this.sampleStatus = new Map();
    this.loadingCallbacks = new Map();
    this.isInitialized = false;
    this.schedulerIntervalId = null;
    this.nextNoteTime = 0;
    this.currentStep = 0;
    this.bpm = 120;
    this.swing = 0;
    this.stepDuration = 60.0 / this.bpm / 4; // 16th notes
    this.lookAhead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // seconds
    this.maxCacheSize = 200; // maximum number of samples to keep in memory
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Resume audio context if it's suspended (needed for browsers that require user interaction)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Play a silent sound to unlock audio on iOS/Safari
      const silentBuffer = this.context.createBuffer(1, 1, 22050);
      const source = this.context.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(this.context.destination);
      source.start(0);
      
      this.isInitialized = true;
      console.log('Audio engine initialized successfully, state:', this.context.state);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  public async loadSample(sample: Sample, forceReload = false): Promise<AudioBuffer> {
    // Return cached sample if available and not forcing reload
    if (!forceReload && this.samples.has(sample.id)) {
      // Update last used timestamp for cache management
      const status = this.sampleStatus.get(sample.id);
      if (status) {
        status.lastUsed = Date.now();
        this.sampleStatus.set(sample.id, status);
      }
      return this.samples.get(sample.id)!;
    }

    // Check if sample is already loading
    const status = this.sampleStatus.get(sample.id);
    if (status && status.isLoading) {
      // Return a promise that will resolve when the sample is loaded
      return new Promise((resolve, reject) => {
        const callbacks = this.loadingCallbacks.get(sample.id) || [];
        callbacks.push((buffer, error) => {
          if (error) reject(error);
          else if (buffer) resolve(buffer);
          else reject(new Error('Failed to load sample'));
        });
        this.loadingCallbacks.set(sample.id, callbacks);
      });
    }

    // Set loading status
    this.sampleStatus.set(sample.id, {
      isLoading: true,
      isLoaded: false,
      error: null,
      lastUsed: Date.now()
    });

    try {
      // Manage cache size before loading new sample
      this.manageCacheSize();

      // Load the sample
      const response = await fetch(sample.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      // Cache the sample
      this.samples.set(sample.id, audioBuffer);
      
      // Update status
      this.sampleStatus.set(sample.id, {
        isLoading: false,
        isLoaded: true,
        error: null,
        lastUsed: Date.now()
      });

      // Notify any waiting callbacks
      const callbacks = this.loadingCallbacks.get(sample.id) || [];
      callbacks.forEach(callback => callback(audioBuffer));
      this.loadingCallbacks.delete(sample.id);

      return audioBuffer;
    } catch (error) {
      console.error('Error loading sample:', error);
      
      // Update status with error
      this.sampleStatus.set(sample.id, {
        isLoading: false,
        isLoaded: false,
        error: error as Error,
        lastUsed: Date.now()
      });

      // Notify any waiting callbacks of the error
      const callbacks = this.loadingCallbacks.get(sample.id) || [];
      callbacks.forEach(callback => callback(null, error as Error));
      this.loadingCallbacks.delete(sample.id);

      throw error;
    }
  }

  // Get the loading status of a sample
  public getSampleStatus(sampleId: string): SampleLoadingStatus | null {
    return this.sampleStatus.get(sampleId) || null;
  }

  // Manage the sample cache size
  private manageCacheSize(): void {
    if (this.samples.size <= this.maxCacheSize) return;

    // Get all sample IDs sorted by last used time (oldest first)
    const sampleEntries = Array.from(this.sampleStatus.entries())
      .filter(([id, status]) => status.isLoaded && !status.isLoading)
      .sort(([, statusA], [, statusB]) => statusA.lastUsed - statusB.lastUsed);

    // Remove oldest samples until we're under the limit
    const samplesToRemove = sampleEntries.slice(0, sampleEntries.length - this.maxCacheSize);
    for (const [id] of samplesToRemove) {
      this.samples.delete(id);
      // Keep the status but mark as not loaded
      const status = this.sampleStatus.get(id);
      if (status) {
        status.isLoaded = false;
        this.sampleStatus.set(id, status);
      }
    }

    console.log(`Removed ${samplesToRemove.length} samples from cache`);
  }

  public playSample(sampleId: string, options: { volume?: number; pan?: number } = {}): void {
    // Try to initialize if not already initialized
    if (!this.isInitialized) {
      this.initialize().catch(err => {
        console.warn('Failed to initialize audio engine:', err);
        return;
      });
    }
    
    // Force resume the audio context if it's suspended
    if (this.context.state === 'suspended') {
      this.context.resume().catch(err => {
        console.warn('Failed to resume audio context:', err);
        return;
      });
    }

    // Get the sample from the Redux store
    import('../store').then(async ({ store }) => {
      const state = store.getState();
      const sample = state.audio.samples[sampleId];
      
      if (!sample) {
        console.warn(`Sample not found: ${sampleId}`);
        return;
      }
      
      try {
        // Update the loading status to indicate we're trying to play this sample
        const currentStatus = this.sampleStatus.get(sampleId);
        if (!currentStatus) {
          this.sampleStatus.set(sampleId, {
            isLoading: false,
            isLoaded: false,
            error: null,
            lastUsed: Date.now()
          });
        }

        // Check if we already have the sample loaded
        let buffer: AudioBuffer;
        if (this.samples.has(sampleId)) {
          buffer = this.samples.get(sampleId)!;
          
          // Update last used timestamp
          const status = this.sampleStatus.get(sampleId);
          if (status) {
            status.lastUsed = Date.now();
            this.sampleStatus.set(sampleId, status);
          }
        } else {
          // Set loading status
          this.sampleStatus.set(sampleId, {
            isLoading: true,
            isLoaded: false,
            error: null,
            lastUsed: Date.now()
          });

          // Manage cache before loading new sample
          this.manageCacheSize();
          
          // Load the sample
          try {
            const response = await fetch(sample.url);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await this.context.decodeAudioData(arrayBuffer);
            
            // Cache the sample
            this.samples.set(sampleId, buffer);
            
            // Update status
            this.sampleStatus.set(sampleId, {
              isLoading: false,
              isLoaded: true,
              error: null,
              lastUsed: Date.now()
            });
          } catch (error) {
            console.error(`Error loading sample: ${sampleId}`, error);
            
            // Update status with error
            this.sampleStatus.set(sampleId, {
              isLoading: false,
              isLoaded: false,
              error: error as Error,
              lastUsed: Date.now()
            });
            
            throw error;
          }
        }
        
        // Create source node
        const sourceNode = this.context.createBufferSource();
        sourceNode.buffer = buffer;
        
        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = options.volume !== undefined ? options.volume : 1.0;
        
        // Apply pan if specified
        if (options.pan !== undefined) {
          const pannerNode = this.context.createStereoPanner();
          pannerNode.pan.value = options.pan;
          sourceNode.connect(pannerNode);
          pannerNode.connect(gainNode);
        } else {
          sourceNode.connect(gainNode);
        }
        
        // Connect to master output
        gainNode.connect(this.masterGainNode);
        
        // Start playback
        sourceNode.start();
        
        console.log(`Playing sample: ${sample.name} (${sample.category})`);
      } catch (error) {
        console.error('Error playing sample:', error);
      }
    }).catch(error => {
      console.error('Error accessing store:', error);
    });
  }

  public setMasterVolume(volume: number): void {
    this.masterGainNode.gain.value = volume;
  }

  public setBpm(bpm: number): void {
    this.bpm = bpm;
    this.stepDuration = 60.0 / this.bpm / 4; // 16th notes
  }
  
  public getBpm(): number {
    return this.bpm;
  }

  public setSwing(swing: number): void {
    this.swing = swing;
  }

  private scheduleNote(trackId: string, step: Step, time: number, track: Track): void {
    if (!step.active || !track.sampleId) return;
    
    // Skip if track is muted and not soloed
    if (track.mute) return;

    const sampleId = track.sampleId;
    
    // Get the sample from the Redux store
    import('../store').then(async ({ store }) => {
      const state = store.getState();
      const sample = state.audio.samples[sampleId];
      
      if (!sample) {
        console.warn(`Sample not found for scheduling: ${sampleId}`);
        return;
      }
      
      try {
        // Update the loading status to indicate we're trying to play this sample
        const currentStatus = this.sampleStatus.get(sampleId);
        if (!currentStatus) {
          this.sampleStatus.set(sampleId, {
            isLoading: false,
            isLoaded: false,
            error: null,
            lastUsed: Date.now()
          });
        }

        // Check if we already have the sample loaded
        let buffer: AudioBuffer;
        if (this.samples.has(sampleId)) {
          buffer = this.samples.get(sampleId)!;
          
          // Update last used timestamp
          const status = this.sampleStatus.get(sampleId);
          if (status) {
            status.lastUsed = Date.now();
            this.sampleStatus.set(sampleId, status);
          }
        } else {
          // Set loading status
          this.sampleStatus.set(sampleId, {
            isLoading: true,
            isLoaded: false,
            error: null,
            lastUsed: Date.now()
          });

          // Manage cache before loading new sample
          this.manageCacheSize();
          
          // Load the sample
          try {
            const response = await fetch(sample.url);
            const arrayBuffer = await response.arrayBuffer();
            buffer = await this.context.decodeAudioData(arrayBuffer);
            
            // Cache the sample
            this.samples.set(sampleId, buffer);
            
            // Update status
            this.sampleStatus.set(sampleId, {
              isLoading: false,
              isLoaded: true,
              error: null,
              lastUsed: Date.now()
            });
          } catch (error) {
            console.error(`Error loading sample for scheduling: ${sampleId}`, error);
            
            // Update status with error
            this.sampleStatus.set(sampleId, {
              isLoading: false,
              isLoaded: false,
              error: error as Error,
              lastUsed: Date.now()
            });
            
            return;
          }
        }
        
        // Create source node
        const sourceNode = this.context.createBufferSource();
        sourceNode.buffer = buffer;
        
        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = track.volume * step.velocity;
        
        // Apply pan
        const pannerNode = this.context.createStereoPanner();
        pannerNode.pan.value = track.pan;
        sourceNode.connect(pannerNode);
        pannerNode.connect(gainNode);
        
        // Connect to master output
        gainNode.connect(this.masterGainNode);
        
        // Start playback at the scheduled time
        sourceNode.start(time);
        
        console.log(`Scheduling note: ${sampleId} at time ${time}`);
      } catch (error) {
        console.error('Error scheduling note:', error);
      }
    }).catch(error => {
      console.error('Error accessing store for scheduling:', error);
    });
  }

  private nextStep(): void {
    // Calculate time for the next step
    const swingAmount = this.currentStep % 2 === 1 ? this.swing / 100 : 0;
    this.nextNoteTime += this.stepDuration * (1 + swingAmount);
    
    // Increment step counter
    this.currentStep = (this.currentStep + 1) % 32; // Using 32 steps per pattern
  }

  private scheduler(tracks: Record<string, Track>): void {
    // Schedule notes that will play before the next interval
    while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
      // For each track, schedule the current step if it's active
      Object.entries(tracks).forEach(([trackId, track]) => {
        if (track.steps && track.steps[this.currentStep] && track.steps[this.currentStep].active) {
          this.scheduleNote(trackId, track.steps[this.currentStep], this.nextNoteTime, track);
        }
      });
      
      // Move to the next step
      this.nextStep();
    }
  }

  public startSequencer(tracks: Record<string, Track>): void {
    if (this.schedulerIntervalId !== null) {
      // If already running, stop first to ensure we start from step 0
      this.stopSequencer();
    }

    // Try to initialize if not already initialized
    if (!this.isInitialized) {
      this.initialize().catch(err => {
        console.warn('Failed to initialize audio engine:', err);
        return;
      });
    }
    
    // Force resume the audio context if it's suspended
    if (this.context.state === 'suspended') {
      this.context.resume().catch(err => {
        console.warn('Failed to resume audio context:', err);
        return;
      });
    }

    // Explicitly reset the current step to 0
    this.currentStep = 0;
    this.nextNoteTime = this.context.currentTime;

    // Start the scheduler
    this.schedulerIntervalId = window.setInterval(() => {
      this.scheduler(tracks);
    }, this.lookAhead);
    
    console.log('Sequencer started at step 0');
  }

  public stopSequencer(): void {
    if (this.schedulerIntervalId === null) return;

    window.clearInterval(this.schedulerIntervalId);
    this.schedulerIntervalId = null;
    this.currentStep = 0;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getAnalyserNode(): AnalyserNode {
    return this.analyserNode;
  }

  public getAudioContext(): AudioContext {
    return this.context;
  }

  public generateWaveformData(buffer: AudioBuffer, numPoints: number = 100): number[] {
    const channelData = buffer.getChannelData(0); // Use the first channel
    const blockSize = Math.floor(channelData.length / numPoints);
    const waveform = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j]);
      }
      waveform.push(sum / blockSize);
    }

    return waveform;
  }
}

// Create a singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;
