import {
  Renderer,
  RenderProgram,
  Geometry,
  Uniforms,
  Mesh,
  OrbitControls,
  Camera,
} from "../src";
import { TGeometryArgs } from "../src/core/Geometry";
import { primitives } from "twgl.js";

import shader from "./shader.wgsl?raw";

let device: GPUDevice;
const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer;
let uniforms;
let camera: Camera;
let controls: OrbitControls;

const DEG_TO_RAD = 0.0174533;

const requestWebGPU = async () => {
  if (device) return device;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.warn("Could not access Adapter");
    return false;
  }
  device = await adapter.requestDevice();
  return device;
};

const render = () => {
  camera.aspectRatio = renderer.width / renderer.height;
  // uniforms.uniform.u_elapsed_time = uniforms.uniform.u_elapsed_time + 0.01;
  renderer.render();
  controls?.update();
  uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
  requestAnimationFrame(render);
};

const init = async () => {
  if (!navigator.gpu) {
    return alert(
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags."
    );
  }
  const device = (await requestWebGPU()) as GPUDevice;
  renderer = new Renderer(device as GPUDevice, canvas);

  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );

  camera = new Camera({
    fov: DEG_TO_RAD * 50,
    aspectRatio: renderer.width / renderer.height,
    near: 0.01,
    far: 999,
    position: [0, 0, -5],
  });

  controls = new OrbitControls(camera, canvas);
  uniforms = new Uniforms(device as GPUDevice, {
    u_view_projection_matrix: camera.viewProjectionMatrix,
  });

  const program = new RenderProgram(renderer, shader, geometry, {
    uniforms: uniforms,
  });
  renderer.addRenderable(program);
  requestAnimationFrame(render);

  window.addEventListener("resize", () => renderer.resize());
};

init();
