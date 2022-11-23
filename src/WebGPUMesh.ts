import WebGPUGeometry from "./WebGPUGeometry";
import WebGPUProgram from "./WebGPUProgram";
import WebGPURenderer, { RenderableInterface } from "./WebGPURenderer";

class WebGPUMesh implements RenderableInterface {
  private pipeline: GPURenderPipeline;
  constructor(
    renderer: WebGPURenderer,
    private geometry: WebGPUGeometry,
    private program: WebGPUProgram
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

export default WebGPUMesh;
