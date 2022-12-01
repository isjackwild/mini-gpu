const requestWebGPU: () => Promise<false | GPUDevice> = async () => {
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
