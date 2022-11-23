import { mat4, mat3, quat, vec4, vec2, vec3 } from "gl-matrix";
import { primitives } from "twgl.js";
import shader from "bundle-text:./shader.wgsl";
import WebGPURenderer from "./WebGPURenderer";
import WebGPUMesh from "./WebGPUMesh";
import WebGPUProgram from "./WebGPUProgram";
import WebGPUUniforms from "./WebGPUUniforms";
import WebGPUGeometry, { TGeometryArgs } from "./WebGPUGeometry";

let device: GPUDevice;
const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;

let renderer: WebGPURenderer;
let uniforms;

const requestWebGPU = async () => {
  if (device) return device;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.warn("Could not access Adapter");
    return;
  }
  device = await adapter.requestDevice();
  return device;
};

const render = () => {
  uniforms.uniform.u_elapsed_time = uniforms.uniform.u_elapsed_time + 0.01;
  renderer.render();
  requestAnimationFrame(render);
};

const init = async () => {
  if (!navigator.gpu) {
    return alert(
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags."
    );
  }
  const device = (await requestWebGPU()) as GPUDevice;
  renderer = new WebGPURenderer(device as GPUDevice, canvas);

  const geometry = new WebGPUGeometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );
  uniforms = new WebGPUUniforms(device as GPUDevice, {
    u_elapsed_time: 0,
    u_delta_time: 0,
  });

  const uniforms2 = new WebGPUUniforms(device as GPUDevice, {
    u_resolution: [canvas.width, canvas.height],
  });

  const program = new WebGPUProgram(renderer, shader, {
    default: uniforms,
    viewport: uniforms2,
  });
  console.log(program.getWgslChunk());

  const mesh = new WebGPUMesh(renderer, geometry, program);
  renderer.addRenderable(mesh);
  requestAnimationFrame(render);
};

init();
