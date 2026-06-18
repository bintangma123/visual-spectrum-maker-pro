/**
 * Visual Spectrum Maker PRO V1
 * Main Application Entry Point
 */
import { AudioEngine, AudioAnalysisData } from './audio/AudioEngine';
import { BaseVisualizer } from './visualizers/BaseVisualizer';
import { VerticalBarsVisualizer } from './visualizers/VerticalBars';
import { CircularSpectrumVisualizer } from './visualizers/CircularSpectrum';
import { WaveformVisualizer } from './visualizers/WaveformVisualizer';
import { NeonSpectrumVisualizer } from './visualizers/NeonSpectrum';
import { MirrorBarsVisualizer } from './visualizers/MirrorBars';
import { ParticleBurstVisualizer } from './visualizers/ParticleBurst';
import { EnergyRingVisualizer } from './visualizers/EnergyRing';
import { ParticleEngine, ParticleType } from './particles/ParticleEngine';
import { LightingEffects } from './effects/LightingEffects';
import { CameraEffects } from './effects/CameraEffects';
import { OverlayEffects, OverlayType } from './effects/OverlayEffects';
import { BackgroundEngine, BackgroundType } from './effects/BackgroundEngine';
import { TextOverlay, TextAnimation } from './ui/TextOverlay';
import { TemplateManager } from './templates/TemplateManager';
import { ExportEngine } from './export/ExportEngine';
import { AIAssistant } from './ai/AIAssistant';
import { PanelManager } from './ui/PanelManager';

class VisualSpectrumMakerPRO {
    // Core systems
    private audioEngine: AudioEngine;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private animationFrame: number = 0;

    // Visual systems
    private visualizers: Map<string, BaseVisualizer> = new Map();
    private activeVisualizer: string = 'vertical-bars';
    private particleEngine: ParticleEngine;
    private lightingEffects: LightingEffects;
    private cameraEffects: CameraEffects;
    private overlayEffects: OverlayEffects;
    private backgroundEngine: BackgroundEngine;
    private textOverlay: TextOverlay;

    // Managers
    private templateManager: TemplateManager;
    private exportEngine: ExportEngine;
    private aiAssistant: AIAssistant;
    private panelManager: PanelManager;

    // State
    private isInitialized: boolean = false;
    private audioLoaded: boolean = false;

    constructor() {
        this.canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.audioEngine = new AudioEngine();
        this.particleEngine = new ParticleEngine(this.canvas.width, this.canvas.height);
        this.lightingEffects = new LightingEffects();
        this.cameraEffects = new CameraEffects();
        this.overlayEffects = new OverlayEffects();
        this.backgroundEngine = new BackgroundEngine();
        this.textOverlay = new TextOverlay();
        this.templateManager = new TemplateManager();
        this.exportEngine = new ExportEngine();
        this.aiAssistant = new AIAssistant();
        this.panelManager = new PanelManager();

        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initializeVisualizers();
        this.particleEngine.initialize();
        this.setupEventListeners();
        this.panelManager.showPanel('dashboard');

        this.isInitialized = true;
        this.startRenderLoop();
    }

    private resizeCanvas(): void {
        const container = document.getElementById('canvas-container')!;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Resize subsystems
        this.particleEngine.resize(this.canvas.width, this.canvas.height);
        this.visualizers.forEach(v => v.resize(this.canvas.width, this.canvas.height));
    }

    private initializeVisualizers(): void {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.visualizers.set('vertical-bars', new VerticalBarsVisualizer(this.ctx, w, h));
        this.visualizers.set('circular', new CircularSpectrumVisualizer(this.ctx, w, h));
        this.visualizers.set('waveform', new WaveformVisualizer(this.ctx, w, h));
        this.visualizers.set('neon', new NeonSpectrumVisualizer(this.ctx, w, h));
        this.visualizers.set('mirror-bars', new MirrorBarsVisualizer(this.ctx, w, h));
        this.visualizers.set('particle-burst', new ParticleBurstVisualizer(this.ctx, w, h));
        this.visualizers.set('energy-ring', new EnergyRingVisualizer(this.ctx, w, h));
    }


