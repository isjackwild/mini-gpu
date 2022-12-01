struct UniformsDefault {
  u_view_projection_matrix : mat4x4<f32>,
}
@group(0) @binding(0) var<uniform> uniforms_default : UniformsDefault;

struct VertexInput {
  @location(0) position : vec4<f32>,
  @location(1) color : vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
}

@vertex
fn vertex_main(vert : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms_default.u_view_projection_matrix * vert.position;
  output.color = vert.color;
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(1,0,0,1);
} 