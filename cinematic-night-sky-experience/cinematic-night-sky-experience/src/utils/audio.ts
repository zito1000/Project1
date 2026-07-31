/**
 * Web Audio Deep-Space Ambient Soundscape Synthesizer
 * Provides an ethereal, non-intrusive celestial drone and crystalline chime effects.
 */

class SpaceSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.isInitialized = true;

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Low-pass Filter for deep space atmosphere
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(180, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Sub-drone 1 (Deep A1 - 55 Hz)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

      // Sub-drone 2 (Warm E2 - 82.41 Hz)
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(82.41, this.ctx.currentTime);

      // LFO for slow breathing filter sweep
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12 second cycle
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(80, this.ctx.currentTime);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.droneOsc1.connect(this.filter);
      this.droneOsc2.connect(droneGain);
      droneGain.connect(this.filter);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.lfo.start();
    } catch {
      // AudioContext fallback for restricted browsers
    }
  }

  public resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.18, this.ctx.currentTime, 0.1);
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public playChime(freq = 880, duration = 2.5) {
    if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Ignore audio glitches
    }
  }

  public playConstellationConnectSound() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    this.playChime(randomNote, 2.0);
  }

  public stopAll() {
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // cleanup
      }
      this.isInitialized = false;
    }
  }
}

export const soundscape = new SpaceSoundscape();
