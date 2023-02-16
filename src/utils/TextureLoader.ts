class TextureLoader {
  constructor(private device: GPUDevice) {}

  public createTextureFromImageBitmapOrCanvas(
    src: ImageBitmap | HTMLCanvasElement | OffscreenCanvas | ImageBitmap[]
  ): GPUTexture {
    const isCubemap = Array.isArray(src);

    const width = isCubemap ? src[0].width : src.width;
    const height = isCubemap ? src[0].height : src.height;
    const depth = isCubemap ? 6 : 1;

    const texture = this.device.createTexture({
      dimension: "2d",
      size: [width, height, depth],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    if (isCubemap) {
      src.forEach((faceSrc, i) => {
        this.device.queue.copyExternalImageToTexture(
          { source: faceSrc },
          { texture, origin: [0, 0, i] },
          [faceSrc.width, faceSrc.height]
        );
      });
    } else {
      this.device.queue.copyExternalImageToTexture(
        { source: src },
        { texture },
        [src.width, src.height]
      );
    }
    return texture;
  }

  public async loadImageBitmapFromImageSrc(src: string): Promise<ImageBitmap> {
    const response = await fetch(src);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    return imageBitmap;
  }

  public async loadTextureFromImageSrc(
    src: string | [string, string, string, string, string, string]
  ): Promise<GPUTexture> {
    if (Array.isArray(src)) {
      const promises: Promise<ImageBitmap>[] = src.map(
        async (src) => await this.loadImageBitmapFromImageSrc(src)
      );
      const imageBitmaps = await Promise.all(promises);
      return this.createTextureFromImageBitmapOrCanvas(imageBitmaps);
    } else {
      const imageBitmap = await this.loadImageBitmapFromImageSrc(src);
      return this.createTextureFromImageBitmapOrCanvas(imageBitmap);
    }
  }
}

export default TextureLoader;
