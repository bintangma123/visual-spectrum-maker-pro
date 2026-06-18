/**
 * Mirror Bars Visualizer - Symmetric bars from center
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class MirrorBarsVisualizer extends BaseVisualizer {
    render(data: AudioAnalysisData): void {
        const { frequencyData } = data;
        const barCount = this.config.barCount;
        const totalWidth = this.width * 0.9;
        const barWidth = (totalWidth / barCount) - this.config.barGap;
        const startX = (this.width - totalWidth) / 2;
        const centerY = this.height / 2;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;
        this.applyGlow();

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * frequencyData.length / barCount);
            const value = (frequencyData[dataIndex] / 255) * this.config.reactivity;
            const barHeight = value * this.height * 0.4;
            const x = startX + i * (barWidth + this.config.barGap);

            if (this.config.useGradient) {
                this.ctx.fillStyle = this.createGradient(x, centerY - barHeight, x, centerY + barHeight);
            } else {
                this.ctx.fillStyle = this.config.color;
            }

            // Top bar
            this.ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
            // Bottom bar (mirror)
            this.ctx.fillRect(x, centerY, barWidth, barHeight);
        }

        // Center line
        this.ctx.strokeStyle = this.config.color;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, centerY);
        this.ctx.lineTo(startX + totalWidth, centerY);
        this.ctx.stroke();

        this.clearGlow();
        this.ctx.restore();
    }
}
