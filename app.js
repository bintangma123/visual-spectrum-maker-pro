/**
 * Visual Spectrum Maker PRO V1 - Standalone Web Application
 * Pure HTML5 + CSS + JavaScript. No dependencies.
 * Open index.html in Chrome/Edge to run.
 */

// Polyfill for CanvasRenderingContext2D.roundRect (Chrome < 99)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = Array.isArray(radii) ? radii[0] || 0 : radii || 0;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
    };
}

// ============================================================
// AUDIO ENGINE
// ============================================================
const AudioEngine = {
    ctx: null,
    analyser: null,
    gainNode: null,
    source: null,
    buffer: null,
    freqData: null,
    timeData: null,
    isPlaying: false,
    startTime: 0,
    pauseTime: 0,
    duration: 0,
    bpm: 0,
    beatHistory: [],
    lastBeatTime: 0,
    config: { sensitivity: 1.5, gain: 1.0, smoothing: 0.8, beatThreshold: 0.6 },

    async init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = this.config.smoothing;
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
    },

    async loadFile(file) {
        if (!this.ctx) await this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const arrayBuf = await file.arrayBuffer();
        this.buffer = await this.ctx.decodeAudioData(arrayBuf);
        this.duration = this.buffer.duration;
        this.pauseTime = 0;
    },

    play() {
        if (!this.buffer) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.stop();
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gainNode);
        this.source.start(0, this.pauseTime);
        this.startTime = this.ctx.currentTime - this.pauseTime;
        this.isPlaying = true;
        this.source.onended = () => { if (this.isPlaying) { this.isPlaying = false; this.pauseTime = 0; } };
    },

    pause() {
        if (!this.isPlaying) return;
        this.pauseTime = this.ctx.currentTime - this.startTime;
        if (this.source) try { this.source.stop(); } catch(e) {}
        this.isPlaying = false;
    },

    stop() {
        if (this.source) { try { this.source.stop(); } catch(e) {} this.source.disconnect(); this.source = null; }
        this.isPlaying = false;
        this.pauseTime = 0;
    },

    seek(t) { const was = this.isPlaying; this.stop(); this.pauseTime = t; if (was) this.play(); },
    getTime() { return this.isPlaying ? this.ctx.currentTime - this.startTime : this.pauseTime; },

    analyze() {
        if (!this.analyser) return { bass:0, mid:0, treble:0, overall:0, isBeat:false, freq: new Uint8Array(1024), time: new Uint8Array(1024), bpm:0 };
        this.analyser.getByteFrequencyData(this.freqData);
        this.analyser.getByteTimeDomainData(this.timeData);
        const len = this.freqData.length;
        const sens = this.config.sensitivity;
        const bEnd = Math.floor(len * 0.1), mEnd = Math.floor(len * 0.5);
        let bass=0, mid=0, treble=0, total=0;
        for (let i=0; i<len; i++) {
            const v = (this.freqData[i]/255) * sens;
            total += v;
            if (i < bEnd) bass += v;
            else if (i < mEnd) mid += v;
            else treble += v;
        }
        bass = Math.min(bass / bEnd, 1);
        mid = Math.min(mid / (mEnd - bEnd), 1);
        treble = Math.min(treble / (len - mEnd), 1);
        const overall = Math.min(total / len, 1);
        const isBeat = this._detectBeat(bass);
        return { bass, mid, treble, overall, isBeat, freq: this.freqData, time: this.timeData, bpm: this.bpm };
    },

    _detectBeat(level) {
        const now = performance.now();
        if (level > this.config.beatThreshold && (now - this.lastBeatTime) > 200) {
            if (this.lastBeatTime > 0) {
                this.beatHistory.push(now - this.lastBeatTime);
                if (this.beatHistory.length > 20) this.beatHistory.shift();
                const avg = this.beatHistory.reduce((a,b)=>a+b,0) / this.beatHistory.length;
                this.bpm = Math.round(60000 / avg);
            }
            this.lastBeatTime = now;
            return true;
        }
        return false;
    },

    setGain(v) { this.config.gain = v; if (this.gainNode) this.gainNode.gain.value = v; },
    setSensitivity(v) { this.config.sensitivity = v; },
    setSmoothing(v) { this.config.smoothing = v; if (this.analyser) this.analyser.smoothingTimeConstant = v; },
    setBeatThreshold(v) { this.config.beatThreshold = v; }
};

// ============================================================
// STATE
// ============================================================
const State = {
    activeViz: 'bars',
    bgType: 'gradient',
    bgColor: '#0a0a1a',
    bgGrad: ['#0a0a1a', '#1a0a2e', '#0a1a2e'],
    bgAngle: 135,
    bgAnimSpeed: 0.5,
    bgImage: null,
    bgReactive: true,
    particleType: 'fireflies',
    particleCount: 80,
    particleSpeed: 1,
    particleSize: 3,
    particleReactive: true,
    vizColors: ['#6c5ce7', '#a29bfe', '#00f5ff'],
    vizBarCount: 64,
    vizGlow: 0.5,
    vizReactivity: 1,
    vizMirror: false,
    fxVignette: true,
    fxVignetteAmt: 0.4,
    fxBloom: false,
    fxBloomAmt: 0.3,
    fxOverlay: 'none',
    fxOverlayAmt: 0.3,
    camBassZoom: true,
    camBassAmt: 0.04,
    camBeatPunch: true,
    camPunchAmt: 0.03,
    camShake: false,
    camShakeAmt: 2,
    textTitle: 'Song Title',
    textArtist: 'Artist Name',
    textAnim: 'none',
    textColor: '#ffffff',
    textGlow: 0,
    punchDecay: 0,
    particles: [],
    time: 0
};

