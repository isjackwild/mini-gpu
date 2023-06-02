import { mat4, vec3 } from "gl-matrix";

class Camera {
  private _aspectRatio: number;
  private _fov: number;
  private _near: number;
  private _far: number;
  private _position: [number, number, number];
  private _target: [number, number, number];
  private _up: [number, number, number];

  public transformationMatrix = mat4.identity(mat4.create()) as Float32Array;
  private projectionMatrix = mat4.identity(mat4.create()) as Float32Array;
  public viewProjectionMatrix = mat4.identity(mat4.create()) as Float32Array;

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
    this._near = near;
    this._far = far;
    this._aspectRatio = aspectRatio;
    this._fov = fov;
    this._position = position;
    this._target = target;
    this._up = up;

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
    this._position = position;
    this.updateMatrices();
  }

  public get position(): [number, number, number] {
    return this._position;
  }

  public set target(target: [number, number, number]) {
    this._target = target;
    this.updateMatrices();
  }

  public get target(): [number, number, number] {
    return this._target;
  }

  public get up(): [number, number, number] {
    return this._up;
  }

  public set up(up: [number, number, number]) {
    this._up = up;
    this.updateMatrices();
  }

  public updateMatrices() {
    mat4.lookAt(
      this.transformationMatrix,
      this.position,
      this.target,
      this.up
    ) as Float32Array;

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
