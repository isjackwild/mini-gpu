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