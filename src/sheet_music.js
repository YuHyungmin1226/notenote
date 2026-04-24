import { Renderer, Stave, StaveNote, Formatter, BarNote, Barline, Accidental } from 'vexflow';

export function drawSheetMusic(containerId, notesData) {
  const container = document.getElementById(containerId);
  container.innerHTML = ''; // Clear previous

  if (!notesData || notesData.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">🎼</span><p class="placeholder-text">No notes detected. Try singing again!</p></div>';
    return;
  }

  // Create renderer and attach to container
  const renderer = new Renderer(container, Renderer.Backends.SVG);
  
  // Calculate dynamic width based on number of notes
  const width = Math.max(500, notesData.length * 60 + 100);
  renderer.resize(width, 150);
  const context = renderer.getContext();
  
  // Create a stave
  const stave = new Stave(10, 20, width - 20);
  stave.addClef('treble').addTimeSignature('4/4');
  stave.setContext(context).draw();

  // Map out notes and insert bar lines every 4 beats
  const vexNotes = [];
  let currentBeats = 0;

  notesData.forEach((nd, i) => {
    let staveNote;
    let beats = 1;
    if (nd.duration.includes('8')) beats = 0.5;
    else if (nd.duration.includes('q')) beats = 1;
    else if (nd.duration.includes('h')) beats = 2;
    else if (nd.duration.includes('w')) beats = 4;

    let keys = nd.keys;
    if (!keys || keys.length === 0 || !keys[0]) {
      staveNote = new StaveNote({ keys: ['b/4'], duration: nd.duration + 'r' });
    } else {
      staveNote = new StaveNote({ keys: keys, duration: nd.duration });
      keys.forEach((key, keyIndex) => {
        if (key.includes('#')) {
          staveNote.addModifier(new Accidental('#'), keyIndex);
        } else if (key.includes('b')) {
          staveNote.addModifier(new Accidental('b'), keyIndex);
        }
      });
    }

    vexNotes.push(staveNote);
    currentBeats += beats;

    // Add bar line every 4 beats
    if (currentBeats >= 4) {
      vexNotes.push(new BarNote(Barline.type.SINGLE));
      currentBeats = currentBeats % 4; // overflow wrap
    }
  });

  if (currentBeats > 0) {
    vexNotes.push(new BarNote(Barline.type.END));
  }

  // Calculate notes width and format them
  Formatter.FormatAndDraw(context, stave, vexNotes);
}

export function highlightNote(index, isPlaying) {
  const stavenotes = document.querySelectorAll('#sheet-music-output .vf-stavenote');
  const noteGroup = stavenotes[index];
  if (!noteGroup) return;
  
  if (isPlaying) {
    noteGroup.style.transition = "fill 0.1s ease, stroke 0.1s ease";
    // Change color to accent
    const paths = noteGroup.querySelectorAll('path');
    paths.forEach(p => {
      p.setAttribute('fill', '#34d399');
      p.setAttribute('stroke', '#34d399');
    });
  } else {
    // Reset back to black
    const paths = noteGroup.querySelectorAll('path');
    paths.forEach(p => {
      p.setAttribute('fill', 'black');
      p.setAttribute('stroke', 'black');
    });
  }
}
