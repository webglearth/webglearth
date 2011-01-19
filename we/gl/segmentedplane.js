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
 * @fileoverview Contains functions for creating segmented plane.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.gl.SegmentedPlane');

goog.require('we.gl.Mesh');



/**
 * Object representing a segmented plane.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of plane in segments.
 * @param {number} height Height of plane in segments.
 * @param {number=} opt_subdiv Optional subdivision of each segment.
 * @constructor
 * @implements {we.gl.Mesh}
 */
we.gl.SegmentedPlane = function(context, width, height, opt_subdiv) {
  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = context.gl;

  opt_subdiv = opt_subdiv ? opt_subdiv : 1;
  width = width * opt_subdiv;
  height = height * opt_subdiv;

  /** @inheritDoc */
  this.vertexBuffer = this.gl.createBuffer();

  /** @inheritDoc */
  this.texCoordBuffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
  var numItems = width * height * 6 * 2;
  var vertices = new Float32Array(numItems * 2);
  var coords = new Float32Array(numItems * 2);

  for (var y = 0; y < height; ++y)
  {
    for (var x = 0; x < width; ++x)
    {
      var addVertex = function(i_, x_, y_) {
        var baseIndex = ((x * width + y) * 6 + i_);
        vertices[baseIndex * 2 + 0] = (x - width / 2 + x_) / opt_subdiv;
        vertices[baseIndex * 2 + 1] = (y - height / 2 + y_) / opt_subdiv;

        coords[baseIndex * 2 + 0] =
            (x % opt_subdiv) / opt_subdiv + x_ / opt_subdiv;
        coords[baseIndex * 2 + 1] =
            (y % opt_subdiv) / opt_subdiv + y_ / opt_subdiv;
      };
      addVertex(0, 1, 1);
      addVertex(1, 0, 1);
      addVertex(2, 1, 0);
      addVertex(3, 0, 1);
      addVertex(4, 0, 0);
      addVertex(5, 1, 0);
    }
  }
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      vertices,
      this.gl.STATIC_DRAW
  );
  this.vertexBuffer.itemSize = 2;
  this.vertexBuffer.numItems = numItems;

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      coords,
      this.gl.STATIC_DRAW
  );
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = numItems;
};
