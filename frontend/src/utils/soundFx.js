/**
 * AEROTWIN AI - Tactical Audio & Sound Effects Engine (Web Audio API)
 * High-fidelity procedural audio synthesizer for MALE UAV telemetry & ground control station.
 * Zero external audio file dependencies - 100% synthesis via AudioContext.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = true; // Start muted by default to comply with browser autoplay policies
    this.volume = 0.35; // Master volume
    this.engineRunning = false;

    // Engine Audio Nodes
    this.engineMasterGain = null;
    this.oscLow = null;
    this.oscMid = null;
    this.oscSub = null;
    this.noiseNode = null;
    this.filterNode = null;
    this.vibrationLfo = null;
    this.vibrationGain = null;

    // Alarm tracking
    this.alarmActive = false;
    this.alarmInterval = null;
    this.lastFaultState = 'Healthy';
  }

  /**
   * Lazy initialize AudioContext on user interaction
   */
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(mute) {
    this.muted = mute;
    if (this.engineMasterGain && this.ctx) {
      this.engineMasterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.18, this.ctx.currentTime, 0.05);
    }
    if (mute && this.alarmActive) {
      this.stopAlarm();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.initContext();
    const nextMuted = !this.muted;
    this.setMuted(nextMuted);
    if (!nextMuted && !this.engineRunning) {
      this.startEngineSound(4850, 2.15);
    }
    return nextMuted;
  }

  /**
   * Start ambient continuous engine propulsion hum & acoustic rumble
   */
  startEngineSound(rpm = 4800, vibration = 2.0) {
    if (this.engineRunning || !this.ctx || this.muted) return;
    try {
      this.engineRunning = true;

      // Master engine volume node
      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(this.volume * 0.18, this.ctx.currentTime);
      this.engineMasterGain.connect(this.ctx.destination);

      // Low rumble oscillator (fundamental firing frequency ~ RPM / 60 * 2)
      this.oscLow = this.ctx.createOscillator();
      this.oscLow.type = 'sawtooth';
      const baseFreq = Math.max(30, (rpm / 60) * 1.6);
      this.oscLow.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      // Mid harmonic oscillator
      this.oscMid = this.ctx.createOscillator();
      this.oscMid.type = 'triangle';
      this.oscMid.frequency.setValueAtTime(baseFreq * 2.0, this.ctx.currentTime);

      // Sub-bass thump (piston stroke displacement)
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'sine';
      this.oscSub.frequency.setValueAtTime(baseFreq * 0.5, this.ctx.currentTime);

      // Mechanical vibration LFO (low-frequency wobble)
      this.vibrationLfo = this.ctx.createOscillator();
      this.vibrationLfo.type = 'sine';
      this.vibrationLfo.frequency.setValueAtTime(vibration * 1.5, this.ctx.currentTime);

      this.vibrationGain = this.ctx.createGain();
      this.vibrationGain.gain.setValueAtTime(12 + vibration * 6, this.ctx.currentTime);
      this.vibrationLfo.connect(this.vibrationGain);
      this.vibrationGain.connect(this.oscLow.frequency);

      // Lowpass filter to muffle raw harsh harmonics into realistic cockpit/GCS cabin hum
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.0, this.ctx.currentTime);

      // Propeller wind noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(520, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.engineMasterGain);

      // Connect oscillators through filter to master engine gain
      this.oscLow.connect(this.filterNode);
      this.oscMid.connect(this.filterNode);
      this.oscSub.connect(this.filterNode);
      this.filterNode.connect(this.engineMasterGain);

      this.oscLow.start();
      this.oscMid.start();
      this.oscSub.start();
      this.vibrationLfo.start();
      this.noiseNode.start();
    } catch (err) {
      console.warn('[Audio] Could not start engine audio:', err);
    }
  }

  /**
   * Update engine pitch, rumble & filter cutoff dynamically with incoming telemetry
   */
  updateEngineTelemetry(rpm = 4800, vibration = 2.0, throttle = 70) {
    if (this.muted || !this.engineRunning || !this.ctx) return;
    try {
      const baseFreq = Math.max(30, (rpm / 60) * 1.5);

      if (this.oscLow) {
        this.oscLow.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
      }
      if (this.oscMid) {
        this.oscMid.frequency.setTargetAtTime(baseFreq * 2.0, this.ctx.currentTime, 0.1);
      }
      if (this.oscSub) {
        this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, this.ctx.currentTime, 0.1);
      }
      if (this.vibrationLfo && this.vibrationGain) {
        this.vibrationLfo.frequency.setTargetAtTime(Math.max(1, vibration * 2), this.ctx.currentTime, 0.1);
        this.vibrationGain.gain.setTargetAtTime(8 + vibration * 12, this.ctx.currentTime, 0.1);
      }
      if (this.filterNode) {
        const filterCutoff = 220 + (throttle / 100) * 260 + (vibration * 25);
        this.filterNode.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.15);
      }
    } catch (err) {
      // ignore transient web audio errors
    }
  }

  /**
   * Stop continuous engine sound
   */
  stopEngineSound() {
    if (!this.engineRunning) return;
    try {
      this.engineRunning = false;
      if (this.oscLow) { this.oscLow.stop(); this.oscLow.disconnect(); }
      if (this.oscMid) { this.oscMid.stop(); this.oscMid.disconnect(); }
      if (this.oscSub) { this.oscSub.stop(); this.oscSub.disconnect(); }
      if (this.vibrationLfo) { this.vibrationLfo.stop(); this.vibrationLfo.disconnect(); }
      if (this.noiseNode) { this.noiseNode.stop(); this.noiseNode.disconnect(); }
      if (this.engineMasterGain) { this.engineMasterGain.disconnect(); }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Tactical GCS Interface Beep / Click chirp
   */
  playClick(type = 'normal') {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      if (type === 'high') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(1900, now + 0.04);
        gain.gain.setValueAtTime(this.volume * 0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'toggle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
        gain.gain.setValueAtTime(this.volume * 0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);
        gain.gain.setValueAtTime(this.volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.045);
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Warning Chime (Two-tone amber alert)
   */
  playWarningChime() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(this.volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Critical Emergency Alarm Siren (Military cockpit Master Caution style)
   */
  playEmergencyAlarm() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.frequency.setValueAtTime(920, now);
      osc1.frequency.linearRampToValueAtTime(680, now + 0.15);
      gain1.gain.setValueAtTime(this.volume * 0.28, now);
      gain1.gain.linearRampToValueAtTime(0.001, now + 0.16);

      osc1.start(now);
      osc1.stop(now + 0.17);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.frequency.setValueAtTime(920, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(680, now + 0.35);
      gain2.gain.setValueAtTime(this.volume * 0.28, now + 0.2);
      gain2.gain.linearRampToValueAtTime(0.001, now + 0.36);

      osc2.start(now + 0.2);
      osc2.stop(now + 0.37);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Fault Injected Surge / Mechanical Clank Effect
   */
  playFaultInjected() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Low mechanical thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'sawtooth';
      thud.frequency.setValueAtTime(180, now);
      thud.frequency.exponentialRampToValueAtTime(35, now + 0.25);
      thudGain.gain.setValueAtTime(this.volume * 0.45, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now);
      thud.stop(now + 0.3);

      // High dissonant alarm ping
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(1150, now);
      ping.frequency.exponentialRampToValueAtTime(580, now + 0.2);
      pingGain.gain.setValueAtTime(this.volume * 0.3, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      ping.connect(pingGain);
      pingGain.connect(this.ctx.destination);
      ping.start(now);
      ping.stop(now + 0.25);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Success Confirmation (Fault Cleared / Subsystem nominal)
   */
  playSuccess() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(this.volume * 0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Aerodynamic Takeoff Spool-up & Thrust Roar
   */
  playTakeoffThrust() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Spool-up rising whoosh
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 1.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 1.8);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.38, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Realistic Runway Touchdown Tire Chirp & Screech
   */
  playTouchdownScreech() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High rubber screech burst
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.28);

      gain.gain.setValueAtTime(this.volume * 0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);

      // Mechanical gear compression thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(120, now);
      thud.frequency.exponentialRampToValueAtTime(30, now + 0.18);
      thudGain.gain.setValueAtTime(this.volume * 0.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now);
      thud.stop(now + 0.22);
    } catch (err) {
      // ignore
    }
  }

  /**
   * Play Hydraulic Landing Gear Actuator Hum
   */
  playGearActuator() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(this.volume * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (err) {
      // ignore
    }
  }
}

// Global Singleton Instance
export const soundFx = new SoundSystem();
export default soundFx;
