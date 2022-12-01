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

  if(count >= index) {
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