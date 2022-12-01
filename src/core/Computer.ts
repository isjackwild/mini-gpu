export interface ComputableInterface {
  getCommands(computePass: GPUComputePassEncoder): void;
}

class Computer {
  private items: Set<ComputableInterface> = new Set();

  constructor(private device: GPUDevice) {}

  public add(computable: ComputableInterface): void {
    this.items.add(computable);
  }

  public remove(computable: ComputableInterface): void {
    this.items.delete(computable);
  }

  public run(computable: ComputableInterface): void {
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();

    computable.getCommands(computePass);

    computePass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }

  public runAll() {
    const commandEncoder = this.device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();

    for (const computable of this.items) {
      computable.getCommands(computePass);
    }

    computePass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }
}

export default Computer;
