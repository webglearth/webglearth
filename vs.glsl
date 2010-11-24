#define BUFFER_WIDTH %BUFFER_WIDTH_FLOAT%
#define BUFFER_HEIGHT %BUFFER_HEIGHT_FLOAT%
#define BUFFER_SIZE %BUFFER_SIZE_INT%

#ifdef GL_ES
precision highp float;
#endif

const float PI  = 3.1415927;
const float PI2 = 6.2831855;
const float MAX_PHI = 1.4844222;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVPMatrix;

uniform float uZoomLevel;
uniform float uTileCount;
uniform vec2 uOffset;
    
uniform sampler2D uTileBuffer;

uniform vec4 uMetaBuffer[BUFFER_SIZE];
varying vec2 vTC;

float compareMeta(in vec3 a, in vec3 b) {
  vec3 c = a - b;
  return bool(c.x) ? c.x : (bool(c.y) ? c.y : c.z);
}

void main(void) {
  vec2 phi = PI2*vec2(aVertexPosition.x, aVertexPosition.y + uOffset.y)/uTileCount;
  
  //this version has better accuracy than 2.0*atan(exp(uLatitude + phiy)) - PI/2.0
  // (is more numerically stable)
  phi.y = atan((exp(phi.y) - exp(-phi.y))*0.5);
  
  //if (abs(phiy) > MAX_PHI)
  //  phiy = sign(phiy)*PIhalf;
    
  if (abs(phi.x) > PI)
    phi.x = PI;
  if (abs(phi.y) > PI)
    phi.y = PI;

  gl_Position = uMVPMatrix * vec4(sin(phi.x)*cos(phi.y), sin(phi.y), cos(phi.x)*cos(phi.y), 1.0);      
  
  float tilex = mod((aVertexPosition.x - aTextureCoord.x  + uOffset.x + uTileCount*0.5), uTileCount);
  float tiley = aTextureCoord.y - 1.0 - aVertexPosition.y - uOffset.y + uTileCount*0.5;
  vec2 off = vec2(0.0, 0.0);
  
  vec3 key = vec3(uZoomLevel, tilex, tiley);
  
  const float last = float(BUFFER_SIZE)-1.0;
  int mid = 1; float min = 0.0, max = last;
  while (key.r >= 0.0 && (compareMeta(uMetaBuffer[mid].xyz,key) != 0.0)) {
      if (min > max) {
        key.r--;
        min = 0.0;
        max = last;
        off.x = off.x*0.5 + mod(key.g, 2.0);
        off.y = off.y*0.5 + 1.0-mod(key.b, 2.0);
        key.gb = floor(key.gb/2.0);
        //key.b = floor(key.b/2.0);
      }
      
      mid = int((min + max) * 0.5);
      if (compareMeta(uMetaBuffer[mid].xyz,key) > 0.0) {
        max = float(mid) - 1.0;
      } else {
        min = float(mid) + 1.0;
      }
  }
  
  if (compareMeta(uMetaBuffer[mid].xyz,key) == 0.0) {
    float i = uMetaBuffer[mid].a;
    float reduction = exp2(uZoomLevel - key.r);
    vTC.x = ((mod(i, BUFFER_WIDTH)) + off.x*0.5  + (aTextureCoord.x)/reduction)/BUFFER_WIDTH;
    vTC.y = ((floor(i / BUFFER_WIDTH)) + off.y*0.5 + (aTextureCoord.y)/reduction)/BUFFER_HEIGHT;
    return;
  }
  
  vTC = vec2(0.0,0.0);//aTextureCoord;
  
  if ((abs(phi.y) - MAX_PHI) > 0.01)
    vTC=vec2(0.5,0.5); //DEBUG
}