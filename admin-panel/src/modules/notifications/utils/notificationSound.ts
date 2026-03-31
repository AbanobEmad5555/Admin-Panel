let audioContext: AudioContext | null = null;
let unlocked = false;
let unlockBound = false;
let muted = false;

const unlockAudio = () => {
  unlocked = true;
  if (audioContext && audioContext.state === "suspended") {
    void audioContext.resume().catch(() => undefined);
  }
};

const bindUnlockListeners = () => {
  if (typeof window === "undefined" || unlockBound) {
    return;
  }
  unlockBound = true;
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio);
};

const getAudioContext = () => {
  if (typeof window === "undefined") {
    return null;
  }
  bindUnlockListeners();
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }
    audioContext = new AudioContextCtor();
  }
  return audioContext;
};

export const notificationSound = {
  setMuted(value: boolean) {
    muted = value;
  },
  async play() {
    if (muted) {
      return;
    }
    const context = getAudioContext();
    if (!context || !unlocked) {
      return;
    }
    if (context.state === "suspended") {
      await context.resume().catch(() => undefined);
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  },
};
