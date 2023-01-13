import StructuredFloat32Array from "./StructuredFloat32Array";
import { ProgramInputInterface } from "./Program";

class PingPongBufferInput implements ProgramInputInterface {
  private _bindGroupLayout: GPUBindGroupLayout;

  private bufferA: GPUBuffer;
  private bufferB: GPUBuffer;
  private stagingBuffer: GPUBuffer;

  private bindGroupA: GPUBindGroup;
  private bindGroupB: GPUBindGroup;

  private bindGroupSwapIndex = 0;
  private isReadingStagingBuffer = false;

  constructor(
    private device: GPUDevice,
    private data: StructuredFloat32Array | Float32Array
  ) {
    const size = data.byteLength;
    this.bufferA = this.device.createBuffer({
      size,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Float32Array(this.bufferA.getMappedRange()).set([...data]);
    this.bufferA.unmap();

    this.bufferB = this.device.createBuffer({
      size,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Float32Array(this.bufferB.getMappedRange()).set([...data]);
    this.bufferB.unmap();

    this.stagingBuffer = this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

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

  public get length(): number {
    return this.data.length;
  }

  public get byteLength(): number {
    return this.data.byteLength;
  }

  public get bindGroupLayout(): GPUBindGroupLayout {
    return this._bindGroupLayout;
  }

  public get bindGroup(): GPUBindGroup {
    return this.bindGroupSwapIndex % 2 === 0
      ? this.bindGroupA
      : this.bindGroupB;
  }

  public get buffer(): GPUBuffer {
    return this.bindGroupSwapIndex % 2 === 0 ? this.bufferA : this.bufferB;
  }

  public get backBuffer(): GPUBuffer {
    return this.bindGroupSwapIndex % 2 === 1 ? this.bufferA : this.bufferB;
  }

  public step(): void {
    this.bindGroupSwapIndex++;
  }

  public getWgslChunk(
    groupIndex: string | number = "[REPLACE_WITH_GROUP_INDEX]",
    name: string = ""
  ): string {
    if (this.data instanceof StructuredFloat32Array) {
      const structName = `PingPong${
        name.charAt(0).toUpperCase() + name.slice(1)
      }`;
      return `
      ${this.data.getWgslChunk(structName)}
  
    @group(${groupIndex}) @binding(0) var<storage, read> input${
        name ? "_" : ""
      }${name} : array<${structName}>;
    @group(${groupIndex}) @binding(1) var<storage, read_write> output${
        name ? "_" : ""
      }${name} : array<${structName}>;
      `;
    } else {
      return `
    @group(${groupIndex}) @binding(0) var<storage, read> input${
        name ? "_" : ""
      }${name} : array<[REPLACE_WITH_TYPE]>;
    @group(${groupIndex}) @binding(1) var<storage, read_write> output${
        name ? "_" : ""
      }${name} : array<[REPLACE_WITH_TYPE]>;
      `;
    }
  }

  public async read(): Promise<Float32Array | null> {
    if (this.isReadingStagingBuffer) return null;
    this.isReadingStagingBuffer = true;

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      this.buffer,
      0,
      this.stagingBuffer,
      0,
      this.stagingBuffer.size
    );
    this.device.queue.submit([commandEncoder.finish()]);

    await this.stagingBuffer.mapAsync(
      GPUMapMode.READ,
      0,
      this.stagingBuffer.size
    );
    const copyArrayBuffer = this.stagingBuffer.getMappedRange(
      0,
      this.stagingBuffer.size
    );
    const data = copyArrayBuffer.slice(0);

    this.stagingBuffer.unmap();
    this.isReadingStagingBuffer = false;
    return new Float32Array(data);
  }
}

export default PingPongBufferInput;
