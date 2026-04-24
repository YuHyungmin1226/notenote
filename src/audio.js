export class AudioProcessor {
  constructor(onPitchDetected, onWaveformData) {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.scriptProcessor = null;
    
    this.onPitchDetected = onPitchDetected;
    this.onWaveformData = onWaveformData;
    
    this.isRecording = false;
    this.animationId = null;
  }

  async start() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      this.microphone.connect(this.analyser);
      
      this.isRecording = true;
      this.processAudio();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw err; // throw so main.js can catch and revert UI
    }
  }

  stop() {
    this.isRecording = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.microphone) {
      this.microphone.mediaStream.getTracks().forEach(track => track.stop());
      this.microphone.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  processAudio() {
    if (!this.isRecording) return;

    const bufferLength = this.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(buffer);

    // Call waveform callback for oscilloscope
    if (this.onWaveformData) {
      this.onWaveformData(buffer);
    }

    // Autocorrelation for pitch detection (YIN-like simple approach)
    const pitch = this.autoCorrelate(buffer, this.audioContext.sampleRate);
    
    if (this.onPitchDetected && pitch !== -1) {
      this.onPitchDetected(pitch);
    } else if (this.onPitchDetected) {
      this.onPitchDetected(null); // silence or no clear pitch
    }

    this.animationId = requestAnimationFrame(() => this.processAudio());
  }

  autoCorrelate(buffer, sampleRate) {
    // Perform a quick root mean square calculation to avoid calculating silence
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.01) return -1; // Not enough signal

    let r1 = 0, r2 = buffer.length - 1, thres = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[buffer.length - i]) < thres) { r2 = buffer.length - i; break; }
    }

    buffer = buffer.slice(r1, r2);
    let c = new Array(buffer.length).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < buffer.length - i; j++) {
        c[i] += buffer[j] * buffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buffer.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }

    let t0 = maxpos;
    let x1 = c[t0 - 1], x2 = c[t0], x3 = c[t0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) t0 = t0 - b / (2 * a);

    return sampleRate / t0;
  }
}
