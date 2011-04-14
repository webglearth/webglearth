precision highp float;

attribute vec3 aVertexPosition;

uniform mat4 uMVPMatrix;

void main(void) {
  gl_Position = uMVPMatrix * vec4(aVertexPosition, 1.0);
}
