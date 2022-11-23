import WebGPURenderer from "./WebGPURenderer";
import WebGPUUniforms from "./WebGPUUniforms";

class WebGPUProgram {
  private uniformsKeys: string[];
  constructor(
    renderer: WebGPURenderer,
    public shader: string,
    public uniforms: { [key: string]: WebGPUUniforms }
  ) {
    this.uniformsKeys = Object.keys(uniforms);
  }

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
    return this.uniformsKeys.map((key) => this.uniforms[key].bindGroupLayout);
  }

  public setBindGroups(renderPass: GPURenderPassEncoder): void {
    this.uniformsKeys.forEach((key, index) => {
      renderPass.setBindGroup(index, this.uniforms[key].bindGroup);
    });
  }

  public getWgslChunk(): string {
    return this.uniformsKeys.reduce((acc, key) => {
      return `${acc} ${this.uniforms[key].getWgslChunk(
        this.uniformsKeys.indexOf(key),
        key
      )}`;
    }, "");
  }
}

export default WebGPUProgram;
