class WebGPUUniforms {
  private _uniform: ProxyConstructor;
  private uniformsArray: Float32Array;
  private uniformsArrayMemberMetadata: {
    [key: string]: { index: number; length: number };
  } = {};
  private uniformsBuffer: GPUBuffer;
  private bufferNeedsUpdate = true;
  private _bindGroup: GPUBindGroup;
  private _bindGroupLayout: GPUBindGroupLayout;
  public autoUpdate = true;

  constructor(private device: GPUDevice, members: { [key: string]: any }) {
    const bufferMembers: { key: string; value: any }[] = [];
    const textures: { key: string; value: GPUTexture }[] = [];
    for (let key in members) {
      const value = members[key];

      if (value instanceof GPUTexture) {
        textures.push({ key, value });
      } else {
        bufferMembers.push({ key, value });
      }
    }

    this.createArraysAndBuffers(bufferMembers, textures);
    this.createBindGroup();

    const handler = {
      get: (target, prop) => {
        return this.proxyGetHandler(target, prop);
      },
      set: (target, prop, reciever) => {
        return this.proxySetHandler(target, prop, reciever);
      },
    };
    this._uniform = new Proxy({}, handler);
  }

  private createBindGroup() {
    this._bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility:
            GPUShaderStage.VERTEX |
            GPUShaderStage.FRAGMENT |
            GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
      ],
    });

    this._bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformsBuffer,
          },
        },
      ],
    });
  }

  private createArraysAndBuffers(
    bufferMembers: { key: string; value: any }[],
    textures: { key: string; value: GPUTexture }[]
  ) {
    const arrayData: number[] = [];

    // TODO, array padding;
    for (let { key, value } of bufferMembers) {
      const arrayIndex = arrayData.length;
      this.uniformsArrayMemberMetadata[key] = {
        index: arrayIndex,
        length: value.length || 1,
      };

      if (Array.isArray(value)) {
        arrayData.push(...value);
      } else {
        arrayData.push(value);
      }
    }

    console.log(arrayData.length * Float32Array.BYTES_PER_ELEMENT);
    this.uniformsBuffer = this.device.createBuffer({
      size: arrayData.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformsArray = new Float32Array(arrayData);
    this.update();
  }

  private proxyGetHandler(target, prop) {
    const { index, length } = this.uniformsArrayMemberMetadata[prop];

    if (length > 1) {
      return Array.from(this.uniformsArray.slice(index, length));
    }
    return this.uniformsArray[index];
  }

  private proxySetHandler(target, prop, reciever) {
    const { index } = this.uniformsArrayMemberMetadata[prop];

    if (Array.isArray(reciever)) {
      this.uniformsArray.set(reciever, index);
    } else {
      this.uniformsArray.set([reciever], index);
    }
    this.bufferNeedsUpdate = true;

    if (this.autoUpdate) {
      this.update();
    }
    return true;
  }

  public get uniform(): any {
    return this._uniform;
  }

  public get bindGroupLayout(): GPUBindGroupLayout {
    return this._bindGroupLayout;
  }

  public get bindGroup(): GPUBindGroup {
    return this._bindGroup;
  }

  public update() {
    if (!this.bufferNeedsUpdate) return;
    this.device.queue.writeBuffer(this.uniformsBuffer, 0, this.uniformsArray);
    this.bufferNeedsUpdate = false;
  }
}

export default WebGPUUniforms;
