/**
 * Circular Spectrum Visualizer - Audio ring / radial display
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class CircularSpectrumVisualizer extends BaseVisualizer {
    private rotation: number = 0;

    render(data: AudioAnalysisData): void {
        const { frequencyData, bassLevel } = data;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.25;
        const barCount = this.config.barCount;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;
        this.applyGlow();

        // Rotate with bass
        this.rotation += 0.002 + bassLevel * 0.01;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * frequencyData.length / barCount);
            const value = (frequencyData[dataIndex] / 255) * this.config.reactivity;
            const angle = (i / barCount) * Math.PI * 2 + this.rotation;
            const barLength = value * radius * 1.5;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barLength);
            const y2 = centerY + Math.sin(angle) * (radius + barLength);

            if (this.config.useGradient) {
                const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
                const colors = this.config.gradientColors;
                colors.forEach((color, idx) => {
                    gradient.addColorStop(idx / (colors.length - 1), color);
                });
                this.ctx.strokeStyle = gradient;
            } else {
                this.ctx.strokeStyle = this.config.color;
            }

            this.ctx.lineWidth = this.config.barWidth;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();

            // Inner bars (mirror)
            if (this.config.mirrorMode) {
                const x3 = centerX + Math.cos(angle) * (radius - barLength * 0.4);
                const y3 = centerY + Math.sin(angle) * (radius - barLength * 0.4);
                this.ctx.globalAlpha = this.config.opacity * 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x3, y3);
                this.ctx.stroke();
                this.ctx.globalAlpha = this.config.opacity;
            }
        }

        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * (0.9 + bassLevel * 0.1), 0, Math.PI * 2);
        this.ctx.strokeStyle = this.config.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.clearGlow();
        this.ctx.restore();
    }
}
