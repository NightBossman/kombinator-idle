// Prosty syntezator dźwięków w klimacie retro (8-bit / CRT beep) wykorzystujący Web Audio API

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

try {
  const saved = localStorage.getItem('kombinator_sound_enabled');
  if (saved !== null) {
    soundEnabled = saved === 'true';
  }
} catch (e) {}

export const isSoundEnabled = () => soundEnabled;
export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  try {
    localStorage.setItem('kombinator_sound_enabled', String(enabled));
  } catch (e) {}
};

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playBeep = (freq: number = 440, type: OscillatorType = 'square', duration: number = 0.1) => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignoruj błędy audio (np. brak interakcji użytkownika na starcie)
  }
};

export const playClick = () => playBeep(800, 'square', 0.05);
export const playSuccess = () => {
    playBeep(440, 'square', 0.1);
    setTimeout(() => playBeep(660, 'square', 0.15), 100);
};
export const playError = () => playBeep(150, 'sawtooth', 0.3);
export const playAlert = () => {
    playBeep(600, 'sawtooth', 0.1);
    setTimeout(() => playBeep(400, 'sawtooth', 0.2), 150);
};
