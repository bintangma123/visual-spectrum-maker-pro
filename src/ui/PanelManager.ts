/**
 * Panel Manager - Creates and manages sidebar UI panels
 */

export class PanelManager {
    private sidebar: HTMLElement;
    private properties: HTMLElement;
    private currentPanel: string = 'dashboard';

    constructor() {
        this.sidebar = document.getElementById('sidebar')!;
        this.properties = document.getElementById('properties-panel')!;
    }

    showPanel(panelId: string): void {
        this.currentPanel = panelId;
        switch (panelId) {
            case 'dashboard': this.showDashboard(); break;
            case 'spectrum': this.showSpectrum(); break;
            case 'background': this.showBackground(); break;
            case 'particles': this.showParticles(); break;
            case 'effects': this.showEffects(); break;
            case 'text': this.showText(); break;
            case 'templates': this.showTemplates(); break;
            case 'export': this.showExport(); break;
            case 'ai': this.showAI(); break;
        }
    }

    private showDashboard(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>🎵 Audio</h3>
                <div class="drop-zone" id="audio-drop">
                    <div class="panel-item" style="grid-column: span 2; padding: 20px;">
                        <span class="icon">📁</span>
                        Drop MP3 Here or Click to Browse
                        <input type="file" id="audio-input" accept="audio/*" style="display:none">
                    </div>
                </div>
            </div>
            <div class="panel-section">
                <h3>🎛️ Audio Engine</h3>
                <div class="control-group">
                    <label>Sensitivity: <span id="val-sensitivity">1.5</span></label>
                    <input type="range" id="ctrl-sensitivity" min="0.5" max="3" step="0.1" value="1.5">
                </div>
                <div class="control-group">
                    <label>Gain: <span id="val-gain">1.0</span></label>
                    <input type="range" id="ctrl-gain" min="0" max="3" step="0.1" value="1">
                </div>
                <div class="control-group">
                    <label>Smoothing: <span id="val-smoothing">0.8</span></label>
                    <input type="range" id="ctrl-smoothing" min="0" max="0.99" step="0.01" value="0.8">
                </div>
                <div class="control-group">
                    <label>Beat Threshold: <span id="val-beat">0.6</span></label>
                    <input type="range" id="ctrl-beat" min="0.2" max="1" step="0.05" value="0.6">
                </div>
            </div>
            <div class="panel-section">
                <h3>📊 Levels</h3>
                <div id="level-meters">
                    <div class="level-meter"><label>Bass</label><div class="meter-bar"><div id="meter-bass" class="meter-fill"></div></div></div>
                    <div class="level-meter"><label>Mid</label><div class="meter-bar"><div id="meter-mid" class="meter-fill"></div></div></div>
                    <div class="level-meter"><label>Treble</label><div class="meter-bar"><div id="meter-treble" class="meter-fill"></div></div></div>
                    <div class="level-meter"><label>Overall</label><div class="meter-bar"><div id="meter-overall" class="meter-fill"></div></div></div>
                </div>
            </div>
        `;
        this.properties.innerHTML = `
            <div class="panel-section">
                <h3>ℹ️ Quick Start</h3>
                <p style="font-size:12px;color:var(--text-secondary);line-height:1.6">
                    1. Drop an MP3 file<br>
                    2. Choose a visualizer style<br>
                    3. Customize colors & effects<br>
                    4. Export as video (no audio)<br>
                    5. Combine with MP3 in editor
                </p>
            </div>
            <div class="panel-section">
                <h3>⚡ Keyboard Shortcuts</h3>
                <p style="font-size:11px;color:var(--text-muted);line-height:1.8">
                    Space - Play/Pause<br>
                    S - Stop<br>
                    R - Start Recording<br>
                    T - Apply Template<br>
                    1-5 - Switch Visualizer
                </p>
            </div>
        `;
    }


    private showSpectrum(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>📊 Classic</h3>
                <div class="panel-grid">
                    <div class="panel-item active" data-viz="vertical-bars"><span class="icon">▮▮▮</span>Vertical Bars</div>
                    <div class="panel-item" data-viz="horizontal-bars"><span class="icon">▬▬▬</span>Horizontal</div>
                    <div class="panel-item" data-viz="mirror-bars"><span class="icon">⬍</span>Mirror Bars</div>
                    <div class="panel-item" data-viz="double-bars"><span class="icon">▮▮</span>Double Bars</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>⭕ Circle</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-viz="circular"><span class="icon">◎</span>Circular</div>
                    <div class="panel-item" data-viz="energy-ring"><span class="icon">◉</span>Energy Ring</div>
                    <div class="panel-item" data-viz="double-ring"><span class="icon">◎◎</span>Double Ring</div>
                    <div class="panel-item" data-viz="radial"><span class="icon">✺</span>Radial</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>🌊 Wave</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-viz="waveform"><span class="icon">〰️</span>Waveform</div>
                    <div class="panel-item" data-viz="oscilloscope"><span class="icon">∿</span>Oscilloscope</div>
                    <div class="panel-item" data-viz="ribbon"><span class="icon">🎗️</span>Ribbon Wave</div>
                    <div class="panel-item" data-viz="liquid"><span class="icon">💧</span>Liquid Wave</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>✨ Modern</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-viz="neon"><span class="icon">💡</span>Neon</div>
                    <div class="panel-item" data-viz="glass"><span class="icon">🪟</span>Glass</div>
                    <div class="panel-item" data-viz="rgb"><span class="icon">🌈</span>RGB</div>
                    <div class="panel-item" data-viz="cyber"><span class="icon">🤖</span>Cyber</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>💎 Premium</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-viz="particle-burst"><span class="icon">💥</span>Particle Burst</div>
                    <div class="panel-item" data-viz="plasma"><span class="icon">⚡</span>Plasma Wave</div>
                    <div class="panel-item" data-viz="aurora"><span class="icon">🌌</span>Aurora</div>
                    <div class="panel-item" data-viz="fire"><span class="icon">🔥</span>Fire</div>
                </div>
            </div>
        `;
        this.showSpectrumProperties();
    }

