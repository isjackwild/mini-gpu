import StructuredFloat32Array from "./StructuredFloat32Array";
import { ProgramInputInterface } from "./Program";

class BufferInput implements ProgramInputInterface {
  private _bindGroupLayout: GPUBindGroupLayout;
  private buffers: GPUBuffer[] = [];
  private stagingBuffer: GPUBuffer;
  private _bindGroup: GPUBindGroup;
  private isReadingStagingBuffer = false;

  constructor(
    private device: GPUDevice,
    private data:
      | StructuredFloat32Array
      | Float32Array
      | (StructuredFloat32Array | Float32Array)[]
  ) {
    const arrays = Array.isArray(data) ? data : [data];
    let maxDataLength = 0;

    arrays.forEach((data) => {
      const size = data.byteLength;
      if (size > maxDataLength) {
        maxDataLength = size;
      }

      const buffer = this.device.createBuffer({
        size,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
      });
      this.buffers.push(buffer);
      new Float32Array(buffer.getMappedRange()).set([...data]);
      buffer.unmap();
    });

    this.stagingBuffer = this.device.createBuffer({
      size: maxDataLength,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });

    this._bindGroupLayout = this.device.createBindGroupLayout({
      entries: arrays.map((data, index) => {
        return {
          binding: index,
          visibility:
            GPUShaderStage.COMPUTE |
            GPUShaderStage.FRAGMENT |
            GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        };
      }),
    });

    this._bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: this.buffers.map((buffer, index) => {
        return { binding: index, resource: { buffer } };
      }),
    });
  }

  public get length(): number | number[] {
    if (Array.isArray(this.data)) {
      return this.data.map((item) => item.length);
    } else {
      return this.data.length;
    }
  }

  public get byteLength(): number | number[] {
    if (Array.isArray(this.data)) {
      return this.data.map((item) => item.byteLength);
    } else {
      return this.data.byteLength;
    }
  }

  public get bindGroupLayout(): GPUBindGroupLayout {
    return this._bindGroupLayout;
  }

  public get bindGroup(): GPUBindGroup {
    return this._bindGroup;
  }

  public getWgslChunk(
    groupIndex: string | number = "[REPLACE_WITH_GROUP_INDEX]",
    name: string = ""
  ): string {
    if (Array.isArray(this.data)) {
      return this.data.reduce((acc, item, index) => {
        return `
        ${acc}
        ${
          item instanceof StructuredFloat32Array
            ? item.getWgslChunk(
                `Buffer${index}${name.charAt(0).toUpperCase() + name.slice(1)}`
              )
            : ``
        }

        @group(${groupIndex}) @binding(${index}) var<storage, read> input${
          name ? "_" : ""
        }${name}_${index} : array<[REPLACE_WITH_TYPE]>;
        `;
      }, ``);
    } else {
      if (this.data instanceof StructuredFloat32Array) {
        const structName = `Buffer${
          name.charAt(0).toUpperCase() + name.slice(1)
        }`;
        return `
    ${this.data.getWgslChunk(structName)}

    @group(${groupIndex}) @binding(0) var<storage, read> input${
          name ? "_" : ""
        }${name} : array<${structName}>;
    `;
      } else {
        return `
    @group(${groupIndex}) @binding(0) var<storage, read> input${
          name ? "_" : ""
        }${name} : array<[REPLACE_WITH_TYPE]>;
    `;
      }
    }
  }

  public async read(index = 0): Promise<Float32Array | null> {
    if (this.isReadingStagingBuffer) return null;
    this.isReadingStagingBuffer = true;

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(
      this.buffers[index],
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

  public async updateData(
    data: StructuredFloat32Array | Float32Array,
    index = 0
  ): Promise<void> {
    await this.device.queue.writeBuffer(this.buffers[index], 0, data);
  }
}

export default BufferInput;
