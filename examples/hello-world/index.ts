import {
  Renderer,
  RenderProgram,
  Geometry,
  Uniforms,
  Mesh,
  TextureLoader,
} from "../../src/index";

import { primitives } from "twgl.js";
import textureSrc from "./spectral-interference.png";
import shader from "bundle-text:./shader.wgsl";
import { TGeometryArgs } from "../../src/core/Geometry";

let device: GPUDevice;
const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;

let renderer: Renderer;
let uniforms;

console.log(Mesh.foo);

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
  const texture = await new TextureLoader(device).loadTextureFromImageSrc(
    textureSrc
  );
  renderer = new Renderer(device as GPUDevice, canvas);

  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );
  uniforms = new Uniforms(device as GPUDevice, {
    u_elapsed_time: 0,
    u_test_vector: [1, 1, 1],
    u_test_vector_2: [1, 1, 1, 1],
    u_test_vector_3: [1, 1],
    u_delta_time: 0,
    u_texture: texture,
  });
  const viewportUniforms = new Uniforms(device as GPUDevice, {
    u_resolution: [canvas.width, canvas.height],
  });
  const program = new RenderProgram(renderer, shader, {
    default: uniforms,
    viewport: viewportUniforms,
  });
  // console.log(program.getWgslChunk());

  const mesh = new Mesh(renderer, geometry, program);
  renderer.addRenderable(mesh);
  requestAnimationFrame(render);
};

init();