    private showSpectrumProperties(): void {
        this.properties.innerHTML = `
            <div class="panel-section">
                <h3>🎨 Colors</h3>
                <div class="control-group">
                    <label>Primary Color</label>
                    <input type="color" id="viz-color1" value="#6c5ce7">
                </div>
                <div class="control-group">
                    <label>Secondary Color</label>
                    <input type="color" id="viz-color2" value="#a29bfe">
                </div>
                <div class="control-group">
                    <label>Accent Color</label>
                    <input type="color" id="viz-color3" value="#00f5ff">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="viz-gradient" checked> Use Gradient</label>
                </div>
            </div>
            <div class="panel-section">
                <h3>⚙️ Settings</h3>
                <div class="control-group">
                    <label>Bar Count: <span id="val-barcount">64</span></label>
                    <input type="range" id="ctrl-barcount" min="8" max="256" step="8" value="64">
                </div>
                <div class="control-group">
                    <label>Bar Width: <span id="val-barwidth">4</span></label>
                    <input type="range" id="ctrl-barwidth" min="1" max="20" step="1" value="4">
                </div>
                <div class="control-group">
                    <label>Gap: <span id="val-bargap">2</span></label>
                    <input type="range" id="ctrl-bargap" min="0" max="10" step="1" value="2">
                </div>
                <div class="control-group">
                    <label>Reactivity: <span id="val-reactivity">1.0</span></label>
                    <input type="range" id="ctrl-reactivity" min="0.5" max="3" step="0.1" value="1">
                </div>
                <div class="control-group">
                    <label>Glow: <span id="val-glow">0.5</span></label>
                    <input type="range" id="ctrl-glow" min="0" max="1" step="0.1" value="0.5">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="viz-mirror"> Mirror Mode</label>
                </div>
            </div>
        `;
    }


