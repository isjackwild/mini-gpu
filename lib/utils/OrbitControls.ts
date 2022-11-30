import { mat4, vec2, vec3 } from "gl-matrix";
import Camera from "./Camera";

type TOptions = {
  target?: vec3;
  up?: vec3;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
};

type TSpherical = {
  rho: number;
  phi: number;
  theta: number;
};

type TVec3 = {
  x: number;
  y: number;
  z: number;
};

class Spherical {
  public static sphericalToCathesian({ rho, phi, theta }: TSpherical): TVec3 {
    var sinPhiRho = Math.sin(phi) * rho;

    return {
      x: sinPhiRho * Math.sin(theta),
      y: Math.cos(phi) * rho,
      z: sinPhiRho * Math.cos(theta),
    };
  }

  public static cathesianToSpherical({ x, y, z }: TVec3): TSpherical {
    var rho = Math.sqrt(x * x + y * y + z * z);
    return {
      rho,
      phi: Math.acos(Math.min(Math.max(y / rho, -1), 1)),
      theta: Math.atan2(x, z),
    };
  }

  constructor(public rho = 0, public phi = 0, public theta = 0) {}

  public setFromCathesian(cathesian: TVec3): Spherical {
    const { rho, phi, theta } = Spherical.cathesianToSpherical(cathesian);

    this.rho = rho;
    this.phi = phi;
    this.theta = theta;

    return this;
  }

  public toCathesian(): TVec3 {
    return Spherical.sphericalToCathesian({
      rho: this.rho,
      phi: this.phi,
      theta: this.theta,
    });
  }
}

class OrbitControls {
  public eye = vec3.create();
  public target: vec3;
  public up: vec3;

  private spherical: Spherical;
  private sphericalDelta = new Spherical();

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  // Phi
  public minPolarAngle = Math.PI * 0.1;
  public maxPolarAngle = Math.PI * 0.9;

  // How far you can orbit horizontally, upper and lower limits.
  // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
  // Theta
  public minAzimuthAngle = -Infinity;
  public maxAzimuthAngle = Infinity;

  public rotateSpeed = 0.5;

  public autoRotate = false;
  public autoRotateSpeed = 1;

  public enableDamping = true;
  public dampingFactor = 0.01;

  private isPointerDown = false;
  private pointerStartPosition = vec2.create();
  private pointerDeltaPosition = vec2.create();
  private pointerEndPosition = vec2.create();

  constructor(
    private camera: Camera,
    private domElement = document.body,
    options: TOptions = {}
  ) {
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);

    const {
      target,
      up,
      autoRotate,
      autoRotateSpeed,
      enableDamping,
      dampingFactor,
    } = options;

    this.eye = mat4.getTranslation(this.eye, this.camera.transformationMatrix);
    this.target = target || vec3.fromValues(0, 0, 0);
    this.up = up || vec3.fromValues(0, 1, 0);

    this.autoRotate = !!autoRotate;
    this.autoRotateSpeed = autoRotateSpeed || 1;
    this.enableDamping = enableDamping === false ? false : true;
    this.dampingFactor = dampingFactor || 0.05;

    this.spherical = new Spherical().setFromCathesian({
      x: this.eye[0],
      y: this.eye[1],
      z: this.eye[2],
    });

    this.domElement.style.touchAction = "none";
    this.addEventListeners();
  }

  private addEventListeners(): void {
    this.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.domElement.addEventListener("pointermove", this.onPointerMove);
    this.domElement.addEventListener("pointerup", this.onPointerUp);
    this.domElement.addEventListener("pointercancel", this.onPointerCancel);
    this.domElement.addEventListener("pointerleave", this.onPointerCancel);
  }

  private removeEventListeners(): void {
    this.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.domElement.removeEventListener("pointerup", this.onPointerUp);
    this.domElement.removeEventListener("pointercancel", this.onPointerCancel);
    this.domElement.removeEventListener("pointerleave", this.onPointerCancel);
  }

  private onPointerDown(event: PointerEvent) {
    this.isPointerDown = true;
    const { clientX, clientY } = event;
    vec2.set(this.pointerStartPosition, clientX, clientY);
    this.domElement.style.cursor = "grabbing";
  }

  private onPointerMove(event: PointerEvent) {
    if (!this.isPointerDown) {
      return;
    }

    const { clientX, clientY } = event;
    vec2.set(this.pointerEndPosition, clientX, clientY);

    vec2.sub(
      this.pointerDeltaPosition,
      this.pointerEndPosition,
      this.pointerStartPosition
    );
    vec2.scale(
      this.pointerDeltaPosition,
      this.pointerDeltaPosition,
      this.rotateSpeed
    );

    this.rotateAzimuth(
      (2 * Math.PI * this.pointerDeltaPosition[0]) /
        this.domElement.clientHeight
    ); // yes, height
    this.rotatePolar(
      (2 * Math.PI * this.pointerDeltaPosition[1]) /
        this.domElement.clientHeight
    );

    vec2.copy(this.pointerStartPosition, this.pointerEndPosition);
  }

  private onPointerUp() {
    this.domElement.style.cursor = "";
    this.isPointerDown = false;
  }

  private onPointerCancel(event: PointerEvent) {
    this.onPointerUp();
  }

  public rotatePolar(angle: number) {
    this.sphericalDelta.phi += angle;
  }

  public rotateAzimuth(angle: number) {
    this.sphericalDelta.theta += angle;
  }

  public update(delta: number = 16.66) {
    if (this.autoRotate && !this.isPointerDown) {
      this.rotateAzimuth(delta * -0.0001 * this.autoRotateSpeed);
    }

    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor;
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor;
      this.sphericalDelta.theta *= 1 - this.dampingFactor;
      this.sphericalDelta.phi *= 1 - this.dampingFactor;
    } else {
      this.spherical.phi += this.sphericalDelta.phi;
      this.spherical.theta += this.sphericalDelta.theta;
      this.sphericalDelta.phi = 0;
      this.sphericalDelta.theta = 0;
    }

    this.spherical.phi = Math.min(
      Math.max(this.spherical.phi, this.minPolarAngle),
      this.maxPolarAngle
    );
    this.spherical.theta = Math.min(
      Math.max(this.spherical.theta, this.minAzimuthAngle),
      this.maxAzimuthAngle
    );

    const { x, y, z } = this.spherical.toCathesian();
    vec3.set(this.eye, x, y, z);
    mat4.lookAt(
      this.camera.transformationMatrix,
      this.eye,
      this.target,
      this.up
    );
    this.camera.updateMatrices();
  }

  public destroy(): void {
    this.removeEventListeners();
  }
}

export default OrbitControls;
