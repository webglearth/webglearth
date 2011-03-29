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

#define BUFF_SIDE %BUFFER_SIDE_FLOAT%
#define BUFF_SIZE int(BUFF_SIDE*BUFF_SIDE)

#define TERRAIN %TERRAIN_BOOL%
#define BUFF_SIDE_T %BUFFER_SIDE_T_FLOAT%
#define BUFF_SIZE_T int(BUFF_SIDE_T*BUFF_SIDE_T)

precision highp float;

const float PI=3.1415927;
const float PI2=6.2831855;
const float EARTH_RADIUS=6371009.0; //in meters

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVPMatrix;

uniform float uTileCount;
uniform vec2 uOffset;

uniform float uMetaL0[BUFF_SIZE];
uniform float uMetaL1[BUFF_SIZE];
uniform float uMetaL2[BUFF_SIZE];
uniform vec2 uOffL[3];
varying float vFallbackA;
varying vec2 vTCA;

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
  vec2 phi=PI2*vec2(aVertexPosition.x+uOffset.x,aVertexPosition.y+uOffset.y)/uTileCount;

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
  float rawElev = 0.0;
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
    rawElev=texture2D(uBufferL0T,TCT).r;
  } else if (fallbackT == 1.0) {
    rawElev=texture2D(uBufferL1T,TCT).r;
  } else {
    rawElev=texture2D(uBufferLnT,TCT).r;
  }

  elev = rawElev * 8248.0 / EARTH_RADIUS; //raw elevation (0-1) * earth radius
#endif

  //bend the segplane
  float exp_2y=exp(2.0*phi.y);
  float tanh=((exp_2y-1.0)/(exp_2y+1.0));
  float cosy=sqrt(1.0-tanh*tanh);
  vec3 pos=vec3(sin(phi.x)*cosy,tanh,cos(phi.x)*cosy);
  gl_Position=uMVPMatrix*vec4(pos*(1.0+elev),1.0);

  //texture A
  vFallbackA = -1.0;
  vec2 off = modFirst(tileCoords - uOffL[0],uTileCount);
  if (validateOffset(off) && uMetaL0[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
    vFallbackA = 0.0;
  } else {
    off = modFirst((tileCoords / 2.0) - uOffL[1],uTileCount/2.0);
    if (validateOffset(off) && uMetaL1[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
      vFallbackA = 1.0;
    } else {
      off = modFirst((tileCoords / 4.0) - uOffL[2],uTileCount/4.0);
      if (validateOffset(off) && uMetaL2[int(floor(off.y)*BUFF_SIDE+off.x)] == 1.0) {
        vFallbackA = 2.0;
      }
    }
  }
  if (vFallbackA >= 0.0) {
    vTCA = (off+aTextureCoord/exp2(vFallbackA)+mod(uOffL[int(vFallbackA)],BUFF_SIDE))/BUFF_SIDE;
  } else {
    vTCA = (tileCoords + aTextureCoord)/uTileCount;
  }
  vTCA.y = 1.0-vTCA.y; //flip Y axis
}