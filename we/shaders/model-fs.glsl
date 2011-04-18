precision highp float;

varying vec3 vLightWeighting;

void main(void) {
  vec3 uColor = vec3(0.8, 0.8, 0.8);
  gl_FragColor = vec4(uColor * vLightWeighting, 1.0);
}
