#define BUFFER_WIDTH %BUFFER_WIDTH_FLOAT%
#define BUFFER_HEIGHT %BUFFER_HEIGHT_FLOAT%

#ifdef GL_ES
precision mediump float;
#endif

invariant varying vec2 vTile;
varying vec2 vTC;

uniform sampler2D uTileBuffer;
uniform float uTileSize;

void main() {
  vec2 TC = clamp(vTC*uTileSize, 0.5, uTileSize - 0.5);
  vec2 BC = (vTile + (TC/uTileSize));
  gl_FragColor = texture2D(uTileBuffer, vec2(BC.s/BUFFER_WIDTH, BC.t/BUFFER_HEIGHT));
}