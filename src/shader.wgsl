struct UniformsDefault {
  u_elapsed_time : f32,
  u_delta_time : f32,
}

@group(0) @binding(0) var<uniform> uniforms_default : UniformsDefault;
     
struct UniformsViewport {
  u_resolution : vec2<f32>,
}

@group(1) @binding(0) var<uniform> uniforms_viewport : UniformsViewport;

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
  output.position = vert.position;
  output.color = vert.color;
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(1,cos(uniforms_default.u_elapsed_time) / 2 + 0.5,0,1);
} 