// ============================================================
// VISUALIZERS
// ============================================================
const Visualizers = {
    bars(ctx, w, h, data) {
        const { freq } = data;
        const count = State.vizBarCount;
        const gap = 2;
        const totalW = w * 0.85;
        const barW = (totalW / count) - gap;
        const startX = (w - totalW) / 2;
        const baseY = h * 0.75;

        for (let i = 0; i < count; i++) {
            const idx = Math.floor(i * freq.length / count);
            const val = (freq[idx] / 255) * State.vizReactivity;
            const barH = val * h * 0.6;
            const x = startX + i * (barW + gap);
            const hue = (i / count) * 60 + 250;
            const grad = ctx.createLinearGradient(x, baseY, x, baseY - barH);
            grad.addColorStop(0, State.vizColors[0]);
            grad.addColorStop(0.5, State.vizColors[1]);
            grad.addColorStop(1, State.vizColors[2]);
            ctx.fillStyle = grad;
            ctx.shadowBlur = State.vizGlow * 15;
            ctx.shadowColor = State.vizColors[0];
            ctx.beginPath();
            ctx.roundRect(x, baseY - barH, barW, barH, [3, 3, 0, 0]);
            ctx.fill();
            if (State.vizMirror) {
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x, baseY + 2, barW, barH * 0.25);
                ctx.globalAlpha = 1;
            }
        }
        ctx.shadowBlur = 0;
    },

    circular(ctx, w, h, data) {
        const { freq, bass } = data;
        const cx = w/2, cy = h/2;
        const radius = Math.min(w,h) * 0.22;
        const count = State.vizBarCount;
        State.time += 0.002 + bass * 0.008;

        ctx.shadowBlur = State.vizGlow * 12;
        ctx.shadowColor = State.vizColors[0];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(i * freq.length / count);
            const val = (freq[idx] / 255) * State.vizReactivity;
            const angle = (i / count) * Math.PI * 2 + State.time;
            const len = val * radius * 1.4;
            const x1 = cx + Math.cos(angle) * radius;
            const y1 = cy + Math.sin(angle) * radius;
            const x2 = cx + Math.cos(angle) * (radius + len);
            const y2 = cy + Math.sin(angle) * (radius + len);
            const grad = ctx.createLinearGradient(x1,y1,x2,y2);
            grad.addColorStop(0, State.vizColors[0]);
            grad.addColorStop(1, State.vizColors[2]);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }
        ctx.strokeStyle = State.vizColors[1];
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, radius * (0.95 + bass*0.05), 0, Math.PI*2); ctx.stroke();
        ctx.shadowBlur = 0;
    },

    waveform(ctx, w, h, data) {
        const { time: td, bass } = data;
        const cy = h / 2;
        const amp = h * 0.3 * State.vizReactivity;
        ctx.shadowBlur = State.vizGlow * 10;
        ctx.shadowColor = State.vizColors[0];
        const grad = ctx.createLinearGradient(0, cy-amp, 0, cy+amp);
        grad.addColorStop(0, State.vizColors[2]);
        grad.addColorStop(0.5, State.vizColors[0]);
        grad.addColorStop(1, State.vizColors[1]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + bass * 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const slice = w / td.length;
        for (let i = 0; i < td.length; i++) {
            const v = td[i] / 128;
            const y = cy + (v - 1) * amp;
            i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    },

    mirror(ctx, w, h, data) {
        const { freq } = data;
        const count = State.vizBarCount;
        const gap = 2;
        const totalW = w * 0.85;
        const barW = (totalW / count) - gap;
        const startX = (w - totalW) / 2;
        const cy = h / 2;

        ctx.shadowBlur = State.vizGlow * 12;
        ctx.shadowColor = State.vizColors[0];
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(i * freq.length / count);
            const val = (freq[idx] / 255) * State.vizReactivity;
            const barH = val * h * 0.35;
            const x = startX + i * (barW + gap);
            const grad = ctx.createLinearGradient(x, cy - barH, x, cy + barH);
            grad.addColorStop(0, State.vizColors[2]);
            grad.addColorStop(0.5, State.vizColors[0]);
            grad.addColorStop(1, State.vizColors[2]);
            ctx.fillStyle = grad;
            ctx.fillRect(x, cy - barH, barW, barH);
            ctx.fillRect(x, cy, barW, barH);
        }
        ctx.shadowBlur = 0;
    },

    neon(ctx, w, h, data) {
        const { freq, bass } = data;
        const count = State.vizBarCount;
        const totalW = w * 0.8;
        const barW = (totalW / count) - 2;
        const startX = (w - totalW) / 2;
        const baseY = h * 0.65;

        for (let pass = 0; pass < 3; pass++) {
            ctx.shadowBlur = [20,10,0][pass];
            ctx.shadowColor = State.vizColors[0];
            ctx.globalAlpha = [0.3, 0.6, 1][pass];
            for (let i = 0; i < count; i++) {
                const idx = Math.floor(i * freq.length / count);
                const val = (freq[idx] / 255) * State.vizReactivity;
                const barH = val * h * 0.45;
                const x = startX + i * (barW + 2);
                const hue = (i/count)*100 + 240;
                ctx.fillStyle = `hsl(${hue}, 85%, ${50 + val*25}%)`;
                ctx.fillRect(x, baseY - barH, barW, barH);
            }
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Reflection
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(i * freq.length / count);
            const val = (freq[idx] / 255) * State.vizReactivity;
            const x = startX + i * (barW + 2);
            ctx.fillStyle = State.vizColors[0];
            ctx.fillRect(x, baseY + 2, barW, val * h * 0.12);
        }
        ctx.globalAlpha = 1;
    },

    particles(ctx, w, h, data) {
        const { freq, bass, isBeat } = data;
        const cx = w/2, cy = h/2;
        if (isBeat) {
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5 * bass;
                State.particles.push({ x:cx, y:cy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:1, size:1+Math.random()*3, color:State.vizColors[Math.floor(Math.random()*3)] });
            }
        }
        // Also spawn from frequency
        for (let i = 0; i < 32; i++) {
            const idx = Math.floor(i * freq.length / 32);
            const val = freq[idx] / 255;
            if (val > 0.6 && Math.random() > 0.8) {
                const angle = (i/32) * Math.PI * 2;
                const r = Math.min(w,h) * 0.15;
                State.particles.push({ x:cx+Math.cos(angle)*r, y:cy+Math.sin(angle)*r, vx:Math.cos(angle)*val*3, vy:Math.sin(angle)*val*3, life:1, size:val*3, color:State.vizColors[Math.floor(Math.random()*3)] });
            }
        }
        for (let i = State.particles.length-1; i >= 0; i--) {
            const p = State.particles[i];
            p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.97; p.life -= 0.015;
            if (p.life <= 0) { State.particles.splice(i,1); continue; }
            ctx.globalAlpha = p.life;
            ctx.shadowBlur = 8; ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2); ctx.fill();
        }
        if (State.particles.length > 400) State.particles = State.particles.slice(-400);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        // Center glow
        const g = ctx.createRadialGradient(cx,cy,0,cx,cy,80+bass*40);
        g.addColorStop(0, `rgba(108,92,231,${bass*0.3})`); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    },

    energy(ctx, w, h, data) {
        const { freq, bass, overall, isBeat } = data;
        const cx = w/2, cy = h/2;
        const maxR = Math.min(w,h) * 0.35;
        State.time += 0.02;

        for (let r = 0; r < 5; r++) {
            const start = Math.floor(r * freq.length / 5);
            const end = Math.floor((r+1) * freq.length / 5);
            let avg = 0;
            for (let i = start; i < end; i++) avg += freq[i];
            avg = avg / (end-start) / 255;
            const radius = (r+1) * (maxR/5) * (0.8 + avg*0.4);
            const hue = 260 + r*30;
            ctx.strokeStyle = `hsla(${hue},80%,60%,${avg*0.8})`;
            ctx.lineWidth = 1 + avg*3;
            ctx.shadowBlur = avg * 12; ctx.shadowColor = `hsl(${hue},80%,60%)`;
            ctx.beginPath();
            for (let a = 0; a <= Math.PI*2; a += 0.05) {
                const fi = Math.floor((a/(Math.PI*2))*(end-start)) + start;
                const fv = (freq[fi]||0)/255 * State.vizReactivity;
                const wave = Math.sin(a*8 + State.time*2) * fv * 8;
                const px = cx + Math.cos(a)*(radius+wave);
                const py = cy + Math.sin(a)*(radius+wave);
                a === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py);
            }
            ctx.closePath(); ctx.stroke();
        }
        // Core
        const coreG = ctx.createRadialGradient(cx,cy,0,cx,cy,15+overall*15);
        coreG.addColorStop(0,`rgba(255,255,255,${0.7+bass*0.3})`);
        coreG.addColorStop(0.4,`rgba(108,92,231,0.5)`);
        coreG.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle = coreG; ctx.beginPath(); ctx.arc(cx,cy,15+overall*15,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    }
};



