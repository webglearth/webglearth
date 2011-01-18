#define BUFF_W %BUFFER_WIDTH_FLOAT%
#define BUFF_H %BUFFER_HEIGHT_FLOAT%

precision mediump float;

varying vec2 vTile;
varying vec2 vTC;

uniform sampler2D uTileBuffer;
uniform float uTileSize;

void main(){
vec2 TC=clamp(vTC*uTileSize,0.5,uTileSize-0.5);
vec2 BC=(vTile+(TC/uTileSize));
gl_FragColor=texture2D(uTileBuffer,vec2(BC.s/BUFF_W,BC.t/BUFF_H));
}