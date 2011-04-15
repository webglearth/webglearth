precision highp float;

varying vec3 vLightWeighting;

void main(void) {
  vec3 uColor = vec3(1.0, 0.0, 1.0);
  gl_FragColor = vec4(uColor * vLightWeighting, 1.0);
}
