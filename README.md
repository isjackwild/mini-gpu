![Mini GPU](public/minigpu.svg)

> A 🤏 helping hand for working with WebGPU

# ⚠️ Disclaimer! ⚠️

As WebGPU is a brand new API, and this library is very much a work in progress, so you can expect breaking changes. You should amost certainly not be using this in a production setting as of yet, but it's always fun to play around with new toys!

It has only been tested in [Chrome Canary](https://www.google.com/intl/en_uk/chrome/canary/), and you need to enable the WebGPU flag.

(I'm also not finished with writing these docs, so beware...)

# Motivation

This mini library has come out of my own experiments with WebGPU, and a desire to come up with a good structure for writing WebGPU code, simplify a few common use cases, and to abstract some of the boilerplate code you need to write to get something to happen.

It certainly doesn't (and doesn't aim to) do it all, and if you're after something highly configurable, you'll probably want to write it yourself, but if you're just looking for somewhere to get started, then come on in.

# Usage

_when I get round to publishing it..._

Install the library by running

```
npm i mini-gpu
```

Import the bits you need

```
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
} from "mini-gpu";
```

# How it works

Mini GPU supports both render pipelines and compute pipelines, and they follow a similar structure.

0. Get access to your machines GPU device.
1. Create a `Renderer` or `Computer` to run your programs.
2. Create one or multiple program inputs. There are currently two supported input types: `UniformsInput` (which creates a set of... wait for it... uniforms) and `PingPongInput` (which creates a swappable pingpong buffer for doing GPGPU).
3. For Render pipelines, create a `Geometry` by passing in indices, positions, normals and texcoords (I use the awesome [twgl.js](https://twgljs.org/) for this).
4. Create a `RenderProgram` or a `ComputeProgram` with your WGSL shader code and your program inputs.
5. Run the programs with the `Renderer` or `Computer`.
6. Be amazed!!! (Or maybe slightly underwhelmed).

# Examples

## Render something

### render.wgsl

```
struct Uniforms {
  u_elapsed_time : f32,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
  @location(0) position : vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

@vertex
fn vertex_main(vert : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms_default.u_view_projection_matrix * vert.position;
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let r = cos(uniforms.u_elapsed_time) / 2 + 0.5;
  let g = sin(uniforms.u_elapsed_time * 0.5) / 2 + 0.5;
  let b = cos(uniforms.u_elapsed_time * 0.25) / 2 + 0.5;
  return vec4<f32>(r,g,b,1);
}
```

### main.ts

```
import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
} from "mini-gpu";

// I'm using twgl to create my geometries...
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer;
let uniforms: UniformsInput;

const render = () => {
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  renderer.renderAll();
  requestAnimationFrame(render);
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  renderer = new Renderer(device as GPUDevice, canvas);

  // Using twgl.js here to create my geometry attributes
  const geometry = new Geometry(
    renderer,
    primitives.createSphereVertices(1, 64, 32)
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
    true
  );
  renderer.add(renderProgram);

  requestAnimationFrame(render);
  window.addEventListener("resize", () => renderer.resize());
};

init();
```

## Compute something

TODO

## Compute something then render something

TODO

# Class reference

TODO
