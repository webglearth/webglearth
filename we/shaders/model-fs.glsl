precision highp float;

uniform vec3 uColor;
varying vec3 vLightWeighting;

void main(void) {
  gl_FragColor = vec4(uColor * vLightWeighting, 1.0);
}
