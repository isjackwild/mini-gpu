import shader from "bundle-text:./shader.wgsl";

let device: GPUDevice;
const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
let ctx: GPUCanvasContext, presentationFormat;

let vertexDataBuffer, uniformBuffer, uniformBindGroup;
let renderPassDesc: GPURenderPassDescriptor, renderPipeline: GPURenderPipeline;

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

const setupCanvasCtx = () => {
  ctx = canvas.getContext("webgpu") as GPUCanvasContext;
  presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  ctx.configure({
    device,
    format: presentationFormat,
    alphaMode: "opaque",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
};

const setupPipeline = async () => {
  // Setup shader modules
  const shaderModule = device.createShaderModule({ code: shader });
  await shaderModule.compilationInfo();

  const vertexState = {
    module: shaderModule,
    entryPoint: "vertex_main",
    buffers: [
      {
        arrayStride: 2 * 4 * 4, // 2 attributes of 4 elements, each float32 (takes up 4 bytes)
        attributes: [
          { format: "float32x4", offset: 0, shaderLocation: 0 },
          { format: "float32x4", offset: 4 * 4, shaderLocation: 1 },
        ],
      },
    ],
  };

  const fragmentState = {
    module: shaderModule,
    entryPoint: "fragment_main",
    targets: [{ format: presentationFormat }],
  };

  const depthFormat = "depth24plus-stencil8";
  const depthTexture = device.createTexture({
    size: {
      width: canvas.width,
      height: canvas.height,
      depthOrArrayLayers: 1,
    },
    format: depthFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });

  const layout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  renderPipeline = device.createRenderPipeline({
    layout,
    vertex: vertexState,
    fragment: fragmentState,
    depthStencil: {
      format: depthFormat,
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });

  uniformBindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  renderPassDesc = {
    colorAttachments: [
      {
        view: undefined, // Assigned later

        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilStoreOp: "store",
    },
  };
};

const setupBuffers = () => {
  const VERTEX_COUNT = 3;
  vertexDataBuffer = device.createBuffer({
    size: VERTEX_COUNT * 2 * 4 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  });

  // prettier-ignore
  new Float32Array(vertexDataBuffer.getMappedRange()).set([
    1, -1, 0, 1, //position
    1, 0, 0, 1, //color
    -1, -1, 0, 1, //position
    0, 1, 0, 1, //color
    0, 1, 0, 1, //position
    0, 0, 1, 1, //color
  ]);

  vertexDataBuffer.unmap();

  uniformBuffer = device.createBuffer({
    size: 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
};

const render = () => {
  renderPassDesc.colorAttachments[0].view = ctx
    .getCurrentTexture()
    .createView();

  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass(renderPassDesc);

  const colorUniform = new Float32Array([1.0, 0.0, 0.0, 1.0]);
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    colorUniform.buffer,
    colorUniform.byteOffset,
    colorUniform.byteLength
  );

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, uniformBindGroup);
  renderPass.setVertexBuffer(0, vertexDataBuffer);
  renderPass.draw(3, 1, 0, 0);
  renderPass.end();

  device.queue.submit([commandEncoder.finish()]);

  requestAnimationFrame(render);
};

const init = async () => {
  if (!navigator.gpu) {
    return alert(
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags."
    );
  }
  await requestWebGPU();
  setupCanvasCtx();
  setupBuffers();
  await setupPipeline();

  requestAnimationFrame(render);
};

init();