// ============================================================
// BACKGROUND RENDERER
// ============================================================
const Background = {
    time: 0,
    render(ctx, w, h, data) {
        this.time += 0.016;
        switch (State.bgType) {
            case 'solid':
                ctx.fillStyle = State.bgColor;
                ctx.fillRect(0,0,w,h);
                break;
            case 'gradient': {
                const angle = State.bgAngle * Math.PI / 180;
                const g = ctx.createLinearGradient(
                    w/2+Math.cos(angle)*w/2, h/2+Math.sin(angle)*h/2,
                    w/2-Math.cos(angle)*w/2, h/2-Math.sin(angle)*h/2
                );
                State.bgGrad.forEach((c,i) => g.addColorStop(i/(State.bgGrad.length-1), c));
                ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
                break;
            }
            case 'animated': {
                const speed = State.bgAnimSpeed;
                const cx = w/2 + Math.cos(this.time*speed)*w*0.3;
                const cy = h/2 + Math.sin(this.time*speed)*h*0.3;
                const r = Math.max(w,h) * (0.8 + (State.bgReactive ? data.bass*0.2 : 0));
                const g = ctx.createRadialGradient(cx,cy,0,w/2,h/2,r);
                State.bgGrad.forEach((c,i) => g.addColorStop(i/(State.bgGrad.length-1), c));
                ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
                break;
            }
            case 'image':
                if (State.bgImage) {
                    const zoom = State.bgReactive ? 1 + data.bass * 0.02 : 1;
                    ctx.save();
                    ctx.translate(w/2, h/2); ctx.scale(zoom, zoom); ctx.translate(-w/2, -h/2);
                    const iw = State.bgImage.width, ih = State.bgImage.height;
                    const scale = Math.max(w/iw, h/ih);
                    const dw = iw*scale, dh = ih*scale;
                    ctx.drawImage(State.bgImage, (w-dw)/2, (h-dh)/2, dw, dh);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
                }
                break;
            default:
                ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
        }
    }
};

