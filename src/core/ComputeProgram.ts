import { ComputableInterface } from "./Computer";
import Program from "./Program";
import { ProgramInputInterface } from "./Program";

// TODO — How to update a uniforms group and swap with another
class ComputeProgram extends Program implements ComputableInterface {
  declare pipeline: GPUComputePipeline;

  constructor(
    private device: GPUDevice,
    public shader: string,
    protected _inputs: { [key: string]: ProgramInputInterface },
    public count: number,
    private workgroupSize: number
  ) {
    super();
    this.inputsKeys = Object.keys(this.inputs);
    const shaderModule = this.device.createShaderModule({
      code: this.shader,
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: this.getBindGroupLayouts(),
    });

    this.pipeline = this.device.createComputePipeline({
      layout: pipelineLayout,
      compute: {
        module: shaderModule,
        entryPoint: "main",
      },
    });
  }

  public setBindGroups(computePass: GPUComputePassEncoder): void {
    super.setBindGroups(computePass);
  }

  public getCommands(computePass: GPUComputePassEncoder): void {
    computePass.setPipeline(this.pipeline);
    this.setBindGroups(computePass);
    computePass.dispatchWorkgroups(Math.ceil(this.count / this.workgroupSize));
  }
}

export default ComputeProgram;
