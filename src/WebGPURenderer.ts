export interface RenderableInterface {
  getCommands(renderPassDescriptor: GPURenderPassEncoder): void;
}

class WebGPURenderer {
  public ctx: GPUCanvasContext;
  private renderables: Set<RenderableInterface> = new Set();
  public presentationFormat: GPUTextureFormat;
  public depthFormat: GPUTextureFormat = "depth24plus-stencil8";
  private renderPassDescriptor: GPURenderPassDescriptor;

  constructor(
    public device: GPUDevice,
    private canvas: HTMLCanvasElement,
    options: { alphaMode?: GPUCanvasAlphaMode } = {}
  ) {
    this.ctx = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.ctx.configure({
      device: this.device,
      format: this.presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      alphaMode: "premultiplied",
      ...options,
    });

    const depthTexture = device.createTexture({
      size: {
        width: canvas.width,
        height: canvas.height,
        depthOrArrayLayers: 1,
      },
      format: this.depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const colorView = this.ctx.getCurrentTexture().createView();
    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: colorView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        stencilLoadOp: "clear",
        stencilStoreOp: "store",
      },
    };
  }

  public get width(): number {
    return this.canvas.width;
  }

  public get height(): number {
    return this.canvas.height;
  }

  public addRenderable(renderable: RenderableInterface): void {
    this.renderables.add(renderable);
  }

  public removeRenderable(renderable: RenderableInterface): void {
    this.renderables.delete(renderable);
  }

  public render() {
    this.renderPassDescriptor.colorAttachments[0].view = this.ctx
      .getCurrentTexture()
      .createView();

    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    for (const renderable of this.renderables) {
      renderable.getCommands(renderPass);
    }

    renderPass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }
}

export default WebGPURenderer;
