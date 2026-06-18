/**
 * Export Engine - Render to MP4 without audio using MediaRecorder
 */

export interface ExportConfig {
    format: 'mp4' | 'webm' | 'gif';
    codec: 'h264' | 'vp9' | 'vp8';
    fps: 24 | 30 | 60 | 120;
    resolution: { width: number; height: number; label: string };
    quality: number; // 0-1
    filename: string;
}

export type ExportStatus = 'idle' | 'rendering' | 'encoding' | 'complete' | 'error';

export interface ExportProgress {
    status: ExportStatus;
    progress: number;
    currentFrame: number;
    totalFrames: number;
    elapsedTime: number;
    estimatedRemaining: number;
}

export class ExportEngine {
    public config: ExportConfig = {
        format: 'webm',
        codec: 'vp9',
        fps: 30,
        resolution: { width: 1920, height: 1080, label: '1080p' },
        quality: 0.9,
        filename: 'visual-spectrum'
    };

    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private isRecording: boolean = false;
    private onProgress: ((progress: ExportProgress) => void) | null = null;
    private startTime: number = 0;

    static RESOLUTIONS = [
        { width: 1280, height: 720, label: '720p' },
        { width: 1920, height: 1080, label: '1080p' },
        { width: 2560, height: 1440, label: '1440p' },
        { width: 3840, height: 2160, label: '4K' }
    ];

    startRecording(canvas: HTMLCanvasElement, onProgress?: (progress: ExportProgress) => void): void {
        this.onProgress = onProgress || null;
        this.chunks = [];
        this.startTime = performance.now();

        const mimeType = this.getMimeType();
        const stream = canvas.captureStream(this.config.fps);

        try {
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: this.getBitrate()
            });
        } catch (e) {
            // Fallback
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: this.getBitrate()
            });
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.finalize();
        };

        this.mediaRecorder.start(100); // Collect data every 100ms
        this.isRecording = true;

        if (this.onProgress) {
            this.onProgress({
                status: 'rendering',
                progress: 0,
                currentFrame: 0,
                totalFrames: 0,
                elapsedTime: 0,
                estimatedRemaining: 0
            });
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }

    private finalize(): void {
        const mimeType = this.getMimeType();
        const blob = new Blob(this.chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Auto download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.config.filename}.${this.getExtension()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        if (this.onProgress) {
            this.onProgress({
                status: 'complete',
                progress: 1,
                currentFrame: 0,
                totalFrames: 0,
                elapsedTime: performance.now() - this.startTime,
                estimatedRemaining: 0
            });
        }
    }

    private getMimeType(): string {
        switch (this.config.format) {
            case 'mp4': return 'video/mp4';
            case 'webm': return this.config.codec === 'vp9' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
            default: return 'video/webm';
        }
    }

    private getExtension(): string {
        return this.config.format === 'gif' ? 'gif' : this.config.format;
    }

    private getBitrate(): number {
        const { width, height } = this.config.resolution;
        const pixels = width * height;
        return Math.floor(pixels * this.config.quality * 8);
    }

    getIsRecording(): boolean {
        return this.isRecording;
    }

    updateProgress(currentTime: number, totalDuration: number): void {
        if (!this.onProgress || !this.isRecording) return;
        const progress = currentTime / totalDuration;
        const elapsed = performance.now() - this.startTime;
        const estimated = progress > 0 ? (elapsed / progress) - elapsed : 0;

        this.onProgress({
            status: 'rendering',
            progress,
            currentFrame: Math.floor(currentTime * this.config.fps),
            totalFrames: Math.floor(totalDuration * this.config.fps),
            elapsedTime: elapsed,
            estimatedRemaining: estimated
        });
    }
}
