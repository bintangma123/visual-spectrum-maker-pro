/**
 * Audio Engine PRO - Core audio analysis system
 * FFT Analyzer, Beat Detection, BPM Detection, Frequency Isolation
 */

export interface AudioAnalysisData {
    frequencyData: Uint8Array;
    timeDomainData: Uint8Array;
    bassLevel: number;
    midLevel: number;
    trebleLevel: number;
    overallLevel: number;
    isBeat: boolean;
    isKick: boolean;
    isSnare: boolean;
    bpm: number;
    peakHold: number[];
    smoothedData: Float32Array;
}

export interface AudioEngineConfig {
    fftSize: number;
    smoothing: number;
    sensitivity: number;
    gain: number;
    beatThreshold: number;
    peakDecay: number;
}

export class AudioEngine {
    private context: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private gainNode: GainNode | null = null;
    private source: AudioBufferSourceNode | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private audioElement: HTMLAudioElement | null = null;
    private frequencyData: Uint8Array = new Uint8Array(0);
    private timeDomainData: Uint8Array = new Uint8Array(0);
    private peakHold: number[] = [];
    private smoothedData: Float32Array = new Float32Array(0);
    private lastBeatTime: number = 0;
    private beatHistory: number[] = [];
    private bpm: number = 0;
    private isPlaying: boolean = false;
    private startTime: number = 0;
    private pauseTime: number = 0;
    private duration: number = 0;

    public config: AudioEngineConfig = {
        fftSize: 2048,
        smoothing: 0.8,
        sensitivity: 1.5,
        gain: 1.0,
        beatThreshold: 0.6,
        peakDecay: 0.98
    };

    constructor() {}

    async initialize(): Promise<void> {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = this.config.fftSize;
        this.analyser.smoothingTimeConstant = this.config.smoothing;

        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = this.config.gain;
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        const bufferLength = this.analyser.frequencyBinCount;
        this.frequencyData = new Uint8Array(bufferLength);
        this.timeDomainData = new Uint8Array(bufferLength);
        this.peakHold = new Array(bufferLength).fill(0);
        this.smoothedData = new Float32Array(bufferLength);
    }

    async loadFile(file: File): Promise<void> {
        if (!this.context) await this.initialize();
        
        const arrayBuffer = await file.arrayBuffer();
        this.audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.duration = this.audioBuffer.duration;
        
        // Also create audio element for seeking
        const url = URL.createObjectURL(file);
        if (this.audioElement) {
            this.audioElement.pause();
            URL.revokeObjectURL(this.audioElement.src);
        }
        this.audioElement = new Audio(url);
        this.audioElement.crossOrigin = 'anonymous';
    }


    play(): void {
        if (!this.context || !this.audioBuffer) return;
        if (this.context.state === 'suspended') this.context.resume();

        this.stop();
        this.source = this.context.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.gainNode!);
        
        const offset = this.pauseTime;
        this.source.start(0, offset);
        this.startTime = this.context.currentTime - offset;
        this.isPlaying = true;

        this.source.onended = () => {
            if (this.isPlaying) {
                this.isPlaying = false;
                this.pauseTime = 0;
            }
        };
    }

    pause(): void {
        if (!this.isPlaying || !this.context) return;
        this.pauseTime = this.context.currentTime - this.startTime;
        this.source?.stop();
        this.isPlaying = false;
    }

    stop(): void {
        if (this.source) {
            try { this.source.stop(); } catch(e) {}
            this.source.disconnect();
            this.source = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
    }

    seek(time: number): void {
        const wasPlaying = this.isPlaying;
        this.stop();
        this.pauseTime = time;
        if (wasPlaying) this.play();
    }

    getCurrentTime(): number {
        if (!this.context) return 0;
        if (this.isPlaying) {
            return this.context.currentTime - this.startTime;
        }
        return this.pauseTime;
    }

    getDuration(): number {
        return this.duration;
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    getAudioBuffer(): AudioBuffer | null {
        return this.audioBuffer;
    }


    analyze(): AudioAnalysisData {
        if (!this.analyser) {
            return this.getEmptyAnalysis();
        }

        this.analyser.getByteFrequencyData(this.frequencyData as any);
        this.analyser.getByteTimeDomainData(this.timeDomainData as any);

        // Apply sensitivity
        const sensitivity = this.config.sensitivity;
        
        // Calculate frequency bands
        const bufferLength = this.frequencyData.length;
        const bassEnd = Math.floor(bufferLength * 0.1);
        const midEnd = Math.floor(bufferLength * 0.5);

        let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0;

        for (let i = 0; i < bufferLength; i++) {
            const value = this.frequencyData[i] / 255 * sensitivity;
            totalSum += value;

            // Smoothing
            this.smoothedData[i] = this.smoothedData[i] * 0.7 + value * 0.3;

            // Peak hold
            if (value > this.peakHold[i]) {
                this.peakHold[i] = value;
            } else {
                this.peakHold[i] *= this.config.peakDecay;
            }

            if (i < bassEnd) bassSum += value;
            else if (i < midEnd) midSum += value;
            else trebleSum += value;
        }

        const bassLevel = bassSum / bassEnd;
        const midLevel = midSum / (midEnd - bassEnd);
        const trebleLevel = trebleSum / (bufferLength - midEnd);
        const overallLevel = totalSum / bufferLength;

        // Beat detection
        const isBeat = this.detectBeat(bassLevel);
        const isKick = bassLevel > this.config.beatThreshold * 1.2;
        const isSnare = midLevel > this.config.beatThreshold && trebleLevel > this.config.beatThreshold * 0.8;

        return {
            frequencyData: this.frequencyData,
            timeDomainData: this.timeDomainData,
            bassLevel: Math.min(bassLevel, 1),
            midLevel: Math.min(midLevel, 1),
            trebleLevel: Math.min(trebleLevel, 1),
            overallLevel: Math.min(overallLevel, 1),
            isBeat,
            isKick,
            isSnare,
            bpm: this.bpm,
            peakHold: this.peakHold,
            smoothedData: this.smoothedData
        };
    }

    private detectBeat(currentLevel: number): boolean {
        const now = performance.now();
        if (currentLevel > this.config.beatThreshold && (now - this.lastBeatTime) > 200) {
            // Calculate BPM
            if (this.lastBeatTime > 0) {
                const interval = now - this.lastBeatTime;
                this.beatHistory.push(interval);
                if (this.beatHistory.length > 20) this.beatHistory.shift();
                
                const avgInterval = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
                this.bpm = Math.round(60000 / avgInterval);
            }
            this.lastBeatTime = now;
            return true;
        }
        return false;
    }

    private getEmptyAnalysis(): AudioAnalysisData {
        return {
            frequencyData: new Uint8Array(1024),
            timeDomainData: new Uint8Array(1024),
            bassLevel: 0, midLevel: 0, trebleLevel: 0, overallLevel: 0,
            isBeat: false, isKick: false, isSnare: false,
            bpm: 0, peakHold: [], smoothedData: new Float32Array(1024)
        };
    }

    setGain(value: number): void {
        this.config.gain = value;
        if (this.gainNode) this.gainNode.gain.value = value;
    }

    setSensitivity(value: number): void {
        this.config.sensitivity = value;
    }

    setSmoothing(value: number): void {
        this.config.smoothing = value;
        if (this.analyser) this.analyser.smoothingTimeConstant = value;
    }

    setBeatThreshold(value: number): void {
        this.config.beatThreshold = value;
    }

    destroy(): void {
        this.stop();
        if (this.context) {
            this.context.close();
            this.context = null;
        }
    }
}
