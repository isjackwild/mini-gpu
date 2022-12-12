import { ProgramInputInterface } from "./Program";

class PingPongTextureInput implements ProgramInputInterface {
  private _bindGroupLayout: GPUBindGroupLayout;

  private textureA: GPUTexture;
  private textureB: GPUTexture;

  private bindGroupA: GPUBindGroup;
  private bindGroupB: GPUBindGroup;

  private bindGroupSwapIndex = 0;

  constructor(private device: GPUDevice, descriptor: GPUTextureDescriptor) {
    this.textureA = this.device.createTexture(descriptor);
    this.textureB = this.device.createTexture(descriptor);

    this._bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility:
            GPUShaderStage.VERTEX |
            GPUShaderStage.FRAGMENT |
            GPUShaderStage.COMPUTE,
          sampler: { type: "filtering" },
        },
        {
          binding: 1,
          visibility:
            GPUShaderStage.VERTEX |
            GPUShaderStage.FRAGMENT |
            GPUShaderStage.COMPUTE,
          texture: {
            sampleType: "float",
            multisampled: false,
            viewDimension: this.textureA.dimension,
          },
        },
      ],
    });

    this.bindGroupA = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
          }),
        },
        {
          binding: 1,
          resource: this.textureA.createView({
            dimension: this.textureA.dimension,
          }),
        },
      ],
    });

    this.bindGroupB = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
          }),
        },
        {
          binding: 1,
          resource: this.textureB.createView({
            dimension: this.textureB.dimension,
          }),
        },
      ],
    });
  }

  public get width(): number {
    return this.textureA.width;
  }

  public get height(): number {
    return this.textureA.height;
  }

  public get bindGroupLayout(): GPUBindGroupLayout {
    return this._bindGroupLayout;
  }

  public get bindGroup(): GPUBindGroup {
    return this.bindGroupSwapIndex % 2 === 0
      ? this.bindGroupA
      : this.bindGroupB;
  }

  public get texture(): GPUTexture {
    return this.bindGroupSwapIndex % 2 === 0 ? this.textureA : this.textureB;
  }

  public get renderTexture(): GPUTexture {
    return this.bindGroupSwapIndex % 2 === 1 ? this.textureA : this.textureB;
  }

  public step(): void {
    this.bindGroupSwapIndex++;
  }

  public getWgslChunk(
    groupIndex: string | number = "[REPLACE_WITH_GROUP_INDEX]"
  ): string {
    return `
    @group(${groupIndex}) @binding(0) var sampler: sampler;
    @group(${groupIndex}) @binding(1) var texture: texture_2d<f32>;
    `;
  }

  public update() {}
}

export default PingPongTextureInput;
