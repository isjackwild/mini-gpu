import Geometry from "./Geometry";
import RenderProgram from "./RenderProgram";
import Renderer, { RenderableInterface } from "./Renderer";

class Mesh implements RenderableInterface {
  private pipeline: GPURenderPipeline;
  constructor(
    renderer: Renderer,
    private geometry: Geometry,
    private program: RenderProgram
  ) {
    const shaderModule = renderer.device.createShaderModule({
      code: program.shader,
    });
    const vertexState = this.geometry.getVertexState(shaderModule);
    const fragmentState = this.program.getFragmentState(renderer, shaderModule);

    const pipelineLayout = renderer.device.createPipelineLayout({
      bindGroupLayouts: this.program.getBindGroupLayouts(),
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

  public getCommands(renderPass: GPURenderPassEncoder): void {
    renderPass.setPipeline(this.pipeline);
    this.geometry.setVertexBuffers(renderPass);
    this.program.setBindGroups(renderPass);
    renderPass.drawIndexed(
      this.geometry.vertexCount,
      this.geometry.instanceCount,
      0,
      0
    );
  }
}

export default Mesh;
