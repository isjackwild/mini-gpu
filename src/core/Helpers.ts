const requestWebGPU: () => Promise<false | GPUDevice> = async () => {
  if (!navigator.gpu) {
    const message =
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags.";
    console.error(message);
    alert(message);
    return false;
  }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.warn("Could not access Adapter");
    return false;
  }
  return await adapter.requestDevice();
};

export default {
  requestWebGPU,
};
