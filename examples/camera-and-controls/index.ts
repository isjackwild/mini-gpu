import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
  Camera,
  OrbitControls,
} from "../../src";

// I'm using twgl to create my geometries...
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";
import { TGeometryArgs } from "../../src/core/Geometry";

const DEG_TO_RAD = 0.0174533;

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer;
let uniforms: UniformsInput;
let camera: Camera, controls: OrbitControls;

const animate = () => {
  controls?.update();
  uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  renderer.renderAll();
  requestAnimationFrame(animate);
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  renderer = new Renderer(device as GPUDevice, canvas);
  camera = new Camera({
    fov: DEG_TO_RAD * 50,
    aspectRatio: renderer.width / renderer.height,
    near: 0.01,
    far: 999,
    position: [0, 0, -5],
  });
  controls = new OrbitControls(camera, canvas);

  // Using twgl.js here to create my geometry attributes
  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32) as TGeometryArgs
  );

  uniforms = new UniformsInput(device as GPUDevice, {
    u_elapsed_time: 0,
    u_view_projection_matrix: camera.viewProjectionMatrix,
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
  window.addEventListener("resize", () => {
    renderer.resize();
    camera.aspectRatio = renderer.width / renderer.height;
  });
};

init();
