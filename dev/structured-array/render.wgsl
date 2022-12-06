struct Uniforms {
  max_life : f32,
  delta_time : f32,
  u_view_projection_matrix : mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct PingPongValues {
  size : f32,
  life : f32,
  speed : f32,
  color : vec3<f32>,
  heading : vec3<f32>,
  position : vec3<f32>,
}

@group(1) @binding(0) var<storage, read> input_values : array<PingPongValues>;
@group(1) @binding(1) var<storage, read_write> output_values : array<PingPongValues>;

struct VertexInput {
  @location(0) position : vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
}

@vertex
fn vertex_main(@builtin(instance_index) instance_index : u32, vert : VertexInput) -> VertexOutput {
  var entity = input_values[instance_index];

  var output : VertexOutput;
  output.position = uniforms.u_view_projection_matrix * vec4<f32>(vert.position.xyz * entity.size + entity.position, 1);
  output.color = vec4<f32>(entity.color, 1);
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  return in.color;
}