/**
 * Waveform / Oscilloscope Visualizer
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class WaveformVisualizer extends BaseVisualizer {
    render(data: AudioAnalysisData): void {
        const { timeDomainData, bassLevel } = data;
        const centerY = this.height / 2;
        const amplitude = this.height * 0.35 * this.config.reactivity;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;
        this.applyGlow();

        // Main waveform
        this.ctx.beginPath();
        this.ctx.lineWidth = 2 + bassLevel * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (this.config.useGradient) {
            this.ctx.strokeStyle = this.createGradient(0, centerY - amplitude, this.width, centerY + amplitude);
        } else {
            this.ctx.strokeStyle = this.config.color;
        }

        const sliceWidth = this.width / timeDomainData.length;
        let x = 0;

        for (let i = 0; i < timeDomainData.length; i++) {
            const v = timeDomainData[i] / 128.0;
            const y = centerY + (v - 1) * amplitude;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        this.ctx.stroke();

        // Mirror/reflection
        if (this.config.mirrorMode) {
            this.ctx.globalAlpha = this.config.opacity * 0.3;
            this.ctx.beginPath();
            x = 0;
            for (let i = 0; i < timeDomainData.length; i++) {
                const v = timeDomainData[i] / 128.0;
                const y = centerY - (v - 1) * amplitude * 0.5;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
                x += sliceWidth;
            }
            this.ctx.stroke();
        }

        this.clearGlow();
        this.ctx.restore();
    }
}
