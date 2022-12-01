import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
} from "../../src";

// I'm using twgl to create my geometries...
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";
import { TGeometryArgs } from "../../src/core/Geometry";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer;
let uniforms: UniformsInput;

const animate = () => {
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  renderer.renderAll();
  requestAnimationFrame(animate);
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  renderer = new Renderer(device as GPUDevice, canvas);

  // Using twgl.js here to create my geometry attributes
  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );

  uniforms = new UniformsInput(device as GPUDevice, {
    u_elapsed_time: 0,
  });

  const renderProgram = new RenderProgram(
    renderer,
    renderShader,
    geometry,
    {
      uniforms,
    },
    true // wireframe
  );
  renderer.add(renderProgram);

  requestAnimationFrame(animate);
  window.addEventListener("resize", () => renderer.resize());
};

init();