    private setupEventListeners(): void {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                (e.target as HTMLElement).classList.add('active');
                const panel = (e.target as HTMLElement).dataset.panel;
                if (panel) this.panelManager.showPanel(panel);
                this.rebindPanelEvents();
            });
        });

        // Transport
        document.getElementById('btn-play')!.addEventListener('click', () => this.play());
        document.getElementById('btn-pause')!.addEventListener('click', () => this.pause());
        document.getElementById('btn-stop')!.addEventListener('click', () => this.stop());

        // Seek bar
        document.getElementById('seek-bar')!.addEventListener('input', (e) => {
            const value = parseFloat((e.target as HTMLInputElement).value);
            const time = (value / 100) * this.audioEngine.getDuration();
            this.audioEngine.seek(time);
        });

        // Drag and drop
        const container = document.getElementById('canvas-container')!;
        const overlay = document.getElementById('canvas-overlay')!;

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            overlay.classList.add('active');
        });
        container.addEventListener('dragleave', () => overlay.classList.remove('active'));
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            overlay.classList.remove('active');
            this.handleDrop(e);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            switch (e.key) {
                case ' ': e.preventDefault(); this.audioEngine.getIsPlaying() ? this.pause() : this.play(); break;
                case 's': this.stop(); break;
                case 'r': this.toggleRecording(); break;
                case '1': this.setVisualizer('vertical-bars'); break;
                case '2': this.setVisualizer('circular'); break;
                case '3': this.setVisualizer('waveform'); break;
                case '4': this.setVisualizer('neon'); break;
                case '5': this.setVisualizer('mirror-bars'); break;
                case '6': this.setVisualizer('particle-burst'); break;
                case '7': this.setVisualizer('energy-ring'); break;
            }
        });

        // Initial panel bindings
        this.rebindPanelEvents();
    }

    private rebindPanelEvents(): void {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.bindAudioControls();
            this.bindVisualizerSelection();
            this.bindBackgroundControls();
            this.bindParticleControls();
            this.bindEffectsControls();
            this.bindTextControls();
            this.bindTemplateSelection();
            this.bindExportControls();
            this.bindAIControls();
            this.bindAudioFileInput();
        }, 50);
    }

    private bindAudioFileInput(): void {
        const audioInput = document.getElementById('audio-input') as HTMLInputElement;
        const dropZone = document.getElementById('audio-drop');
        if (audioInput) {
            audioInput.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) this.loadAudio(file);
            });
        }
        if (dropZone) {
            dropZone.addEventListener('click', () => audioInput?.click());
        }
    }

    private bindAudioControls(): void {
        this.bindSlider('ctrl-sensitivity', 'val-sensitivity', (v) => this.audioEngine.setSensitivity(v));
        this.bindSlider('ctrl-gain', 'val-gain', (v) => this.audioEngine.setGain(v));
        this.bindSlider('ctrl-smoothing', 'val-smoothing', (v) => this.audioEngine.setSmoothing(v));
        this.bindSlider('ctrl-beat', 'val-beat', (v) => this.audioEngine.setBeatThreshold(v));
    }

    private bindVisualizerSelection(): void {
        document.querySelectorAll('[data-viz]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-viz]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const viz = (e.currentTarget as HTMLElement).dataset.viz!;
                this.setVisualizer(viz);
            });
        });

        // Color controls
        const color1 = document.getElementById('viz-color1') as HTMLInputElement;
        const color2 = document.getElementById('viz-color2') as HTMLInputElement;
        const color3 = document.getElementById('viz-color3') as HTMLInputElement;
        if (color1) color1.addEventListener('input', () => this.updateVisualizerColors());
        if (color2) color2.addEventListener('input', () => this.updateVisualizerColors());
        if (color3) color3.addEventListener('input', () => this.updateVisualizerColors());

        this.bindSlider('ctrl-barcount', 'val-barcount', (v) => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.barCount = v;
        });
        this.bindSlider('ctrl-barwidth', 'val-barwidth', (v) => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.barWidth = v;
        });
        this.bindSlider('ctrl-bargap', 'val-bargap', (v) => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.barGap = v;
        });
        this.bindSlider('ctrl-reactivity', 'val-reactivity', (v) => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.reactivity = v;
        });
        this.bindSlider('ctrl-glow', 'val-glow', (v) => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.glowIntensity = v;
        });

        const mirrorCb = document.getElementById('viz-mirror') as HTMLInputElement;
        if (mirrorCb) mirrorCb.addEventListener('change', () => {
            const viz = this.visualizers.get(this.activeVisualizer);
            if (viz) viz.config.mirrorMode = mirrorCb.checked;
        });
    }


    private bindBackgroundControls(): void {
        document.querySelectorAll('[data-bg]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-bg]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const bg = (e.currentTarget as HTMLElement).dataset.bg as BackgroundType;
                this.backgroundEngine.config.type = bg;
            });
        });

        const bgColor = document.getElementById('bg-color') as HTMLInputElement;
        if (bgColor) bgColor.addEventListener('input', () => {
            this.backgroundEngine.config.solidColor = bgColor.value;
        });

        const grad1 = document.getElementById('bg-grad1') as HTMLInputElement;
        const grad2 = document.getElementById('bg-grad2') as HTMLInputElement;
        const grad3 = document.getElementById('bg-grad3') as HTMLInputElement;
        if (grad1) grad1.addEventListener('input', () => this.updateBgGradient());
        if (grad2) grad2.addEventListener('input', () => this.updateBgGradient());
        if (grad3) grad3.addEventListener('input', () => this.updateBgGradient());

        this.bindSlider('ctrl-bgangle', 'val-bgangle', (v) => this.backgroundEngine.config.gradientAngle = v);
        this.bindSlider('ctrl-bgspeed', 'val-bgspeed', (v) => this.backgroundEngine.config.animatedSpeed = v);
        this.bindSlider('ctrl-bgblur', 'val-bgblur', (v) => this.backgroundEngine.config.blur = v);

        const imgUpload = document.getElementById('bg-image-upload');
        const imgInput = document.getElementById('bg-image-input') as HTMLInputElement;
        if (imgUpload && imgInput) {
            imgUpload.addEventListener('click', () => imgInput.click());
            imgInput.addEventListener('change', () => {
                const file = imgInput.files?.[0];
                if (file) this.backgroundEngine.loadImage(file);
            });
        }

        const kenburns = document.getElementById('bg-kenburns') as HTMLInputElement;
        if (kenburns) kenburns.addEventListener('change', () => this.backgroundEngine.config.kenBurns = kenburns.checked);

        const reactive = document.getElementById('bg-reactive') as HTMLInputElement;
        if (reactive) reactive.addEventListener('change', () => this.backgroundEngine.config.reactToMusic = reactive.checked);
    }

    private bindParticleControls(): void {
        document.querySelectorAll('[data-particle]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-particle]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const type = (e.currentTarget as HTMLElement).dataset.particle as ParticleType;
                this.particleEngine.setType(type);
            });
        });

        this.bindSlider('ctrl-pcount', 'val-pcount', (v) => {
            this.particleEngine.config.count = v;
            this.particleEngine.initialize();
        });
        this.bindSlider('ctrl-pspeed', 'val-pspeed', (v) => this.particleEngine.config.speed = v);
        this.bindSlider('ctrl-psize', 'val-psize', (v) => this.particleEngine.config.size = v);
        this.bindSlider('ctrl-popacity', 'val-popacity', (v) => this.particleEngine.config.opacity = v);
        this.bindSlider('ctrl-preactivity', 'val-preactivity', (v) => this.particleEngine.config.reactivity = v);

        const reactive = document.getElementById('particle-reactive') as HTMLInputElement;
        if (reactive) reactive.addEventListener('change', () => this.particleEngine.config.reactToMusic = reactive.checked);
    }

    private bindEffectsControls(): void {
        // Lighting
        const vignette = document.getElementById('fx-vignette') as HTMLInputElement;
        if (vignette) vignette.addEventListener('change', () => this.lightingEffects.config.vignette = vignette.checked);
        this.bindSlider('ctrl-vignette', null, (v) => this.lightingEffects.config.vignetteIntensity = v);

        const bloom = document.getElementById('fx-bloom') as HTMLInputElement;
        if (bloom) bloom.addEventListener('change', () => this.lightingEffects.config.bloom = bloom.checked);
        this.bindSlider('ctrl-bloom', null, (v) => this.lightingEffects.config.bloomIntensity = v);

        const lensflare = document.getElementById('fx-lensflare') as HTMLInputElement;
        if (lensflare) lensflare.addEventListener('change', () => this.lightingEffects.config.lensFlare = lensflare.checked);
        this.bindSlider('ctrl-lensflare', null, (v) => this.lightingEffects.config.lensFlareIntensity = v);

        const ambient = document.getElementById('fx-ambient') as HTMLInputElement;
        if (ambient) ambient.addEventListener('change', () => this.lightingEffects.config.ambientLight = ambient.checked);

        const ambientColor = document.getElementById('fx-ambient-color') as HTMLInputElement;
        if (ambientColor) ambientColor.addEventListener('input', () => this.lightingEffects.config.ambientColor = ambientColor.value);

        // Camera
        const autozoom = document.getElementById('cam-autozoom') as HTMLInputElement;
        if (autozoom) autozoom.addEventListener('change', () => this.cameraEffects.config.autoZoom = autozoom.checked);
        this.bindSlider('ctrl-autozoom', null, (v) => this.cameraEffects.config.autoZoomSpeed = v);

        const basszoom = document.getElementById('cam-basszoom') as HTMLInputElement;
        if (basszoom) basszoom.addEventListener('change', () => this.cameraEffects.config.bassZoom = basszoom.checked);
        this.bindSlider('ctrl-basszoom', null, (v) => this.cameraEffects.config.bassZoomIntensity = v);

        const beatpunch = document.getElementById('cam-beatpunch') as HTMLInputElement;
        if (beatpunch) beatpunch.addEventListener('change', () => this.cameraEffects.config.beatPunch = beatpunch.checked);
        this.bindSlider('ctrl-beatpunch', null, (v) => this.cameraEffects.config.beatPunchIntensity = v);

        const shake = document.getElementById('cam-shake') as HTMLInputElement;
        if (shake) shake.addEventListener('change', () => this.cameraEffects.config.shake = shake.checked);
        this.bindSlider('ctrl-shake', null, (v) => this.cameraEffects.config.shakeIntensity = v);

        const rotate = document.getElementById('cam-rotate') as HTMLInputElement;
        if (rotate) rotate.addEventListener('change', () => this.cameraEffects.config.rotate = rotate.checked);
        this.bindSlider('ctrl-rotate', null, (v) => this.cameraEffects.config.rotateSpeed = v);

        // Overlay
        document.querySelectorAll('[data-overlay]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-overlay]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const type = (e.currentTarget as HTMLElement).dataset.overlay as OverlayType;
                this.overlayEffects.config.type = type;
            });
        });
        this.bindSlider('ctrl-overlay', 'val-overlay', (v) => this.overlayEffects.config.intensity = v);
    }


    private bindTextControls(): void {
        const titleInput = document.getElementById('text-title') as HTMLInputElement;
        const artistInput = document.getElementById('text-artist') as HTMLInputElement;
        if (titleInput) titleInput.addEventListener('input', () => this.textOverlay.setTitle(titleInput.value));
        if (artistInput) artistInput.addEventListener('input', () => this.textOverlay.setArtist(artistInput.value));

        this.bindSlider('ctrl-fontsize', 'val-fontsize', (v) => {
            const layer = this.textOverlay.getLayer('title');
            if (layer) layer.config.fontSize = v;
        });
        this.bindSlider('ctrl-texty', 'val-texty', (v) => {
            const layer = this.textOverlay.getLayer('title');
            if (layer) layer.config.y = v;
            const artist = this.textOverlay.getLayer('artist');
            if (artist) artist.config.y = v + 0.05;
        });
        this.bindSlider('ctrl-textglow', 'val-textglow', (v) => {
            const layer = this.textOverlay.getLayer('title');
            if (layer) layer.config.glowIntensity = v;
        });

        const textColor = document.getElementById('text-color') as HTMLInputElement;
        if (textColor) textColor.addEventListener('input', () => {
            const layer = this.textOverlay.getLayer('title');
            if (layer) layer.config.color = textColor.value;
        });

        const glowColor = document.getElementById('text-glow-color') as HTMLInputElement;
        if (glowColor) glowColor.addEventListener('input', () => {
            const layer = this.textOverlay.getLayer('title');
            if (layer) layer.config.glowColor = glowColor.value;
        });

        document.querySelectorAll('[data-textanim]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-textanim]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const anim = (e.currentTarget as HTMLElement).dataset.textanim as TextAnimation;
                const layer = this.textOverlay.getLayer('title');
                if (layer) layer.config.animation = anim;
            });
        });
    }

    private bindTemplateSelection(): void {
        document.querySelectorAll('[data-template]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('[data-template]').forEach(i => i.classList.remove('active'));
                (e.currentTarget as HTMLElement).classList.add('active');
                const templateId = (e.currentTarget as HTMLElement).dataset.template!;
                this.applyTemplate(templateId);
            });
        });

        const randomBtn = document.getElementById('btn-random-preset');
        if (randomBtn) randomBtn.addEventListener('click', () => {
            const templates = this.templateManager.getTemplates();
            const random = templates[Math.floor(Math.random() * templates.length)];
            this.applyTemplate(random.id);
        });
    }

    private bindExportControls(): void {
        const startBtn = document.getElementById('btn-start-record');
        const stopBtn = document.getElementById('btn-stop-record');

        if (startBtn) startBtn.addEventListener('click', () => this.startRecording());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopRecording());

        const format = document.getElementById('export-format') as HTMLSelectElement;
        if (format) format.addEventListener('change', () => {
            this.exportEngine.config.format = format.value as any;
        });

        const resolution = document.getElementById('export-resolution') as HTMLSelectElement;
        if (resolution) resolution.addEventListener('change', () => {
            const res = ExportEngine.RESOLUTIONS.find(r => r.label.startsWith(resolution.value)) || ExportEngine.RESOLUTIONS[1];
            this.exportEngine.config.resolution = res;
        });

        const fps = document.getElementById('export-fps') as HTMLSelectElement;
        if (fps) fps.addEventListener('change', () => {
            this.exportEngine.config.fps = parseInt(fps.value) as any;
        });

        this.bindSlider('ctrl-quality', 'val-quality', (v) => {
            this.exportEngine.config.quality = v;
            const display = document.getElementById('val-quality');
            if (display) display.textContent = Math.round(v * 100) + '%';
        });

        const filename = document.getElementById('export-filename') as HTMLInputElement;
        if (filename) filename.addEventListener('input', () => {
            this.exportEngine.config.filename = filename.value;
        });
    }

    private bindAIControls(): void {
        const analyzeBtn = document.getElementById('btn-ai-analyze');
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => {
            const recommendation = this.aiAssistant.getRecommendation();
            this.showAIResults(recommendation);
        });

        const applyBtn = document.getElementById('btn-ai-apply');
        if (applyBtn) applyBtn.addEventListener('click', () => {
            const rec = this.aiAssistant.getRecommendation();
            this.applyTemplate(rec.template);
        });
    }


    // === Utility Methods ===

    private bindSlider(sliderId: string, displayId: string | null, callback: (value: number) => void): void {
        const slider = document.getElementById(sliderId) as HTMLInputElement;
        if (!slider) return;
        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            if (displayId) {
                const display = document.getElementById(displayId);
                if (display) display.textContent = value.toString();
            }
            callback(value);
        });
    }

    private updateVisualizerColors(): void {
        const color1 = (document.getElementById('viz-color1') as HTMLInputElement)?.value || '#6c5ce7';
        const color2 = (document.getElementById('viz-color2') as HTMLInputElement)?.value || '#a29bfe';
        const color3 = (document.getElementById('viz-color3') as HTMLInputElement)?.value || '#00f5ff';
        
        const viz = this.visualizers.get(this.activeVisualizer);
        if (viz) {
            viz.config.color = color1;
            viz.config.gradientColors = [color1, color2, color3];
        }
    }

    private updateBgGradient(): void {
        const c1 = (document.getElementById('bg-grad1') as HTMLInputElement)?.value || '#0a0a1a';
        const c2 = (document.getElementById('bg-grad2') as HTMLInputElement)?.value || '#1a0a2e';
        const c3 = (document.getElementById('bg-grad3') as HTMLInputElement)?.value || '#0a1a2e';
        this.backgroundEngine.config.gradientColors = [c1, c2, c3];
    }

    // === Core Operations ===

    private async loadAudio(file: File): Promise<void> {
        try {
            await this.audioEngine.loadFile(file);
            this.audioLoaded = true;
            this.aiAssistant.reset();
            
            // Update UI
            const titleFromFile = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            this.textOverlay.setTitle(titleFromFile);
            
            // Auto play
            this.play();
        } catch (error) {
            console.error('Error loading audio:', error);
        }
    }

    private play(): void {
        this.audioEngine.play();
    }

    private pause(): void {
        this.audioEngine.pause();
    }

    private stop(): void {
        this.audioEngine.stop();
    }

    private setVisualizer(id: string): void {
        if (this.visualizers.has(id)) {
            this.activeVisualizer = id;
        }
    }

    private handleDrop(e: DragEvent): void {
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file.type.startsWith('audio/')) {
            this.loadAudio(file);
        } else if (file.type.startsWith('image/')) {
            this.backgroundEngine.loadImage(file);
        }
    }

    private applyTemplate(templateId: string): void {
        const template = this.templateManager.getTemplate(templateId);
        if (!template) return;

        // Apply visualizer
        if (this.visualizers.has(template.visualizer)) {
            this.activeVisualizer = template.visualizer;
        }

        // Apply colors
        this.visualizers.forEach(viz => {
            viz.config.gradientColors = template.colors;
            viz.config.color = template.colors[0];
        });

        // Apply background
        if (template.background) {
            Object.assign(this.backgroundEngine.config, template.background);
        }

        // Apply particles
        if (template.particles && template.particles.type !== 'none') {
            this.particleEngine.config.type = template.particles.type;
            if (template.particles.count) this.particleEngine.config.count = template.particles.count;
            this.particleEngine.initialize();
        }

        // Apply lighting
        if (template.lighting) {
            Object.assign(this.lightingEffects.config, template.lighting);
        }

        // Apply camera
        if (template.camera) {
            Object.assign(this.cameraEffects.config, template.camera);
        }

        // Apply overlay
        if (template.overlay) {
            Object.assign(this.overlayEffects.config, template.overlay);
        }

        // Update template description
        const desc = document.getElementById('template-desc');
        if (desc) desc.textContent = `${template.name}: ${template.description}`;
    }


    // === Recording ===

    private startRecording(): void {
        this.exportEngine.startRecording(this.canvas, (progress) => {
            const progressBar = document.getElementById('export-progress-bar');
            const status = document.getElementById('export-status');
            const progressDiv = document.getElementById('export-progress');
            
            if (progressDiv) progressDiv.style.display = 'block';
            if (progressBar) progressBar.style.width = `${progress.progress * 100}%`;
            if (status) status.textContent = `${progress.status} - ${Math.round(progress.progress * 100)}%`;

            if (progress.status === 'complete') {
                setTimeout(() => {
                    if (progressDiv) progressDiv.style.display = 'none';
                    const startBtn = document.getElementById('btn-start-record');
                    const stopBtn = document.getElementById('btn-stop-record');
                    if (startBtn) startBtn.style.display = 'block';
                    if (stopBtn) stopBtn.style.display = 'none';
                }, 2000);
            }
        });

        const startBtn = document.getElementById('btn-start-record');
        const stopBtn = document.getElementById('btn-stop-record');
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'block';

        // Start playing if not already
        if (!this.audioEngine.getIsPlaying() && this.audioLoaded) {
            this.play();
        }
    }

    private stopRecording(): void {
        this.exportEngine.stopRecording();
    }

    private toggleRecording(): void {
        if (this.exportEngine.getIsRecording()) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    // === AI ===

    private showAIResults(rec: any): void {
        const resultsDiv = document.getElementById('ai-results');
        const analysisDiv = document.getElementById('ai-analysis');
        const suggestionsDiv = document.getElementById('ai-suggestions');
        const youtubeDiv = document.getElementById('ai-youtube');

        if (resultsDiv) resultsDiv.style.display = 'block';
        if (analysisDiv) {
            analysisDiv.innerHTML = `
                <b>Genre:</b> ${rec.genre}<br>
                <b>Mood:</b> ${rec.mood}<br>
                <b>Energy:</b> ${rec.energy}<br>
            `;
        }
        if (suggestionsDiv) {
            suggestionsDiv.innerHTML = `
                <div class="panel-item" style="margin-bottom:4px;text-align:left;padding:8px;">
                    🎨 Template: <b>${rec.template}</b>
                </div>
                <div class="panel-item" style="margin-bottom:4px;text-align:left;padding:8px;">
                    📊 Visualizer: <b>${rec.visualizer}</b>
                </div>
                <div class="panel-item" style="margin-bottom:4px;text-align:left;padding:8px;">
                    ✨ Particles: <b>${rec.particles}</b>
                </div>
                <div class="panel-item" style="margin-bottom:4px;text-align:left;padding:8px;">
                    🖼️ Background: <b>${rec.background}</b>
                </div>
                <div style="display:flex;gap:4px;margin-top:8px;">
                    ${rec.colors.map((c: string) => `<div style="width:24px;height:24px;border-radius:4px;background:${c};border:1px solid rgba(255,255,255,0.2);"></div>`).join('')}
                </div>
            `;
        }
        if (youtubeDiv) {
            youtubeDiv.innerHTML = `
                <b>Title:</b><br>${rec.youtubeTitle}<br><br>
                <b>Hashtags:</b><br>${rec.hashtags.join(' ')}<br><br>
                <b>Description:</b><br>${rec.description}
            `;
        }
    }

    // === Render Loop ===

    private startRenderLoop(): void {
        const render = () => {
            this.animationFrame = requestAnimationFrame(render);
            this.renderFrame();
        };
        render();
    }

    private renderFrame(): void {
        const data = this.audioEngine.analyze();
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Feed AI
        if (this.audioEngine.getIsPlaying()) {
            this.aiAssistant.analyze(data);
        }

        // Clear
        this.ctx.clearRect(0, 0, w, h);

        // Camera transform
        this.ctx.save();
        const transform = this.cameraEffects.getTransform(data);
        this.cameraEffects.applyTransform(this.ctx, w, h, transform);

        // Background
        this.backgroundEngine.render(this.ctx, w, h, data);

        // Particles (behind visualizer)
        this.particleEngine.update(data);
        this.particleEngine.render(this.ctx);

        // Visualizer
        const visualizer = this.visualizers.get(this.activeVisualizer);
        if (visualizer) {
            visualizer.render(data);
        }

        // Camera restore
        this.ctx.restore();

        // Post-processing (not affected by camera)
        this.lightingEffects.apply(this.ctx, w, h, data);
        this.overlayEffects.apply(this.ctx, w, h, data);

        // Text overlay
        this.textOverlay.render(this.ctx, w, h, data);

        // Update UI meters
        this.updateMeters(data);
        this.updateTransport();

        // Update export progress
        if (this.exportEngine.getIsRecording()) {
            this.exportEngine.updateProgress(
                this.audioEngine.getCurrentTime(),
                this.audioEngine.getDuration()
            );
        }
    }

    private updateMeters(data: AudioAnalysisData): void {
        const bassMeter = document.getElementById('meter-bass');
        const midMeter = document.getElementById('meter-mid');
        const trebleMeter = document.getElementById('meter-treble');
        const overallMeter = document.getElementById('meter-overall');
        const bpmDisplay = document.getElementById('bpm-display');

        if (bassMeter) bassMeter.style.width = `${data.bassLevel * 100}%`;
        if (midMeter) midMeter.style.width = `${data.midLevel * 100}%`;
        if (trebleMeter) trebleMeter.style.width = `${data.trebleLevel * 100}%`;
        if (overallMeter) overallMeter.style.width = `${data.overallLevel * 100}%`;
        if (bpmDisplay) bpmDisplay.textContent = `BPM: ${data.bpm || '--'}`;
    }

    private updateTransport(): void {
        const current = this.audioEngine.getCurrentTime();
        const duration = this.audioEngine.getDuration();
        const timeDisplay = document.getElementById('time-display');
        const seekBar = document.getElementById('seek-bar') as HTMLInputElement;

        if (timeDisplay) {
            timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
        }
        if (seekBar && duration > 0) {
            seekBar.value = ((current / duration) * 100).toString();
        }
    }

    private formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new VisualSpectrumMakerPRO();
});
