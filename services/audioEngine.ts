import { LevelTheme } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private bpm: number = 120;
  private nextNoteTime: number = 0;
  private schedulerTimer: number | null = null;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // s
  private notesQueue: { time: number; lane: number }[] = [];
  
  // Callbacks
  onSpawnNote: ((lane: number, time: number) => void) | null = null;
  onBeat: ((time: number) => void) | null = null;

  constructor() {
    // Lazy init
  }

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.connect(this.analyser);
      this.gainNode.gain.value = 0.3; // Master volume
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setTheme(theme: LevelTheme) {
    this.bpm = theme.bpm;
  }

  start() {
    if (!this.ctx) return;
    this.isPlaying = true;
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.ctx.currentTime + 0.5; // Start shortly after
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
    }
  }

  getCurrentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  getByteFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getEnergy() {
    if (!this.analyser) return 0;
    const data = this.getByteFrequencyData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length;
  }

  private scheduler = () => {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      this.nextNote();
    }

    this.schedulerTimer = window.setTimeout(this.scheduler, this.lookahead);
  };

  private nextNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    // Simple 4/4 rhythm for demo: notes on every beat or half beat depending on "track"
    // For procedural, we just keep advancing.
    this.nextNoteTime += secondsPerBeat / 2; // 8th notes
  }

  private scheduleNote(time: number) {
    // Synth sound
    const osc = this.ctx!.createOscillator();
    const noteGain = this.ctx!.createGain();
    
    osc.connect(noteGain);
    noteGain.connect(this.gainNode!);

    // Simple procedural drum/synth pattern
    const beatIndex = Math.floor((time - this.startTime) / (60 / this.bpm * 0.5));
    const isKick = beatIndex % 4 === 0;
    const isSnare = beatIndex % 4 === 2;
    const isHat = beatIndex % 2 === 1;

    let freq = 0;
    let type: OscillatorType = 'sine';

    if (isKick) {
      freq = 150;
      type = 'square';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      noteGain.gain.setValueAtTime(1, time);
      noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
    } else if (isSnare) {
      freq = 200;
      type = 'triangle'; // White noise is harder to synth simply, using triangle for "tom" sound
      osc.frequency.setValueAtTime(200, time);
      noteGain.gain.setValueAtTime(0.7, time);
      noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    } else if (isHat) {
      freq = 800;
      type = 'sawtooth';
      osc.frequency.setValueAtTime(800, time);
      noteGain.gain.setValueAtTime(0.3, time);
      noteGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    }

    osc.type = type;
    osc.start(time);
    osc.stop(time + 0.5);

    // Trigger visual note spawn
    // Procedural placement: Random lane but weighted by beat type
    let lane = Math.floor(Math.random() * 4);
    if (isKick) lane = 1; // Center-ish
    if (isSnare) lane = 2;
    
    // Add some variation
    if (Math.random() > 0.8) lane = Math.floor(Math.random() * 4);

    // Call back to game engine to spawn visual note
    // Look ahead adjustment: The audio plays at `time`. The note needs to ARRIVE at target at `time`.
    // We notify the game now, the game logic handles spawning it at the right distance.
    if (this.onSpawnNote) {
       this.onSpawnNote(lane, time);
    }
    
    if (isKick && this.onBeat) {
        this.onBeat(time);
    }
  }
}

export const audioEngine = new AudioEngine();
