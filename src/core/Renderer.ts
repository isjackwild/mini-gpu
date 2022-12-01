export interface RenderableInterface {
  getCommands(renderPass: GPURenderPassEncoder): void;
}

class Renderer {
  public ctx: GPUCanvasContext;
  private items: Set<RenderableInterface> = new Set();
  public presentationFormat: GPUTextureFormat;
  public depthFormat: GPUTextureFormat = "depth24plus-stencil8";
  private renderPassDescriptor: GPURenderPassDescriptor;
  private _pixelRatio = window.devicePixelRatio;
  private presentationSize = { width: 0, height: 0 };

  constructor(
    public device: GPUDevice,
    private canvas: HTMLCanvasElement,
    options: { alphaMode?: GPUCanvasAlphaMode } = {}
  ) {
    this.presentationSize.width = this.canvas.clientWidth * this.pixelRatio;
    this.presentationSize.height = this.canvas.clientHeight * this.pixelRatio;
    this.canvas.width = this.presentationSize.width;
    this.canvas.height = this.presentationSize.height;
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
        width: this.width,
        height: this.height,
        depthOrArrayLayers: 1,
      },
      format: this.depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
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
    return this.presentationSize.width;
  }

  public get height(): number {
    return this.presentationSize.height;
  }

  public get pixelRatio(): number {
    return this._pixelRatio;
  }

  public set pixelRatio(pixelRatio: number) {
    this._pixelRatio = pixelRatio;
    this.resize();
  }

  public resize(width?: number, height?: number): void {
    const newWidth = (width || this.canvas.clientWidth) * this.pixelRatio;
    const newHeight = (height || this.canvas.clientHeight) * this.pixelRatio;

    if (newWidth === this.width && newHeight === this.height) return;

    this.presentationSize.width = newWidth;
    this.presentationSize.height = newHeight;

    this.canvas.width = this.presentationSize.width;
    this.canvas.height = this.presentationSize.height;

    const depthTexture = this.device.createTexture({
      size: {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: 1,
      },
      format: this.depthFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.renderPassDescriptor.depthStencilAttachment.view =
      depthTexture.createView();
    this.renderPassDescriptor.colorAttachments[0].view = this.ctx
      .getCurrentTexture()
      .createView();
  }

  public add(renderable: RenderableInterface): void {
    this.items.add(renderable);
  }

  public remove(renderable: RenderableInterface): void {
    this.items.delete(renderable);
  }

  public render(renderable: RenderableInterface): void {
    this.renderPassDescriptor.colorAttachments[0].view = this.ctx
      .getCurrentTexture()
      .createView();

    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    renderable.getCommands(renderPass);

    renderPass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }

  public renderAll() {
    this.renderPassDescriptor.colorAttachments[0].view = this.ctx
      .getCurrentTexture()
      .createView();

    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    for (const renderable of this.items) {
      renderable.getCommands(renderPass);
    }

    renderPass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }
}

export default Renderer;
