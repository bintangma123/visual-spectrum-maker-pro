/**
 * Base Visualizer - Abstract class for all spectrum visualizers
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export interface VisualizerConfig {
    barCount: number;
    barWidth: number;
    barGap: number;
    barRadius: number;
    color: string;
    gradientColors: string[];
    useGradient: boolean;
    mirrorMode: boolean;
    opacity: number;
    glowIntensity: number;
    reactivity: number;
    rotation: number;
    scale: number;
}

export abstract class BaseVisualizer {
    protected ctx: CanvasRenderingContext2D;
    protected width: number;
    protected height: number;
    public config: VisualizerConfig;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.config = {
            barCount: 64,
            barWidth: 4,
            barGap: 2,
            barRadius: 2,
            color: '#6c5ce7',
            gradientColors: ['#6c5ce7', '#a29bfe', '#00f5ff'],
            useGradient: true,
            mirrorMode: false,
            opacity: 1,
            glowIntensity: 0.5,
            reactivity: 1,
            rotation: 0,
            scale: 1
        };
    }

    abstract render(data: AudioAnalysisData): void;

    protected createGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        const colors = this.config.gradientColors;
        colors.forEach((color, i) => {
            gradient.addColorStop(i / (colors.length - 1), color);
        });
        return gradient;
    }

    protected applyGlow(): void {
        if (this.config.glowIntensity > 0) {
            this.ctx.shadowBlur = this.config.glowIntensity * 20;
            this.ctx.shadowColor = this.config.color;
        }
    }

    protected clearGlow(): void {
        this.ctx.shadowBlur = 0;
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
}
