struct Color {
  r: f32,
  g: f32,
  b: f32,
}
@group(0) @binding(0) var<storage, read> input : array<Color>;

struct VertexInput {
  @location(0) position : vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
}

@vertex
fn vertex_main(vert : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = vert.position;
  return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
  let r = input[0].r;
  let g = input[0].g;
  let b = input[0].b;
  return vec4<f32>(r,g,b,1);
}