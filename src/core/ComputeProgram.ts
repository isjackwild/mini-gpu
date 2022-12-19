import { ComputableInterface } from "./Computer";
import Program from "./Program";
import { ProgramInputInterface } from "./Program";

// TODO — How to update a uniforms group and swap with another
class ComputeProgram extends Program implements ComputableInterface {
  declare pipeline: GPUComputePipeline;
  private workgroupTotalSize = 0;
  private workgroupSize3D = [64, 1, 1];

  constructor(
    private device: GPUDevice,
    public shader: string,
    protected _inputs: { [key: string]: ProgramInputInterface },
    private count: number,
    private workgroupSize:
      | number
      | [number]
      | [number, number]
      | [number, number, number]
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

    if (Array.isArray(this.workgroupSize)) {
      this.workgroupTotalSize =
        (this.workgroupSize[0] || 1) *
        (this.workgroupSize[1] || 1) *
        (this.workgroupSize[2] || 1);

      this.workgroupSize3D[0] = this.workgroupSize[0] || 1;
      this.workgroupSize3D[1] = this.workgroupSize[1] || 1;
      this.workgroupSize3D[2] = this.workgroupSize[2] || 1;
    } else {
      this.workgroupTotalSize = this.workgroupSize;
    }

    console.log(this.workgroupSize3D);
  }

  // private calculateWorkgroupSize(): [number, number, number] {
  //   let x = this.device.limits.maxComputeWorkgroupSizeX;
  //   let y = this.device.limits.maxComputeWorkgroupSizeY;
  //   let z = this.device.limits.maxComputeWorkgroupSizeZ;

  //   while (x * y * z > this.count) {
  //     x--;
  //     y--;
  //     z--;
  //   }

  //   return [
  //     Math.max(Math.min(x + 1, this.device.limits.maxComputeWorkgroupSizeX), 1),
  //     Math.max(Math.min(y + 1, this.device.limits.maxComputeWorkgroupSizeY), 1),
  //     Math.max(Math.min(z + 1, this.device.limits.maxComputeWorkgroupSizeZ), 1),
  //   ];
  // }

  public setBindGroups(computePass: GPUComputePassEncoder): void {
    super.setBindGroups(computePass);
  }

  public getCommands(computePass: GPUComputePassEncoder): void {
    computePass.setPipeline(this.pipeline);
    this.setBindGroups(computePass);
    const dispatchCount = Math.ceil(this.count / this.workgroupTotalSize);
    // computePass.dispatchWorkgroups(Math.ceil(this.count / this.workgroupSize));
    computePass.dispatchWorkgroups(
      Math.ceil(this.count / this.workgroupSize3D[0]),
      Math.ceil(this.count / this.workgroupSize3D[1]),
      Math.ceil(this.count / this.workgroupSize3D[2])
    );
  }
}

export default ComputeProgram;
