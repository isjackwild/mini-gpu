struct Uniforms {
  max_life : f32,
  delta_time : f32,
  u_view_projection_matrix : mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct Item {
  size: f32,
  life: f32,
  speed: f32,
  color: vec3<f32>,
  heading: vec3<f32>,
  position: vec3<f32>,
}

@group(1) @binding(0) var<storage, read> input : array<Item>;
@group(1) @binding(1) var<storage, read_write> output : array<Item>;


@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let count = arrayLength(&output);
  let index = global_id.x * (global_id.y + 1) * (global_id.z + 1);

  if (index >= count) {
    return;
  }

  var current_state = input[index];
  let next_state: ptr<storage, Item, read_write> = &output[index];
  (*next_state) = current_state;

  (*next_state).life = max(0, output[index].life - uniforms.delta_time);
  (*next_state).position = (*next_state).position + normalize((*next_state).heading) * (*next_state).speed;
}