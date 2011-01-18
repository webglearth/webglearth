
/**
 * @fileoverview This file WILL be automatically generated from all *.glsl files
 * Notes:
 *    All lines starting with # has to end with newline symbol.
 *    All leading and trailing spaces SHOULD be trimmed.
 *    All redundant whitespace can be reduced to single space.
 */

goog.provide('we.shaderbank.codes');


/** @type {string} */
we.shaderbank.codes['fs.glsl'] = '#define BUFF_W %BUFFER_WIDTH_FLOAT%\n#define BUFF_H %BUFFER_HEIGHT_FLOAT%\nprecision mediump float;varying vec2 vTile;varying vec2 vTC;uniform sampler2D uTileBuffer;uniform float uTileSize;void main(){vec2 TC=clamp(vTC*uTileSize,0.5,uTileSize-0.5);vec2 BC=(vTile+(TC/uTileSize));gl_FragColor=texture2D(uTileBuffer,vec2(BC.s/BUFF_W,BC.t/BUFF_H));}';


/** @type {string} */
we.shaderbank.codes['vs.glsl'] = '#define BUFF_W %BUFFER_WIDTH_FLOAT%\n#define BUFF_H %BUFFER_HEIGHT_FLOAT%\n#define BUFF_SIZE %BUFFER_SIZE_INT%\n#define BINARY_SEARCH_CYCLES %BINARY_SEARCH_CYCLES_INT%\n#define LOOKUP_LEVELS %LOOKUP_LEVELS_INT%\nprecision highp float;const float PI=3.1415927;const float PI2=6.2831855;const float MAX_PHI=1.4844222;attribute vec2 aVertexPosition;attribute vec2 aTextureCoord;uniform mat4 uMVPMatrix;uniform float uZoomLevel;uniform float uTileCount;uniform vec2 uOffset;uniform vec4 uMetaBuffer[BUFF_SIZE];varying vec2 vTile;varying vec2 vTC;float compareMeta(in vec3 a, in vec3 b){  vec3 c=a-b;  return bool(c.x)?c.x:(bool(c.y)?c.y:c.z);}void main(void) {vec2 phi=PI2*vec2(aVertexPosition.x,aVertexPosition.y+uOffset.y)/uTileCount;if(abs(phi.x)>PI) phi.x=PI;%VERTEX_TRANSFORM%float tilex=mod(aVertexPosition.x-aTextureCoord.x+uOffset.x+uTileCount*0.5,uTileCount);float tiley=aTextureCoord.y-1.0-aVertexPosition.y-uOffset.y+uTileCount*0.5;vec2 off=vec2(0.0,0.0);vec3 key=vec3(uZoomLevel,tilex,tiley);const float last=float(BUFF_SIZE)-1.0;float lastZoomLevel=max(0.0,uZoomLevel-float(LOOKUP_LEVELS)+1.0);int mid=1;float min=0.0,max=last;for (int _i=0;_i<BINARY_SEARCH_CYCLES*LOOKUP_LEVELS;++_i) {if (min>max){if (key.r<=lastZoomLevel) break;key.r--;min=0.0;max=last;off.x=off.x*0.5+mod(key.g,2.0);off.y=off.y*0.5+1.0-mod(key.b,2.0);key.gb=floor(key.gb/2.0);}mid=int((min+max)*0.5);float res=compareMeta(uMetaBuffer[mid].xyz,key);if (res>0.0){max=float(mid)-1.0;} else if (res<0.0){min=float(mid)+1.0;} else {break;}}if (compareMeta(uMetaBuffer[mid].xyz,key)==0.0) {float i=uMetaBuffer[mid].a;float reduction=exp2(uZoomLevel-key.r);vTile.x=mod(i,BUFF_W);vTile.y=floor(i/BUFF_W);vTC.x=off.x*0.5+(aTextureCoord.x)/reduction;vTC.y=off.y*0.5+(aTextureCoord.y)/reduction;return;}vTile=vec2(0.0,0.0);vTC=vec2(0.0,0.0);if ((abs(phi.y)-MAX_PHI)>0.01)vTC=vec2(0.5,0.5);}';