    private showBackground(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>🖼️ Background Type</h3>
                <div class="panel-grid">
                    <div class="panel-item active" data-bg="solid"><span class="icon">⬛</span>Solid</div>
                    <div class="panel-item" data-bg="gradient"><span class="icon">🌅</span>Gradient</div>
                    <div class="panel-item" data-bg="image"><span class="icon">🖼️</span>Image</div>
                    <div class="panel-item" data-bg="animated-gradient"><span class="icon">🎆</span>Animated</div>
                    <div class="panel-item" data-bg="blur"><span class="icon">🔲</span>Frosted</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>🎨 Background Settings</h3>
                <div class="control-group">
                    <label>Background Color</label>
                    <input type="color" id="bg-color" value="#0a0a0f">
                </div>
                <div class="control-group">
                    <label>Gradient Color 1</label>
                    <input type="color" id="bg-grad1" value="#0a0a1a">
                </div>
                <div class="control-group">
                    <label>Gradient Color 2</label>
                    <input type="color" id="bg-grad2" value="#1a0a2e">
                </div>
                <div class="control-group">
                    <label>Gradient Color 3</label>
                    <input type="color" id="bg-grad3" value="#0a1a2e">
                </div>
                <div class="control-group">
                    <label>Angle: <span id="val-bgangle">135</span>°</label>
                    <input type="range" id="ctrl-bgangle" min="0" max="360" step="5" value="135">
                </div>
                <div class="control-group">
                    <label>Animation Speed: <span id="val-bgspeed">0.5</span></label>
                    <input type="range" id="ctrl-bgspeed" min="0" max="2" step="0.1" value="0.5">
                </div>
            </div>
            <div class="panel-section">
                <h3>📷 Image</h3>
                <div class="panel-item" style="padding:15px;cursor:pointer" id="bg-image-upload">
                    <span class="icon">📁</span>Upload Background Image
                    <input type="file" id="bg-image-input" accept="image/*" style="display:none">
                </div>
                <div class="control-group">
                    <label>Blur: <span id="val-bgblur">0</span></label>
                    <input type="range" id="ctrl-bgblur" min="0" max="20" step="1" value="0">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="bg-kenburns"> Ken Burns Effect</label>
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="bg-reactive" checked> React to Music</label>
                </div>
            </div>
        `;
        this.properties.innerHTML = '';
    }

    private showParticles(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>✨ Particle Type</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-particle="dust"><span class="icon">🌫️</span>Dust</div>
                    <div class="panel-item" data-particle="snow"><span class="icon">❄️</span>Snow</div>
                    <div class="panel-item" data-particle="rain"><span class="icon">🌧️</span>Rain</div>
                    <div class="panel-item active" data-particle="fireflies"><span class="icon">✨</span>Fireflies</div>
                    <div class="panel-item" data-particle="bubbles"><span class="icon">🫧</span>Bubbles</div>
                    <div class="panel-item" data-particle="sparks"><span class="icon">⚡</span>Sparks</div>
                    <div class="panel-item" data-particle="stars"><span class="icon">⭐</span>Stars</div>
                    <div class="panel-item" data-particle="galaxy"><span class="icon">🌌</span>Galaxy</div>
                    <div class="panel-item" data-particle="smoke"><span class="icon">💨</span>Smoke</div>
                    <div class="panel-item" data-particle="fog"><span class="icon">🌁</span>Fog</div>
                    <div class="panel-item" data-particle="hearts"><span class="icon">💖</span>Hearts</div>
                    <div class="panel-item" data-particle="notes"><span class="icon">🎵</span>Notes</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>⚙️ Settings</h3>
                <div class="control-group">
                    <label>Count: <span id="val-pcount">100</span></label>
                    <input type="range" id="ctrl-pcount" min="10" max="300" step="10" value="100">
                </div>
                <div class="control-group">
                    <label>Speed: <span id="val-pspeed">1.0</span></label>
                    <input type="range" id="ctrl-pspeed" min="0.1" max="5" step="0.1" value="1">
                </div>
                <div class="control-group">
                    <label>Size: <span id="val-psize">3</span></label>
                    <input type="range" id="ctrl-psize" min="1" max="10" step="0.5" value="3">
                </div>
                <div class="control-group">
                    <label>Opacity: <span id="val-popacity">0.6</span></label>
                    <input type="range" id="ctrl-popacity" min="0.1" max="1" step="0.05" value="0.6">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="particle-reactive" checked> React to Music</label>
                </div>
                <div class="control-group">
                    <label>Reactivity: <span id="val-preactivity">1.0</span></label>
                    <input type="range" id="ctrl-preactivity" min="0.5" max="3" step="0.1" value="1">
                </div>
            </div>
        `;
        this.properties.innerHTML = '';
    }


