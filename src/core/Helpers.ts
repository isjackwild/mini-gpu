const requestWebGPU: () => Promise<false | GPUDevice> = async () => {
  if (!navigator.gpu) {
    alert(
      "WebGPU not available! — Use Chrome Canary and enable-unsafe-gpu in flags."
    );
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
