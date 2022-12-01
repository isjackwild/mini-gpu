const PI = 3.14159265359;

struct Item {
  value: f32,
}

@group(0) @binding(0) var<storage, read> input : array<Item>;
@group(0) @binding(1) var<storage, read_write> output : array<Item>;


@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let cells_count = arrayLength(&output);
  let cell_index = global_id.x * (global_id.y + 1) * (global_id.z + 1);

  if(cell_index >= cells_count) {
    return;
  }

  var current_state = input[cell_index];
  let next_state: ptr<storage, Item, read_write> = &output[cell_index];
  (*next_state) = current_state;

  (*next_state).value = (*next_state).value + 0.0001;
}