import { AudioProcessor } from './audio.js';
import { NoteLogic } from './note_logic.js';
import { drawSheetMusic, highlightNote } from './sheet_music.js';
import { NotePlayer } from './player.js';

function initApp() {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const dot = document.getElementById('recording-dot');
  const statusText = document.getElementById('status-text');
  const freqVal = document.getElementById('freq-val');
  const noteVal = document.getElementById('note-val');
  const canvas = document.getElementById('oscilloscope');
  const canvasCtx = canvas.getContext('2d');

  const noteLogic = new NoteLogic();
  const notePlayer = new NotePlayer();
  let startTime = 0;
  let latestNotes = [];
  const playBtn = document.getElementById('play-btn');

  // Initialize UI Oscilloscope
  function drawOscilloscope(dataArray) {
    if (!dataArray) return;
    
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 3;
    canvasCtx.strokeStyle = '#34d399'; // Accent color
    canvasCtx.beginPath();
    
    const sliceWidth = canvas.width * 1.0 / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i]; // value between -1.0 and 1.0
      // Scale and shift vertically
      const y = (v * (canvas.height / 2)) + (canvas.height / 2);

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  // Handle Pitch Data
  function handlePitch(freq) {
    const timestamp = performance.now() - startTime;
    
    if (freq) {
      freqVal.innerText = freq.toFixed(1);
      const noteStr = noteLogic.processPitch(freq, timestamp);
      if (noteStr) {
        noteVal.innerText = noteStr.split('/')[0].toUpperCase();
      } else {
        noteVal.innerText = '-';
      }
    } else {
      freqVal.innerText = '---';
      noteVal.innerText = '-';
      noteLogic.processPitch(null, timestamp); // silence
    }
  }

  const audioProcessor = new AudioProcessor(handlePitch, drawOscilloscope);

  startBtn.addEventListener('click', async () => {
    noteLogic.reset();
    document.getElementById('sheet-music-output').innerHTML = '<p class="placeholder-text">Listening...</p>';
    
    startBtn.disabled = true;
    startBtn.innerText = 'Starting...';

    try {
      await audioProcessor.start();
      notePlayer.startMetronome();
      
      startTime = performance.now();
      
      startBtn.innerText = 'Start Recording';
      stopBtn.disabled = false;
      dot.classList.add('recording');
      statusText.innerText = 'Recording...';
    } catch (err) {
      document.getElementById('sheet-music-output').innerHTML = '<p class="placeholder-text" style="color:var(--danger)">Error: Microphone access denied or missing.</p>';
      startBtn.disabled = false;
      startBtn.innerText = 'Start Recording';
    }
  });

  stopBtn.addEventListener('click', () => {
    audioProcessor.stop();
    notePlayer.stopMetronome();
    const timestamp = performance.now() - startTime;
    latestNotes = noteLogic.finalize(timestamp);
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    dot.classList.remove('recording');
    statusText.innerText = 'Ready to record';
    freqVal.innerText = '---';
    noteVal.innerText = '-';
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Sheet Music
    drawSheetMusic('sheet-music-output', latestNotes);

    if (latestNotes && latestNotes.length > 0) {
      playBtn.disabled = false;
    }
  });
  
  playBtn.addEventListener('click', async () => {
    playBtn.disabled = true;
    const prevText = playBtn.innerHTML;
    playBtn.innerHTML = '<span class="btn-icon">🔊</span> Playing...';
    
    await notePlayer.playNotes(latestNotes, 
      (i) => highlightNote(i, true),
      (i) => highlightNote(i, false)
    );

    // estimate length to re-enable button
    // It's already async? Wait, playNotes doesn't block since it schedules Web Audio API nodes.
    // To properly reset, we need to know duration. Let's just re-enable immediately or after 1 sec for now since playNotes is fire-and-forget scheduling. 
    // Wait, let's calculate rough duration.
    let beats = 0;
    latestNotes.forEach(nd => {
      if (nd.duration.includes('8')) beats += 0.5;
      else if (nd.duration.includes('q')) beats += 1;
      else if (nd.duration.includes('h')) beats += 2;
      else if (nd.duration.includes('w')) beats += 4;
    });
    const totalMs = (beats * (60 / notePlayer.bpm)) * 1000 + 500;
    
    setTimeout(() => {
      playBtn.disabled = false;
      playBtn.innerHTML = prevText;
    }, totalMs);
  });
  
  // draw empty line initially
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, canvas.height / 2);
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
  canvasCtx.lineWidth = 1;
  canvasCtx.stroke();
}
initApp();
