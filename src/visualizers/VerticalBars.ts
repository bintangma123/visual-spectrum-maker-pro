/**
 * Vertical Bars Visualizer - Classic spectrum analyzer
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class VerticalBarsVisualizer extends BaseVisualizer {
    render(data: AudioAnalysisData): void {
        const { frequencyData } = data;
        const barCount = this.config.barCount;
        const totalWidth = this.width;
        const barWidth = (totalWidth / barCount) - this.config.barGap;
        const centerY = this.height;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;
        this.applyGlow();

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * frequencyData.length / barCount);
            const value = (frequencyData[dataIndex] / 255) * this.config.reactivity;
            const barHeight = value * this.height * 0.8;
            const x = i * (barWidth + this.config.barGap);
            const y = centerY - barHeight;

            if (this.config.useGradient) {
                this.ctx.fillStyle = this.createGradient(x, centerY, x, y);
            } else {
                this.ctx.fillStyle = this.config.color;
            }

            this.drawRoundedBar(x, y, barWidth, barHeight);

            // Mirror mode
            if (this.config.mirrorMode) {
                this.ctx.globalAlpha = this.config.opacity * 0.4;
                this.drawRoundedBar(x, centerY, barWidth, barHeight * 0.3);
                this.ctx.globalAlpha = this.config.opacity;
            }
        }

        this.clearGlow();
        this.ctx.restore();
    }

    private drawRoundedBar(x: number, y: number, w: number, h: number): void {
        const r = Math.min(this.config.barRadius, w / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
}
