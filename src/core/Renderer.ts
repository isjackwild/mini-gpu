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
  private _renderTexture?: GPUTexture;
  private antialiasRenderTexture?: GPUTexture;
  private depthTexture?: GPUTexture;
  private _sampleCount: 1 | 4 = 1;

  constructor(
    public device: GPUDevice,
    private canvas: HTMLCanvasElement,
    contextConfig: { alphaMode?: GPUCanvasAlphaMode } = {},
    options: { antialias?: boolean } = {}
  ) {
    this.presentationSize.width = this.canvas.clientWidth * this.pixelRatio;
    this.presentationSize.height = this.canvas.clientHeight * this.pixelRatio;
    this.canvas.width = this.presentationSize.width;
    this.canvas.height = this.presentationSize.height;
    this.ctx = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this._sampleCount = options.antialias ? 4 : 1;

    this.ctx.configure({
      device: this.device,
      format: this.presentationFormat,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      alphaMode: "premultiplied",
      ...contextConfig,
    });

    if (options.antialias) {
      this.antialiasRenderTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: this.presentationFormat,
        sampleCount: this.sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    this.depthTexture = device.createTexture({
      size: {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: 1,
      },
      format: this.depthFormat,
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: this.colourAttachmentView,
          resolveTarget: this.colourAttachmentResolveTarget,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        stencilLoadOp: "clear",
        stencilStoreOp: "store",
      },
    };
  }

  public get width(): number {
    if (!!this.renderTexture) {
      return this.renderTexture.width;
    }
    return this.presentationSize.width;
  }

  public get height(): number {
    if (!!this.renderTexture) {
      return this.renderTexture.height;
    }
    return this.presentationSize.height;
  }

  public get aspectRatio(): number {
    return this.width / this.height;
  }

  public get pixelRatio(): number {
    return this._pixelRatio;
  }

  public set pixelRatio(pixelRatio: number) {
    this._pixelRatio = pixelRatio;
    this.resize();
  }

  public get sampleCount(): 1 | 4 {
    return this._sampleCount;
  }

  public set renderTexture(texture: GPUTexture | null) {
    const lastWidth = this.width;
    const lastHeight = this.height;
    this._renderTexture?.destroy();
    this._renderTexture = texture;

    this.setColourAttachment();
    if (this.width !== lastWidth || this.height !== lastHeight) {
      this.depthTexture?.destroy();
      this.depthTexture = this.device.createTexture({
        size: {
          width: this.width,
          height: this.height,
          depthOrArrayLayers: 1,
        },
        sampleCount: this.sampleCount,
        format: this.depthFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.renderPassDescriptor.depthStencilAttachment.view =
        this.depthTexture.createView();
    }
  }

  public get renderTexture(): GPUTexture {
    return this._renderTexture;
  }

  public resize(width?: number, height?: number): void {
    if (!!this.renderTexture) return;

    const newWidth = (width || this.canvas.clientWidth) * this.pixelRatio;
    const newHeight = (height || this.canvas.clientHeight) * this.pixelRatio;

    if (newWidth === this.width && newHeight === this.height) return;

    this.presentationSize.width = newWidth;
    this.presentationSize.height = newHeight;

    this.canvas.width = this.presentationSize.width;
    this.canvas.height = this.presentationSize.height;

    this.depthTexture?.destroy();
    this.depthTexture = this.device.createTexture({
      size: {
        width: this.width,
        height: this.height,
        depthOrArrayLayers: 1,
      },
      format: this.depthFormat,
      sampleCount: this.sampleCount,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.renderPassDescriptor.depthStencilAttachment.view =
      this.depthTexture.createView();

    if (!!this.antialiasRenderTexture) {
      this.antialiasRenderTexture = this.device.createTexture({
        size: [width, height],
        format: this.presentationFormat,
        sampleCount: this.sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
  }

  public add(renderable: RenderableInterface): void {
    this.items.add(renderable);
  }

  public remove(renderable: RenderableInterface): void {
    this.items.delete(renderable);
  }

  private get colourAttachmentView(): GPUTextureView {
    if (this.antialiasRenderTexture) {
      return this.antialiasRenderTexture.createView();
    }
    if (this.renderTexture) {
      return this.renderTexture.createView();
    }
    return this.ctx.getCurrentTexture().createView();
  }

  private get colourAttachmentResolveTarget(): GPUTextureView | undefined {
    if (!this.antialiasRenderTexture) {
      return;
    }
    if (this.renderTexture) {
      return this.renderTexture.createView();
    }
    return this.ctx.getCurrentTexture().createView();
  }

  private setColourAttachment() {
    this.renderPassDescriptor.colorAttachments[0].view =
      this.colourAttachmentView;
    this.renderPassDescriptor.colorAttachments[0].resolveTarget =
      this.colourAttachmentResolveTarget;
  }

  public render(
    renderables: RenderableInterface | RenderableInterface[]
  ): void {
    this.setColourAttachment();

    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    if (Array.isArray(renderables)) {
      renderables.forEach((renderable) => renderable.getCommands(renderPass));
    } else {
      renderables.getCommands(renderPass);
    }

    renderPass.end();
    const commands = commandEncoder.finish();
    this.device.queue.submit([commands]);
  }

  public renderAll() {
    this.setColourAttachment();

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
