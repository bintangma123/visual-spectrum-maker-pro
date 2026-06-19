/**
 * Visual Spectrum Maker PRO V1.0 - Stable Release
 * Pure HTML5 + CSS + JavaScript. Zero dependencies.
 * Open index.html in Chrome/Edge to run.
 */
"use strict";

// Polyfill roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
        const rad = Array.isArray(r)?r[0]||0:r||0;
        this.moveTo(x+rad,y); this.lineTo(x+w-rad,y);
        this.quadraticCurveTo(x+w,y,x+w,y+rad); this.lineTo(x+w,y+h);
        this.lineTo(x,y+h); this.lineTo(x,y+rad);
        this.quadraticCurveTo(x,y,x+rad,y); this.closePath();
    };
}


// ============================================================
// NOTIFICATION SYSTEM
// ============================================================
const Notify = {
    show(msg, type='info') {
        const el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2500);
    }
};

// ============================================================
// AUDIO ENGINE
// ============================================================
const AudioEngine = {
    ctx: null, analyser: null, gainNode: null, source: null, buffer: null,
    freqData: null, timeData: null, isPlaying: false,
    startTime: 0, pauseTime: 0, duration: 0, bpm: 0,
    beatHistory: [], lastBeatTime: 0,
    config: { sensitivity: 1.5, gain: 1.0, smoothing: 0.8, beatThreshold: 0.6 },
    volume: 1.0, muted: false,

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
        this.stop();
        const ab = await file.arrayBuffer();
        this.buffer = await this.ctx.decodeAudioData(ab);
        this.duration = this.buffer.duration;
        this.pauseTime = 0;
        this.bpm = 0; this.beatHistory = []; this.lastBeatTime = 0;
    },

    play() {
        if (!this.buffer) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this._stopSource();
        this.source = this.ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gainNode);
        const offset = Math.min(this.pauseTime, this.duration);
        this.source.start(0, offset);
        this.startTime = this.ctx.currentTime - offset;
        this.isPlaying = true;
        this.source.onended = () => { if (this.isPlaying) { this.isPlaying = false; this.pauseTime = 0; } };
    },

    pause() {
        if (!this.isPlaying) return;
        this.pauseTime = this.ctx.currentTime - this.startTime;
        this._stopSource();
        this.isPlaying = false;
    },

    stop() { this._stopSource(); this.isPlaying = false; this.pauseTime = 0; },

    _stopSource() {
        if (this.source) { try{this.source.stop();}catch(e){} this.source.disconnect(); this.source = null; }
    },

    seek(t) { const was = this.isPlaying; this.stop(); this.pauseTime = Math.max(0, Math.min(t, this.duration)); if (was) this.play(); },
    getTime() { if (!this.isPlaying) return this.pauseTime; const t = this.ctx.currentTime - this.startTime; return Math.min(t, this.duration); },

    setVolume(v) { this.volume = v; if (this.gainNode) this.gainNode.gain.value = this.muted ? 0 : v * this.config.gain; },
    toggleMute() { this.muted = !this.muted; if (this.gainNode) this.gainNode.gain.value = this.muted ? 0 : this.volume * this.config.gain; return this.muted; },

    analyze() {
        if (!this.analyser) return {bass:0,mid:0,treble:0,overall:0,isBeat:false,freq:new Uint8Array(1024),time:new Uint8Array(1024),bpm:0};
        this.analyser.getByteFrequencyData(this.freqData);
        this.analyser.getByteTimeDomainData(this.timeData);
        const len = this.freqData.length, sens = this.config.sensitivity;
        const bEnd = Math.floor(len*0.1), mEnd = Math.floor(len*0.5);
        let bass=0,mid=0,treble=0,total=0;
        for (let i=0;i<len;i++) { const v=(this.freqData[i]/255)*sens; total+=v; if(i<bEnd)bass+=v; else if(i<mEnd)mid+=v; else treble+=v; }
        bass=Math.min(bass/bEnd,1); mid=Math.min(mid/(mEnd-bEnd),1); treble=Math.min(treble/(len-mEnd),1);
        const overall=Math.min(total/len,1);
        const isBeat = this._detectBeat(bass);
        return {bass,mid,treble,overall,isBeat,freq:this.freqData,time:this.timeData,bpm:this.bpm};
    },

    _detectBeat(level) {
        const now = performance.now();
        if (level > this.config.beatThreshold && (now-this.lastBeatTime)>200) {
            if (this.lastBeatTime>0) { this.beatHistory.push(now-this.lastBeatTime); if(this.beatHistory.length>20) this.beatHistory.shift(); const avg=this.beatHistory.reduce((a,b)=>a+b,0)/this.beatHistory.length; this.bpm=Math.round(60000/avg); }
            this.lastBeatTime=now; return true;
        }
        return false;
    },

    setGain(v) { this.config.gain=v; if(this.gainNode) this.gainNode.gain.value = this.muted?0:this.volume*v; },
    setSensitivity(v) { this.config.sensitivity=v; },
    setSmoothing(v) { this.config.smoothing=v; if(this.analyser) this.analyser.smoothingTimeConstant=v; },
    setBeatThreshold(v) { this.config.beatThreshold=v; }
};


// ============================================================
// STATE
// ============================================================
const State = {
    activeViz:'bars', bgType:'gradient', bgColor:'#0a0a1a',
    bgGrad:['#0a0a1a','#1a0a2e','#0a1a2e'], bgAngle:135, bgAnimSpeed:0.5,
    bgImage:null, bgVideo:null, bgReactive:true,
    particleType:'fireflies', particleCount:80, particleSpeed:1, particleSize:3, particleReactive:true,
    vizColors:['#6c5ce7','#a29bfe','#00f5ff'], vizBarCount:64, vizGlow:0.5, vizReactivity:1, vizMirror:false,
    fxVignette:true, fxVignetteAmt:0.4, fxOverlay:'none', fxOverlayAmt:0.3,
    camBassZoom:true, camBassAmt:0.04, camBeatPunch:true, camPunchAmt:0.03, camShake:false, camShakeAmt:2,
    textTitle:'Song Title', textArtist:'Artist Name', textAnim:'none', textColor:'#ffffff', textGlow:0,
    logoImage:null, logoSize:60, logoX:0.5, logoY:0.12, logoGlow:0,
    punchDecay:0, vizParticles:[], time:0, exportName:'visual-spectrum'
};

