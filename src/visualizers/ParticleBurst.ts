/**
 * Particle Burst Visualizer - Explosive particle-based spectrum
 */
import { AudioAnalysisData } from '../audio/AudioEngine';
import { BaseVisualizer } from './BaseVisualizer';

interface BurstParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
}

export class ParticleBurstVisualizer extends BaseVisualizer {
    private particles: BurstParticle[] = [];

    render(data: AudioAnalysisData): void {
        const { frequencyData, bassLevel, isBeat } = data;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ctx.save();
        this.ctx.globalAlpha = this.config.opacity;

        // Spawn particles on beat
        if (isBeat) {
            const count = Math.floor(20 + bassLevel * 40);
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 6 * bassLevel;
                const hue = Math.random() * 60 + 240;
                this.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 1 + Math.random() * 3,
                    life: 1,
                    maxLife: 0.5 + Math.random() * 1.5,
                    color: `hsl(${hue}, 80%, 60%)`
                });
            }
        }

        // Also spawn from frequency data
        const barCount = 32;
        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * frequencyData.length / barCount);
            const value = frequencyData[dataIndex] / 255;
            if (value > 0.6 && Math.random() > 0.7) {
                const angle = (i / barCount) * Math.PI * 2;
                const radius = Math.min(this.width, this.height) * 0.2;
                this.particles.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    vx: Math.cos(angle) * value * 3,
                    vy: Math.sin(angle) * value * 3,
                    size: value * 3,
                    life: 1,
                    maxLife: 1 + Math.random(),
                    color: this.config.gradientColors[Math.floor(Math.random() * this.config.gradientColors.length)]
                });
            }
        }

        // Update and render particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 0.016 / p.maxLife;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life * this.config.opacity;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Limit particles
        if (this.particles.length > 500) {
            this.particles = this.particles.slice(-500);
        }

        // Center glow
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 100 + bassLevel * 50
        );
        gradient.addColorStop(0, `rgba(108, 92, 231, ${bassLevel * 0.3})`);
        gradient.addColorStop(1, 'rgba(108, 92, 231, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.restore();
    }
}
