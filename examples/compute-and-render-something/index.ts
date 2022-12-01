import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
  Computer,
  PingPongInput,
  ComputeProgram,
} from "../../src";
import { TGeometryArgs } from "../../src/core/Geometry";

// I'm using twgl to create my geometries...
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";
import computeShader from "./compute.wgsl?raw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer, computer: Computer;
let uniforms: UniformsInput, pingPong: PingPongInput;

const animate = () => {
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  computer.runAll();
  renderer.renderAll();
  pingPong.step();
  requestAnimationFrame(animate);
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  renderer = new Renderer(device as GPUDevice, canvas);
  computer = new Computer(device as GPUDevice);

  pingPong = new PingPongInput(device, new Float32Array([0, 0, 0]));
  uniforms = new UniformsInput(device as GPUDevice, {
    u_elapsed_time: 0,
  });

  const computeProgram = new ComputeProgram(
    device,
    computeShader,
    {
      uniforms,
      values: pingPong,
    },
    pingPong.length,
    64
  );
  computer.add(computeProgram);

  // Using twgl.js here to create my geometry attributes
  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );

  const renderProgram = new RenderProgram(
    renderer,
    renderShader,
    geometry,
    {
      computed: pingPong,
    },
    true // wireframe
  );
  renderer.add(renderProgram);

  requestAnimationFrame(animate);
  window.addEventListener("resize", () => renderer.resize());
};

init();
