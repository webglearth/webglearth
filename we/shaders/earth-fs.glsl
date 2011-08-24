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

precision mediump float;

uniform sampler2D uBufferL0A;
uniform sampler2D uBufferL1A;
uniform sampler2D uBufferL2A;
uniform sampler2D uBufferLnA;

varying float vFallbackA;
varying vec2 vTCA;


uniform sampler2D uBufferL0B;
uniform sampler2D uBufferL1B;
uniform sampler2D uBufferL2B;

varying float vFallbackB;
varying vec2 vTCB;

uniform float uMixFactor;

void main(){
  float fallbackA = floor(vFallbackA + 0.5);
  vec4 colorA;
  if (fallbackA  == 0.0) {
    colorA=texture2D(uBufferL0A,vTCA);
  } else if (fallbackA  == 1.0) {
    colorA=texture2D(uBufferL1A,vTCA);
  } else if (fallbackA  == 2.0) {
    colorA=texture2D(uBufferL2A,vTCA);
  } else if (fallbackA == -1.0) {
    colorA=texture2D(uBufferLnA,vTCA);
  } else {
    discard;
  }
  
  float fallbackB = floor(vFallbackB + 0.5);
  vec4 colorB = vec4(0.0);
  if (fallbackB  == 0.0) {
    colorB=texture2D(uBufferL0B,vTCB);
  } else if (fallbackB  == 1.0) {
    colorB=texture2D(uBufferL1B,vTCB);
  } else if (fallbackB  == 2.0) {
    colorB=texture2D(uBufferL2B,vTCB);
  }
  
  gl_FragColor = mix(colorA, colorB, uMixFactor * colorB.a);
  //gl_FragColor = mix(gl_FragColor, vec4(1.0,0.0,0.0,1.0), float(vFallbackA)/4.0); //useful for clipstack debugging - fallback levels are red and LevelN is slightly cyan
}