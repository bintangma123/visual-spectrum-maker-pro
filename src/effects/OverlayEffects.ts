/**
 * Overlay Effects - Film Grain, VHS, Scanlines, Bokeh, etc.
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export type OverlayType = 'none' | 'grain' | 'vhs' | 'crt' | 'scanline' | 'noise' | 'bokeh';

export interface OverlayConfig {
    type: OverlayType;
    intensity: number;
}

export class OverlayEffects {
    public config: OverlayConfig = {
        type: 'none',
        intensity: 0.3
    };
    private time: number = 0;

    apply(ctx: CanvasRenderingContext2D, width: number, height: number, data: AudioAnalysisData): void {
        this.time += 0.016;
        switch (this.config.type) {
            case 'grain': this.applyGrain(ctx, width, height); break;
            case 'vhs': this.applyVHS(ctx, width, height); break;
            case 'scanline': this.applyScanlines(ctx, width, height); break;
            case 'crt': this.applyCRT(ctx, width, height); break;
            case 'noise': this.applyNoise(ctx, width, height); break;
            case 'bokeh': this.applyBokeh(ctx, width, height, data); break;
        }
    }

    private applyGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;
        const intensity = this.config.intensity * 30;
        for (let i = 0; i < pixels.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity;
            pixels[i] += noise;
            pixels[i + 1] += noise;
            pixels[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private applyVHS(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.save();
        // Horizontal offset glitch
        const glitchChance = this.config.intensity * 0.1;
        if (Math.random() < glitchChance) {
            const y = Math.random() * h;
            const sliceH = 2 + Math.random() * 10;
            const offset = (Math.random() - 0.5) * 20;
            const imgData = ctx.getImageData(0, y, w, sliceH);
            ctx.putImageData(imgData, offset, y);
        }

        // Color separation
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = this.config.intensity * 0.1;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
        ctx.fillRect(2, 0, w, h);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
        ctx.fillRect(-2, 0, w, h);

        // Scanline overlay
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = this.config.intensity * 0.15;
        for (let y = 0; y < h; y += 4) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, y, w, 2);
        }
        ctx.restore();
    }

    private applyScanlines(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.save();
        ctx.globalAlpha = this.config.intensity * 0.3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for (let y = 0; y < h; y += 3) {
            ctx.fillRect(0, y, w, 1);
        }
        ctx.restore();
    }

    private applyCRT(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        // Barrel distortion simulation + scanlines
        this.applyScanlines(ctx, w, h);
        // Corner darkening
        ctx.save();
        const gradient = ctx.createRadialGradient(w/2, h/2, w*0.35, w/2, h/2, w*0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${this.config.intensity * 0.5})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    private applyNoise(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.save();
        ctx.globalAlpha = this.config.intensity * 0.15;
        const blockSize = 4;
        for (let x = 0; x < w; x += blockSize) {
            for (let y = 0; y < h; y += blockSize) {
                const v = Math.floor(Math.random() * 255);
                ctx.fillStyle = `rgb(${v},${v},${v})`;
                ctx.fillRect(x, y, blockSize, blockSize);
            }
        }
        ctx.restore();
    }

    private applyBokeh(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const count = 8 + Math.floor(data.overallLevel * 10);
        for (let i = 0; i < count; i++) {
            const x = (Math.sin(this.time * 0.3 + i * 1.7) * 0.5 + 0.5) * w;
            const y = (Math.cos(this.time * 0.2 + i * 2.3) * 0.5 + 0.5) * h;
            const size = 20 + Math.sin(this.time + i) * 15 + data.bassLevel * 20;
            const alpha = 0.05 + data.overallLevel * 0.05;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `rgba(162, 155, 254, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(108, 92, 231, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
