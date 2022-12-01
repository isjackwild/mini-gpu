import { ProgramInputInterface } from "./UniformsInput";

class PingPongInput implements ProgramInputInterface {
  private _bindGroupLayout: GPUBindGroupLayout;

  private bufferA: GPUBuffer;
  private bufferB: GPUBuffer;

  private bindGroupA: GPUBindGroup;
  private bindGroupB: GPUBindGroup;

  private bindGroupSwapIndex = 0;

  constructor(private device: GPUDevice, data: Float32Array) {
    this._bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility:
            GPUShaderStage.COMPUTE |
            GPUShaderStage.FRAGMENT |
            GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    const size = data.byteLength;
    this.bufferA = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.bufferA.getMappedRange()).set([...data]);
    this.bufferA.unmap();

    this.bufferB = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.bindGroupA = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.bufferA } },
        { binding: 1, resource: { buffer: this.bufferB } },
      ],
    });

    this.bindGroupB = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.bufferB } },
        { binding: 1, resource: { buffer: this.bufferA } },
      ],
    });
  }

  public get bindGroupLayout(): GPUBindGroupLayout {
    return this._bindGroupLayout;
  }

  public get bindGroup(): GPUBindGroup {
    return this.bindGroupSwapIndex % 2 === 0
      ? this.bindGroupA
      : this.bindGroupB;
  }

  public step(): void {
    this.bindGroupSwapIndex++;
  }

  public getWgslChunk(
    groupIndex: string | number = "[REPLACE_WITH_GROUP_INDEX]",
    name: string = ""
  ): string {
    const structName = `PingPong${
      name.charAt(0).toUpperCase() + name.slice(1)
    }`;
    return `
    ${structName} {
      ...
    }

    @group(${groupIndex}) @binding(0) var<storage, read> input${
      name ? "_" : ""
    }${name} : array<${structName}>;
    @group(${groupIndex}) @binding(1) var<storage, read_write> output${
      name ? "_" : ""
    }${name} : array<${structName}>;
    `;
  }

  public update() {}
}

export default PingPongInput;
