![Mini GPU](public/minigpu.svg)

> A 🤏 helping hand for working with WebGPU

# ⚠️ Disclaimer! ⚠️

As WebGPU is a brand new API, and this library is very much a work in progress (as well as my first library), you can expect breaking changes. **Only a fool would think of using this thing in a production setting for the time being**, but it's always fun to play around with new toys!

It has only been tested in [Chrome Canary](https://www.google.com/intl/en_uk/chrome/canary/), and you need to enable the WebGPU flag.

(I'm also not finished with writing these docs, so beware...)

# Motivation

This mini library is a side project which has come out of my own experiments with WebGPU at [Google Arts & Culture Lab](https://artsandculture.google.com/), and **a desire to come up with a good structure for writing WebGPU code.** I'm basically attempting to simplify a few common use cases, and to abstract some of the boilerplate code you need to write to get something to happen.

It certainly doesn't (and doesn't aim to) do it all, and if you're after something highly configurable, you'll probably want to write it yourself, but if you're just looking for somewhere to get started, then come on in.

# Usage

Install the library by running

```
npm i mini-gpu
```

Import the bits you need

```
import {
  Renderer,
  ...
} from "mini-gpu";
```

# How it works

Mini GPU supports both render pipelines and compute pipelines, and they follow a similar structure.

0. Get access to your machines GPU device.
1. Create a `Renderer` or `Computer` to run your programs.
2. Create one or multiple program inputs. There are currently two supported input types: `UniformsInput` (which creates a set of... wait for it... uniforms) and `PingPongBufferInput` (which creates a swappable pingpong buffer for doing [GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units)).
3. For Render pipelines, create a `Geometry` by passing in indices, positions, normals and texcoords (I use the awesome [twgl.js](https://twgljs.org/) for this).
4. Create a `RenderProgram` or a `ComputeProgram` with your WGSL shader code and your program inputs.
5. Run the programs with the `Renderer` or `Computer`.
6. Be amazed!!! (Or maybe slightly underwhelmed).

# Extras

## WGSL Header

Because mini GPU sets up your bind groups and their order for you, you might need to get a hint as to what to put in the header of your WGSL code. You can do this by calling

```
myComputeOrRenderProgram.getWgslChunk();
```

_Bare in mind that this is still WIP_, so the output might need some tweaking (the types might not be right all the time, but the locations should be.)

## Camera

Sets up matrices required for a simple perspective camera, which can be passed into a program as uniforms:

```
const camera = new Camera({
  fov: DEG_TO_RAD * 50,
  aspectRatio: renderer.width / renderer.height,
  near: 0.01,
  far: 999,
  position: [0, 0, -5],
});

const uniforms = new UniformsInput(device as GPUDevice, {
  u_view_projection_matrix: camera.viewProjectionMatrix,
});
```

You can then update properties such as `aspectRatio`, `fov`, `near`, `far`, `position`, `target` and `up` and the matrices will be updated. You will then need to update the uniforms: `uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;`

## Camera Orbit Controls

Creates orbit controls for a passed camera:

```
const controls = new OrbitControls(camera, canvas);
```

You need to update the controls on each frame, and then update the uniforms with the new viewProjecttionMatrix of the camera:

```
controls.update();
uniforms.member.u_view_projection_matrix = camera.viewProjectionMatrix;
```

## Texture Loader

Allows you to load and create a WebGPU texture from a number of different sources.

```
// create the loader
const loader = new TextureLoader(device);

// create a texture from a canvas (or ImageBitmap)
const texture = loader.createTextureFromImageBitmapOrCanvas(myCanvasOrOffscreenCanvasOrImageBitmap);

// create a texture from a URL
const texture = async loader.loadTextureFromImageSrc('my/image.png');
```

You can also pass in an array of six elements to each method to create a cube texture.

## Structured Array

This class helps to created padded, structured array data which can be used as data for a `BufferInput` or `PingPongBufferInput`, and is also used internally when creating `UniformsInput`.

It takes a Javascript object (or a function which returns an object) and the number of array elements you require (it defaults to a single element), and creates a magically padded Float32Array. It also allows you to get and set struct members by their name and array index.

For example:

```
const particleCount = 1000;

// Pass an object in the constructor
const data = new StructuredFloat32Array(
  {
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    randomSeed: () => Math.random(), // you can also use a function which returns an array or float
  },
  particleCount
);

// OR

// Pass a function which returns an object in the constructor
const data = new StructuredFloat32Array(
  (index) => ({
    position: [index, index, index],
    velocity: [0, 0, 0],
    randomSeed: () => Math.random(), // you can also use a function which returns an array or float
  }),
  particleCount
);

const simulation = new PingPongBufferInput(device, data);
```

You can then access and update members by name and array index, for example:

```
// gets the position of particle at index 10
const particlePosition = data.getValueAt('position', 10);

// sets the position of particle at index 20
data.setValueAt('position', [1,2,3], 20)
```

# Class reference

The Class reference can be found [here](https://isjackwild.github.io/mini-gpu/)

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
  output.position = vert.position;
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
```

## Compute something

### compute.wgsl

```
struct Item {
  value: f32,
}

@group(0) @binding(0) var<storage, read> input : array<Item>;
@group(0) @binding(1) var<storage, read_write> output : array<Item>;


@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let count = arrayLength(&output);
  let index = global_id.x * (global_id.y + 1) * (global_id.z + 1);

  if (index >= count) {
    return;
  }

  var current_state = input[index];
  let next_state: ptr<storage, Item, read_write> = &output[index];
  (*next_state) = current_state;

  (*next_state).value = (*next_state).value + 0.0001;
}
```

### main.ts

```
import {
  Computer,
  ComputeProgram,
  UniformsInput,
  PingPongBufferInput,
  Helpers,
} from "mini-gpu";

import computeShader from "./compute.wgsl?raw";

let computer: Computer;
let uniforms: UniformsInput, pingPong: PingPongBufferInput;

const readPingPong = async () => {
  const data = await pingPong.read();
  if (!data) return;
  console.log(data);
};

const animate = () => {
  computer.runAll();
  pingPong.step();
  uniforms.member.u_elapsed_time = uniforms.member.u_elapsed_time + 0.01;
  readPingPong();
  requestAnimationFrame(animate);
};

const init = async () => {
  const device = (await Helpers.requestWebGPU()) as GPUDevice;
  computer = new Computer(device as GPUDevice);

  uniforms = new UniformsInput(device as GPUDevice, {
    u_elapsed_time: 0,
  });
  pingPong = new PingPongBufferInput(
    device as GPUDevice,
    new Float32Array([0, 1, 2, 3, 4])
  );

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

  requestAnimationFrame(animate);
};

init();

```

## Compute something then render something

### compute.wgsl

```
struct Uniforms {
  u_elapsed_time : f32,
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct Color {
  r: f32,
  g: f32,
  b: f32,
}

@group(1) @binding(0) var<storage, read> input : array<Color>;
@group(1) @binding(1) var<storage, read_write> output : array<Color>;


@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let count = arrayLength(&output);
  let index = global_id.x * (global_id.y + 1) * (global_id.z + 1);

  if (index >= count) {
    return;
  }

  var current_state = input[index];
  let next_state: ptr<storage, Color, read_write> = &output[index];
  (*next_state) = current_state;

  let r = cos(uniforms.u_elapsed_time) / 2 + 0.5;
  let g = sin(uniforms.u_elapsed_time * 0.5) / 2 + 0.5;
  let b = cos(uniforms.u_elapsed_time * 0.25) / 2 + 0.5;

  (*next_state).r = r;
  (*next_state).g = g;
  (*next_state).b = b;
}
```

### render.wgsl

```
struct Color {
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<storage, read> input : array<Color>;

struct VertexInput {
  @location(0) position : vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

@vertex
fn vertex_main(vert : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = vert.position;
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let r = input[0].r;
  let g = input[0].g;
  let b = input[0].b;
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
  Computer,
  PingPongBufferInput,
  ComputeProgram,
} from "mini-gpu";
import { TGeometryArgs } from "../../src/core/Geometry";

// I'm using twgl to create my geometries...
import { primitives } from "twgl.js";

import renderShader from "./render.wgsl?raw";
import computeShader from "./compute.wgsl?raw";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;

let renderer: Renderer, computer: Computer;
let uniforms: UniformsInput, pingPong: PingPongBufferInput;

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

  pingPong = new PingPongBufferInput(device, new Float32Array([0, 0, 0]));
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
```

# Camera with Controls

### render.wgsl

```
struct Uniforms {
  u_elapsed_time : f32,
  u_view_projection_matrix : mat4x4<f32>,
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
  output.position = uniforms.u_view_projection_matrix * vert.position;
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

## main.ts

```
import {
  Renderer,
  RenderProgram,
  Geometry,
  UniformsInput,
  Helpers,
  Camera,
  OrbitControls,
} from "mini-gpu";

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
```
