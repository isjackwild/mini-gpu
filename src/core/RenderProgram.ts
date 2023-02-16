import Geometry from "./Geometry";
import Program from "./Program";
import Renderer, { RenderableInterface } from "./Renderer";
import { ProgramInputInterface } from "./Program";

// TODO — How to update a uniforms group and swap with another
class RenderProgram extends Program implements RenderableInterface {
  declare pipeline: GPURenderPipeline;

  constructor(
    private renderer: Renderer,
    public shader: string,
    private geometry: Geometry,
    protected _inputs: { [key: string]: ProgramInputInterface },
    options: {
      wireframe?: boolean;
      depthWrite?: boolean;
      depthCompare?: GPUCompareFunction;
    } = {}
  ) {
    super();
    options = {
      wireframe: false,
      depthWrite: true,
      depthCompare: "less",
      ...options,
    };
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
        topology: options.wireframe ? "line-list" : "triangle-list",
      },
      depthStencil: {
        format: renderer.depthFormat,
        depthWriteEnabled: options.depthWrite,
        depthCompare: options.depthCompare,
      },
      multisample:
        renderer.sampleCount === 4
          ? {
              count: renderer.sampleCount,
            }
          : undefined,
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

  public setBindGroups(renderPass: GPURenderPassEncoder): void {
    super.setBindGroups(renderPass);
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