    private showEffects(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>💡 Lighting</h3>
                <div class="control-group">
                    <label><input type="checkbox" id="fx-vignette" checked> Vignette</label>
                    <input type="range" id="ctrl-vignette" min="0" max="1" step="0.05" value="0.4">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="fx-bloom"> Bloom</label>
                    <input type="range" id="ctrl-bloom" min="0" max="1" step="0.05" value="0.3">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="fx-lensflare"> Lens Flare</label>
                    <input type="range" id="ctrl-lensflare" min="0" max="1" step="0.05" value="0.5">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="fx-ambient"> Ambient Light</label>
                    <input type="color" id="fx-ambient-color" value="#6c5ce7">
                </div>
            </div>
            <div class="panel-section">
                <h3>📷 Camera</h3>
                <div class="control-group">
                    <label><input type="checkbox" id="cam-autozoom"> Auto Zoom</label>
                    <input type="range" id="ctrl-autozoom" min="0.0001" max="0.005" step="0.0001" value="0.001">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="cam-basszoom" checked> Bass Zoom</label>
                    <input type="range" id="ctrl-basszoom" min="0" max="0.1" step="0.005" value="0.05">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="cam-beatpunch" checked> Beat Punch</label>
                    <input type="range" id="ctrl-beatpunch" min="0" max="0.1" step="0.005" value="0.03">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="cam-shake"> Shake</label>
                    <input type="range" id="ctrl-shake" min="0" max="10" step="0.5" value="2">
                </div>
                <div class="control-group">
                    <label><input type="checkbox" id="cam-rotate"> Rotate</label>
                    <input type="range" id="ctrl-rotate" min="0.0001" max="0.005" step="0.0001" value="0.0005">
                </div>
            </div>
            <div class="panel-section">
                <h3>🎬 Overlay</h3>
                <div class="panel-grid">
                    <div class="panel-item active" data-overlay="none"><span class="icon">✕</span>None</div>
                    <div class="panel-item" data-overlay="grain"><span class="icon">🎞️</span>Film Grain</div>
                    <div class="panel-item" data-overlay="vhs"><span class="icon">📼</span>VHS</div>
                    <div class="panel-item" data-overlay="crt"><span class="icon">🖥️</span>CRT</div>
                    <div class="panel-item" data-overlay="scanline"><span class="icon">≡</span>Scanline</div>
                    <div class="panel-item" data-overlay="noise"><span class="icon">▓</span>Noise</div>
                    <div class="panel-item" data-overlay="bokeh"><span class="icon">●</span>Bokeh</div>
                </div>
                <div class="control-group">
                    <label>Intensity: <span id="val-overlay">0.3</span></label>
                    <input type="range" id="ctrl-overlay" min="0" max="1" step="0.05" value="0.3">
                </div>
            </div>
        `;
        this.properties.innerHTML = '';
    }

    private showText(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>📝 Text Layers</h3>
                <div class="control-group">
                    <label>Song Title</label>
                    <input type="text" id="text-title" value="Song Title" style="width:100%;padding:6px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius);color:white;font-size:12px;">
                </div>
                <div class="control-group">
                    <label>Artist</label>
                    <input type="text" id="text-artist" value="Artist Name" style="width:100%;padding:6px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius);color:white;font-size:12px;">
                </div>
            </div>
            <div class="panel-section">
                <h3>🎨 Style</h3>
                <div class="control-group">
                    <label>Font Size: <span id="val-fontsize">36</span></label>
                    <input type="range" id="ctrl-fontsize" min="12" max="72" step="2" value="36">
                </div>
                <div class="control-group">
                    <label>Color</label>
                    <input type="color" id="text-color" value="#ffffff">
                </div>
                <div class="control-group">
                    <label>Position Y: <span id="val-texty">0.85</span></label>
                    <input type="range" id="ctrl-texty" min="0.1" max="0.95" step="0.01" value="0.85">
                </div>
                <div class="control-group">
                    <label>Glow Intensity: <span id="val-textglow">0</span></label>
                    <input type="range" id="ctrl-textglow" min="0" max="1" step="0.1" value="0">
                </div>
                <div class="control-group">
                    <label>Glow Color</label>
                    <input type="color" id="text-glow-color" value="#6c5ce7">
                </div>
            </div>
            <div class="panel-section">
                <h3>✨ Animation</h3>
                <div class="panel-grid">
                    <div class="panel-item active" data-textanim="none"><span class="icon">—</span>None</div>
                    <div class="panel-item" data-textanim="fade"><span class="icon">◐</span>Fade</div>
                    <div class="panel-item" data-textanim="slide"><span class="icon">→</span>Slide</div>
                    <div class="panel-item" data-textanim="zoom"><span class="icon">🔍</span>Zoom</div>
                    <div class="panel-item" data-textanim="bounce"><span class="icon">⤴</span>Bounce</div>
                    <div class="panel-item" data-textanim="pulse"><span class="icon">💓</span>Pulse</div>
                    <div class="panel-item" data-textanim="neon"><span class="icon">💡</span>Neon</div>
                    <div class="panel-item" data-textanim="glitch"><span class="icon">⚡</span>Glitch</div>
                </div>
            </div>
        `;
        this.properties.innerHTML = '';
    }


