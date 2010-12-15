#define BUFFER_WIDTH %BUFFER_WIDTH_FLOAT%
#define BUFFER_HEIGHT %BUFFER_HEIGHT_FLOAT%
#define BUFFER_SIZE %BUFFER_SIZE_INT%
#define BINARY_SEARCH_CYCLES %BINARY_SEARCH_CYCLES_INT%
#define LOOKUP_LEVELS %LOOKUP_LEVELS_INT%

#ifdef GL_ES
precision highp float;
#endif

const float PI  = 3.1415927;
const float PI2 = 6.2831855;
const float MAX_PHI = 1.4844222;

//From application
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVPMatrix;

uniform float uZoomLevel;
uniform float uTileCount;
uniform vec2 uOffset;

uniform vec4 uMetaBuffer[BUFFER_SIZE];

//To fragment shader
invariant varying vec2 vTile;
varying vec2 vTC;

float compareMeta(in vec3 a, in vec3 b) {
  vec3 c = a - b;
  return bool(c.x) ? c.x : (bool(c.y) ? c.y : c.z);
}

void main(void) {
  vec2 phi = PI2*vec2(aVertexPosition.x, aVertexPosition.y + uOffset.y)/uTileCount;

  if (abs(phi.x) > PI)
    phi.x = PI;

  //if (abs(phi.y) > PI)
  //  phi.y = PI;

  float exp_2y = exp(2.0*phi.y);
  float tanh = ((exp_2y - 1.0)/(exp_2y + 1.0));
  float cosy = sqrt(1.0 - tanh*tanh);
  gl_Position = uMVPMatrix * vec4(sin(phi.x)*cosy, tanh, cos(phi.x)*cosy, 1.0);

  float tilex = mod((aVertexPosition.x - aTextureCoord.x  + uOffset.x + uTileCount*0.5), uTileCount);
  float tiley = aTextureCoord.y - 1.0 - aVertexPosition.y - uOffset.y + uTileCount*0.5;
  vec2 off = vec2(0.0, 0.0);

  vec3 key = vec3(uZoomLevel, tilex, tiley);

  const float last = float(BUFFER_SIZE)-1.0;
  float lastZoomLevel = max(0.0, uZoomLevel - float(LOOKUP_LEVELS) + 1.0);
  int mid = 1; float min = 0.0, max = last;
  for (int _i=0; _i < BINARY_SEARCH_CYCLES*LOOKUP_LEVELS; ++_i) {
      if (min > max) {
        if (key.r <= lastZoomLevel) break;
        key.r--;
        min = 0.0;
        max = last;
        off.x = off.x*0.5 + mod(key.g, 2.0);
        off.y = off.y*0.5 + 1.0-mod(key.b, 2.0);
        key.gb = floor(key.gb/2.0);
      }

      mid = int((min + max) * 0.5);
      float res = compareMeta(uMetaBuffer[mid].xyz,key);
      if (res > 0.0) {
        max = float(mid) - 1.0;
      } else if (res < 0.0) {
        min = float(mid) + 1.0;
      } else {
        break;
      }
  }

  if (compareMeta(uMetaBuffer[mid].xyz,key) == 0.0) {
    float i = uMetaBuffer[mid].a;
    float reduction = exp2(uZoomLevel - key.r);
    vTile.x = mod(i, BUFFER_WIDTH);
    vTile.y = floor(i / BUFFER_WIDTH);
    vTC.x = off.x*0.5 + (aTextureCoord.x)/reduction;
    vTC.y = off.y*0.5 + (aTextureCoord.y)/reduction;
    return;
  }

  vTile = vec2(0.0,0.0);
  vTC = vec2(0.0,0.0);//aTextureCoord;

  if ((abs(phi.y) - MAX_PHI) > 0.01)
    vTC=vec2(0.5,0.5); //DEBUG
}