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
 */

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