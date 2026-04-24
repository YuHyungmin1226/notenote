const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];


export class NoteLogic {
  constructor() {
    this.recordedNotes = [];
    this.currentNote = null;
    this.noteStartTime = 0;
    this.lastNoteEndTime = 0;
    
    // Pitch smoothing buffer to prevent jitter
    this.pitchHistory = [];
    this.historySize = 5; 
    
    // Config
    this.bpm = 120;
    this.msPerBeat = 60000 / this.bpm; // 500ms
  }

  reset() {
    this.recordedNotes = [];
    this.currentNote = null;
    this.noteStartTime = 0;
    this.lastNoteEndTime = 0;
    this.pitchHistory = [];
  }

  freqToNoteStr(freq) {
    if (!freq || freq < 50 || freq > 2000) return null;
    
    // Convert to MIDI
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    
    return `${NOTE_NAMES[noteIndex]}/${octave}`;
  }

  getStablePitch(rawNote) {
    this.pitchHistory.push(rawNote);
    if (this.pitchHistory.length > this.historySize) {
      this.pitchHistory.shift();
    }
    
    const counts = {};
    let maxPitch = null;
    let maxCount = 0;
    
    for (const p of this.pitchHistory) {
      if (p) {
        counts[p] = (counts[p] || 0) + 1;
        if (counts[p] > maxCount) {
          maxCount = counts[p];
          maxPitch = p;
        }
      }
    }
    
    // Require majority agreement for a real note
    if (maxCount >= 3) return maxPitch;
    
    // Silence majority logic
    const nullCount = this.pitchHistory.filter(x => x === null).length;
    if (nullCount >= 3) return null;
    
    return this.currentNote ? this.currentNote.pitch : null;
  }

  pushQuantizedNote(pitch, durationMs) {
    const beats = durationMs / this.msPerBeat;
    if (beats < 0.25) return; // Ignore very tiny glitches
    
    let quantizedDuration = 'q';
    if (beats < 0.75) quantizedDuration = '8';
    else if (beats < 1.5) quantizedDuration = 'q';
    else if (beats < 3) quantizedDuration = 'h';
    else quantizedDuration = 'w';

    const keys = pitch ? [pitch] : []; // Empty array triggers a rest in vexflow script
    this.recordedNotes.push({ keys, duration: quantizedDuration });
  }

  processPitch(freq, timestamp) {
    if (this.lastNoteEndTime === 0 && timestamp > 0 && !this.currentNote) {
      this.lastNoteEndTime = timestamp;
    }

    const rawNote = this.freqToNoteStr(freq);
    const stableNote = this.getStablePitch(rawNote);
    
    if (this.currentNote) {
      if (this.currentNote.pitch !== stableNote) {
        this.saveCurrentNote(timestamp);
        if (stableNote) {
          this.startNewNote(stableNote, timestamp);
        } else {
          this.lastNoteEndTime = timestamp;
        }
      }
    } else {
      if (stableNote) {
        const restDurationMs = timestamp - this.lastNoteEndTime;
        if (restDurationMs > 250 && this.lastNoteEndTime > 0) {
          this.pushQuantizedNote(null, restDurationMs);
        }
        this.startNewNote(stableNote, timestamp);
      }
    }
    
    return rawNote; // Return raw for immediate UI feedback
  }

  startNewNote(pitch, timestamp) {
    this.currentNote = { pitch };
    this.noteStartTime = timestamp;
  }

  saveCurrentNote(endTime) {
    if (!this.currentNote) return;
    const durationMs = endTime - this.noteStartTime;
    this.pushQuantizedNote(this.currentNote.pitch, durationMs);
    this.currentNote = null;
    this.lastNoteEndTime = endTime;
  }

  finalize(timestamp) {
    if (this.currentNote) {
      this.saveCurrentNote(timestamp);
    } else {
      const restDurationMs = timestamp - this.lastNoteEndTime;
      if (restDurationMs > 250 && this.lastNoteEndTime > 0) {
        this.pushQuantizedNote(null, restDurationMs);
      }
    }
    return this.recordedNotes;
  }
}
