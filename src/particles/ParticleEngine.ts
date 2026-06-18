/**
 * Particle Engine - Multiple particle types reactive to music
 */
import { AudioAnalysisData } from '../audio/AudioEngine';

export type ParticleType = 'dust' | 'snow' | 'rain' | 'fireflies' | 'bubbles' | 
    'sparks' | 'stars' | 'galaxy' | 'smoke' | 'fog' | 'shapes' | 'hearts' | 'notes';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    opacity: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    type: ParticleType;
}

export interface ParticleConfig {
    type: ParticleType;
    count: number;
    speed: number;
    size: number;
    opacity: number;
    reactToMusic: boolean;
    reactivity: number;
    color: string;
    colors: string[];
}

export class ParticleEngine {
    private particles: Particle[] = [];
    private width: number;
    private height: number;
    public config: ParticleConfig;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.config = {
            type: 'dust',
            count: 100,
            speed: 1,
            size: 3,
            opacity: 0.6,
            reactToMusic: true,
            reactivity: 1,
            color: '#ffffff',
            colors: ['#ffffff', '#a29bfe', '#6c5ce7', '#00f5ff']
        };
    }

    initialize(): void {
        this.particles = [];
        for (let i = 0; i < this.config.count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    private createParticle(fromTop: boolean = false): Particle {
        const type = this.config.type;
        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        let x = Math.random() * this.width;
        let y = fromTop ? -10 : Math.random() * this.height;
        let vx = 0, vy = 0;

        switch (type) {
            case 'snow':
                vx = (Math.random() - 0.5) * 0.5;
                vy = 0.5 + Math.random() * 1.5;
                break;
            case 'rain':
                vx = -1;
                vy = 8 + Math.random() * 4;
                break;
            case 'fireflies':
                vx = (Math.random() - 0.5) * 2;
                vy = (Math.random() - 0.5) * 2;
                break;
            case 'bubbles':
                vx = (Math.random() - 0.5) * 0.5;
                vy = -(0.5 + Math.random() * 1.5);
                y = fromTop ? this.height + 10 : y;
                break;
            case 'sparks':
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                vx = Math.cos(angle) * speed;
                vy = Math.sin(angle) * speed;
                x = this.width / 2;
                y = this.height / 2;
                break;
            case 'stars':
                vx = 0;
                vy = 0;
                break;
            case 'galaxy':
                vx = (Math.random() - 0.5) * 0.3;
                vy = (Math.random() - 0.5) * 0.3;
                break;
            case 'smoke':
                vx = (Math.random() - 0.5) * 0.5;
                vy = -(0.3 + Math.random() * 0.5);
                y = this.height;
                break;
            default: // dust, fog, shapes, hearts, notes
                vx = (Math.random() - 0.5) * this.config.speed;
                vy = (Math.random() - 0.5) * this.config.speed;
                break;
        }

        return {
            x, y, vx, vy,
            size: this.config.size * (0.5 + Math.random()),
            life: 1,
            opacity: this.config.opacity * (0.5 + Math.random() * 0.5),
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            color,
            type
        };
    }


    update(data: AudioAnalysisData): void {
        const { bassLevel, overallLevel, isBeat } = data;
        const musicFactor = this.config.reactToMusic ? (overallLevel * this.config.reactivity) : 0;

        // Spawn extra on beat
        if (isBeat && this.config.reactToMusic && this.particles.length < this.config.count * 2) {
            for (let i = 0; i < 5; i++) {
                this.particles.push(this.createParticle(true));
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply music reactivity
            const speedMult = 1 + musicFactor * 2;
            p.x += p.vx * speedMult * this.config.speed;
            p.y += p.vy * speedMult * this.config.speed;
            p.rotation += p.rotationSpeed;

            // Type-specific behavior
            switch (p.type) {
                case 'fireflies':
                    p.vx += (Math.random() - 0.5) * 0.1;
                    p.vy += (Math.random() - 0.5) * 0.1;
                    p.opacity = this.config.opacity * (0.3 + Math.sin(Date.now() * 0.003 + i) * 0.7);
                    break;
                case 'stars':
                    p.opacity = this.config.opacity * (0.5 + Math.sin(Date.now() * 0.002 + i) * 0.5);
                    p.size = this.config.size * (0.8 + bassLevel * 0.5);
                    break;
                case 'galaxy':
                    const cx = this.width / 2;
                    const cy = this.height / 2;
                    const angle = Math.atan2(p.y - cy, p.x - cx);
                    p.vx += Math.cos(angle + Math.PI / 2) * 0.01;
                    p.vy += Math.sin(angle + Math.PI / 2) * 0.01;
                    break;
                case 'sparks':
                    p.life -= 0.01;
                    p.vy += 0.05; // gravity
                    break;
                case 'smoke':
                    p.life -= 0.005;
                    p.size += 0.1;
                    p.opacity *= 0.995;
                    break;
            }

            // Remove dead or off-screen particles
            const margin = 50;
            if (p.x < -margin || p.x > this.width + margin ||
                p.y < -margin || p.y > this.height + margin ||
                p.life <= 0 || p.opacity <= 0.01) {
                this.particles[i] = this.createParticle(true);
            }
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        for (const p of this.particles) {
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = p.color;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            switch (p.type) {
                case 'dust':
                case 'fog':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'snow':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'rain':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(1, p.size * 3);
                    ctx.stroke();
                    break;
                case 'fireflies':
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bubbles':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'sparks':
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'stars':
                    this.drawStar(ctx, 0, 0, p.size);
                    break;
                case 'hearts':
                    this.drawHeart(ctx, 0, 0, p.size);
                    break;
                case 'notes':
                    ctx.font = `${p.size * 4}px serif`;
                    ctx.fillText('♪', 0, 0);
                    break;
                default:
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }

    private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.3);
        ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size * 1.2);
        ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.3);
        ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
        ctx.fill();
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    setType(type: ParticleType): void {
        this.config.type = type;
        this.initialize();
    }
}
