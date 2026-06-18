/**
 * Lighting Effects - Glow, Bloom, Lens Flare, Vignette, etc.
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export interface LightingConfig {
    glow: boolean;
    glowIntensity: number;
    bloom: boolean;
    bloomIntensity: number;
    lensFlare: boolean;
    lensFlareIntensity: number;
    vignette: boolean;
    vignetteIntensity: number;
    chromaticAberration: boolean;
    chromaticOffset: number;
    neonEdge: boolean;
    ambientLight: boolean;
    ambientColor: string;
}

export class LightingEffects {
    public config: LightingConfig = {
        glow: false,
        glowIntensity: 0.5,
        bloom: false,
        bloomIntensity: 0.3,
        lensFlare: false,
        lensFlareIntensity: 0.5,
        vignette: true,
        vignetteIntensity: 0.4,
        chromaticAberration: false,
        chromaticOffset: 2,
        neonEdge: false,
        ambientLight: false,
        ambientColor: '#6c5ce7'
    };

    apply(ctx: CanvasRenderingContext2D, width: number, height: number, data: AudioAnalysisData): void {
        if (this.config.vignette) {
            this.applyVignette(ctx, width, height, data);
        }
        if (this.config.bloom) {
            this.applyBloom(ctx, width, height, data);
        }
        if (this.config.lensFlare) {
            this.applyLensFlare(ctx, width, height, data);
        }
        if (this.config.ambientLight) {
            this.applyAmbientLight(ctx, width, height, data);
        }
    }

    private applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        const intensity = this.config.vignetteIntensity * (1 + data.bassLevel * 0.3);
        const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    private applyBloom(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        const intensity = this.config.bloomIntensity * (0.5 + data.overallLevel * 0.5);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity;
        ctx.filter = `blur(${8 + data.bassLevel * 10}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
    }

    private applyLensFlare(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        if (data.bassLevel < 0.4) return;
        const intensity = (data.bassLevel - 0.4) * this.config.lensFlareIntensity;
        const cx = w * 0.6;
        const cy = h * 0.3;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Main flare
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100 + intensity * 200);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.5})`);
        gradient.addColorStop(0.2, `rgba(200, 180, 255, ${intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Secondary flares
        for (let i = 0; i < 3; i++) {
            const fx = cx + (w / 2 - cx) * (i + 1) * 0.4;
            const fy = cy + (h / 2 - cy) * (i + 1) * 0.4;
            const size = 20 + i * 15;
            const g2 = ctx.createRadialGradient(fx, fy, 0, fx, fy, size);
            g2.addColorStop(0, `rgba(108, 92, 231, ${intensity * 0.3})`);
            g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g2;
            ctx.fillRect(fx - size, fy - size, size * 2, size * 2);
        }

        ctx.restore();
    }

    private applyAmbientLight(ctx: CanvasRenderingContext2D, w: number, h: number, data: AudioAnalysisData): void {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1 + data.overallLevel * 0.15;
        ctx.fillStyle = this.config.ambientColor;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}
