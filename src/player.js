export class NotePlayer {
  constructor() {
    this.audioCtx = null;
    this.bpm = 120;
    this.metronomeInterval = null;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  async playNotes(notesData, onPlayCallback, onStopCallback) {
    if (!notesData || notesData.length === 0) return;
    
    this.init();
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    // Start playing slightly in the future to ensure smooth scheduling
    let time = this.audioCtx.currentTime + 0.1;
    const secPerBeat = 60 / this.bpm;

    notesData.forEach((nd, i) => {
      let beats = 1; // Default quarter note
      if (nd.duration.includes('8')) beats = 0.5;
      else if (nd.duration.includes('q')) beats = 1;
      else if (nd.duration.includes('h')) beats = 2;
      else if (nd.duration.includes('w')) beats = 4;

      const durationSec = beats * secPerBeat;
      const isRest = !nd.keys || nd.keys.length === 0 || nd.duration.includes('r');

      const timeMsToStart = (time - this.audioCtx.currentTime) * 1000;
      const timeMsToStop = timeMsToStart + (durationSec * 1000);

      if (onPlayCallback) {
        setTimeout(() => onPlayCallback(i), timeMsToStart);
      }
      if (onStopCallback) {
        setTimeout(() => onStopCallback(i), timeMsToStop);
      }

      if (!isRest) {
        const pitch = nd.keys[0]; // e.g. 'c/4'
        const freq = this.pitchToFreq(pitch);

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Use triangle or sine wave for synthetic piano-like feel
        osc.type = 'triangle';
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        // Envelope shaping for a musical pluck/fade out
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.05); // attack
        gain.gain.exponentialRampToValueAtTime(0.01, time + durationSec - 0.05); // decay
        gain.gain.setValueAtTime(0, time + durationSec);

        osc.start(time);
        osc.stop(time + durationSec);
      }

      // advance time
      time += durationSec;
    });
  }

  pitchToFreq(pitch) {
    // "c/4", "c#/4" structure
    const notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    const parts = pitch.split('/');
    if (parts.length !== 2) return 440;
    
    const noteName = parts[0].toLowerCase();
    const octave = parseInt(parts[1], 10);
    const noteIndex = notes.indexOf(noteName);
    
    if (noteIndex === -1) return 440;

    // MIDI Note Number
    const midi = (octave + 1) * 12 + noteIndex;
    
    // Frequency Formula
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  startMetronome() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    this.playClick();
    const intervalMs = (60 / this.bpm) * 1000;
    this.metronomeInterval = setInterval(() => this.playClick(), intervalMs);
  }

  stopMetronome() {
    if (this.metronomeInterval) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

  playClick() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 1000; // High frequency tick for metronome
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, this.audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
    
    osc.start(this.audioCtx.currentTime);
    osc.stop(this.audioCtx.currentTime + 0.1);
  }
}
