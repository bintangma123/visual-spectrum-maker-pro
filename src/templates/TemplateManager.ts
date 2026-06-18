/**
 * Template Manager - Pre-built visual templates
 */

export interface VisualTemplate {
    id: string;
    name: string;
    category: string;
    description: string;
    visualizer: string;
    background: any;
    particles: any;
    lighting: any;
    camera: any;
    overlay: any;
    colors: string[];
    textConfig: any;
}

export class TemplateManager {
    private templates: VisualTemplate[] = [];

    constructor() {
        this.initializeTemplates();
    }

    private initializeTemplates(): void {
        this.templates = [
            {
                id: 'spotify',
                name: 'Spotify Style',
                category: 'Music',
                description: 'Clean bars with gradient, minimal design',
                visualizer: 'vertical-bars',
                background: { type: 'gradient', gradientColors: ['#191414', '#1a1a2e'] },
                particles: { type: 'none', count: 0 },
                lighting: { vignette: true, vignetteIntensity: 0.3 },
                camera: { bassZoom: true, bassZoomIntensity: 0.02 },
                overlay: { type: 'none' },
                colors: ['#1DB954', '#1ed760', '#ffffff'],
                textConfig: { animation: 'none', color: '#ffffff' }
            },
            {
                id: 'trap-nation',
                name: 'Trap Nation',
                category: 'Music',
                description: 'Centered circular visualizer with artistic background',
                visualizer: 'circular',
                background: { type: 'gradient', gradientColors: ['#0a0a1a', '#1a0033', '#330066'] },
                particles: { type: 'dust', count: 50 },
                lighting: { vignette: true, vignetteIntensity: 0.5, glow: true },
                camera: { bassZoom: true, beatPunch: true },
                overlay: { type: 'none' },
                colors: ['#ff00ff', '#8b00ff', '#ffffff'],
                textConfig: { animation: 'pulse', color: '#ffffff' }
            },
            {
                id: 'ncs',
                name: 'NCS',
                category: 'Music',
                description: 'Dynamic spectrum with bold colors',
                visualizer: 'neon',
                background: { type: 'solid', solidColor: '#000000' },
                particles: { type: 'sparks', count: 30 },
                lighting: { bloom: true, bloomIntensity: 0.4 },
                camera: { beatPunch: true, beatPunchIntensity: 0.04 },
                overlay: { type: 'none' },
                colors: ['#00f5ff', '#0080ff', '#ff00ff'],
                textConfig: { animation: 'glitch', color: '#00f5ff' }
            },
            {
                id: 'monstercat',
                name: 'Monstercat',
                category: 'Music',
                description: 'Sharp bars with reactive elements',
                visualizer: 'vertical-bars',
                background: { type: 'gradient', gradientColors: ['#1a1a2e', '#16213e', '#0f3460'] },
                particles: { type: 'none', count: 0 },
                lighting: { vignette: true, ambientLight: true },
                camera: { bassZoom: true },
                overlay: { type: 'none' },
                colors: ['#ffffff', '#6c5ce7', '#a29bfe'],
                textConfig: { animation: 'none', color: '#ffffff' }
            },
            {
                id: 'lofi',
                name: 'LoFi Girl',
                category: 'Chill',
                description: 'Soft waveform with warm tones',
                visualizer: 'waveform',
                background: { type: 'animated-gradient', gradientColors: ['#2d1b69', '#553c9a', '#6b46c1'] },
                particles: { type: 'fireflies', count: 30 },
                lighting: { vignette: true, vignetteIntensity: 0.4 },
                camera: { autoZoom: true, autoZoomSpeed: 0.0005 },
                overlay: { type: 'grain', intensity: 0.2 },
                colors: ['#ffd93d', '#ffb347', '#ff6b6b'],
                textConfig: { animation: 'fade', color: '#ffd93d' }
            },
            {
                id: 'edm',
                name: 'EDM',
                category: 'Music',
                description: 'High energy particle burst',
                visualizer: 'particle-burst',
                background: { type: 'solid', solidColor: '#000000' },
                particles: { type: 'sparks', count: 80 },
                lighting: { bloom: true, lensFlare: true, bloomIntensity: 0.5 },
                camera: { beatPunch: true, shake: true, shakeIntensity: 3 },
                overlay: { type: 'none' },
                colors: ['#ff0080', '#7700ff', '#00f5ff'],
                textConfig: { animation: 'pulse', color: '#ffffff' }
            },
            {
                id: 'chill',
                name: 'Chill',
                category: 'Chill',
                description: 'Calm waveform with soft particles',
                visualizer: 'waveform',
                background: { type: 'animated-gradient', gradientColors: ['#0f2027', '#203a43', '#2c5364'] },
                particles: { type: 'snow', count: 40 },
                lighting: { vignette: true, vignetteIntensity: 0.3 },
                camera: { autoZoom: true },
                overlay: { type: 'bokeh', intensity: 0.3 },
                colors: ['#74b9ff', '#a29bfe', '#ffffff'],
                textConfig: { animation: 'fade', color: '#74b9ff' }
            },
            {
                id: 'podcast',
                name: 'Podcast',
                category: 'Content',
                description: 'Simple centered waveform',
                visualizer: 'waveform',
                background: { type: 'gradient', gradientColors: ['#1a1a2e', '#232323'] },
                particles: { type: 'none', count: 0 },
                lighting: { vignette: true, vignetteIntensity: 0.2 },
                camera: {},
                overlay: { type: 'none' },
                colors: ['#ffffff', '#cccccc'],
                textConfig: { animation: 'none', color: '#ffffff' }
            },
            {
                id: 'synthwave',
                name: 'Synthwave',
                category: 'Retro',
                description: 'Retro neon grid with spectrum',
                visualizer: 'mirror-bars',
                background: { type: 'gradient', gradientColors: ['#0a0020', '#1a0040', '#2a0060'] },
                particles: { type: 'stars', count: 60 },
                lighting: { neonEdge: true, bloom: true, chromaticAberration: true },
                camera: { bassZoom: true },
                overlay: { type: 'scanline', intensity: 0.15 },
                colors: ['#ff00ff', '#ff6600', '#ffff00', '#00ffff'],
                textConfig: { animation: 'neon', glowColor: '#ff00ff', color: '#ff00ff' }
            },
            {
                id: 'vaporwave',
                name: 'Vaporwave',
                category: 'Retro',
                description: 'Aesthetic pastel vibes',
                visualizer: 'vertical-bars',
                background: { type: 'animated-gradient', gradientColors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff'] },
                particles: { type: 'shapes', count: 20 },
                lighting: { chromaticAberration: true, chromaticOffset: 3 },
                camera: { rotate: true, rotateSpeed: 0.0002 },
                overlay: { type: 'vhs', intensity: 0.2 },
                colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'],
                textConfig: { animation: 'glitch', color: '#01cdfe' }
            },
            {
                id: 'cinematic',
                name: 'Cinematic',
                category: 'Content',
                description: 'Widescreen with film look',
                visualizer: 'waveform',
                background: { type: 'gradient', gradientColors: ['#000000', '#0a0a0a', '#1a1a1a'] },
                particles: { type: 'dust', count: 20 },
                lighting: { vignette: true, vignetteIntensity: 0.6 },
                camera: { autoZoom: true, autoZoomSpeed: 0.0003 },
                overlay: { type: 'grain', intensity: 0.15 },
                colors: ['#d4af37', '#ffffff', '#888888'],
                textConfig: { animation: 'fade', color: '#d4af37' }
            },
            {
                id: 'gaming',
                name: 'Gaming',
                category: 'Content',
                description: 'RGB dynamic with energy',
                visualizer: 'energy-ring',
                background: { type: 'solid', solidColor: '#050510' },
                particles: { type: 'sparks', count: 60 },
                lighting: { bloom: true, neonEdge: true },
                camera: { beatPunch: true, shake: true },
                overlay: { type: 'crt', intensity: 0.1 },
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffffff'],
                textConfig: { animation: 'glitch', color: '#00ff00' }
            },
            {
                id: 'worship',
                name: 'Worship',
                category: 'Content',
                description: 'Soft, warm, atmospheric',
                visualizer: 'waveform',
                background: { type: 'animated-gradient', gradientColors: ['#1a0a00', '#2a1500', '#1a0a00'] },
                particles: { type: 'fireflies', count: 40 },
                lighting: { vignette: true, ambientLight: true, ambientColor: '#ff9900' },
                camera: { autoZoom: true },
                overlay: { type: 'bokeh', intensity: 0.4 },
                colors: ['#ffd700', '#ffaa00', '#ffffff'],
                textConfig: { animation: 'fade', color: '#ffd700' }
            },
            {
                id: 'ambient',
                name: 'Ambient',
                category: 'Chill',
                description: 'Minimal, peaceful, floating',
                visualizer: 'energy-ring',
                background: { type: 'animated-gradient', gradientColors: ['#000428', '#004e92'] },
                particles: { type: 'galaxy', count: 100 },
                lighting: { vignette: true },
                camera: { autoZoom: true, rotate: true, rotateSpeed: 0.0001 },
                overlay: { type: 'none' },
                colors: ['#4facfe', '#00f2fe', '#ffffff'],
                textConfig: { animation: 'fade', color: '#4facfe' }
            }
        ];
    }

    getTemplates(): VisualTemplate[] {
        return this.templates;
    }

    getTemplate(id: string): VisualTemplate | undefined {
        return this.templates.find(t => t.id === id);
    }

    getCategories(): string[] {
        return [...new Set(this.templates.map(t => t.category))];
    }

    getTemplatesByCategory(category: string): VisualTemplate[] {
        return this.templates.filter(t => t.category === category);
    }
}
