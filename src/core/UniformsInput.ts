import StructuredFloat32Array, {
  TStructuredFloat32ArrayAcceptedTypes,
} from "./StructuredFloat32Array";
import { ProgramInputInterface } from "./Program";

class UniformsInput implements ProgramInputInterface {
  private _member: ProxyConstructor;

  private bufferMembers: { key: string; value: any }[] = [];
  private textures: { key: string; value: GPUTexture }[] = [];

  private uniformsArray: StructuredFloat32Array;
  private uniformsBuffer: GPUBuffer;
  private bufferNeedsUpdate = true;
  private _bindGroup: GPUBindGroup;
  private _bindGroupLayout: GPUBindGroupLayout;
  public autoUpdate = true;

  constructor(private device: GPUDevice, members: { [key: string]: any }) {
    for (let key in members) {
      const value = members[key];

      if (value instanceof GPUTexture) {
        this.textures.push({ key, value });
      } else {
        this.bufferMembers.push({ key, value });
      }
    }

    this.createArraysAndBuffers();
    this.createBindGroup();

    const handler = {
      get: (target, prop) => {
        return this.proxyGetHandler(target, prop);
      },
      set: (target, prop, reciever) => {
        return this.proxySetHandler(target, prop, reciever);
      },
    };
    this._member = new Proxy({}, handler);
  }

  private createArraysAndBuffers(): void {
    const structuredArrayInitializer = this.bufferMembers.reduce(
      (acc, value) => {
        acc[value.key] = value.value;
        return acc;
      },
      {}
    );
    this.uniformsArray = new StructuredFloat32Array(
      structuredArrayInitializer as any as {
        [key: string]: TStructuredFloat32ArrayAcceptedTypes;
      }
    );

    this.uniformsBuffer = this.device.createBuffer({
      size: this.uniformsArray.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.update();
  }

  private createBindGroup(): void {
    const entriesLayout: GPUBindGroupLayoutEntry[] = [];

    if (this.bufferMembers.length) {
      entriesLayout.push({
        binding: entriesLayout.length,
        visibility:
          GPUShaderStage.VERTEX |
          GPUShaderStage.FRAGMENT |
          GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      });
    }

    this.textures.forEach(({ value }) => {
      entriesLayout.push({
        binding: entriesLayout.length,
        visibility:
          GPUShaderStage.VERTEX |
          GPUShaderStage.FRAGMENT |
          GPUShaderStage.COMPUTE,
        sampler: { type: "filtering" },
      });
      entriesLayout.push({
        binding: entriesLayout.length,
        visibility:
          GPUShaderStage.VERTEX |
          GPUShaderStage.FRAGMENT |
          GPUShaderStage.COMPUTE,
        texture: {
          sampleType: "float",
          multisampled: false,
          viewDimension: value.dimension,
        },
      });
    });

    this._bindGroupLayout = this.device.createBindGroupLayout({
      entries: entriesLayout,
    });

    const entries: GPUBindGroupEntry[] = [];
    if (this.bufferMembers.length) {
      entries.push({
        binding: 0,
        resource: {
          buffer: this.uniformsBuffer,
        },
      });
    }
    this.textures.forEach(({ value }) => {
      entries.push({
        binding: entries.length,
        resource: this.device.createSampler({
          magFilter: "linear",
          minFilter: "linear",
        }),
      });
      entries.push({
        binding: entries.length,
        resource: value.createView({ dimension: value.dimension }),
      });
    });

    this._bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries,
    });
  }

  private proxyGetHandler(target, prop) {
    const texture = this.textures.find(
      ({ key }: { key: string }) => key === prop
    );
    if (texture) {
      return texture.value;
    }
    return this.uniformsArray.getValueAt(prop);
  }

  private proxySetHandler(target, prop, reciever) {
    if (reciever instanceof GPUTexture) {
      const item = this.textures.find(
        ({ key }: { key: string }) => key === prop
      );
      item.value = reciever;
      this.createBindGroup();
    } else {
      this.uniformsArray.setValueAt(prop, reciever);
      this.bufferNeedsUpdate = true;
    }

    if (this.autoUpdate) {
      this.update();
    }

    return true;
  }

  public get member(): any {
    return this._member;
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
    const structName = `Uniforms${
      name.charAt(0).toUpperCase() + name.slice(1)
    }`;
    return `
    struct ${structName} {
        ${this.bufferMembers.reduce((acc, { key, value }) => {
          const type = Array.isArray(value) ? `vec${value.length}<f32>` : "f32";
          if (acc === "") {
            return `${key} : ${type},`;
          } else {
            return `${acc}
        ${key} : ${type},`;
          }
        }, "")}
    }

    @group(${groupIndex}) @binding(0) var<uniform> uniforms${
      name ? "_" : ""
    }${name} : ${structName};
    `;
  }

  public update() {
    if (!this.bufferNeedsUpdate) return;
    this.device.queue.writeBuffer(this.uniformsBuffer, 0, this.uniformsArray);
    this.bufferNeedsUpdate = false;
  }
}

export default UniformsInput;
