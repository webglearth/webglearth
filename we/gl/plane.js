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
 * @fileoverview Contains functions for creating simple plane.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Plane');

goog.require('we.gl.Mesh');



/**
 * Object representing a plane.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of plane.
 * @param {number} height Height of plane.
 * @constructor
 * @implements {we.gl.Mesh}
 */
we.gl.Plane = function(context, width, height) {
  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = context.gl;

  /** @inheritDoc */
  this.vertexBuffer = this.gl.createBuffer();

  /** @inheritDoc */
  this.texCoordBuffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
  var vertices = [
    width, height, 0.0,
    0.0, height, 0.0,
    width, 0.0, 0.0,
    0.0, 0.0, 0.0
  ];
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
  );
  this.vertexBuffer.itemSize = 3;
  this.vertexBuffer.numItems = 4;


  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
  var coords = [
    1.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    0.0, 0.0
  ];
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(coords),
      this.gl.STATIC_DRAW
  );
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = 4;

};
