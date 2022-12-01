import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  PingPongInput,
  OrbitControls,
  Camera,
  Helpers,
} from "../src";
import { TGeometryArgs } from "../src/core/Geometry";
import { primitives } from "twgl.js";

import shader from "./shader.wgsl?raw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer;
let uniforms: UniformsInput, pingPong: PingPongInput;
let camera: Camera;
let controls: OrbitControls;

const DEG_TO_RAD = 0.0174533;

const render = () => {
  camera.aspectRatio = renderer.width / renderer.height;
  renderer.renderAll();
  controls?.update();
  pingPong.step();
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
  requestAnimationFrame(render);
};

const init = async () => {
  if (!navigator.gpu) {
    return alert(
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags."
    );
  }
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
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
  uniforms = new UniformsInput(device as GPUDevice, {
    u_view_projection_matrix: camera.viewProjectionMatrix,
    u_elapsed_time: 0,
  });
  pingPong = new PingPongInput(device as GPUDevice, new Float32Array([0]));

  const program = new RenderProgram(renderer, shader, geometry, {
    uniforms,
    pingPong,
  });
  console.log(program.getWgslChunk());
  renderer.addRenderable(program);
  requestAnimationFrame(render);

  window.addEventListener("resize", () => renderer.resize());
};

init();
