import { WebGPUUniforms } from "./WebGPUMesh";
import WebGPURenderer from "./WebGPURenderer";

class WebGPUProgram {
  constructor(
    renderer: WebGPURenderer,
    public shader: string,
    public uniforms: { [key: string]: WebGPUUniforms }
  ) {}

  public getFragmentState(
    renderer: WebGPURenderer,
    shaderModule: GPUShaderModule
  ): GPUFragmentState {
    return {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [
        {
          format: renderer.presentationFormat,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    };
  }

  public getBindGroupLayouts(): GPUBindGroupLayout[] {
    return Object.keys(this.uniforms).map(
      (key) => this.uniforms[key].bindGroupLayout
    );
  }

  public setBindGroups(renderPass: GPURenderPassEncoder): void {
    Object.keys(this.uniforms).forEach((key, index) => {
      renderPass.setBindGroup(index, this.uniforms[key].bindGroup);
    });
  }
}

export default WebGPUProgram;
