/**
 * Camera Animation Effects - Zoom, Shake, Rotate, etc.
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export interface CameraConfig {
    autoZoom: boolean;
    autoZoomSpeed: number;
    bassZoom: boolean;
    bassZoomIntensity: number;
    beatPunch: boolean;
    beatPunchIntensity: number;
    shake: boolean;
    shakeIntensity: number;
    rotate: boolean;
    rotateSpeed: number;
}

export interface CameraTransform {
    translateX: number;
    translateY: number;
    scale: number;
    rotation: number;
}

export class CameraEffects {
    private time: number = 0;
    private punchDecay: number = 0;

    public config: CameraConfig = {
        autoZoom: false,
        autoZoomSpeed: 0.001,
        bassZoom: true,
        bassZoomIntensity: 0.05,
        beatPunch: true,
        beatPunchIntensity: 0.03,
        shake: false,
        shakeIntensity: 2,
        rotate: false,
        rotateSpeed: 0.0005
    };

    getTransform(data: AudioAnalysisData): CameraTransform {
        this.time += 0.016;
        let translateX = 0, translateY = 0, scale = 1, rotation = 0;

        // Auto zoom (breathing)
        if (this.config.autoZoom) {
            scale += Math.sin(this.time * this.config.autoZoomSpeed * 60) * 0.02;
        }

        // Bass zoom
        if (this.config.bassZoom) {
            scale += data.bassLevel * this.config.bassZoomIntensity;
        }

        // Beat punch
        if (this.config.beatPunch) {
            if (data.isBeat) {
                this.punchDecay = this.config.beatPunchIntensity;
            }
            scale += this.punchDecay;
            this.punchDecay *= 0.9;
        }

        // Shake
        if (this.config.shake) {
            const intensity = this.config.shakeIntensity * data.bassLevel;
            translateX += (Math.random() - 0.5) * intensity;
            translateY += (Math.random() - 0.5) * intensity;
        }

        // Rotate
        if (this.config.rotate) {
            rotation = this.time * this.config.rotateSpeed * 60;
        }

        return { translateX, translateY, scale, rotation };
    }

    applyTransform(ctx: CanvasRenderingContext2D, width: number, height: number, transform: CameraTransform): void {
        ctx.translate(width / 2 + transform.translateX, height / 2 + transform.translateY);
        ctx.scale(transform.scale, transform.scale);
        ctx.rotate(transform.rotation);
        ctx.translate(-width / 2, -height / 2);
    }
}
