/**
 * Energy Ring Visualizer - Pulsating energy rings
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

export class EnergyRingVisualizer extends BaseVisualizer {
    private rings: { radius: number; opacity: number; width: number }[] = [];
    private time: number = 0;

    render(data: AudioAnalysisData): void {
        const { frequencyData, bassLevel, isBeat, overallLevel } = data;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) * 0.4;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;
        this.time += 0.02;

        // Spawn rings on beat
        if (isBeat) {
            this.rings.push({ radius: 20, opacity: 1, width: 3 + bassLevel * 5 });
        }

        // Draw frequency-based static rings
        const ringCount = 5;
        for (let r = 0; r < ringCount; r++) {
            const dataStart = Math.floor(r * frequencyData.length / ringCount);
            const dataEnd = Math.floor((r + 1) * frequencyData.length / ringCount);
            let avg = 0;
            for (let i = dataStart; i < dataEnd; i++) avg += frequencyData[i];
            avg = avg / (dataEnd - dataStart) / 255;

            const radius = (r + 1) * (maxRadius / ringCount) * (0.8 + avg * 0.4);
            const hue = 260 + r * 30;

            this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${avg * 0.8})`;
            this.ctx.lineWidth = 1 + avg * 3;
            this.ctx.shadowBlur = avg * 15;
            this.ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;

            // Wavy ring
            this.ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2; a += 0.05) {
                const freqIdx = Math.floor((a / (Math.PI * 2)) * (dataEnd - dataStart)) + dataStart;
                const freqVal = frequencyData[freqIdx] / 255 * this.config.reactivity;
                const wave = Math.sin(a * 8 + this.time * 2) * freqVal * 10;
                const px = centerX + Math.cos(a) * (radius + wave);
                const py = centerY + Math.sin(a) * (radius + wave);
                if (a === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }

        // Animated expanding rings
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            ring.radius += 3;
            ring.opacity -= 0.015;

            if (ring.opacity <= 0) {
                this.rings.splice(i, 1);
                continue;
            }

            this.ctx.strokeStyle = `rgba(162, 155, 254, ${ring.opacity})`;
            this.ctx.lineWidth = ring.width * ring.opacity;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(162, 155, 254, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, ring.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Center energy core
        const coreSize = 15 + overallLevel * 20;
        const coreGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0, centerX, centerY, coreSize
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 + bassLevel * 0.2})`);
        coreGradient.addColorStop(0.3, `rgba(108, 92, 231, ${0.6})`);
        coreGradient.addColorStop(1, 'rgba(108, 92, 231, 0)');
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.rings.length > 20) this.rings = this.rings.slice(-20);
        this.ctx.restore();
    }
}
