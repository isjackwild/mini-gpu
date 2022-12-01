import Geometry from "./Geometry";
import Renderer, { RenderableInterface } from "./Renderer";
import Uniforms, { ProgramInputInterface } from "./UniformsInput";

// TODO — How to update a uniforms group and swap with another
class RenderProgram implements RenderableInterface {
  private pipeline: GPURenderPipeline;
  private inputsKeys: string[];

  constructor(
    private renderer: Renderer,
    public shader: string,
    private geometry: Geometry,
    private _inputs: { [key: string]: ProgramInputInterface }
  ) {
    this.inputsKeys = Object.keys(this.inputs);
    const shaderModule = renderer.device.createShaderModule({
      code: this.shader,
    });
    const vertexState = this.geometry.getVertexState(shaderModule);
    const fragmentState = this.getFragmentState(shaderModule);

    const pipelineLayout = renderer.device.createPipelineLayout({
      bindGroupLayouts: this.getBindGroupLayouts(),
    });

    this.pipeline = renderer.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: "line-list",
      },
      depthStencil: {
        format: renderer.depthFormat,
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });
  }

  public get inputs(): { [key: string]: ProgramInputInterface } {
    return this._inputs;
  }

  private getFragmentState(shaderModule: GPUShaderModule): GPUFragmentState {
    return {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [
        {
          format: this.renderer.presentationFormat,
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
    return this.inputsKeys.map((key) => this.inputs[key].bindGroupLayout);
  }

  public setBindGroups(renderPass: GPURenderPassEncoder): void {
    this.inputsKeys.forEach((key, index) => {
      this.inputs[key].update();
      renderPass.setBindGroup(index, this.inputs[key].bindGroup);
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

  public getCommands(renderPass: GPURenderPassEncoder): void {
    renderPass.setPipeline(this.pipeline);
    this.geometry.setVertexBuffers(renderPass);
    this.setBindGroups(renderPass);
    renderPass.drawIndexed(
      this.geometry.vertexCount,
      this.geometry.instanceCount,
      0,
      0
    );
  }
}

export default RenderProgram;
