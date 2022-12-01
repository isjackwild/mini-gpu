import {
  Renderer,
  Computer,
  RenderProgram,
  ComputeProgram,
  Geometry,
  UniformsInput,
  PingPongInput,
  OrbitControls,
  Camera,
  Helpers,
} from "../src";
import { TGeometryArgs } from "../src/core/Geometry";
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";
import computeShader from "./compute.wgsl?raw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer, computer: Computer;
let uniforms: UniformsInput, pingPong: PingPongInput;
let camera: Camera;
let controls: OrbitControls;

const DEG_TO_RAD = 0.0174533;

const readPingPong = async () => {
  const data = await pingPong.read();
  if (!data) return;
};

const render = () => {
  camera.aspectRatio = renderer.width / renderer.height;
  renderer.renderAll();
  computer.runAll();
  pingPong.step();
  controls?.update();
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
  readPingPong();
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
  computer = new Computer(device as GPUDevice);

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
  pingPong = new PingPongInput(
    device as GPUDevice,
    new Float32Array([0, 1, 2, 3, 4, 5])
  );

  const renderProgram = new RenderProgram(
    renderer,
    renderShader,
    geometry,
    {
      uniforms,
      pingPong,
    },
    true
  );
  renderer.add(renderProgram);

  const computeProgram = new ComputeProgram(
    device,
    computeShader,
    {
      values: pingPong,
    },
    pingPong.length,
    64
  );
  computer.add(computeProgram);

  requestAnimationFrame(render);

  window.addEventListener("resize", () => renderer.resize());
};

init();
