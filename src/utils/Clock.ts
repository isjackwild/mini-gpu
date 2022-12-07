class Clock {
  then = Date.now();
  delta = 16.666;
  correction = 1;
  elapsedTime = 0;

  constructor() {
    this.reset = this.reset.bind(this);

    window.addEventListener("blur", this.reset);
    window.addEventListener("focus", this.reset);
  }

  public reset() {
    this.then = Date.now();
    this.elapsedTime = 0;
    this.correction = 1;
    this.delta = 16.66;
  }

  public tick(): { delta: number; correction: number; elapsedTime: number } {
    const now = Date.now();
    if (typeof this.then === "number") {
      this.delta = Math.min(now - this.then, 16.666 * 5);
    }
    this.elapsedTime += this.delta;
    this.then = now;
    this.correction = this.delta / 16.666;

    return {
      delta: this.delta,
      correction: this.correction,
      elapsedTime: this.elapsedTime,
    };
  }
}

export default Clock;