// ============================================================
// PARTICLE SYSTEM (background particles - separate from viz)
// ============================================================
const BGParticles = {
    list: [],
    init() {
        this.list = [];
        for (let i = 0; i < State.particleCount; i++) this.list.push(this._create());
    },
    _create(fromEdge) {
        const w = App.canvas.width || 1920, h = App.canvas.height || 1080;
        const t = State.particleType;
        let x = Math.random()*w, y = Math.random()*h, vx=0, vy=0;
        switch(t) {
            case 'snow': vx=(Math.random()-.5)*.5; vy=.5+Math.random()*1.5; if(fromEdge) y=-10; break;
            case 'rain': vx=-1; vy=6+Math.random()*4; if(fromEdge) y=-10; break;
            case 'fireflies': vx=(Math.random()-.5)*1.5; vy=(Math.random()-.5)*1.5; break;
            case 'bubbles': vx=(Math.random()-.5)*.5; vy=-(0.5+Math.random()); if(fromEdge) y=h+10; break;
            case 'stars': vx=0; vy=0; break;
            case 'dust': default: vx=(Math.random()-.5)*.8; vy=(Math.random()-.5)*.8; break;
        }
        return { x, y, vx, vy, size: State.particleSize*(0.5+Math.random()), opacity: 0.3+Math.random()*0.5, phase: Math.random()*Math.PI*2 };
    },
    update(data) {
        const w = App.canvas.width, h = App.canvas.height;
        const musicFactor = State.particleReactive ? data.overall * 1.5 : 0;
        for (let i = this.list.length-1; i >= 0; i--) {
            const p = this.list[i];
            const spd = State.particleSpeed * (1 + musicFactor);
            p.x += p.vx * spd; p.y += p.vy * spd; p.phase += 0.02;
            if (State.particleType === 'fireflies') { p.vx += (Math.random()-.5)*.08; p.vy += (Math.random()-.5)*.08; p.opacity = 0.2 + Math.sin(p.phase)*0.5; }
            if (State.particleType === 'stars') { p.opacity = 0.3 + Math.sin(p.phase)*0.4; p.size = State.particleSize * (0.8 + data.bass*0.4); }
            const m = 30;
            if (p.x < -m || p.x > w+m || p.y < -m || p.y > h+m) this.list[i] = this._create(true);
        }
        while (this.list.length < State.particleCount) this.list.push(this._create());
        if (this.list.length > State.particleCount) this.list.length = State.particleCount;
    },
    render(ctx) {
        for (const p of this.list) {
            ctx.globalAlpha = p.opacity * 0.7;
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = State.particleType === 'fireflies' ? 10 : 3;
            ctx.shadowColor = State.vizColors[1];
            if (State.particleType === 'rain') {
                ctx.strokeStyle = 'rgba(200,220,255,0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x+1, p.y+p.size*3); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
};

// ============================================================
// EFFECTS
// ============================================================
const Effects = {
    apply(ctx, w, h, data) {
        // Vignette
        if (State.fxVignette) {
            const intensity = State.fxVignetteAmt * (1 + data.bass*0.2);
            const g = ctx.createRadialGradient(w/2,h/2,w*0.3,w/2,h/2,w*0.7);
            g.addColorStop(0,'rgba(0,0,0,0)');
            g.addColorStop(1,`rgba(0,0,0,${intensity})`);
            ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        }
        // Overlay
        switch (State.fxOverlay) {
            case 'grain': this._grain(ctx,w,h); break;
            case 'scanline': this._scanlines(ctx,w,h); break;
            case 'vhs': this._vhs(ctx,w,h); break;
            case 'bokeh': this._bokeh(ctx,w,h,data); break;
        }
    },
    _grain(ctx,w,h) {
        ctx.globalAlpha = State.fxOverlayAmt * 0.12;
        for (let i = 0; i < 2000; i++) {
            const v = Math.random() > 0.5 ? 255 : 0;
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
        }
        ctx.globalAlpha = 1;
    },
    _scanlines(ctx,w,h) {
        ctx.globalAlpha = State.fxOverlayAmt * 0.25;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
        ctx.globalAlpha = 1;
    },
    _vhs(ctx,w,h) {
        if (Math.random() < State.fxOverlayAmt * 0.08) {
            const y = Math.random()*h, sliceH = 2+Math.random()*8;
            try {
                const img = ctx.getImageData(0, Math.floor(y), w, Math.floor(sliceH));
                ctx.putImageData(img, Math.floor((Math.random()-.5)*15), Math.floor(y));
            } catch(e){}
        }
        ctx.globalAlpha = State.fxOverlayAmt * 0.08;
        ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(2,0,w,h);
        ctx.fillStyle = 'rgba(0,255,255,0.5)'; ctx.fillRect(-2,0,w,h);
        ctx.globalAlpha = 1;
    },
    _bokeh(ctx,w,h,data) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const t = State.time;
        for (let i = 0; i < 6; i++) {
            const x = (Math.sin(t*0.3+i*1.7)*0.5+0.5)*w;
            const y = (Math.cos(t*0.2+i*2.3)*0.5+0.5)*h;
            const size = 20 + Math.sin(t+i)*12 + data.bass*15;
            const g = ctx.createRadialGradient(x,y,0,x,y,size);
            g.addColorStop(0,`rgba(162,155,254,0.06)`);
            g.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
};

// ============================================================
// TEXT OVERLAY
// ============================================================
const TextRenderer = {
    time: 0,
    render(ctx, w, h, data) {
        this.time += 0.016;
        if (!State.textTitle && !State.textArtist) return;
        const baseY = h * 0.82;
        // Title
        if (State.textTitle) this._drawText(ctx, w, State.textTitle, baseY, 32, '700', data);
        // Artist
        if (State.textArtist) {
            ctx.globalAlpha = 0.7;
            this._drawText(ctx, w, State.textArtist, baseY + 40, 16, '400', data);
            ctx.globalAlpha = 1;
        }
    },
    _drawText(ctx, w, text, y, size, weight, data) {
        let x = w/2, alpha = 1, scale = 1;
        switch (State.textAnim) {
            case 'fade': alpha = 0.4 + Math.sin(this.time*2)*0.6; break;
            case 'bounce': y += Math.abs(Math.sin(this.time*3))*-12; break;
            case 'pulse': scale = 1 + data.bass * 0.1; break;
            case 'neon': State.textGlow = 0.5 + Math.sin(this.time*4)*0.5; break;
            case 'glitch': if(Math.random()>.95){x+=(Math.random()-.5)*8; y+=(Math.random()-.5)*4;} break;
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y); ctx.scale(scale, scale);
        ctx.font = `${weight} ${size}px -apple-system, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (State.textGlow > 0) { ctx.shadowBlur = State.textGlow*20; ctx.shadowColor = State.vizColors[0]; }
        ctx.fillStyle = State.textColor;
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }
};



// ============================================================
// CAMERA EFFECTS
// ============================================================
const Camera = {
    apply(ctx, w, h, data) {
        let tx=0, ty=0, scale=1;
        if (State.camBassZoom) scale += data.bass * State.camBassAmt;
        if (State.camBeatPunch) { if (data.isBeat) State.punchDecay = State.camPunchAmt; scale += State.punchDecay; State.punchDecay *= 0.9; }
        if (State.camShake) { const i = State.camShakeAmt * data.bass; tx = (Math.random()-.5)*i; ty = (Math.random()-.5)*i; }
        ctx.translate(w/2+tx, h/2+ty);
        ctx.scale(scale, scale);
        ctx.translate(-w/2, -h/2);
    }
};

// ============================================================
// TEMPLATES
// ============================================================
const Templates = {
    list: [
        { id:'spotify', name:'Spotify', icon:'🟢', viz:'bars', bg:'gradient', bgGrad:['#191414','#1a1a2e'], colors:['#1DB954','#1ed760','#fff'], particles:'dust', overlay:'none' },
        { id:'trap', name:'Trap Nation', icon:'🔮', viz:'circular', bg:'gradient', bgGrad:['#0a0a1a','#1a0033','#330066'], colors:['#ff00ff','#8b00ff','#fff'], particles:'dust', overlay:'none' },
        { id:'ncs', name:'NCS', icon:'⚡', viz:'neon', bg:'solid', bgGrad:['#000','#000'], colors:['#00f5ff','#0080ff','#ff00ff'], particles:'none', overlay:'none' },
        { id:'monstercat', name:'Monstercat', icon:'🐱', viz:'bars', bg:'gradient', bgGrad:['#1a1a2e','#16213e','#0f3460'], colors:['#fff','#6c5ce7','#a29bfe'], particles:'none', overlay:'none' },
        { id:'lofi', name:'LoFi Girl', icon:'☕', viz:'waveform', bg:'animated', bgGrad:['#2d1b69','#553c9a','#6b46c1'], colors:['#ffd93d','#ffb347','#ff6b6b'], particles:'fireflies', overlay:'grain' },
        { id:'edm', name:'EDM', icon:'🎧', viz:'particles', bg:'solid', bgGrad:['#000','#000'], colors:['#ff0080','#7700ff','#00f5ff'], particles:'none', overlay:'none' },
        { id:'chill', name:'Chill', icon:'🌊', viz:'waveform', bg:'animated', bgGrad:['#0f2027','#203a43','#2c5364'], colors:['#74b9ff','#a29bfe','#fff'], particles:'snow', overlay:'bokeh' },
        { id:'podcast', name:'Podcast', icon:'🎙️', viz:'waveform', bg:'gradient', bgGrad:['#1a1a2e','#232323'], colors:['#fff','#ccc','#999'], particles:'none', overlay:'none' },
        { id:'synthwave', name:'Synthwave', icon:'🌆', viz:'mirror', bg:'gradient', bgGrad:['#0a0020','#1a0040','#2a0060'], colors:['#ff00ff','#ff6600','#00ffff'], particles:'stars', overlay:'scanline' },
        { id:'vaporwave', name:'Vaporwave', icon:'🌸', viz:'bars', bg:'animated', bgGrad:['#ff71ce','#01cdfe','#b967ff'], colors:['#ff71ce','#01cdfe','#05ffa1'], particles:'none', overlay:'vhs' },
        { id:'cinema', name:'Cinematic', icon:'🎬', viz:'waveform', bg:'gradient', bgGrad:['#000','#0a0a0a','#1a1a1a'], colors:['#d4af37','#fff','#888'], particles:'dust', overlay:'grain' },
        { id:'gaming', name:'Gaming', icon:'🎮', viz:'energy', bg:'solid', bgGrad:['#050510','#050510'], colors:['#ff0000','#00ff00','#0000ff'], particles:'none', overlay:'scanline' },
        { id:'worship', name:'Worship', icon:'✝️', viz:'waveform', bg:'animated', bgGrad:['#1a0a00','#2a1500','#1a0a00'], colors:['#ffd700','#ffaa00','#fff'], particles:'fireflies', overlay:'bokeh' },
        { id:'ambient', name:'Ambient', icon:'🌌', viz:'energy', bg:'animated', bgGrad:['#000428','#004e92','#000428'], colors:['#4facfe','#00f2fe','#fff'], particles:'stars', overlay:'none' },
    ],
    apply(id) {
        const t = this.list.find(x => x.id === id);
        if (!t) return;
        State.activeViz = t.viz;
        State.bgType = t.bg;
        State.bgGrad = [...t.bgGrad];
        State.bgColor = t.bgGrad[0];
        State.vizColors = [...t.colors];
        if (t.particles !== 'none') { State.particleType = t.particles; BGParticles.init(); }
        else State.particleCount = 0;
        State.fxOverlay = t.overlay;
    }
};

// ============================================================
// EXPORT ENGINE
// ============================================================
const Exporter = {
    recorder: null,
    chunks: [],
    isRecording: false,
    start(canvas) {
        this.chunks = [];
        const stream = canvas.captureStream(30);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        this.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
        this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
        this.recorder.onstop = () => this._save();
        this.recorder.start(100);
        this.isRecording = true;
        document.getElementById('recording-badge').classList.remove('hidden');
    },
    stop() {
        if (this.recorder && this.isRecording) { this.recorder.stop(); this.isRecording = false; }
        document.getElementById('recording-badge').classList.add('hidden');
    },
    _save() {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'visual-spectrum.webm';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
};



// ============================================================
// UI PANELS
// ============================================================
const Panels = {
    dashboard() {
        return `
        <div class="section"><h3>🎵 Load Audio</h3>
            <div class="file-drop" id="audio-drop">Click or drag MP3 here<input type="file" id="audio-input" accept="audio/*" style="display:none"></div>
        </div>
        <div class="section"><h3>🎛️ Audio Engine</h3>
            <div class="ctrl"><label>Sensitivity <span id="v-sens">1.5</span></label><input type="range" id="c-sens" min="0.5" max="3" step="0.1" value="1.5"></div>
            <div class="ctrl"><label>Gain <span id="v-gain">1.0</span></label><input type="range" id="c-gain" min="0" max="3" step="0.1" value="1"></div>
            <div class="ctrl"><label>Smoothing <span id="v-smooth">0.8</span></label><input type="range" id="c-smooth" min="0" max="0.99" step="0.01" value="0.8"></div>
            <div class="ctrl"><label>Beat Threshold <span id="v-beat">0.6</span></label><input type="range" id="c-beat" min="0.2" max="1" step="0.05" value="0.6"></div>
        </div>
        <div class="section"><h3>📊 Levels</h3>
            <div class="meter"><label>Bass</label><div class="meter-bar"><div class="meter-fill bass" id="m-bass"></div></div></div>
            <div class="meter"><label>Mid</label><div class="meter-bar"><div class="meter-fill mid" id="m-mid"></div></div></div>
            <div class="meter"><label>Treble</label><div class="meter-bar"><div class="meter-fill treble" id="m-treble"></div></div></div>
            <div class="meter"><label>Overall</label><div class="meter-bar"><div class="meter-fill overall" id="m-overall"></div></div></div>
        </div>`;
    },
    spectrum() {
        return `
        <div class="section"><h3>📊 Visualizer Type</h3>
            <div class="grid">
                <div class="grid-item ${State.activeViz==='bars'?'active':''}" data-viz="bars"><span class="ico">▮▮▮</span>Bars</div>
                <div class="grid-item ${State.activeViz==='mirror'?'active':''}" data-viz="mirror"><span class="ico">⬍</span>Mirror</div>
                <div class="grid-item ${State.activeViz==='circular'?'active':''}" data-viz="circular"><span class="ico">◎</span>Circular</div>
                <div class="grid-item ${State.activeViz==='waveform'?'active':''}" data-viz="waveform"><span class="ico">〰️</span>Waveform</div>
                <div class="grid-item ${State.activeViz==='neon'?'active':''}" data-viz="neon"><span class="ico">💡</span>Neon</div>
                <div class="grid-item ${State.activeViz==='particles'?'active':''}" data-viz="particles"><span class="ico">💥</span>Particles</div>
                <div class="grid-item ${State.activeViz==='energy'?'active':''}" data-viz="energy"><span class="ico">◉</span>Energy</div>
            </div>
        </div>
        <div class="section"><h3>🎨 Colors</h3>
            <div class="ctrl"><label>Primary</label><input type="color" id="c-col1" value="${State.vizColors[0]}"></div>
            <div class="ctrl"><label>Secondary</label><input type="color" id="c-col2" value="${State.vizColors[1]}"></div>
            <div class="ctrl"><label>Accent</label><input type="color" id="c-col3" value="${State.vizColors[2]}"></div>
        </div>
        <div class="section"><h3>⚙️ Settings</h3>
            <div class="ctrl"><label>Bar Count <span id="v-bars">${State.vizBarCount}</span></label><input type="range" id="c-bars" min="16" max="128" step="8" value="${State.vizBarCount}"></div>
            <div class="ctrl"><label>Glow <span id="v-glow">${State.vizGlow}</span></label><input type="range" id="c-glow" min="0" max="1" step="0.1" value="${State.vizGlow}"></div>
            <div class="ctrl"><label>Reactivity <span id="v-react">${State.vizReactivity}</span></label><input type="range" id="c-react" min="0.5" max="3" step="0.1" value="${State.vizReactivity}"></div>
        </div>`;
    },
    background() {
        return `
        <div class="section"><h3>🖼️ Type</h3>
            <div class="grid">
                <div class="grid-item ${State.bgType==='solid'?'active':''}" data-bg="solid"><span class="ico">⬛</span>Solid</div>
                <div class="grid-item ${State.bgType==='gradient'?'active':''}" data-bg="gradient"><span class="ico">🌅</span>Gradient</div>
                <div class="grid-item ${State.bgType==='animated'?'active':''}" data-bg="animated"><span class="ico">🎆</span>Animated</div>
                <div class="grid-item ${State.bgType==='image'?'active':''}" data-bg="image"><span class="ico">🖼️</span>Image</div>
            </div>
        </div>
        <div class="section"><h3>🎨 Settings</h3>
            <div class="ctrl"><label>Color 1</label><input type="color" id="c-bg1" value="${State.bgGrad[0]}"></div>
            <div class="ctrl"><label>Color 2</label><input type="color" id="c-bg2" value="${State.bgGrad[1]}"></div>
            <div class="ctrl"><label>Color 3</label><input type="color" id="c-bg3" value="${State.bgGrad[2]||State.bgGrad[1]}"></div>
            <div class="ctrl"><label>Angle <span id="v-bga">${State.bgAngle}°</span></label><input type="range" id="c-bga" min="0" max="360" step="5" value="${State.bgAngle}"></div>
            <div class="ctrl"><label>Anim Speed <span id="v-bgs">${State.bgAnimSpeed}</span></label><input type="range" id="c-bgs" min="0" max="3" step="0.1" value="${State.bgAnimSpeed}"></div>
        </div>
        <div class="section"><h3>📷 Image</h3>
            <div class="file-drop" id="bg-drop">Upload Background Image<input type="file" id="bg-input" accept="image/*" style="display:none"></div>
        </div>`;
    },
    particles() {
        return `
        <div class="section"><h3>✨ Type</h3>
            <div class="grid">
                <div class="grid-item ${State.particleType==='dust'?'active':''}" data-pt="dust"><span class="ico">🌫️</span>Dust</div>
                <div class="grid-item ${State.particleType==='snow'?'active':''}" data-pt="snow"><span class="ico">❄️</span>Snow</div>
                <div class="grid-item ${State.particleType==='rain'?'active':''}" data-pt="rain"><span class="ico">🌧️</span>Rain</div>
                <div class="grid-item ${State.particleType==='fireflies'?'active':''}" data-pt="fireflies"><span class="ico">✨</span>Fireflies</div>
                <div class="grid-item ${State.particleType==='bubbles'?'active':''}" data-pt="bubbles"><span class="ico">🫧</span>Bubbles</div>
                <div class="grid-item ${State.particleType==='stars'?'active':''}" data-pt="stars"><span class="ico">⭐</span>Stars</div>
            </div>
        </div>
        <div class="section"><h3>⚙️ Settings</h3>
            <div class="ctrl"><label>Count <span id="v-pc">${State.particleCount}</span></label><input type="range" id="c-pc" min="0" max="200" step="10" value="${State.particleCount}"></div>
            <div class="ctrl"><label>Speed <span id="v-ps">${State.particleSpeed}</span></label><input type="range" id="c-ps" min="0.1" max="4" step="0.1" value="${State.particleSpeed}"></div>
            <div class="ctrl"><label>Size <span id="v-pz">${State.particleSize}</span></label><input type="range" id="c-pz" min="1" max="8" step="0.5" value="${State.particleSize}"></div>
        </div>`;
    },
    effects() {
        return `
        <div class="section"><h3>💡 Lighting</h3>
            <div class="ctrl"><label>Vignette <span id="v-vig">${State.fxVignetteAmt}</span></label><input type="range" id="c-vig" min="0" max="1" step="0.05" value="${State.fxVignetteAmt}"></div>
        </div>
        <div class="section"><h3>📷 Camera</h3>
            <div class="ctrl"><label>Bass Zoom <span id="v-bz">${State.camBassAmt}</span></label><input type="range" id="c-bz" min="0" max="0.1" step="0.005" value="${State.camBassAmt}"></div>
            <div class="ctrl"><label>Beat Punch <span id="v-bp">${State.camPunchAmt}</span></label><input type="range" id="c-bp" min="0" max="0.1" step="0.005" value="${State.camPunchAmt}"></div>
            <div class="ctrl"><label>Shake <span id="v-sh">${State.camShakeAmt}</span></label><input type="range" id="c-sh" min="0" max="8" step="0.5" value="${State.camShakeAmt}"></div>
        </div>
        <div class="section"><h3>🎬 Overlay</h3>
            <div class="grid">
                <div class="grid-item ${State.fxOverlay==='none'?'active':''}" data-fx="none"><span class="ico">✕</span>None</div>
                <div class="grid-item ${State.fxOverlay==='grain'?'active':''}" data-fx="grain"><span class="ico">🎞️</span>Grain</div>
                <div class="grid-item ${State.fxOverlay==='scanline'?'active':''}" data-fx="scanline"><span class="ico">≡</span>Scanline</div>
                <div class="grid-item ${State.fxOverlay==='vhs'?'active':''}" data-fx="vhs"><span class="ico">📼</span>VHS</div>
                <div class="grid-item ${State.fxOverlay==='bokeh'?'active':''}" data-fx="bokeh"><span class="ico">●</span>Bokeh</div>
            </div>
            <div class="ctrl"><label>Intensity <span id="v-fxi">${State.fxOverlayAmt}</span></label><input type="range" id="c-fxi" min="0" max="1" step="0.05" value="${State.fxOverlayAmt}"></div>
        </div>`;
    },
    text() {
        return `
        <div class="section"><h3>📝 Text</h3>
            <div class="ctrl"><label>Title</label><input type="text" id="c-title" value="${State.textTitle}"></div>
            <div class="ctrl"><label>Artist</label><input type="text" id="c-artist" value="${State.textArtist}"></div>
            <div class="ctrl"><label>Color</label><input type="color" id="c-tcol" value="${State.textColor}"></div>
            <div class="ctrl"><label>Glow <span id="v-tg">${State.textGlow}</span></label><input type="range" id="c-tg" min="0" max="1" step="0.1" value="${State.textGlow}"></div>
        </div>
        <div class="section"><h3>✨ Animation</h3>
            <div class="grid">
                <div class="grid-item ${State.textAnim==='none'?'active':''}" data-ta="none"><span class="ico">—</span>None</div>
                <div class="grid-item ${State.textAnim==='fade'?'active':''}" data-ta="fade"><span class="ico">◐</span>Fade</div>
                <div class="grid-item ${State.textAnim==='bounce'?'active':''}" data-ta="bounce"><span class="ico">⤴</span>Bounce</div>
                <div class="grid-item ${State.textAnim==='pulse'?'active':''}" data-ta="pulse"><span class="ico">💓</span>Pulse</div>
                <div class="grid-item ${State.textAnim==='neon'?'active':''}" data-ta="neon"><span class="ico">💡</span>Neon</div>
                <div class="grid-item ${State.textAnim==='glitch'?'active':''}" data-ta="glitch"><span class="ico">⚡</span>Glitch</div>
            </div>
        </div>`;
    },
    templates() {
        return `
        <div class="section"><h3>🎭 Templates</h3>
            <div class="grid">${Templates.list.map(t => `<div class="grid-item" data-tpl="${t.id}"><span class="ico">${t.icon}</span>${t.name}</div>`).join('')}</div>
        </div>
        <div class="section">
            <button class="btn btn-primary" id="btn-random">🎲 Random Preset</button>
        </div>`;
    },
    export() {
        return `
        <div class="section"><h3>🎬 Export Video</h3>
            <p class="info" style="margin-bottom:10px;">Records canvas as WebM video <b>without audio</b>. Combine with your MP3 in any video editor.</p>
            <button class="btn btn-primary" id="btn-rec-start">⏺ Start Recording</button>
            <button class="btn btn-danger" id="btn-rec-stop" style="margin-top:6px;display:none;">⏹ Stop & Download</button>
        </div>
        <div class="section"><h3>ℹ️ Info</h3>
            <p class="info">• Output: WebM (VP9) without audio<br>• Resolution: matches canvas size<br>• FPS: 30<br>• Combine with MP3 in CapCut / Premiere / DaVinci</p>
        </div>`;
    }
};



// ============================================================
// MAIN APPLICATION
// ============================================================
const App = {
    canvas: null,
    ctx: null,
    currentPanel: 'dashboard',
    frameCount: 0,
    lastFpsTime: 0,
    fps: 0,

    init() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        BGParticles.init();
        this.setupNav();
        this.setupTransport();
        this.setupDragDrop();
        this.setupKeyboard();
        this.showPanel('dashboard');
        this.loop();
    },

    resize() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        BGParticles.init();
    },

    setupNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showPanel(btn.dataset.panel);
            });
        });
    },

    setupTransport() {
        document.getElementById('btn-play').addEventListener('click', () => AudioEngine.play());
        document.getElementById('btn-pause').addEventListener('click', () => AudioEngine.pause());
        document.getElementById('btn-stop').addEventListener('click', () => AudioEngine.stop());
        document.getElementById('seek-bar').addEventListener('input', e => {
            const t = (e.target.value / 1000) * AudioEngine.duration;
            AudioEngine.seek(t);
        });
    },

    setupDragDrop() {
        const container = document.getElementById('canvas-container');
        const overlay = document.getElementById('drop-overlay');
        container.addEventListener('dragover', e => { e.preventDefault(); overlay.classList.add('active'); });
        container.addEventListener('dragleave', () => overlay.classList.remove('active'));
        container.addEventListener('drop', e => {
            e.preventDefault(); overlay.classList.remove('active');
            const file = e.dataTransfer.files[0];
            if (!file) return;
            if (file.type.startsWith('audio/')) this.loadAudio(file);
            else if (file.type.startsWith('image/')) this.loadBgImage(file);
        });
    },

    setupKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT') return;
            switch(e.key) {
                case ' ': e.preventDefault(); AudioEngine.isPlaying ? AudioEngine.pause() : AudioEngine.play(); break;
                case 's': AudioEngine.stop(); break;
                case 'r': Exporter.isRecording ? Exporter.stop() : Exporter.start(this.canvas); break;
                case '1': State.activeViz='bars'; break;
                case '2': State.activeViz='circular'; break;
                case '3': State.activeViz='waveform'; break;
                case '4': State.activeViz='mirror'; break;
                case '5': State.activeViz='neon'; break;
                case '6': State.activeViz='particles'; break;
                case '7': State.activeViz='energy'; break;
            }
        });
    },

    async loadAudio(file) {
        await AudioEngine.loadFile(file);
        State.textTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        AudioEngine.play();
    },

    loadBgImage(file) {
        const img = new Image();
        img.onload = () => { State.bgImage = img; State.bgType = 'image'; };
        img.src = URL.createObjectURL(file);
    },

    showPanel(id) {
        this.currentPanel = id;
        const sidebar = document.getElementById('sidebar');
        const props = document.getElementById('properties-panel');
        sidebar.innerHTML = Panels[id] ? Panels[id]() : '';
        props.innerHTML = id === 'dashboard' ? `<div class="section"><h3>⚡ Quick Start</h3><p class="info">1. Drop MP3 onto canvas<br>2. Pick a visualizer<br>3. Customize everything<br>4. Export video<br>5. Merge with MP3 in editor</p></div><div class="section"><h3>⌨️ Shortcuts</h3><p class="info">Space – Play/Pause<br>S – Stop<br>R – Record<br>1-7 – Switch Viz</p></div>` : '';
        setTimeout(() => this.bindPanelEvents(), 30);
    },

    bindPanelEvents() {
        // Audio
        this._bind('c-sens','v-sens', v => AudioEngine.setSensitivity(v));
        this._bind('c-gain','v-gain', v => AudioEngine.setGain(v));
        this._bind('c-smooth','v-smooth', v => AudioEngine.setSmoothing(v));
        this._bind('c-beat','v-beat', v => AudioEngine.setBeatThreshold(v));
        // Audio file
        const audioDrop = document.getElementById('audio-drop');
        const audioInput = document.getElementById('audio-input');
        if (audioDrop) { audioDrop.addEventListener('click', () => audioInput.click()); }
        if (audioInput) { audioInput.addEventListener('change', e => { if(e.target.files[0]) this.loadAudio(e.target.files[0]); }); }
        // Visualizer selection
        document.querySelectorAll('[data-viz]').forEach(el => el.addEventListener('click', () => {
            document.querySelectorAll('[data-viz]').forEach(x => x.classList.remove('active'));
            el.classList.add('active'); State.activeViz = el.dataset.viz;
        }));
        // Colors
        this._bindColor('c-col1', v => State.vizColors[0] = v);
        this._bindColor('c-col2', v => State.vizColors[1] = v);
        this._bindColor('c-col3', v => State.vizColors[2] = v);
        // Viz settings
        this._bind('c-bars','v-bars', v => State.vizBarCount = v);
        this._bind('c-glow','v-glow', v => State.vizGlow = v);
        this._bind('c-react','v-react', v => State.vizReactivity = v);
        // Background
        document.querySelectorAll('[data-bg]').forEach(el => el.addEventListener('click', () => {
            document.querySelectorAll('[data-bg]').forEach(x => x.classList.remove('active'));
            el.classList.add('active'); State.bgType = el.dataset.bg;
        }));
        this._bindColor('c-bg1', v => State.bgGrad[0] = v);
        this._bindColor('c-bg2', v => State.bgGrad[1] = v);
        this._bindColor('c-bg3', v => { if(State.bgGrad.length>2) State.bgGrad[2]=v; else State.bgGrad.push(v); });
        this._bind('c-bga','v-bga', v => State.bgAngle = v);
        this._bind('c-bgs','v-bgs', v => State.bgAnimSpeed = v);
        const bgDrop = document.getElementById('bg-drop');
        const bgInput = document.getElementById('bg-input');
        if (bgDrop) { bgDrop.addEventListener('click', () => bgInput.click()); }
        if (bgInput) { bgInput.addEventListener('change', e => { if(e.target.files[0]) this.loadBgImage(e.target.files[0]); }); }
        // Particles
        document.querySelectorAll('[data-pt]').forEach(el => el.addEventListener('click', () => {
            document.querySelectorAll('[data-pt]').forEach(x => x.classList.remove('active'));
            el.classList.add('active'); State.particleType = el.dataset.pt; BGParticles.init();
        }));
        this._bind('c-pc','v-pc', v => { State.particleCount = v; BGParticles.init(); });
        this._bind('c-ps','v-ps', v => State.particleSpeed = v);
        this._bind('c-pz','v-pz', v => State.particleSize = v);
        // Effects
        this._bind('c-vig','v-vig', v => { State.fxVignetteAmt = v; State.fxVignette = v > 0; });
        this._bind('c-bz','v-bz', v => { State.camBassAmt = v; State.camBassZoom = v > 0; });
        this._bind('c-bp','v-bp', v => { State.camPunchAmt = v; State.camBeatPunch = v > 0; });
        this._bind('c-sh','v-sh', v => { State.camShakeAmt = v; State.camShake = v > 0; });
        document.querySelectorAll('[data-fx]').forEach(el => el.addEventListener('click', () => {
            document.querySelectorAll('[data-fx]').forEach(x => x.classList.remove('active'));
            el.classList.add('active'); State.fxOverlay = el.dataset.fx;
        }));
        this._bind('c-fxi','v-fxi', v => State.fxOverlayAmt = v);
        // Text
        const titleIn = document.getElementById('c-title');
        const artistIn = document.getElementById('c-artist');
        if (titleIn) titleIn.addEventListener('input', e => State.textTitle = e.target.value);
        if (artistIn) artistIn.addEventListener('input', e => State.textArtist = e.target.value);
        this._bindColor('c-tcol', v => State.textColor = v);
        this._bind('c-tg','v-tg', v => State.textGlow = v);
        document.querySelectorAll('[data-ta]').forEach(el => el.addEventListener('click', () => {
            document.querySelectorAll('[data-ta]').forEach(x => x.classList.remove('active'));
            el.classList.add('active'); State.textAnim = el.dataset.ta;
        }));
        // Templates
        document.querySelectorAll('[data-tpl]').forEach(el => el.addEventListener('click', () => {
            Templates.apply(el.dataset.tpl);
            document.querySelectorAll('[data-tpl]').forEach(x => x.classList.remove('active'));
            el.classList.add('active');
        }));
        const randomBtn = document.getElementById('btn-random');
        if (randomBtn) randomBtn.addEventListener('click', () => {
            const t = Templates.list[Math.floor(Math.random()*Templates.list.length)];
            Templates.apply(t.id);
        });
        // Export
        const recStart = document.getElementById('btn-rec-start');
        const recStop = document.getElementById('btn-rec-stop');
        if (recStart) recStart.addEventListener('click', () => {
            Exporter.start(this.canvas);
            recStart.style.display = 'none'; recStop.style.display = 'block';
            if (!AudioEngine.isPlaying && AudioEngine.buffer) AudioEngine.play();
        });
        if (recStop) recStop.addEventListener('click', () => {
            Exporter.stop();
            recStart.style.display = 'block'; recStop.style.display = 'none';
        });
    },

    _bind(inputId, displayId, cb) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.addEventListener('input', () => {
            const v = parseFloat(el.value);
            const d = document.getElementById(displayId);
            if (d) d.textContent = v;
            cb(v);
        });
    },
    _bindColor(id, cb) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => cb(el.value));
    },

    // === RENDER LOOP ===
    loop() {
        requestAnimationFrame(() => this.loop());
        this.render();
        // FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) { this.fps = this.frameCount; this.frameCount = 0; this.lastFpsTime = now; }
    },

    render() {
        const w = this.canvas.width, h = this.canvas.height;
        const ctx = this.ctx;
        const data = AudioEngine.analyze();
        State.time += 0.016;

        ctx.clearRect(0, 0, w, h);

        // Camera
        ctx.save();
        Camera.apply(ctx, w, h, data);

        // Background
        Background.render(ctx, w, h, data);

        // Background Particles
        if (State.particleCount > 0) {
            BGParticles.update(data);
            BGParticles.render(ctx);
        }

        // Visualizer
        const vizFn = Visualizers[State.activeViz];
        if (vizFn) vizFn(ctx, w, h, data);

        ctx.restore();

        // Post effects
        Effects.apply(ctx, w, h, data);

        // Text
        TextRenderer.render(ctx, w, h, data);

        // Update UI meters
        this.updateUI(data);
    },

    updateUI(data) {
        const set = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = (pct*100)+'%'; };
        set('m-bass', data.bass); set('m-mid', data.mid); set('m-treble', data.treble); set('m-overall', data.overall);

        // Time
        const cur = AudioEngine.getTime(), dur = AudioEngine.duration;
        const fmt = s => { const m=Math.floor(s/60), sec=Math.floor(s%60); return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; };
        document.getElementById('time-display').textContent = `${fmt(cur)} / ${fmt(dur)}`;
        if (dur > 0) document.getElementById('seek-bar').value = Math.floor((cur/dur)*1000);
        document.getElementById('bpm-display').textContent = `BPM: ${data.bpm || '--'}`;
        document.getElementById('fps-display').textContent = `FPS: ${this.fps}`;
    }
};

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
