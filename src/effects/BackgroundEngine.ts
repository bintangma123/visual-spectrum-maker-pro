/**
 * Background Engine - Solid, Gradient, Image, Animated backgrounds
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export type BackgroundType = 'solid' | 'gradient' | 'image' | 'animated-gradient' | 'blur';

export interface BackgroundConfig {
    type: BackgroundType;
    solidColor: string;
    gradientColors: string[];
    gradientAngle: number;
    animatedSpeed: number;
    image: HTMLImageElement | null;
    imageFit: 'cover' | 'contain' | 'stretch';
    blur: number;
    zoom: number;
    kenBurns: boolean;
    parallax: boolean;
    reactToMusic: boolean;
}

export class BackgroundEngine {
    public config: BackgroundConfig = {
        type: 'gradient',
        solidColor: '#0a0a0f',
        gradientColors: ['#0a0a1a', '#1a0a2e', '#0a1a2e'],
        gradientAngle: 135,
        animatedSpeed: 0.5,
        image: null,
        imageFit: 'cover',
        blur: 0,
        zoom: 1,
        kenBurns: false,
        parallax: false,
        reactToMusic: true
    };
    private time: number = 0;
    private kenBurnsPhase: number = 0;

    render(ctx: CanvasRenderingContext2D, width: number, height: number, data: AudioAnalysisData): void {
        this.time += 0.016;
        ctx.save();

        switch (this.config.type) {
            case 'solid':
                ctx.fillStyle = this.config.solidColor;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'gradient':
                this.renderGradient(ctx, width, height, data);
                break;
            case 'animated-gradient':
                this.renderAnimatedGradient(ctx, width, height, data);
                break;
            case 'image':
                this.renderImage(ctx, width, height, data);
                break;
            case 'blur':
                this.renderBlurBackground(ctx, width, height, data);
                break;
        }

        ctx.restore();
    }

    private renderGradient(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        const angle = this.config.gradientAngle * Math.PI / 180;
        const x0 = w / 2 + Math.cos(angle) * w / 2;
        const y0 = h / 2 + Math.sin(angle) * h / 2;
        const x1 = w / 2 - Math.cos(angle) * w / 2;
        const y1 = h / 2 - Math.sin(angle) * h / 2;

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        this.config.gradientColors.forEach((color, i) => {
            gradient.addColorStop(i / (this.config.gradientColors.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    private renderAnimatedGradient(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        const speed = this.config.animatedSpeed;
        const angle = (this.time * speed * 20) % 360;
        const rad = angle * Math.PI / 180;

        const cx = w / 2 + Math.cos(rad) * w * 0.3;
        const cy = h / 2 + Math.sin(rad) * h * 0.3;
        const radius = Math.max(w, h) * (0.8 + (this.config.reactToMusic ? data.bassLevel * 0.3 : 0));

        const gradient = ctx.createRadialGradient(cx, cy, 0, w / 2, h / 2, radius);
        this.config.gradientColors.forEach((color, i) => {
            const offset = (i / (this.config.gradientColors.length - 1) + this.time * speed * 0.01) % 1;
            gradient.addColorStop(Math.abs(offset), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    private renderImage(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        if (!this.config.image) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            return;
        }

        const img = this.config.image;
        let dx = 0, dy = 0, dw = w, dh = h;

        if (this.config.imageFit === 'cover') {
            const imgRatio = img.width / img.height;
            const canvasRatio = w / h;
            if (imgRatio > canvasRatio) {
                dw = h * imgRatio;
                dx = (w - dw) / 2;
            } else {
                dh = w / imgRatio;
                dy = (h - dh) / 2;
            }
        }

        // Ken Burns effect
        if (this.config.kenBurns) {
            this.kenBurnsPhase += 0.0005;
            const zoom = 1.1 + Math.sin(this.kenBurnsPhase) * 0.1;
            const panX = Math.sin(this.kenBurnsPhase * 0.7) * 20;
            const panY = Math.cos(this.kenBurnsPhase * 0.5) * 15;
            ctx.translate(w/2 + panX, h/2 + panY);
            ctx.scale(zoom, zoom);
            ctx.translate(-w/2, -h/2);
        }

        // Music zoom
        if (this.config.reactToMusic) {
            const zoomFactor = 1 + data.bassLevel * 0.02;
            ctx.translate(w/2, h/2);
            ctx.scale(zoomFactor, zoomFactor);
            ctx.translate(-w/2, -h/2);
        }

        ctx.drawImage(img, dx, dy, dw, dh);

        // Apply blur
        if (this.config.blur > 0) {
            ctx.filter = `blur(${this.config.blur}px)`;
            ctx.drawImage(ctx.canvas, 0, 0);
            ctx.filter = 'none';
        }
    }

    private renderBlurBackground(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        // Frosted glass look
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    loadImage(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                this.config.image = img;
                this.config.type = 'image';
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }
}
