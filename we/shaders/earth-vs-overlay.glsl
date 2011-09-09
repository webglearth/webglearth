/*
 * Copyright (C) 2011 Klokan Technologies GmbH (info@klokantech.com)
 *
 * The code in this file is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU GPL for more details.
 *
 * USE OF THIS CODE OR ANY PART OF IT IN A NONFREE SOFTWARE IS NOT ALLOWED
 * WITHOUT PRIOR WRITTEN PERMISSION FROM KLOKAN TECHNOLOGIES GMBH.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

#define BUFF_SIDE 4.0
#define BUFF_SIZE 16

#define TERRAIN %TERRAIN_BOOL%
#define BUFF_SIDE_T %BUFFER_SIDE_T_FLOAT%
#define BUFF_SIZE_T int(BUFF_SIDE_T*BUFF_SIDE_T)

precision highp float;

const float PI=3.1415927;
const float PI2=6.2831855;
const float EARTH_RADIUS=6378137.0; //in meters

const float TERRAIN_MIN=-10000.0; //in meters
const float TERRAIN_MAX=12000.0; //in meters

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVPMatrix;

uniform float uTileCount;
uniform vec2 uOffset;

uniform float uMetaL0A[BUFF_SIZE];
uniform float uMetaL1A[BUFF_SIZE];
uniform float uMetaL2A[BUFF_SIZE];
uniform vec2 uOffLA[3];
varying float vFallbackA;
varying vec2 vTCA;

uniform float uMetaL0B[BUFF_SIZE];
uniform float uMetaL1B[BUFF_SIZE];
uniform float uMetaL2B[BUFF_SIZE];
uniform vec2 uOffLB[3];
varying float vFallbackB;
varying vec2 vTCB;

#if TERRAIN
  uniform float uMetaL0T[BUFF_SIZE_T];
  uniform float uMetaL1T[BUFF_SIZE_T];
  uniform vec2 uOffLT[2];
  uniform sampler2D uBufferL0T;
  uniform sampler2D uBufferL1T;
  uniform sampler2D uBufferLnT;

  uniform float uDegradationT;

  bool validateOffsetT(vec2 off) {
    return off.x>= 0.0 && off.y >= 0.0 && off.x < BUFF_SIDE_T && off.y < BUFF_SIDE_T;
  }
#endif

bool validateOffset(vec2 off) {
  return off.x >= 0.0 && off.y >= 0.0 && off.x < BUFF_SIDE && off.y < BUFF_SIDE;
}

vec2 modFirst(vec2 x, float y) {
  // This is faster than standard mod - because
  // we need to mod only the first element.
  // And "x-y*floor(x/y)" seems to be 3 instructions shorter (2 vs 5) on my
  //  ATI card than "mod(x,y)" which is strange..
  return vec2(x.x-y*floor(x.x/y), x.y);
}

void main(){
  // real world coordinates
  vec2 phi=PI2*(aVertexPosition+uOffset)/uTileCount;
  
  //tile coordinates
  vec2 tileCoords=vec2(mod(aVertexPosition.x-aTextureCoord.x+uOffset.x+uTileCount*0.5,uTileCount),
                       -aTextureCoord.y-aVertexPosition.y-uOffset.y+uTileCount*0.5);

  //elevation
  float elev=0.0;

//terrain
#if TERRAIN
  vec2 TCT;
  float fallbackT = -1.0;
  float degradationModifier = exp2(uDegradationT);
  vec2 offT = modFirst(tileCoords/degradationModifier - uOffLT[0],uTileCount/degradationModifier);
  vec2 rawElev;
  if (validateOffsetT(offT) && uMetaL0T[int(floor(offT.y)*BUFF_SIDE_T+offT.x)] == 1.0) {
    fallbackT = 0.0;
  } else {
    offT = modFirst((tileCoords/(2.0*degradationModifier)) - uOffLT[1],uTileCount/(2.0*degradationModifier));
    if (validateOffsetT(offT) && uMetaL1T[int(floor(offT.y)*BUFF_SIDE_T+offT.x)] == 1.0) {
      fallbackT = 1.0;
    } else {
      TCT=(tileCoords + aTextureCoord)/uTileCount;
    }
  }
  if (fallbackT >= 0.0) {
    TCT=(offT+aTextureCoord/(exp2(fallbackT)*degradationModifier)+mod(uOffLT[int(fallbackT)],BUFF_SIDE_T))/BUFF_SIDE_T;
  }
  TCT.y = 1.0-TCT.y; //flip Y axis
  if (fallbackT == 0.0) {
    rawElev=texture2D(uBufferL0T,TCT).rg;
  } else if (fallbackT == 1.0) {
    rawElev=texture2D(uBufferL1T,TCT).rg;
  } else {
    rawElev=texture2D(uBufferLnT,TCT).rg;
  }

  elev = ((TERRAIN_MAX-TERRAIN_MIN)*(rawElev.r + rawElev.g/256.0) - TERRAIN_MAX) / EARTH_RADIUS;
#endif

  //bend the segplane
  float exp_2y=exp(2.0*phi.y);
  float tanh=((exp_2y-1.0)/(exp_2y+1.0));
  float cosy=sqrt(1.0-tanh*tanh);
  vec3 pos=vec3(sin(phi.x)*cosy,tanh,cos(phi.x)*cosy);
  gl_Position=uMVPMatrix*vec4(pos*(1.0+elev),1.0);
  
  if (abs(phi.y)>PI) {
    vFallbackA = -1.0e3;
    return;
  }
  
  //texture A
  vFallbackA = -1.0;
  vec2 off = modFirst(tileCoords - uOffLA[0],uTileCount);
  if (validateOffset(off) && uMetaL0A[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
    vFallbackA = 0.0;
  } else {
    off = modFirst((tileCoords / 2.0) - uOffLA[1],uTileCount/2.0);
    if (validateOffset(off) && uMetaL1A[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
      vFallbackA = 1.0;
    } else {
      off = modFirst((tileCoords / 4.0) - uOffLA[2],uTileCount/4.0);
      if (validateOffset(off) && uMetaL2A[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
        vFallbackA = 2.0;
      }
    }
  }
  if (vFallbackA >= 0.0) {
    vTCA = (off+aTextureCoord/exp2(vFallbackA)+mod(uOffLA[int(vFallbackA)],BUFF_SIDE))/BUFF_SIDE;
  } else {
    vTCA = (tileCoords + aTextureCoord)/uTileCount;
  }
  vTCA.y = 1.0-vTCA.y; //flip Y axis
  
  //texture B
  vFallbackB = -1.0;
  off = modFirst(tileCoords - uOffLB[0],uTileCount);
  if (validateOffset(off) && uMetaL0B[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
    vFallbackB = 0.0;
  } else {
    off = modFirst((tileCoords / 2.0) - uOffLB[1],uTileCount/2.0);
    if (validateOffset(off) && uMetaL1B[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
      vFallbackB = 1.0;
    } else {
      off = modFirst((tileCoords / 4.0) - uOffLB[2],uTileCount/4.0);
      if (validateOffset(off) && uMetaL2B[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
        vFallbackB = 2.0;
      }
    }
  }
  if (vFallbackB >= 0.0) {
    vTCB = (off+aTextureCoord/exp2(vFallbackB)+mod(uOffLB[int(vFallbackB)],BUFF_SIDE))/BUFF_SIDE;
  } else {
    vTCB = (tileCoords + aTextureCoord)/uTileCount;
  }
  vTCB.y = 1.0-vTCB.y; //flip Y axis
}
