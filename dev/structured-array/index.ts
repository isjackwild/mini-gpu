import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
  Computer,
  PingPongInput,
  ComputeProgram,
  StructuredFloat32Array,
  Camera,
  OrbitControls,
} from "../../src";
import { TGeometryArgs } from "../../src/core/Geometry";
import { primitives } from "twgl.js";

import computeShader from "./compute.wgsl?raw";
import renderShader from "./render.wgsl?raw";

const DEG_TO_RAD = 0.0174533;
const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let computer: Computer, renderer: Renderer;
let pingPong: PingPongInput;
let camera: Camera, controls: OrbitControls;

const structArray = new StructuredFloat32Array(
  {
    size: () => 0.2 * (Math.random() * 0.1 + 0.1),
    life: () => (Math.random() * 5 + 5) * 1000,
    speed: () => 0.1 * (Math.random() * 0.1 + 0.1),
    color: () => [Math.random(), Math.random(), Math.random()],
    heading: () => [
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5,
    ],
    position: () => [0, 0, 0],
  },
  50_000
);
let uniforms: UniformsInput;

const readArray = async () => {
  console.log(await pingPong.read());
};

const animate = () => {
  controls.update();
  uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
  computer.runAll();
  renderer.renderAll();
  pingPong.step();
  requestAnimationFrame(animate);
  // readArray();
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  computer = new Computer(device);
  renderer = new Renderer(device, canvas);

  camera = new Camera({
    fov: DEG_TO_RAD * 50,
    aspectRatio: renderer.width / renderer.height,
    near: 0.01,
    far: 999,
    position: [0, 0, -10],
  });
  controls = new OrbitControls(camera, canvas);

  uniforms = new UniformsInput(device, {
    delta_time: 1 / 60,
    max_life: 10_000,
    u_view_projection_matrix: camera.viewProjectionMatrix,
  });
  pingPong = new PingPongInput(device, structArray);

  const computeProgram = new ComputeProgram(
    device,
    computeShader,
    {
      uniforms,
      values: pingPong,
    },
    structArray.count,
    64
  );
  computer.add(computeProgram);

  const geometry = new Geometry(
    renderer,
    primitives.createCubeVertices(1) as TGeometryArgs,
    structArray.count
  );
  const renderProgram = new RenderProgram(
    renderer,
    renderShader,
    geometry,
    {
      uniforms,
      values: pingPong,
    }
    // true
  );
  renderer.add(renderProgram);
  console.log(renderProgram.getWgslChunk());

  // window.addEventListener("click", animate);
  requestAnimationFrame(animate);
};

init();
