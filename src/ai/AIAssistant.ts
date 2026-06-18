/**
 * AI Assistant - Analyzes audio characteristics and suggests visuals
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export interface AIRecommendation {
    template: string;
    visualizer: string;
    colors: string[];
    particles: string;
    background: string;
    mood: string;
    energy: string;
    genre: string;
    youtubeTitle: string;
    hashtags: string[];
    description: string;
}

export class AIAssistant {
    private analysisHistory: { bass: number; mid: number; treble: number; bpm: number }[] = [];
    private analysisComplete: boolean = false;

    analyze(data: AudioAnalysisData): void {
        this.analysisHistory.push({
            bass: data.bassLevel,
            mid: data.midLevel,
            treble: data.trebleLevel,
            bpm: data.bpm
        });

        if (this.analysisHistory.length > 300) { // ~5 seconds of data
            this.analysisComplete = true;
        }
    }

    getRecommendation(): AIRecommendation {
        if (this.analysisHistory.length === 0) {
            return this.getDefaultRecommendation();
        }

        const avgBass = this.average(this.analysisHistory.map(h => h.bass));
        const avgMid = this.average(this.analysisHistory.map(h => h.mid));
        const avgTreble = this.average(this.analysisHistory.map(h => h.treble));
        const avgBpm = this.average(this.analysisHistory.map(h => h.bpm).filter(b => b > 0));

        const energy = this.classifyEnergy(avgBass, avgMid, avgTreble, avgBpm);
        const mood = this.classifyMood(avgBass, avgMid, avgTreble);
        const genre = this.classifyGenre(avgBass, avgMid, avgTreble, avgBpm);

        return this.buildRecommendation(energy, mood, genre, avgBpm);
    }

    private classifyEnergy(bass: number, mid: number, treble: number, bpm: number): string {
        const total = (bass + mid + treble) / 3;
        if (total > 0.6 && bpm > 130) return 'high';
        if (total > 0.4 && bpm > 100) return 'medium';
        return 'low';
    }

    private classifyMood(bass: number, mid: number, treble: number): string {
        if (bass > mid && bass > treble) return 'dark';
        if (treble > bass && treble > mid) return 'bright';
        if (mid > bass * 1.2) return 'warm';
        return 'neutral';
    }

    private classifyGenre(bass: number, mid: number, treble: number, bpm: number): string {
        if (bpm > 140 && bass > 0.5) return 'EDM';
        if (bpm > 130 && bass > 0.6) return 'Trap';
        if (bpm > 100 && bpm < 130 && mid > 0.4) return 'Pop';
        if (bpm < 100 && bass < 0.3) return 'Ambient';
        if (bpm < 90 && mid > 0.3) return 'Lo-Fi';
        if (bass > 0.5 && mid > 0.4) return 'Hip-Hop';
        if (treble > 0.5 && mid > 0.4) return 'Rock';
        return 'Electronic';
    }

    private buildRecommendation(energy: string, mood: string, genre: string, bpm: number): AIRecommendation {
        let template = 'chill';
        let visualizer = 'vertical-bars';
        let colors: string[] = ['#6c5ce7', '#a29bfe', '#ffffff'];
        let particles = 'dust';
        let background = 'gradient';

        switch (energy) {
            case 'high':
                template = genre === 'EDM' ? 'edm' : 'ncs';
                visualizer = genre === 'EDM' ? 'particle-burst' : 'neon';
                colors = ['#ff0080', '#7700ff', '#00f5ff'];
                particles = 'sparks';
                background = 'solid';
                break;
            case 'medium':
                template = genre === 'Pop' ? 'spotify' : 'monstercat';
                visualizer = 'vertical-bars';
                colors = ['#6c5ce7', '#a29bfe', '#00f5ff'];
                particles = 'dust';
                background = 'gradient';
                break;
            case 'low':
                template = genre === 'Ambient' ? 'ambient' : 'lofi';
                visualizer = genre === 'Ambient' ? 'energy-ring' : 'waveform';
                colors = ['#4facfe', '#00f2fe', '#ffffff'];
                particles = 'fireflies';
                background = 'animated-gradient';
                break;
        }

        if (mood === 'dark') {
            colors = ['#8b0000', '#4a0080', '#000033'];
        } else if (mood === 'bright') {
            colors = ['#ffdd00', '#ff6600', '#ff0066'];
        }

        const youtubeTitle = this.generateTitle(genre, mood, energy);
        const hashtags = this.generateHashtags(genre, mood);
        const description = this.generateDescription(genre, mood, energy, bpm);

        return {
            template, visualizer, colors, particles, background,
            mood, energy, genre, youtubeTitle, hashtags, description
        };
    }

    private generateTitle(genre: string, mood: string, energy: string): string {
        const moodWords: Record<string, string[]> = {
            dark: ['Dark', 'Deep', 'Midnight', 'Shadow'],
            bright: ['Bright', 'Radiant', 'Solar', 'Golden'],
            warm: ['Warm', 'Sunset', 'Autumn', 'Ember'],
            neutral: ['Crystal', 'Flow', 'Wave', 'Echo']
        };
        const word = moodWords[mood]?.[Math.floor(Math.random() * 4)] || 'Visual';
        return `${word} ${genre} Mix | ${energy === 'high' ? 'Energy' : energy === 'low' ? 'Chill' : 'Vibes'} Visualizer`;
    }

    private generateHashtags(genre: string, mood: string): string[] {
        return [
            `#${genre.replace(/\s/g, '')}`, '#MusicVisualizer', '#Spectrum',
            `#${mood}vibes`, '#AudioVisual', '#SpectrumMaker',
            `#${genre.replace(/\s/g, '')}Music`, '#Visualizer', '#MusicVideo'
        ];
    }

    private generateDescription(genre: string, mood: string, energy: string, bpm: number): string {
        return `${genre} music visualization | ${mood} mood | ${energy} energy | ~${Math.round(bpm)} BPM\n` +
            `Created with Visual Spectrum Maker PRO\n\n` +
            `Genre: ${genre}\nMood: ${mood}\nEnergy: ${energy}\nBPM: ~${Math.round(bpm)}`;
    }

    private getDefaultRecommendation(): AIRecommendation {
        return {
            template: 'spotify', visualizer: 'vertical-bars',
            colors: ['#6c5ce7', '#a29bfe', '#ffffff'],
            particles: 'dust', background: 'gradient',
            mood: 'neutral', energy: 'medium', genre: 'Electronic',
            youtubeTitle: 'Music Visualizer | Spectrum Animation',
            hashtags: ['#MusicVisualizer', '#Spectrum', '#AudioVisual'],
            description: 'Music visualization created with Visual Spectrum Maker PRO'
        };
    }

    private average(arr: number[]): number {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    isReady(): boolean {
        return this.analysisComplete;
    }

    reset(): void {
        this.analysisHistory = [];
        this.analysisComplete = false;
    }
}