    private showTemplates(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>🎭 Visual Templates</h3>
                <div class="panel-grid">
                    <div class="panel-item" data-template="spotify"><span class="icon">🟢</span>Spotify</div>
                    <div class="panel-item" data-template="trap-nation"><span class="icon">🔮</span>Trap Nation</div>
                    <div class="panel-item" data-template="ncs"><span class="icon">⚡</span>NCS</div>
                    <div class="panel-item" data-template="monstercat"><span class="icon">🐱</span>Monstercat</div>
                    <div class="panel-item" data-template="lofi"><span class="icon">☕</span>LoFi Girl</div>
                    <div class="panel-item" data-template="edm"><span class="icon">🎧</span>EDM</div>
                    <div class="panel-item" data-template="chill"><span class="icon">🌊</span>Chill</div>
                    <div class="panel-item" data-template="podcast"><span class="icon">🎙️</span>Podcast</div>
                    <div class="panel-item" data-template="worship"><span class="icon">✝️</span>Worship</div>
                    <div class="panel-item" data-template="ambient"><span class="icon">🌌</span>Ambient</div>
                    <div class="panel-item" data-template="cinematic"><span class="icon">🎬</span>Cinematic</div>
                    <div class="panel-item" data-template="gaming"><span class="icon">🎮</span>Gaming</div>
                    <div class="panel-item" data-template="synthwave"><span class="icon">🌆</span>Synthwave</div>
                    <div class="panel-item" data-template="vaporwave"><span class="icon">🌸</span>Vaporwave</div>
                </div>
            </div>
            <div class="panel-section">
                <h3>💾 Preset Manager</h3>
                <button class="btn btn-primary btn-full" id="btn-save-preset">Save Current as Preset</button>
                <button class="btn btn-full" id="btn-random-preset" style="margin-top:8px;background:var(--bg-tertiary);color:var(--text-primary);">🎲 Random Preset</button>
            </div>
        `;
        this.properties.innerHTML = `
            <div class="panel-section">
                <h3>📋 Template Info</h3>
                <p id="template-desc" style="font-size:12px;color:var(--text-secondary);line-height:1.6">
                    Select a template to preview its settings.
                </p>
            </div>
        `;
    }

    private showExport(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>🎬 Export Settings</h3>
                <div class="control-group">
                    <label>Format</label>
                    <select id="export-format">
                        <option value="webm">WebM (VP9)</option>
                        <option value="mp4">MP4 (H.264)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Resolution</label>
                    <select id="export-resolution">
                        <option value="720">720p (1280×720)</option>
                        <option value="1080" selected>1080p (1920×1080)</option>
                        <option value="1440">1440p (2560×1440)</option>
                        <option value="4k">4K (3840×2160)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>FPS</label>
                    <select id="export-fps">
                        <option value="24">24 FPS</option>
                        <option value="30" selected>30 FPS</option>
                        <option value="60">60 FPS</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Quality: <span id="val-quality">90%</span></label>
                    <input type="range" id="ctrl-quality" min="0.5" max="1" step="0.05" value="0.9">
                </div>
                <div class="control-group">
                    <label>Filename</label>
                    <input type="text" id="export-filename" value="visual-spectrum" style="width:100%;padding:6px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius);color:white;font-size:12px;">
                </div>
            </div>
            <div class="panel-section">
                <h3>🎥 Record</h3>
                <button class="btn btn-primary btn-full" id="btn-start-record">⏺ Start Recording</button>
                <button class="btn btn-full" id="btn-stop-record" style="margin-top:8px;background:var(--danger);color:white;display:none;">⏹ Stop Recording</button>
                <div id="export-progress" style="margin-top:12px;display:none;">
                    <div style="background:var(--bg-tertiary);border-radius:4px;height:8px;overflow:hidden;">
                        <div id="export-progress-bar" style="height:100%;background:var(--accent-primary);width:0%;transition:width 0.3s;"></div>
                    </div>
                    <p id="export-status" style="font-size:11px;color:var(--text-secondary);margin-top:6px;">Ready</p>
                </div>
            </div>
            <div class="panel-section">
                <h3>ℹ️ Output Info</h3>
                <p style="font-size:11px;color:var(--text-muted);line-height:1.6;">
                    • Video exports WITHOUT audio<br>
                    • Combine with MP3 in CapCut, Premiere Pro, or DaVinci Resolve<br>
                    • WebM format has best browser support<br>
                    • Higher resolution = larger file
                </p>
            </div>
        `;
        this.properties.innerHTML = '';
    }

    private showAI(): void {
        this.sidebar.innerHTML = `
            <div class="panel-section">
                <h3>🤖 AI Assistant</h3>
                <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
                    Play a song and the AI will analyze it to suggest the best visual settings.
                </p>
                <button class="btn btn-primary btn-full" id="btn-ai-analyze">🧠 Analyze & Suggest</button>
            </div>
            <div id="ai-results" style="display:none;">
                <div class="panel-section">
                    <h3>📊 Analysis</h3>
                    <div id="ai-analysis" style="font-size:12px;color:var(--text-secondary);line-height:1.8;"></div>
                </div>
                <div class="panel-section">
                    <h3>🎨 Suggestions</h3>
                    <div id="ai-suggestions"></div>
                    <button class="btn btn-success btn-full" id="btn-ai-apply" style="margin-top:8px;">✅ Apply Suggestions</button>
                </div>
                <div class="panel-section">
                    <h3>📺 YouTube</h3>
                    <div id="ai-youtube" style="font-size:12px;color:var(--text-secondary);line-height:1.6;"></div>
                </div>
            </div>
        `;
        this.properties.innerHTML = '';
    }

    getCurrentPanel(): string {
        return this.currentPanel;
    }
}
