#ifdef GL_ES
precision highp float;
#endif

const float PI  = 3.1415927;
const float PI2 = 6.2831855;
const float PIhalf = 1.5707963;
const float MAX_PHI = 1.4844222;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVPMatrix;

uniform float uZoomLevel;
uniform float uTileCount;
uniform float uYOffset;
uniform float uXOffset;
    
uniform sampler2D uTileBuffer;
uniform vec2 uTileBufferSize;

uniform vec4 uMetaBuffer[64];
varying vec2 vTC;

float compareMeta(vec4 a, float zoom, float x, float y) {
  return ((a.r == zoom) ? ((a.g == x) ? ((a.b == y) ? 0.0 : (a.b - y)) : (a.g - x)) : (a.r - zoom));
}

void main(void) {
  float phix = (aVertexPosition.x)/uTileCount*PI2;
  float phiy = (uYOffset+aVertexPosition.y)/uTileCount*PI2;
  
  //this version has better accuracy than 2.0*atan(exp(uLatitude + phiy)) - PI/2.0
  // (is more numerically stable)
  phiy = atan((exp(phiy) - exp(-phiy))/2.0);
  
  //if (abs(phiy) > MAX_PHI)
  //  phiy = sign(phiy)*PIhalf;
    
  if (abs(phix) > PI)
    phix = PI;        
  if (abs(phiy) > PI)
    phiy = PI;
  
  gl_Position = uMVPMatrix * vec4(sin(phix)*cos(phiy), sin(phiy), cos(abs(phix))*cos(abs(phiy)), 1.0);      
  
  float tilex = mod((aVertexPosition.x - aTextureCoord.x  + uXOffset + uTileCount/2.0), uTileCount);
  float tiley = (uTileCount-1.0) - (aVertexPosition.y - aTextureCoord.y + uYOffset + uTileCount/2.0);
  float xoff = 0.0, yoff = 0.0;
  
  
  int size = int(uTileBufferSize.x*uTileBufferSize.y);
  int mid = 1, min = 1, max = size;
  float z = uZoomLevel;
  while (z >= 0.0 && (compareMeta(uMetaBuffer[mid-1],z,tilex,tiley) != 0.0)) {
      if (min > max) {
        z--;
        min = 1;
        max = size;
        xoff = xoff/2.0 + mod(tilex, 2.0);
        yoff = yoff/2.0 + 1.0-mod(tiley, 2.0);
        tilex = floor(tilex/2.0);
        tiley = floor(tiley/2.0);
      }
      
      mid = (min + max) / 2;
      if (compareMeta(uMetaBuffer[mid-1],z,tilex,tiley) > 0.0) {
        max = mid - 1;
      } else {
        min = mid + 1;
      }
  }
  
  if (compareMeta(uMetaBuffer[mid-1],z,tilex,tiley) == 0.0) {
    float i = uMetaBuffer[mid-1].a;
    float reduction = pow(2.0,uZoomLevel - z);
    vTC.x = ((mod(i, uTileBufferSize.x)) + xoff/2.0  + (aTextureCoord.x)/reduction)/uTileBufferSize.x;
    vTC.y = ((floor(i / uTileBufferSize.x)) + yoff/2.0 + (aTextureCoord.y)/reduction)/uTileBufferSize.y;
    return;
  }
  
  vTC = vec2(0.0,0.0);//aTextureCoord;
  
  if ((abs(phiy) - MAX_PHI) > 0.01)
    vTC=vec2(0.5,0.5); //DEBUG
}