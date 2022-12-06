import Renderer from "./Renderer";

export type TGeometryArgs = {
  indices: Uint16Array;
  normal: Float32Array;
  position: Float32Array;
  texcoord: Float32Array;
};

class Geometry {
  private _vertexCount: number;
  // private _instanceCount: number;

  private indicesBuffer: GPUBuffer;
  private positionBuffer: GPUBuffer;
  private normalBuffer: GPUBuffer;
  private texCoordBuffer: GPUBuffer;

  constructor(
    renderer: Renderer,
    { indices, normal, position, texcoord }: TGeometryArgs,
    private _instanceCount = 1
  ) {
    this._vertexCount = indices?.length;

    this.positionBuffer = renderer.device.createBuffer({
      size: position.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.positionBuffer.getMappedRange()).set(position);
    this.positionBuffer.unmap();

    this.normalBuffer = renderer.device.createBuffer({
      size: normal.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.normalBuffer.getMappedRange()).set(normal);
    this.normalBuffer.unmap();

    this.texCoordBuffer = renderer.device.createBuffer({
      size: texcoord.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.texCoordBuffer.getMappedRange()).set(texcoord);
    this.texCoordBuffer.unmap();

    this.indicesBuffer = renderer.device.createBuffer({
      size: indices.length * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indicesBuffer.getMappedRange()).set(indices);
    this.indicesBuffer.unmap();
  }

  public get vertexCount(): number {
    return this._vertexCount;
  }

  public get instanceCount(): number {
    return this._instanceCount;
  }

  public getVertexState(shaderModule: GPUShaderModule): GPUVertexState {
    return {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: [
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          stepMode: "vertex",
          attributes: [
            {
              format: "float32x3" as GPUVertexFormat,
              offset: 0,
              shaderLocation: 0,
            },
          ],
        },
        {
          arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT,
          stepMode: "vertex",
          attributes: [
            {
              format: "float32x3" as GPUVertexFormat,
              offset: 0,
              shaderLocation: 1,
            },
          ],
        },
        {
          arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
          stepMode: "vertex",
          attributes: [
            {
              format: "float32x2" as GPUVertexFormat,
              offset: 0,
              shaderLocation: 2,
            },
          ],
        },
      ],
    };
  }

  public setVertexBuffers(renderPass: GPURenderPassEncoder): void {
    renderPass.setIndexBuffer(this.indicesBuffer, "uint16");
    renderPass.setVertexBuffer(0, this.positionBuffer);
    renderPass.setVertexBuffer(1, this.normalBuffer);
    renderPass.setVertexBuffer(2, this.texCoordBuffer);
  }
}

export default Geometry;
