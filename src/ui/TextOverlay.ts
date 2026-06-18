/**
 * Text Overlay System - Song title, artist, lyrics with animations
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export type TextAnimation = 'none' | 'fade' | 'slide' | 'zoom' | 'bounce' | 'typewriter' | 'glitch' | 'neon' | 'pulse';

export interface TextConfig {
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    x: number;
    y: number;
    align: CanvasTextAlign;
    animation: TextAnimation;
    glowColor: string;
    glowIntensity: number;
    shadow: boolean;
    reactToMusic: boolean;
    visible: boolean;
}

export interface TextLayer {
    id: string;
    config: TextConfig;
}

export class TextOverlay {
    private layers: TextLayer[] = [];
    private time: number = 0;

    constructor() {
        // Default layers
        this.layers = [
            {
                id: 'title',
                config: {
                    text: 'Song Title',
                    fontFamily: 'Segoe UI',
                    fontSize: 36,
                    fontWeight: '700',
                    color: '#ffffff',
                    x: 0.5,
                    y: 0.85,
                    align: 'center',
                    animation: 'none',
                    glowColor: '#6c5ce7',
                    glowIntensity: 0,
                    shadow: true,
                    reactToMusic: false,
                    visible: true
                }
            },
            {
                id: 'artist',
                config: {
                    text: 'Artist Name',
                    fontFamily: 'Segoe UI',
                    fontSize: 18,
                    fontWeight: '400',
                    color: '#a0a0b0',
                    x: 0.5,
                    y: 0.9,
                    align: 'center',
                    animation: 'none',
                    glowColor: '#a29bfe',
                    glowIntensity: 0,
                    shadow: false,
                    reactToMusic: false,
                    visible: true
                }
            }
        ];
    }

    render(ctx: CanvasRenderingContext2D, width: number, height: number, data: AudioAnalysisData): void {
        this.time += 0.016;

        for (const layer of this.layers) {
            if (!layer.config.visible || !layer.config.text) continue;
            this.renderTextLayer(ctx, width, height, layer, data);
        }
    }

    private renderTextLayer(ctx: CanvasRenderingContext2D, w: number, h: number, layer: TextLayer, data: AudioAnalysisData): void {
        const cfg = layer.config;
        ctx.save();

        let x = cfg.x * w;
        let y = cfg.y * h;
        let alpha = 1;
        let scale = 1;

        // Apply animations
        switch (cfg.animation) {
            case 'fade':
                alpha = 0.5 + Math.sin(this.time * 2) * 0.5;
                break;
            case 'slide':
                x += Math.sin(this.time) * 20;
                break;
            case 'zoom':
                scale = 1 + Math.sin(this.time * 1.5) * 0.1;
                break;
            case 'bounce':
                y += Math.abs(Math.sin(this.time * 3)) * -15;
                break;
            case 'pulse':
                scale = 1 + data.bassLevel * 0.15;
                break;
            case 'neon':
                cfg.glowIntensity = 0.5 + Math.sin(this.time * 4) * 0.5;
                break;
            case 'glitch':
                if (Math.random() > 0.95) {
                    x += (Math.random() - 0.5) * 10;
                    y += (Math.random() - 0.5) * 5;
                }
                break;
        }

        // Music reactivity
        if (cfg.reactToMusic) {
            scale += data.bassLevel * 0.05;
        }

        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.font = `${cfg.fontWeight} ${cfg.fontSize}px ${cfg.fontFamily}`;
        ctx.textAlign = cfg.align;
        ctx.textBaseline = 'middle';

        // Glow
        if (cfg.glowIntensity > 0) {
            ctx.shadowBlur = cfg.glowIntensity * 20;
            ctx.shadowColor = cfg.glowColor;
        }

        // Shadow
        if (cfg.shadow) {
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        ctx.fillStyle = cfg.color;
        ctx.fillText(cfg.text, 0, 0);

        ctx.restore();
    }

    setTitle(text: string): void {
        const layer = this.layers.find(l => l.id === 'title');
        if (layer) layer.config.text = text;
    }

    setArtist(text: string): void {
        const layer = this.layers.find(l => l.id === 'artist');
        if (layer) layer.config.text = text;
    }

    getLayer(id: string): TextLayer | undefined {
        return this.layers.find(l => l.id === id);
    }

    addLayer(id: string, config: Partial<TextConfig>): void {
        const defaultConfig: TextConfig = {
            text: '', fontFamily: 'Segoe UI', fontSize: 24, fontWeight: '400',
            color: '#ffffff', x: 0.5, y: 0.5, align: 'center',
            animation: 'none', glowColor: '#6c5ce7', glowIntensity: 0,
            shadow: false, reactToMusic: false, visible: true
        };
        this.layers.push({ id, config: { ...defaultConfig, ...config } });
    }

    removeLayer(id: string): void {
        this.layers = this.layers.filter(l => l.id !== id);
    }

    getLayers(): TextLayer[] {
        return this.layers;
    }
}
