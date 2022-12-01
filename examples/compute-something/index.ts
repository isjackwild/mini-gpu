import {
  Computer,
  ComputeProgram,
  UniformsInput,
  PingPongInput,
  Helpers,
} from "../../src";

import computeShader from "./compute.wgsl?raw";

let computer: Computer;
let uniforms: UniformsInput, pingPong: PingPongInput;

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
  pingPong = new PingPongInput(
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
