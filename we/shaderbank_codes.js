/*
 * Copyright (C) 2011 Klokan Technologies GmbH (info@klokantech.com)
 *
 * The JavaScript code in this page is free software: you can
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
 */

/**
 * @fileoverview This file WILL be automatically generated from all *.glsl files
 * Notes:
 *    All comments can be trimmed.
 *    All lines starting with # has to end with newline symbol.
 *    All leading and trailing spaces SHOULD be trimmed.
 *    All redundant whitespace can be reduced to single space.
 */

goog.provide('we.shaderbank.codes');


/** @type {string} */
we.shaderbank.codes['fs.glsl'] = '#define BUFF_W %BUFFER_WIDTH_FLOAT%\n#define BUFF_H %BUFFER_HEIGHT_FLOAT%\nprecision mediump float;varying vec2 vTile;varying vec2 vTC;uniform sampler2D uTileBuffer;uniform float uTileSize;void main(){vec2 TC=clamp(vTC*uTileSize,0.5,uTileSize-0.5);vec2 BC=(vTile+(TC/uTileSize));gl_FragColor=texture2D(uTileBuffer,vec2(BC.s/BUFF_W,BC.t/BUFF_H));}';


/** @type {string} */
we.shaderbank.codes['vs.glsl'] = '#define BUFF_W %BUFFER_WIDTH_FLOAT%\n#define BUFF_H %BUFFER_HEIGHT_FLOAT%\n#define BUFF_SIZE %BUFFER_SIZE_INT%\n#define BINARY_SEARCH_CYCLES %BINARY_SEARCH_CYCLES_INT%\n#define LOOKUP_LEVELS %LOOKUP_LEVELS_INT%\nprecision highp float;const float PI=3.1415927;const float PI2=6.2831855;const float MAX_PHI=1.4844222;attribute vec2 aVertexPosition;attribute vec2 aTextureCoord;uniform mat4 uMVPMatrix;uniform float uZoomLevel;uniform float uTileCount;uniform vec2 uOffset;uniform vec4 uMetaBuffer[BUFF_SIZE];varying vec2 vTile;varying vec2 vTC;float compareMeta(vec3 a,vec3 b){vec3 c=a-b;return bool(c.x)?c.x:(bool(c.y)?c.y:c.z);}int findInBuffer(vec3 key) {int mid;float min=0.0,max=float(BUFF_SIZE)-1.0;for (int _i=0;_i<BINARY_SEARCH_CYCLES;++_i) {if (min>max) break;mid=int((min+max)*0.5);float res=compareMeta(uMetaBuffer[mid].xyz,key);if (res>0.0){max=float(mid)-1.0;} else if (res<0.0){min=float(mid)+1.0;} else {return mid;}}return -1;}int lookup(inout vec3 key,out vec2 off) {off=vec2(0.0,0.0);float lastZoomLevel=max(0.0,uZoomLevel-float(LOOKUP_LEVELS)+1.0);int mid=-1;for (int _i=0;_i<LOOKUP_LEVELS;++_i) {mid=findInBuffer(key);if (mid<0 && key.r>lastZoomLevel) {key.r--;off.x=off.x*0.5+mod(key.g,2.0);off.y=off.y*0.5+1.0-mod(key.b,2.0);key.gb=floor(key.gb/2.0);} else {break;}}return mid;}void main(){vec2 phi=PI2*vec2(aVertexPosition.x+uOffset.x,aVertexPosition.y+uOffset.y)/uTileCount;float tilex=mod(aVertexPosition.x-aTextureCoord.x+uOffset.x+uTileCount*0.5,uTileCount);float tiley=aTextureCoord.y-1.0-aVertexPosition.y-uOffset.y+uTileCount*0.5;%VERTEX_TRANSFORM%vec2 off=vec2(0.0,0.0);vec3 key=vec3(uZoomLevel,tilex,tiley);int tile=lookup(key,off);if (tile>=0) {float i=uMetaBuffer[tile].a;float reduction=exp2(uZoomLevel-key.r);vTile.x=mod(i,BUFF_W);vTile.y=floor(i/BUFF_W);vTC.x=off.x*0.5+(aTextureCoord.x)/reduction;vTC.y=off.y*0.5+(aTextureCoord.y)/reduction;return;}vTile=vec2(0.0,0.0);vTC=vec2(0.0,0.0);if ((abs(phi.y)-MAX_PHI)>0.01)vTC=vec2(0.5,0.5);}';
