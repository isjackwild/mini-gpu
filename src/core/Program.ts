import { ProgramInputInterface } from "./UniformsInput";

abstract class Program {
  protected pipeline: GPURenderPipeline | GPUComputePipeline;
  protected inputsKeys: string[];
  protected _inputs: { [key: string]: ProgramInputInterface };

  public get inputs(): { [key: string]: ProgramInputInterface } {
    return this._inputs;
  }

  public getBindGroupLayouts(): GPUBindGroupLayout[] {
    return this.inputsKeys.map((key) => this.inputs[key].bindGroupLayout);
  }

  public setBindGroups(
    pass: GPUComputePassEncoder | GPURenderPassEncoder
  ): void {
    this.inputsKeys.forEach((key, index) => {
      this.inputs[key].update();
      pass.setBindGroup(index, this.inputs[key].bindGroup);
    });
  }

  public getWgslChunk(): string {
    return this.inputsKeys.reduce((acc, key) => {
      return `${acc} ${this.inputs[key].getWgslChunk(
        this.inputsKeys.indexOf(key),
        key
      )}`;
    }, "");
  }
}

export default Program;
