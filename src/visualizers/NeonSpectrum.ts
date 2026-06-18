/**
 * Neon Spectrum Visualizer - Glowing modern bars with reflections
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class NeonSpectrumVisualizer extends BaseVisualizer {
    render(data: AudioAnalysisData): void {
        const { frequencyData, bassLevel } = data;
        const barCount = this.config.barCount;
        const totalWidth = this.width * 0.8;
        const barWidth = (totalWidth / barCount) - this.config.barGap;
        const startX = (this.width - totalWidth) / 2;
        const baseY = this.height * 0.65;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;

        // Neon glow effect - multiple passes
        for (let pass = 0; pass < 3; pass++) {
            const blur = [20, 10, 0][pass];
            const alpha = [0.3, 0.6, 1.0][pass];
            
            this.ctx.shadowBlur = blur;
            this.ctx.shadowColor = this.config.gradientColors[0];
            this.ctx.globalAlpha = this.config.opacity * alpha;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor(i * frequencyData.length / barCount);
                const value = (frequencyData[dataIndex] / 255) * this.config.reactivity;
                const barHeight = value * this.height * 0.5;
                const x = startX + i * (barWidth + this.config.barGap);
                const y = baseY - barHeight;

                // Color based on frequency
                const hue = (i / barCount) * 120 + 240; // blue to pink
                const saturation = 80 + value * 20;
                const lightness = 50 + value * 20;
                this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                // Draw bar
                this.ctx.fillRect(x, y, barWidth, barHeight);
            }
        }

        // Reflection
        this.ctx.globalAlpha = this.config.opacity * 0.2;
        this.ctx.shadowBlur = 5;
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * frequencyData.length / barCount);
            const value = (frequencyData[dataIndex] / 255) * this.config.reactivity;
            const barHeight = value * this.height * 0.15;
            const x = startX + i * (barWidth + this.config.barGap);

            const hue = (i / barCount) * 120 + 240;
            this.ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
            this.ctx.fillRect(x, baseY + 2, barWidth, barHeight);
        }

        // Bass pulse ring
        if (bassLevel > 0.5) {
            this.ctx.globalAlpha = (bassLevel - 0.5) * 0.4;
            this.ctx.strokeStyle = this.config.gradientColors[0];
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.arc(this.width / 2, baseY, totalWidth / 2 * bassLevel, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }
}
