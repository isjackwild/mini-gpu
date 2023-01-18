import { mat4, vec3 } from "gl-matrix";

class Camera {
  private _aspectRatio: number;
  private _fov: number;
  private _near: number;
  private _far: number;

  public transformationMatrix: Float32Array;
  private projectionMatrix: Float32Array;
  public viewProjectionMatrix: Float32Array;

  constructor({
    aspectRatio,
    fov,
    near,
    far,
    position,
    target = [0, 0, 0],
    up = [0, 1, 0],
  }: {
    aspectRatio: number;
    fov: number;
    near: number;
    far: number;
    position: [number, number, number];
    target?: [number, number, number];
    up?: [number, number, number];
  }) {
    // const transformationMatrix = mat4.fromTranslation(
    //   mat4.create(),
    //   vec3.fromValues(...position)
    // ) as Float32Array;

    const transformationMatrix = mat4.lookAt(
      mat4.create(),
      position,
      target,
      up
    ) as Float32Array;
    const projectionMatrix = mat4.identity(mat4.create()) as Float32Array;
    const viewProjectionMatrix = mat4.identity(mat4.create()) as Float32Array;

    this._near = near;
    this._far = far;
    this._aspectRatio = aspectRatio;
    this._fov = fov;

    this.transformationMatrix = transformationMatrix;
    this.projectionMatrix = projectionMatrix;
    this.viewProjectionMatrix = viewProjectionMatrix;

    this.updateMatrices();
  }

  public get aspectRatio(): number {
    return this._aspectRatio;
  }

  public set aspectRatio(aspectRatio: number) {
    this._aspectRatio = aspectRatio;
    this.updateMatrices();
  }

  public get fov(): number {
    return this._fov;
  }

  public set fov(fov: number) {
    this._fov = fov;
    this.updateMatrices();
  }

  public get near(): number {
    return this._near;
  }

  public set near(near: number) {
    this._near = near;
    this.updateMatrices();
  }

  public get far(): number {
    return this._far;
  }

  public set far(far: number) {
    this._far = far;
    this.updateMatrices();
  }

  public set position(position: [number, number, number]) {
    this.transformationMatrix[12] = position[0];
    this.transformationMatrix[13] = position[1];
    this.transformationMatrix[14] = position[2];
    this.updateMatrices();
  }

  public get position(): [number, number, number] {
    return [
      this.transformationMatrix[12],
      this.transformationMatrix[13],
      this.transformationMatrix[14],
    ];
  }

  public updateMatrices() {
    mat4.perspective(
      this.projectionMatrix,
      this.fov,
      this.aspectRatio,
      this.near,
      this.far
    ) as Float32Array;

    mat4.multiply(
      this.viewProjectionMatrix,
      this.projectionMatrix,
      this.transformationMatrix
    ) as Float32Array;
  }
}
export default Camera;
