/**
 * High-clarity Shop Chime for Admin Order Alerts
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }
  if (sharedAudioContext && sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

// Ensure AudioContext is unlocked on user's first interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    if (sharedAudioContext && sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume();
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem("tiemchena_admin_sound");
  return saved !== "false";
}

export function setSoundEnabledStorage(enabled: boolean) {
  if (typeof window !== "undefined") {
    localStorage.setItem("tiemchena_admin_sound", enabled ? "true" : "false");
  }
}

/**
 * Loud, crisp 2-tone "Ding-Dong" bell chime
 */
export function playOrderNotificationSound() {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp "Ding" (E5 ~ 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.9, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Harmonic for Tone 1
    const osc1Harmonic = ctx.createOscillator();
    const gain1Harmonic = ctx.createGain();
    osc1Harmonic.type = "triangle";
    osc1Harmonic.frequency.setValueAtTime(1318.5, now);
    gain1Harmonic.gain.setValueAtTime(0.3, now);
    gain1Harmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1Harmonic.connect(gain1Harmonic);
    gain1Harmonic.connect(ctx.destination);
    osc1Harmonic.start(now);
    osc1Harmonic.stop(now + 0.35);

    // Tone 2: Warm "Dong" (C5 ~ 523.25Hz) after 0.18s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(523.25, now + 0.18);
    gain2.gain.setValueAtTime(1.0, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.9);

    // Harmonic for Tone 2
    const osc2Harmonic = ctx.createOscillator();
    const gain2Harmonic = ctx.createGain();
    osc2Harmonic.type = "triangle";
    osc2Harmonic.frequency.setValueAtTime(1046.5, now + 0.18);
    gain2Harmonic.gain.setValueAtTime(0.4, now + 0.18);
    gain2Harmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2Harmonic.connect(gain2Harmonic);
    gain2Harmonic.connect(ctx.destination);
    osc2Harmonic.start(now + 0.18);
    osc2Harmonic.stop(now + 0.6);
  } catch (e) {
    console.warn("Unable to play sound chime:", e);
  }
}