// ============================================================
// VISUALIZERS
// ============================================================
const Visualizers = {
    bars(ctx,w,h,data) {
        const {freq}=data, count=State.vizBarCount, gap=2, totalW=w*0.85;
        const barW=(totalW/count)-gap, startX=(w-totalW)/2, baseY=h*0.75;
        ctx.shadowBlur=State.vizGlow*15; ctx.shadowColor=State.vizColors[0];
        for(let i=0;i<count;i++){
            const idx=Math.floor(i*freq.length/count), val=(freq[idx]/255)*State.vizReactivity;
            const barH=val*h*0.6, x=startX+i*(barW+gap);
            const grad=ctx.createLinearGradient(x,baseY,x,baseY-barH);
            grad.addColorStop(0,State.vizColors[0]); grad.addColorStop(0.5,State.vizColors[1]); grad.addColorStop(1,State.vizColors[2]);
            ctx.fillStyle=grad; ctx.beginPath(); ctx.roundRect(x,baseY-barH,barW,barH,[3,3,0,0]); ctx.fill();
            if(State.vizMirror){ctx.globalAlpha=0.3;ctx.fillRect(x,baseY+2,barW,barH*0.25);ctx.globalAlpha=1;}
        }
        ctx.shadowBlur=0;
    },
    circular(ctx,w,h,data) {
        const {freq,bass}=data, cx=w/2, cy=h/2, radius=Math.min(w,h)*0.22, count=State.vizBarCount;
        const rot = State.time*0.5 + bass*0.5;
        ctx.shadowBlur=State.vizGlow*12; ctx.shadowColor=State.vizColors[0];
        for(let i=0;i<count;i++){
            const idx=Math.floor(i*freq.length/count), val=(freq[idx]/255)*State.vizReactivity;
            const angle=(i/count)*Math.PI*2+rot, len=val*radius*1.4;
            const x1=cx+Math.cos(angle)*radius, y1=cy+Math.sin(angle)*radius;
            const x2=cx+Math.cos(angle)*(radius+len), y2=cy+Math.sin(angle)*(radius+len);
            const grad=ctx.createLinearGradient(x1,y1,x2,y2);
            grad.addColorStop(0,State.vizColors[0]); grad.addColorStop(1,State.vizColors[2]);
            ctx.strokeStyle=grad; ctx.lineWidth=3; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }
        ctx.strokeStyle=State.vizColors[1]; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(cx,cy,radius*(0.95+bass*0.05),0,Math.PI*2); ctx.stroke();
        ctx.shadowBlur=0;
    },
    waveform(ctx,w,h,data) {
        const {time:td,bass}=data, cy=h/2, amp=h*0.3*State.vizReactivity;
        ctx.shadowBlur=State.vizGlow*10; ctx.shadowColor=State.vizColors[0];
        const grad=ctx.createLinearGradient(0,cy-amp,0,cy+amp);
        grad.addColorStop(0,State.vizColors[2]); grad.addColorStop(0.5,State.vizColors[0]); grad.addColorStop(1,State.vizColors[1]);
        ctx.strokeStyle=grad; ctx.lineWidth=2+bass*2; ctx.lineCap='round'; ctx.beginPath();
        const slice=w/td.length;
        for(let i=0;i<td.length;i++){const v=td[i]/128,y=cy+(v-1)*amp; i===0?ctx.moveTo(0,y):ctx.lineTo(i*slice,y);}
        ctx.stroke(); ctx.shadowBlur=0;
    },
    mirror(ctx,w,h,data) {
        const {freq}=data, count=State.vizBarCount, gap=2, totalW=w*0.85;
        const barW=(totalW/count)-gap, startX=(w-totalW)/2, cy=h/2;
        ctx.shadowBlur=State.vizGlow*12; ctx.shadowColor=State.vizColors[0];
        for(let i=0;i<count;i++){
            const idx=Math.floor(i*freq.length/count), val=(freq[idx]/255)*State.vizReactivity, barH=val*h*0.35;
            const x=startX+i*(barW+gap);
            const grad=ctx.createLinearGradient(x,cy-barH,x,cy+barH);
            grad.addColorStop(0,State.vizColors[2]); grad.addColorStop(0.5,State.vizColors[0]); grad.addColorStop(1,State.vizColors[2]);
            ctx.fillStyle=grad; ctx.fillRect(x,cy-barH,barW,barH); ctx.fillRect(x,cy,barW,barH);
        }
        ctx.shadowBlur=0;
    },
    neon(ctx,w,h,data) {
        const {freq}=data, count=State.vizBarCount, totalW=w*0.8, barW=(totalW/count)-2;
        const startX=(w-totalW)/2, baseY=h*0.65;
        for(let pass=0;pass<3;pass++){
            ctx.shadowBlur=[20,10,0][pass]; ctx.shadowColor=State.vizColors[0]; ctx.globalAlpha=[0.3,0.6,1][pass];
            for(let i=0;i<count;i++){
                const idx=Math.floor(i*freq.length/count), val=(freq[idx]/255)*State.vizReactivity;
                const barH=val*h*0.45, x=startX+i*(barW+2), hue=(i/count)*100+240;
                ctx.fillStyle=`hsl(${hue},85%,${50+val*25}%)`; ctx.fillRect(x,baseY-barH,barW,barH);
            }
        }
        ctx.globalAlpha=1; ctx.shadowBlur=0;
        // Reflection
        ctx.globalAlpha=0.15;
        for(let i=0;i<count;i++){const idx=Math.floor(i*freq.length/count);const val=(freq[idx]/255)*State.vizReactivity;const x=startX+i*(barW+2);ctx.fillStyle=State.vizColors[0];ctx.fillRect(x,baseY+2,barW,val*h*0.12);}
        ctx.globalAlpha=1;
    },
    particles(ctx,w,h,data) {
        const {freq,bass,isBeat}=data, cx=w/2,cy=h/2;
        if(isBeat){for(let i=0;i<15;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*5*bass;State.vizParticles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:1+Math.random()*3,color:State.vizColors[Math.floor(Math.random()*3)]});}}
        for(let i=0;i<32;i++){const idx=Math.floor(i*freq.length/32),val=freq[idx]/255;if(val>0.6&&Math.random()>0.8){const a=(i/32)*Math.PI*2,r=Math.min(w,h)*0.15;State.vizParticles.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,vx:Math.cos(a)*val*3,vy:Math.sin(a)*val*3,life:1,size:val*3,color:State.vizColors[Math.floor(Math.random()*3)]});}}
        for(let i=State.vizParticles.length-1;i>=0;i--){const p=State.vizParticles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=0.97;p.vy*=0.97;p.life-=0.015;if(p.life<=0){State.vizParticles.splice(i,1);continue;}ctx.globalAlpha=p.life;ctx.shadowBlur=8;ctx.shadowColor=p.color;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();}
        if(State.vizParticles.length>400) State.vizParticles=State.vizParticles.slice(-400);
        ctx.globalAlpha=1;ctx.shadowBlur=0;
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,80+bass*40);g.addColorStop(0,`rgba(108,92,231,${bass*0.3})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    },
    energy(ctx,w,h,data) {
        const {freq,bass,overall}=data, cx=w/2,cy=h/2, maxR=Math.min(w,h)*0.35;
        for(let r=0;r<5;r++){
            const start=Math.floor(r*freq.length/5),end=Math.floor((r+1)*freq.length/5);let avg=0;
            for(let i=start;i<end;i++) avg+=freq[i]; avg=avg/(end-start)/255;
            const radius=(r+1)*(maxR/5)*(0.8+avg*0.4),hue=260+r*30;
            ctx.strokeStyle=`hsla(${hue},80%,60%,${avg*0.8})`; ctx.lineWidth=1+avg*3;
            ctx.shadowBlur=avg*12; ctx.shadowColor=`hsl(${hue},80%,60%)`;
            ctx.beginPath();
            for(let a=0;a<=Math.PI*2;a+=0.05){const fi=Math.floor((a/(Math.PI*2))*(end-start))+start;const fv=(freq[fi]||0)/255*State.vizReactivity;const wave=Math.sin(a*8+State.time*2)*fv*8;const px=cx+Math.cos(a)*(radius+wave);const py=cy+Math.sin(a)*(radius+wave);a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
            ctx.closePath(); ctx.stroke();
        }
        const coreG=ctx.createRadialGradient(cx,cy,0,cx,cy,15+overall*15);
        coreG.addColorStop(0,`rgba(255,255,255,${0.7+bass*0.3})`);coreG.addColorStop(0.4,'rgba(108,92,231,0.5)');coreG.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=coreG;ctx.beginPath();ctx.arc(cx,cy,15+overall*15,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
};


// ============================================================
// BACKGROUND, PARTICLES, EFFECTS, CAMERA, TEXT, LOGO, EXPORT
// ============================================================
const Background = { time:0, render(ctx,w,h,data) { this.time+=0.016; switch(State.bgType){ case'solid':ctx.fillStyle=State.bgColor;ctx.fillRect(0,0,w,h);break; case'gradient':{const a=State.bgAngle*Math.PI/180;const g=ctx.createLinearGradient(w/2+Math.cos(a)*w/2,h/2+Math.sin(a)*h/2,w/2-Math.cos(a)*w/2,h/2-Math.sin(a)*h/2);State.bgGrad.forEach((c,i)=>g.addColorStop(i/(State.bgGrad.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);break;} case'animated':{const s=State.bgAnimSpeed,cx=w/2+Math.cos(this.time*s)*w*0.3,cy=h/2+Math.sin(this.time*s)*h*0.3,r=Math.max(w,h)*(0.8+(State.bgReactive?data.bass*0.2:0));const g=ctx.createRadialGradient(cx,cy,0,w/2,h/2,r);State.bgGrad.forEach((c,i)=>g.addColorStop(i/(State.bgGrad.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);break;} case'image':if(State.bgImage){const zoom=State.bgReactive?1+data.bass*0.02:1;ctx.save();ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);ctx.translate(-w/2,-h/2);const iw=State.bgImage.width,ih=State.bgImage.height,sc=Math.max(w/iw,h/ih),dw=iw*sc,dh=ih*sc;ctx.drawImage(State.bgImage,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore();}else{ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);}break; case'video':if(State.bgVideo&&State.bgVideo.readyState>=2){const zoom=State.bgReactive?1+data.bass*0.02:1;ctx.save();ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);ctx.translate(-w/2,-h/2);const vw=State.bgVideo.videoWidth||w,vh=State.bgVideo.videoHeight||h,sc=Math.max(w/vw,h/vh),dw=vw*sc,dh=vh*sc;ctx.drawImage(State.bgVideo,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore();}else{ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);}break; default:ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);}}};

const BGParticles = { list:[], init(){ this.list=[]; for(let i=0;i<State.particleCount;i++) this.list.push(this._create()); },
    _create(fromEdge){ const w=App.canvas?App.canvas.width:1920,h=App.canvas?App.canvas.height:1080,t=State.particleType; let x=Math.random()*w,y=Math.random()*h,vx=0,vy=0;
        switch(t){case'snow':vx=(Math.random()-.5)*.5;vy=.5+Math.random()*1.5;if(fromEdge)y=-10;break;case'rain':vx=-1;vy=6+Math.random()*4;if(fromEdge)y=-10;break;case'fireflies':vx=(Math.random()-.5)*1.5;vy=(Math.random()-.5)*1.5;break;case'bubbles':vx=(Math.random()-.5)*.5;vy=-(0.5+Math.random());if(fromEdge)y=h+10;break;case'stars':vx=0;vy=0;break;default:vx=(Math.random()-.5)*.8;vy=(Math.random()-.5)*.8;}
        return{x,y,vx,vy,size:State.particleSize*(0.5+Math.random()),opacity:0.3+Math.random()*0.5,phase:Math.random()*Math.PI*2};},
    update(data){const w=App.canvas.width,h=App.canvas.height,mf=State.particleReactive?data.overall*1.5:0;
        for(let i=this.list.length-1;i>=0;i--){const p=this.list[i],spd=State.particleSpeed*(1+mf);p.x+=p.vx*spd;p.y+=p.vy*spd;p.phase+=0.02;
            if(State.particleType==='fireflies'){p.vx+=(Math.random()-.5)*.08;p.vy+=(Math.random()-.5)*.08;p.opacity=0.2+Math.sin(p.phase)*0.5;}
            if(State.particleType==='stars'){p.opacity=0.3+Math.sin(p.phase)*0.4;p.size=State.particleSize*(0.8+data.bass*0.4);}
            if(p.x<-30||p.x>w+30||p.y<-30||p.y>h+30)this.list[i]=this._create(true);}
        while(this.list.length<State.particleCount)this.list.push(this._create());if(this.list.length>State.particleCount)this.list.length=State.particleCount;},
    render(ctx){for(const p of this.list){ctx.globalAlpha=p.opacity*0.7;ctx.fillStyle='#fff';ctx.shadowBlur=State.particleType==='fireflies'?10:3;ctx.shadowColor=State.vizColors[1];
        if(State.particleType==='rain'){ctx.strokeStyle='rgba(200,220,255,0.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+1,p.y+p.size*3);ctx.stroke();}
        else{ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha=1;ctx.shadowBlur=0;}};

const Effects = { grainSeed:0, apply(ctx,w,h,data){
    if(State.fxVignette){const i=State.fxVignetteAmt*(1+data.bass*0.2),g=ctx.createRadialGradient(w/2,h/2,w*0.3,w/2,h/2,w*0.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${i})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
    switch(State.fxOverlay){case'grain':this._grain(ctx,w,h);break;case'scanline':this._scanlines(ctx,w,h);break;case'vhs':this._vhs(ctx,w,h);break;case'bokeh':this._bokeh(ctx,w,h,data);break;}},
    _grain(ctx,w,h){ctx.globalAlpha=State.fxOverlayAmt*0.08;const s=8;for(let x=0;x<w;x+=s)for(let y=0;y<h;y+=s){const v=Math.random()>0.5?200:50;ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(x,y,s,s);}ctx.globalAlpha=1;},
    _scanlines(ctx,w,h){ctx.globalAlpha=State.fxOverlayAmt*0.25;ctx.fillStyle='rgba(0,0,0,0.4)';for(let y=0;y<h;y+=4)ctx.fillRect(0,y,w,2);ctx.globalAlpha=1;},
    _vhs(ctx,w,h){if(Math.random()<State.fxOverlayAmt*0.05){const y=Math.random()*h,sl=3+Math.random()*6;try{const img=ctx.getImageData(0,Math.floor(y),w,Math.floor(sl));ctx.putImageData(img,Math.floor((Math.random()-.5)*12),Math.floor(y));}catch(e){}}ctx.globalAlpha=State.fxOverlayAmt*0.06;ctx.fillStyle='rgba(255,0,0,0.5)';ctx.fillRect(2,0,w,h);ctx.fillStyle='rgba(0,255,255,0.5)';ctx.fillRect(-2,0,w,h);ctx.globalAlpha=1;},
    _bokeh(ctx,w,h,data){ctx.save();ctx.globalCompositeOperation='screen';const t=State.time;for(let i=0;i<6;i++){const x=(Math.sin(t*0.3+i*1.7)*0.5+0.5)*w,y=(Math.cos(t*0.2+i*2.3)*0.5+0.5)*h,sz=20+Math.sin(t+i)*12+data.bass*15,g=ctx.createRadialGradient(x,y,0,x,y,sz);g.addColorStop(0,'rgba(162,155,254,0.06)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fill();}ctx.restore();}};

const Camera = { apply(ctx,w,h,data){let tx=0,ty=0,scale=1;if(State.camBassZoom)scale+=data.bass*State.camBassAmt;if(State.camBeatPunch){if(data.isBeat)State.punchDecay=State.camPunchAmt;scale+=State.punchDecay;State.punchDecay*=0.9;}if(State.camShake){const i=State.camShakeAmt*data.bass;tx=(Math.random()-.5)*i;ty=(Math.random()-.5)*i;}ctx.translate(w/2+tx,h/2+ty);ctx.scale(scale,scale);ctx.translate(-w/2,-h/2);}};

const TextRenderer = { time:0, render(ctx,w,h,data){ this.time+=0.016; if(!State.textTitle&&!State.textArtist)return; const baseY=h*0.82;
    if(State.textTitle)this._draw(ctx,w,State.textTitle,baseY,30,'700',data);
    if(State.textArtist){ctx.globalAlpha=0.7;this._draw(ctx,w,State.textArtist,baseY+38,15,'400',data);ctx.globalAlpha=1;}},
    _draw(ctx,w,text,y,size,weight,data){let x=w/2,alpha=1,scale=1;switch(State.textAnim){case'fade':alpha=0.4+Math.sin(this.time*2)*0.6;break;case'bounce':y+=Math.abs(Math.sin(this.time*3))*-12;break;case'pulse':scale=1+data.bass*0.1;break;case'neon':State.textGlow=0.5+Math.sin(this.time*4)*0.5;break;case'glitch':if(Math.random()>.95){x+=(Math.random()-.5)*8;y+=(Math.random()-.5)*4;}break;}
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(scale,scale);ctx.font=`${weight} ${size}px -apple-system,'Segoe UI',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';if(State.textGlow>0){ctx.shadowBlur=State.textGlow*20;ctx.shadowColor=State.vizColors[0];}ctx.fillStyle=State.textColor;ctx.fillText(text,0,0);ctx.restore();}};

const LogoRenderer = { render(ctx,w,h,data) { if(!State.logoImage)return; const s=State.logoSize,x=State.logoX*w-s/2,y=State.logoY*h-s/2;ctx.save();if(State.logoGlow>0){ctx.shadowBlur=State.logoGlow*15;ctx.shadowColor=State.vizColors[0];}const pulse=State.camBeatPunch&&data.isBeat?1.05:1;ctx.translate(x+s/2,y+s/2);ctx.scale(pulse,pulse);ctx.translate(-s/2,-s/2);ctx.drawImage(State.logoImage,0,0,s,s);ctx.restore();}};

const Templates = { list:[
    {id:'spotify',name:'Spotify',icon:'🟢',viz:'bars',bg:'gradient',bgGrad:['#191414','#1a1a2e'],colors:['#1DB954','#1ed760','#fff'],particles:'dust',overlay:'none'},
    {id:'trap',name:'Trap Nation',icon:'🔮',viz:'circular',bg:'gradient',bgGrad:['#0a0a1a','#1a0033','#330066'],colors:['#ff00ff','#8b00ff','#fff'],particles:'dust',overlay:'none'},
    {id:'ncs',name:'NCS',icon:'⚡',viz:'neon',bg:'solid',bgGrad:['#000','#000'],colors:['#00f5ff','#0080ff','#ff00ff'],particles:'none',overlay:'none'},
    {id:'monstercat',name:'Monstercat',icon:'🐱',viz:'bars',bg:'gradient',bgGrad:['#1a1a2e','#16213e','#0f3460'],colors:['#fff','#6c5ce7','#a29bfe'],particles:'none',overlay:'none'},
    {id:'lofi',name:'LoFi Girl',icon:'☕',viz:'waveform',bg:'animated',bgGrad:['#2d1b69','#553c9a','#6b46c1'],colors:['#ffd93d','#ffb347','#ff6b6b'],particles:'fireflies',overlay:'grain'},
    {id:'edm',name:'EDM',icon:'🎧',viz:'particles',bg:'solid',bgGrad:['#000','#000'],colors:['#ff0080','#7700ff','#00f5ff'],particles:'none',overlay:'none'},
    {id:'chill',name:'Chill',icon:'🌊',viz:'waveform',bg:'animated',bgGrad:['#0f2027','#203a43','#2c5364'],colors:['#74b9ff','#a29bfe','#fff'],particles:'snow',overlay:'bokeh'},
    {id:'podcast',name:'Podcast',icon:'🎙️',viz:'waveform',bg:'gradient',bgGrad:['#1a1a2e','#232323'],colors:['#fff','#ccc','#999'],particles:'none',overlay:'none'},
    {id:'synthwave',name:'Synthwave',icon:'🌆',viz:'mirror',bg:'gradient',bgGrad:['#0a0020','#1a0040','#2a0060'],colors:['#ff00ff','#ff6600','#00ffff'],particles:'stars',overlay:'scanline'},
    {id:'vaporwave',name:'Vaporwave',icon:'🌸',viz:'bars',bg:'animated',bgGrad:['#ff71ce','#01cdfe','#b967ff'],colors:['#ff71ce','#01cdfe','#05ffa1'],particles:'none',overlay:'vhs'},
    {id:'cinema',name:'Cinematic',icon:'🎬',viz:'waveform',bg:'gradient',bgGrad:['#000','#0a0a0a','#1a1a1a'],colors:['#d4af37','#fff','#888'],particles:'dust',overlay:'grain'},
    {id:'gaming',name:'Gaming',icon:'🎮',viz:'energy',bg:'solid',bgGrad:['#050510','#050510'],colors:['#ff0000','#00ff00','#0000ff'],particles:'none',overlay:'scanline'},
    {id:'worship',name:'Worship',icon:'✝️',viz:'waveform',bg:'animated',bgGrad:['#1a0a00','#2a1500','#1a0a00'],colors:['#ffd700','#ffaa00','#fff'],particles:'fireflies',overlay:'bokeh'},
    {id:'ambient',name:'Ambient',icon:'🌌',viz:'energy',bg:'animated',bgGrad:['#000428','#004e92','#000428'],colors:['#4facfe','#00f2fe','#fff'],particles:'stars',overlay:'none'}],
    apply(id){const t=this.list.find(x=>x.id===id);if(!t)return;State.activeViz=t.viz;State.bgType=t.bg;State.bgGrad=[...t.bgGrad];State.bgColor=t.bgGrad[0];State.vizColors=[...t.colors];if(t.particles!=='none'){State.particleType=t.particles;State.particleCount=80;BGParticles.init();}else{State.particleCount=0;}State.fxOverlay=t.overlay;Notify.show(`Template: ${t.name}`,'info');}};

const Exporter = { recorder:null, chunks:[], isRecording:false,
    start(canvas){this.chunks=[];const stream=canvas.captureStream(30);const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';this.recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});this.recorder.ondataavailable=e=>{if(e.data.size>0)this.chunks.push(e.data);};this.recorder.onstop=()=>this._save();this.recorder.start(100);this.isRecording=true;document.getElementById('recording-badge').classList.remove('hidden');Notify.show('Recording started','info');},
    stop(){if(this.recorder&&this.isRecording){this.recorder.stop();this.isRecording=false;}document.getElementById('recording-badge').classList.add('hidden');},
    _save(){const blob=new Blob(this.chunks,{type:'video/webm'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(State.exportName||'visual-spectrum')+'.webm';document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),2000);Notify.show('Video saved!','success');}};


// ============================================================
// UI PANELS
// ============================================================
const Panels = {
    dashboard(){return `<div class="section"><h3>🎵 Load Audio</h3><div class="file-drop" id="audio-drop">Click or drag MP3 here<input type="file" id="audio-input" accept="audio/*" style="display:none"></div></div><div class="section"><h3>🎛️ Audio Engine</h3><div class="ctrl"><label>Sensitivity <span id="v-sens">${AudioEngine.config.sensitivity}</span></label><input type="range" id="c-sens" min="0.5" max="3" step="0.1" value="${AudioEngine.config.sensitivity}"></div><div class="ctrl"><label>Gain <span id="v-gain">${AudioEngine.config.gain}</span></label><input type="range" id="c-gain" min="0" max="3" step="0.1" value="${AudioEngine.config.gain}"></div><div class="ctrl"><label>Smoothing <span id="v-smooth">${AudioEngine.config.smoothing}</span></label><input type="range" id="c-smooth" min="0" max="0.99" step="0.01" value="${AudioEngine.config.smoothing}"></div><div class="ctrl"><label>Beat Threshold <span id="v-beat">${AudioEngine.config.beatThreshold}</span></label><input type="range" id="c-beat" min="0.2" max="1" step="0.05" value="${AudioEngine.config.beatThreshold}"></div><div class="ctrl"><label>Volume <span id="v-vol">${AudioEngine.volume}</span></label><input type="range" id="c-vol" min="0" max="1.5" step="0.05" value="${AudioEngine.volume}"></div></div><div class="section"><h3>📊 Levels</h3><div class="meter"><label>Bass</label><div class="meter-bar"><div class="meter-fill bass" id="m-bass"></div></div></div><div class="meter"><label>Mid</label><div class="meter-bar"><div class="meter-fill mid" id="m-mid"></div></div></div><div class="meter"><label>Treble</label><div class="meter-bar"><div class="meter-fill treble" id="m-treble"></div></div></div><div class="meter"><label>Overall</label><div class="meter-bar"><div class="meter-fill overall" id="m-overall"></div></div></div></div>`;},
    spectrum(){return `<div class="section"><h3>📊 Visualizer</h3><div class="grid"><div class="grid-item ${State.activeViz==='bars'?'active':''}" data-viz="bars"><span class="ico">▮▮▮</span>Bars</div><div class="grid-item ${State.activeViz==='mirror'?'active':''}" data-viz="mirror"><span class="ico">⬍</span>Mirror</div><div class="grid-item ${State.activeViz==='circular'?'active':''}" data-viz="circular"><span class="ico">◎</span>Circular</div><div class="grid-item ${State.activeViz==='waveform'?'active':''}" data-viz="waveform"><span class="ico">〰️</span>Waveform</div><div class="grid-item ${State.activeViz==='neon'?'active':''}" data-viz="neon"><span class="ico">💡</span>Neon</div><div class="grid-item ${State.activeViz==='particles'?'active':''}" data-viz="particles"><span class="ico">💥</span>Particles</div><div class="grid-item ${State.activeViz==='energy'?'active':''}" data-viz="energy"><span class="ico">◉</span>Energy</div></div></div><div class="section"><h3>🎨 Colors</h3><div class="ctrl"><label>Primary</label><input type="color" id="c-col1" value="${State.vizColors[0]}"></div><div class="ctrl"><label>Secondary</label><input type="color" id="c-col2" value="${State.vizColors[1]}"></div><div class="ctrl"><label>Accent</label><input type="color" id="c-col3" value="${State.vizColors[2]}"></div></div><div class="section"><h3>⚙️ Settings</h3><div class="ctrl"><label>Bar Count <span id="v-bars">${State.vizBarCount}</span></label><input type="range" id="c-bars" min="16" max="128" step="8" value="${State.vizBarCount}"></div><div class="ctrl"><label>Glow <span id="v-glow">${State.vizGlow}</span></label><input type="range" id="c-glow" min="0" max="1" step="0.1" value="${State.vizGlow}"></div><div class="ctrl"><label>Reactivity <span id="v-react">${State.vizReactivity}</span></label><input type="range" id="c-react" min="0.5" max="3" step="0.1" value="${State.vizReactivity}"></div><div class="ctrl"><label><input type="checkbox" id="c-mirror" ${State.vizMirror?'checked':''}> Mirror Reflection</label></div></div>`;},
    background(){return `<div class="section"><h3>🖼️ Type</h3><div class="grid"><div class="grid-item ${State.bgType==='solid'?'active':''}" data-bg="solid"><span class="ico">⬛</span>Solid</div><div class="grid-item ${State.bgType==='gradient'?'active':''}" data-bg="gradient"><span class="ico">🌅</span>Gradient</div><div class="grid-item ${State.bgType==='animated'?'active':''}" data-bg="animated"><span class="ico">🎆</span>Animated</div><div class="grid-item ${State.bgType==='image'?'active':''}" data-bg="image"><span class="ico">🖼️</span>Image</div><div class="grid-item ${State.bgType==='video'?'active':''}" data-bg="video"><span class="ico">🎥</span>Video</div></div></div><div class="section"><h3>🎨 Settings</h3><div class="ctrl"><label>Color 1</label><input type="color" id="c-bg1" value="${State.bgGrad[0]}"></div><div class="ctrl"><label>Color 2</label><input type="color" id="c-bg2" value="${State.bgGrad[1]}"></div><div class="ctrl"><label>Color 3</label><input type="color" id="c-bg3" value="${State.bgGrad[2]||State.bgGrad[1]}"></div><div class="ctrl"><label>Angle <span id="v-bga">${State.bgAngle}</span>°</label><input type="range" id="c-bga" min="0" max="360" step="5" value="${State.bgAngle}"></div><div class="ctrl"><label>Anim Speed <span id="v-bgs">${State.bgAnimSpeed}</span></label><input type="range" id="c-bgs" min="0" max="3" step="0.1" value="${State.bgAnimSpeed}"></div></div><div class="section"><h3>📷 Image</h3><div class="file-drop" id="bg-drop">Upload Background Image<input type="file" id="bg-input" accept="image/*" style="display:none"></div></div><div class="section"><h3>🎥 Video</h3><div class="file-drop" id="bgv-drop">Upload Background Video (MP4/WebM)<input type="file" id="bgv-input" accept="video/*" style="display:none"></div></div>`;},
    particles(){return `<div class="section"><h3>✨ Type</h3><div class="grid"><div class="grid-item ${State.particleType==='dust'?'active':''}" data-pt="dust"><span class="ico">🌫️</span>Dust</div><div class="grid-item ${State.particleType==='snow'?'active':''}" data-pt="snow"><span class="ico">❄️</span>Snow</div><div class="grid-item ${State.particleType==='rain'?'active':''}" data-pt="rain"><span class="ico">🌧️</span>Rain</div><div class="grid-item ${State.particleType==='fireflies'?'active':''}" data-pt="fireflies"><span class="ico">✨</span>Fireflies</div><div class="grid-item ${State.particleType==='bubbles'?'active':''}" data-pt="bubbles"><span class="ico">🫧</span>Bubbles</div><div class="grid-item ${State.particleType==='stars'?'active':''}" data-pt="stars"><span class="ico">⭐</span>Stars</div></div></div><div class="section"><h3>⚙️ Settings</h3><div class="ctrl"><label>Count <span id="v-pc">${State.particleCount}</span></label><input type="range" id="c-pc" min="0" max="200" step="10" value="${State.particleCount}"></div><div class="ctrl"><label>Speed <span id="v-ps">${State.particleSpeed}</span></label><input type="range" id="c-ps" min="0.1" max="4" step="0.1" value="${State.particleSpeed}"></div><div class="ctrl"><label>Size <span id="v-pz">${State.particleSize}</span></label><input type="range" id="c-pz" min="1" max="8" step="0.5" value="${State.particleSize}"></div></div>`;},
    effects(){return `<div class="section"><h3>💡 Lighting</h3><div class="ctrl"><label>Vignette <span id="v-vig">${State.fxVignetteAmt}</span></label><input type="range" id="c-vig" min="0" max="1" step="0.05" value="${State.fxVignetteAmt}"></div></div><div class="section"><h3>📷 Camera</h3><div class="ctrl"><label>Bass Zoom <span id="v-bz">${State.camBassAmt}</span></label><input type="range" id="c-bz" min="0" max="0.1" step="0.005" value="${State.camBassAmt}"></div><div class="ctrl"><label>Beat Punch <span id="v-bp">${State.camPunchAmt}</span></label><input type="range" id="c-bp" min="0" max="0.1" step="0.005" value="${State.camPunchAmt}"></div><div class="ctrl"><label>Shake <span id="v-sh">${State.camShakeAmt}</span></label><input type="range" id="c-sh" min="0" max="8" step="0.5" value="${State.camShakeAmt}"></div></div><div class="section"><h3>🎬 Overlay</h3><div class="grid"><div class="grid-item ${State.fxOverlay==='none'?'active':''}" data-fx="none"><span class="ico">✕</span>None</div><div class="grid-item ${State.fxOverlay==='grain'?'active':''}" data-fx="grain"><span class="ico">🎞️</span>Grain</div><div class="grid-item ${State.fxOverlay==='scanline'?'active':''}" data-fx="scanline"><span class="ico">≡</span>Scanline</div><div class="grid-item ${State.fxOverlay==='vhs'?'active':''}" data-fx="vhs"><span class="ico">📼</span>VHS</div><div class="grid-item ${State.fxOverlay==='bokeh'?'active':''}" data-fx="bokeh"><span class="ico">●</span>Bokeh</div></div><div class="ctrl"><label>Intensity <span id="v-fxi">${State.fxOverlayAmt}</span></label><input type="range" id="c-fxi" min="0" max="1" step="0.05" value="${State.fxOverlayAmt}"></div></div>`;},
    text(){return `<div class="section"><h3>📝 Text</h3><div class="ctrl"><label>Title</label><input type="text" id="c-title" value="${State.textTitle}"></div><div class="ctrl"><label>Artist</label><input type="text" id="c-artist" value="${State.textArtist}"></div><div class="ctrl"><label>Color</label><input type="color" id="c-tcol" value="${State.textColor}"></div><div class="ctrl"><label>Glow <span id="v-tg">${State.textGlow}</span></label><input type="range" id="c-tg" min="0" max="1" step="0.1" value="${State.textGlow}"></div></div><div class="section"><h3>✨ Animation</h3><div class="grid"><div class="grid-item ${State.textAnim==='none'?'active':''}" data-ta="none"><span class="ico">—</span>None</div><div class="grid-item ${State.textAnim==='fade'?'active':''}" data-ta="fade"><span class="ico">◐</span>Fade</div><div class="grid-item ${State.textAnim==='bounce'?'active':''}" data-ta="bounce"><span class="ico">⤴</span>Bounce</div><div class="grid-item ${State.textAnim==='pulse'?'active':''}" data-ta="pulse"><span class="ico">💓</span>Pulse</div><div class="grid-item ${State.textAnim==='neon'?'active':''}" data-ta="neon"><span class="ico">💡</span>Neon</div><div class="grid-item ${State.textAnim==='glitch'?'active':''}" data-ta="glitch"><span class="ico">⚡</span>Glitch</div></div></div><div class="section"><h3>🏷️ Logo</h3><div class="file-drop" id="logo-drop">Upload Logo (PNG/SVG)<input type="file" id="logo-input" accept="image/*" style="display:none"></div><div class="ctrl"><label>Size <span id="v-ls">${State.logoSize}</span></label><input type="range" id="c-ls" min="20" max="200" step="5" value="${State.logoSize}"></div><div class="ctrl"><label>Position Y <span id="v-ly">${State.logoY}</span></label><input type="range" id="c-ly" min="0.05" max="0.95" step="0.01" value="${State.logoY}"></div><div class="ctrl"><label>Glow <span id="v-lg">${State.logoGlow}</span></label><input type="range" id="c-lg" min="0" max="1" step="0.1" value="${State.logoGlow}"></div></div>`;},
    templates(){return `<div class="section"><h3>🎭 Templates</h3><div class="grid">${Templates.list.map(t=>`<div class="grid-item" data-tpl="${t.id}"><span class="ico">${t.icon}</span>${t.name}</div>`).join('')}</div></div><div class="section"><button class="btn btn-primary" id="btn-random">🎲 Random Preset</button></div>`;},
    export(){return `<div class="section"><h3>🎬 Export Video</h3><p class="info" style="margin-bottom:10px">Records canvas as WebM video <b>without audio</b>.</p><div class="ctrl"><label>Filename</label><input type="text" id="c-ename" value="${State.exportName}"></div><button class="btn btn-primary" id="btn-rec-start" style="margin-top:8px">⏺ Start Recording</button><button class="btn btn-danger" id="btn-rec-stop" style="margin-top:6px;display:none">⏹ Stop & Download</button></div><div class="section"><h3>ℹ️ Info</h3><p class="info">• WebM (VP9) without audio<br>• Resolution: canvas size<br>• 30 FPS<br>• Combine with MP3 in CapCut / Premiere / DaVinci</p></div>`;}
};


// ============================================================
// MAIN APPLICATION
// ============================================================
const App = {
    canvas:null, ctx:null, frameCount:0, lastFpsTime:0, fps:0,
    init(){
        this.canvas=document.getElementById('preview-canvas'); this.ctx=this.canvas.getContext('2d');
        this.resize(); window.addEventListener('resize',()=>this.resize());
        BGParticles.init(); this.setupNav(); this.setupTransport();
        this.setupDragDrop(); this.setupKeyboard(); this.showPanel('dashboard'); this.loop();
    },
    resize(){ const c=document.getElementById('canvas-container'); this.canvas.width=c.clientWidth; this.canvas.height=c.clientHeight; },
    setupNav(){ document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.showPanel(btn.dataset.panel);})); },
    setupTransport(){
        document.getElementById('btn-play').addEventListener('click',()=>AudioEngine.play());
        document.getElementById('btn-pause').addEventListener('click',()=>AudioEngine.pause());
        document.getElementById('btn-stop').addEventListener('click',()=>AudioEngine.stop());
        document.getElementById('seek-bar').addEventListener('input',e=>{AudioEngine.seek((e.target.value/1000)*AudioEngine.duration);});
        document.getElementById('btn-fullscreen').addEventListener('click',()=>{const el=document.getElementById('canvas-container');if(!document.fullscreenElement)el.requestFullscreen().then(()=>setTimeout(()=>this.resize(),100));else document.exitFullscreen();});
        document.getElementById('btn-mute').addEventListener('click',()=>{const m=AudioEngine.toggleMute();document.getElementById('btn-mute').textContent=m?'🔇':'🔊';});
    },
    setupDragDrop(){
        const c=document.getElementById('canvas-container'),o=document.getElementById('drop-overlay');
        c.addEventListener('dragover',e=>{e.preventDefault();o.classList.add('active');});
        c.addEventListener('dragleave',()=>o.classList.remove('active'));
        c.addEventListener('drop',e=>{e.preventDefault();o.classList.remove('active');const f=e.dataTransfer.files[0];if(!f)return;if(f.type.startsWith('audio/'))this.loadAudio(f);else if(f.type.startsWith('video/'))this.loadBgVideo(f);else if(f.type.startsWith('image/'))this.loadBgImage(f);});
    },
    setupKeyboard(){
        document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;switch(e.key){case' ':e.preventDefault();AudioEngine.isPlaying?AudioEngine.pause():AudioEngine.play();break;case's':AudioEngine.stop();break;case'r':Exporter.isRecording?Exporter.stop():Exporter.start(this.canvas);break;case'f':document.getElementById('btn-fullscreen').click();break;case'm':document.getElementById('btn-mute').click();break;case'1':State.activeViz='bars';break;case'2':State.activeViz='circular';break;case'3':State.activeViz='waveform';break;case'4':State.activeViz='mirror';break;case'5':State.activeViz='neon';break;case'6':State.activeViz='particles';break;case'7':State.activeViz='energy';break;}});
    },
    async loadAudio(file){await AudioEngine.loadFile(file);State.textTitle=file.name.replace(/\.[^/.]+$/,'').replace(/[-_]/g,' ');State.exportName=file.name.replace(/\.[^/.]+$/,'');AudioEngine.play();Notify.show('Audio loaded: '+file.name,'success');},
    loadBgImage(file){const img=new Image();img.onload=()=>{State.bgImage=img;State.bgType='image';Notify.show('Background image set','success');};img.src=URL.createObjectURL(file);},
    loadBgVideo(file){const video=document.createElement('video');video.src=URL.createObjectURL(file);video.loop=true;video.muted=true;video.playsInline=true;video.addEventListener('canplay',()=>{State.bgVideo=video;State.bgType='video';video.play();Notify.show('Background video set','success');});video.load();},
    showPanel(id){
        const sidebar=document.getElementById('sidebar'),props=document.getElementById('properties-panel');
        sidebar.innerHTML=Panels[id]?Panels[id]():'';
        props.innerHTML=id==='dashboard'?`<div class="section"><h3>⚡ Quick Start</h3><p class="info">1. Drop MP3 onto canvas<br>2. Pick a visualizer<br>3. Customize colors & effects<br>4. Export video (no audio)<br>5. Merge with MP3 in video editor</p></div><div class="section"><h3>⌨️ Shortcuts</h3><p class="info">Space – Play/Pause<br>S – Stop<br>R – Record<br>F – Fullscreen<br>M – Mute<br>1-7 – Switch Visualizer</p></div>`:'';
        setTimeout(()=>this.bindPanelEvents(),30);
    },
    bindPanelEvents(){
        this._bind('c-sens','v-sens',v=>AudioEngine.setSensitivity(v));
        this._bind('c-gain','v-gain',v=>AudioEngine.setGain(v));
        this._bind('c-smooth','v-smooth',v=>AudioEngine.setSmoothing(v));
        this._bind('c-beat','v-beat',v=>AudioEngine.setBeatThreshold(v));
        this._bind('c-vol','v-vol',v=>AudioEngine.setVolume(v));
        const ad=document.getElementById('audio-drop'),ai=document.getElementById('audio-input');
        if(ad){ad.addEventListener('click',()=>ai.click());}if(ai){ai.addEventListener('change',e=>{if(e.target.files[0])this.loadAudio(e.target.files[0]);});}
        document.querySelectorAll('[data-viz]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-viz]').forEach(x=>x.classList.remove('active'));el.classList.add('active');State.activeViz=el.dataset.viz;}));
        this._bindColor('c-col1',v=>State.vizColors[0]=v);this._bindColor('c-col2',v=>State.vizColors[1]=v);this._bindColor('c-col3',v=>State.vizColors[2]=v);
        this._bind('c-bars','v-bars',v=>State.vizBarCount=v);this._bind('c-glow','v-glow',v=>State.vizGlow=v);this._bind('c-react','v-react',v=>State.vizReactivity=v);
        const mirrorCb=document.getElementById('c-mirror');if(mirrorCb)mirrorCb.addEventListener('change',()=>State.vizMirror=mirrorCb.checked);
        document.querySelectorAll('[data-bg]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-bg]').forEach(x=>x.classList.remove('active'));el.classList.add('active');State.bgType=el.dataset.bg;}));
        this._bindColor('c-bg1',v=>State.bgGrad[0]=v);this._bindColor('c-bg2',v=>State.bgGrad[1]=v);this._bindColor('c-bg3',v=>{if(State.bgGrad.length>2)State.bgGrad[2]=v;else State.bgGrad.push(v);});
        this._bind('c-bga','v-bga',v=>State.bgAngle=v);this._bind('c-bgs','v-bgs',v=>State.bgAnimSpeed=v);
        const bd=document.getElementById('bg-drop'),bi=document.getElementById('bg-input');if(bd){bd.addEventListener('click',()=>bi.click());}if(bi){bi.addEventListener('change',e=>{if(e.target.files[0])this.loadBgImage(e.target.files[0]);});}
        const bvd=document.getElementById('bgv-drop'),bvi=document.getElementById('bgv-input');if(bvd){bvd.addEventListener('click',()=>bvi.click());}if(bvi){bvi.addEventListener('change',e=>{if(e.target.files[0])this.loadBgVideo(e.target.files[0]);});}
        document.querySelectorAll('[data-pt]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-pt]').forEach(x=>x.classList.remove('active'));el.classList.add('active');State.particleType=el.dataset.pt;BGParticles.init();}));
        this._bind('c-pc','v-pc',v=>{State.particleCount=v;BGParticles.init();});this._bind('c-ps','v-ps',v=>State.particleSpeed=v);this._bind('c-pz','v-pz',v=>State.particleSize=v);
        this._bind('c-vig','v-vig',v=>{State.fxVignetteAmt=v;State.fxVignette=v>0;});
        this._bind('c-bz','v-bz',v=>{State.camBassAmt=v;State.camBassZoom=v>0;});this._bind('c-bp','v-bp',v=>{State.camPunchAmt=v;State.camBeatPunch=v>0;});this._bind('c-sh','v-sh',v=>{State.camShakeAmt=v;State.camShake=v>0;});
        document.querySelectorAll('[data-fx]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-fx]').forEach(x=>x.classList.remove('active'));el.classList.add('active');State.fxOverlay=el.dataset.fx;}));
        this._bind('c-fxi','v-fxi',v=>State.fxOverlayAmt=v);
        const ti=document.getElementById('c-title'),ar=document.getElementById('c-artist');if(ti)ti.addEventListener('input',e=>State.textTitle=e.target.value);if(ar)ar.addEventListener('input',e=>State.textArtist=e.target.value);
        this._bindColor('c-tcol',v=>State.textColor=v);this._bind('c-tg','v-tg',v=>State.textGlow=v);
        document.querySelectorAll('[data-ta]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-ta]').forEach(x=>x.classList.remove('active'));el.classList.add('active');State.textAnim=el.dataset.ta;}));
        // Logo
        const ld=document.getElementById('logo-drop'),li=document.getElementById('logo-input');
        if(ld){ld.addEventListener('click',()=>li.click());}if(li){li.addEventListener('change',e=>{if(e.target.files[0]){const img=new Image();img.onload=()=>{State.logoImage=img;Notify.show('Logo set','success');};img.src=URL.createObjectURL(e.target.files[0]);}});}
        this._bind('c-ls','v-ls',v=>State.logoSize=v);this._bind('c-ly','v-ly',v=>State.logoY=v);this._bind('c-lg','v-lg',v=>State.logoGlow=v);
        // Templates
        document.querySelectorAll('[data-tpl]').forEach(el=>el.addEventListener('click',()=>{Templates.apply(el.dataset.tpl);document.querySelectorAll('[data-tpl]').forEach(x=>x.classList.remove('active'));el.classList.add('active');}));
        const rb=document.getElementById('btn-random');if(rb)rb.addEventListener('click',()=>{const t=Templates.list[Math.floor(Math.random()*Templates.list.length)];Templates.apply(t.id);});
        // Export
        const rs=document.getElementById('btn-rec-start'),rp=document.getElementById('btn-rec-stop');
        if(rs)rs.addEventListener('click',()=>{Exporter.start(this.canvas);rs.style.display='none';rp.style.display='block';if(!AudioEngine.isPlaying&&AudioEngine.buffer)AudioEngine.play();});
        if(rp)rp.addEventListener('click',()=>{Exporter.stop();rs.style.display='block';rp.style.display='none';});
        const en=document.getElementById('c-ename');if(en)en.addEventListener('input',e=>State.exportName=e.target.value);
    },
    _bind(iid,did,cb){const el=document.getElementById(iid);if(!el)return;el.addEventListener('input',()=>{const v=parseFloat(el.value);const d=document.getElementById(did);if(d)d.textContent=v;cb(v);});},
    _bindColor(id,cb){const el=document.getElementById(id);if(el)el.addEventListener('input',()=>cb(el.value));},
    loop(){requestAnimationFrame(()=>this.loop());this.render();this.frameCount++;const now=performance.now();if(now-this.lastFpsTime>=1000){this.fps=this.frameCount;this.frameCount=0;this.lastFpsTime=now;}},
    render(){
        const w=this.canvas.width,h=this.canvas.height,ctx=this.ctx,data=AudioEngine.analyze();State.time+=0.016;
        ctx.clearRect(0,0,w,h);ctx.save();Camera.apply(ctx,w,h,data);Background.render(ctx,w,h,data);
        if(State.particleCount>0){BGParticles.update(data);BGParticles.render(ctx);}
        const vizFn=Visualizers[State.activeViz];if(vizFn)vizFn(ctx,w,h,data);ctx.restore();
        Effects.apply(ctx,w,h,data);TextRenderer.render(ctx,w,h,data);LogoRenderer.render(ctx,w,h,data);this.updateUI(data);
    },
    updateUI(data){
        const set=(id,pct)=>{const el=document.getElementById(id);if(el)el.style.width=(pct*100)+'%';};
        set('m-bass',data.bass);set('m-mid',data.mid);set('m-treble',data.treble);set('m-overall',data.overall);
        const cur=AudioEngine.getTime(),dur=AudioEngine.duration;
        const fmt=s=>{const m=Math.floor(s/60),sec=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;};
        document.getElementById('time-display').textContent=`${fmt(cur)} / ${fmt(dur)}`;
        if(dur>0)document.getElementById('seek-bar').value=Math.floor((cur/dur)*1000);
        document.getElementById('bpm-display').textContent=`BPM: ${data.bpm||'--'}`;
        document.getElementById('fps-display').textContent=`FPS: ${this.fps}`;
    }
};
document.addEventListener('DOMContentLoaded',()=>App.init());
