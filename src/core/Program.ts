export interface ProgramInputInterface {
  bindGroupLayout: GPUBindGroupLayout;
  bindGroup: GPUBindGroup;
  update?(): void;
  getWgslChunk(groupIndex: string | number, name: string): string;
}

abstract class Program {
  protected pipeline: GPURenderPipeline | GPUComputePipeline;
  protected inputsKeys: string[];
  protected _inputs: { [key: string]: ProgramInputInterface };

  public get inputs(): { [key: string]: ProgramInputInterface } {
    return this._inputs;
  }

  public set inputs(newInputs: { [key: string]: ProgramInputInterface }) {
    this._inputs = newInputs;
    this.inputsKeys = Object.keys(this.inputs);
  }

  public getInput(key: string): ProgramInputInterface {
    return this.inputs[key];
  }

  public setInput(key: string, input: ProgramInputInterface) {
    this._inputs[key] = input;
    this.inputsKeys = Object.keys(this.inputs);
  }

  public getBindGroupLayouts(): GPUBindGroupLayout[] {
    return this.inputsKeys.map((key) => this.inputs[key].bindGroupLayout);
  }

  public setBindGroups(
    pass: GPUComputePassEncoder | GPURenderPassEncoder
  ): void {
    this.inputsKeys.forEach((key, index) => {
      if (this.inputs[key].update) {
        this.inputs[key].update();
      }
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
