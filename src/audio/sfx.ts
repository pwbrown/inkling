/**
 * Sound effects (DESIGN §8), synthesized with the Web Audio API so there are
 * no audio files to license or download. Browsers only allow audio after a
 * user gesture, so the audio context is created on the first key press.
 */
export type Sound = 'key' | 'pop' | 'error' | 'leak' | 'page';

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private volume = 0.6;
  private muted = false;

  setVolume(volume: number, muted: boolean): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.muted = muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.01);
  }

  /** Call from a user gesture (key press or click) so playback is allowed. */
  unlock(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.level();
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise(this.ctx);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  play(sound: Sound): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.level() === 0 || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    switch (sound) {
      case 'key':
        // A soft pen scratch: a short burst of filtered noise, pitch varied a little.
        this.scratch(now, 2600 + Math.random() * 1400, 0.045, 0.25);
        break;
      case 'pop':
        // An ink "plip": a quick upward sine blip.
        this.tone(now, 'sine', 620, 1100, 0.12, 0.35);
        break;
      case 'error':
        // A dull pencil tap.
        this.tone(now, 'triangle', 170, 120, 0.09, 0.3);
        break;
      case 'leak':
        // A glug as ink drains: a falling tone.
        this.tone(now, 'sine', 340, 70, 0.35, 0.45);
        break;
      case 'page':
        // A two-note chime for a finished page.
        this.tone(now, 'sine', 660, 660, 0.18, 0.25);
        this.tone(now + 0.14, 'sine', 990, 990, 0.3, 0.25);
        break;
    }
  }

  private level(): number {
    return this.muted ? 0 : this.volume * 0.8;
  }

  private tone(at: number, type: OscillatorType, from: number, to: number, duration: number, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(env).connect(this.master!);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  private scratch(at: number, frequency: number, duration: number, gain: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 1.2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(filter).connect(env).connect(this.master!);
    src.start(at, Math.random() * 0.5);
    src.stop(at + duration);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
