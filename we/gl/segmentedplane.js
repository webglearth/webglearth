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
 * @param {number} subdiv Subdivision of each segment.
 * @param {boolean=} opt_nolod If true, the plane is created with same amount of
 *                             subdivision even in more excentric areas.
 * @constructor
 * @implements {we.gl.Mesh}
 */
we.gl.SegmentedPlane = function(context, width, height, subdiv, opt_nolod) {
  /** @type {!WebGLRenderingContext} */
  var gl = context.gl;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.vertices_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.coords_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.indices_ = [];

  var nearestLowerPOT = function(num) {
    return Math.max(1, Math.pow(2, Math.ceil(Math.log(num) / Math.LN2)));
  };

  var calcSubdiv = function(nolod, subdiv, x, y) {
    return nolod ? subdiv :
        nearestLowerPOT(subdiv / Math.max(1, Math.sqrt(x * x + y * y)));
  };
  //this.generateTile_(0,0,subdiv,[false,true,false,false]);
  for (var x = -width / 2; x < width / 2; ++x)
  {
    for (var y = -height / 2; y < height / 2; ++y)
    {
      var thisSubdiv = calcSubdiv(opt_nolod, subdiv, x, y);
      var doubles = [y + 1 < height / 2 &&
                     calcSubdiv(opt_nolod, subdiv, x, y + 1) > thisSubdiv,
                     x + 1 < width / 2 &&
                     calcSubdiv(opt_nolod, subdiv, x + 1, y) > thisSubdiv,
                     y - 1 > -height / 2 &&
                     calcSubdiv(opt_nolod, subdiv, x, y - 1) > thisSubdiv,
                     x - 1 > -width / 2 &&
                     calcSubdiv(opt_nolod, subdiv, x - 1, y) > thisSubdiv];
      this.generateTile_(x, y, thisSubdiv, doubles);
    }
  }

  /** @inheritDoc */
  this.vertexBuffer = gl.createBuffer();

  /** @inheritDoc */
  this.texCoordBuffer = gl.createBuffer();

  /** @inheritDoc */
  this.indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(this.vertices_), gl.STATIC_DRAW);
  this.vertexBuffer.itemSize = 2;

  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(this.coords_), gl.STATIC_DRAW);
  this.texCoordBuffer.itemSize = 2;

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(this.indices_), gl.STATIC_DRAW);

  /** @inheritDoc */
  this.numIndices = this.indices_.length;
};


/**
 * @param {number} offX Offset of the tile.
 * @param {number} offY Offset of the tile.
 * @param {number} subdiv Subdivision of this tile.
 * @param {Array.<boolean>} doubles TRBL.
 * @private
 */
we.gl.SegmentedPlane.prototype.generateTile_ = function(offX, offY,
                                                        subdiv, doubles) {
  /** @type {number} */
  var offIndices = this.vertices_.length / 2;

  for (var y = 0; y <= subdiv; ++y) {
    for (var x = 0; x <= subdiv; ++x) {
      this.vertices_.push(offX + x / subdiv, offY + y / subdiv);
      this.coords_.push(x / subdiv, 1 - y / subdiv);
    }
  }

  /** @type {Array.<number>} */
  var additionStarts = [0, 0, 0, 0];
  if (doubles[0]) { //TOP
    additionStarts[0] = this.vertices_.length / 2;
    for (var x = 0; x < subdiv; ++x) {
      this.vertices_.push(offX + (x + 0.5) / subdiv, offY + 1);
      this.coords_.push((x + 0.5) / subdiv, 0);
    }
  }
  if (doubles[1]) { //RIGHT
    additionStarts[1] = this.vertices_.length / 2;
    for (var y = 0; y < subdiv; ++y) {
      this.vertices_.push(offX + 1, offY + (y + 0.5) / subdiv);
      this.coords_.push(1, 1 - (y + 0.5) / subdiv);
    }
  }
  if (doubles[2]) { //BOTTOM
    additionStarts[2] = this.vertices_.length / 2;
    for (var x = 0; x < subdiv; ++x) {
      this.vertices_.push(offX + (x + 0.5) / subdiv, offY);
      this.coords_.push((x + 0.5) / subdiv, 1);
    }
  }
  if (doubles[3]) { //LEFT
    additionStarts[3] = this.vertices_.length / 2;
    for (var y = 0; y < subdiv; ++y) {
      this.vertices_.push(offX, offY + (y + 0.5) / subdiv);
      this.coords_.push(0, 1 - (y + 0.5) / subdiv);
    }
  }

  var finishTriangle = goog.bind(function() {
    /*
    // Useful for debugging - Uncomment this if you want to render
    // this segplane as gl.LINES instead of gl.TRIANGLES
    // (gets compiled-out if commented)
    var last = this.indices_.pop();
    var prelast = this.indices_.pop();
    var preprelast = this.indices_.pop();
    this.indices_.push(preprelast, prelast, prelast, last, last, preprelast);
    */
  }, this);

  //TRIANGLE version
  var line = subdiv + 1;
  for (var y = 0; y < subdiv; ++y) {
    for (var x = 0; x < subdiv; ++x) {
      var base = offIndices + y * line + x;
      this.indices_.push(base);
      // insert transition triangles
      var bottom = y == 0 && doubles[2];
      var left = x == 0 && doubles[3];
      if (bottom && !left) {
        this.indices_.push(additionStarts[2] + x);
        this.indices_.push(base + line);
        finishTriangle();
        this.indices_.push(additionStarts[2] + x);
      } else if (left && !bottom) {
        this.indices_.push(base + 1);
        this.indices_.push(additionStarts[3] + y);
        finishTriangle();

        this.indices_.push(additionStarts[3] + y);
      } else if (left && bottom) {
        this.indices_.push(additionStarts[2] + x);
        this.indices_.push(additionStarts[3] + y);
        finishTriangle();

        this.indices_.push(additionStarts[3] + y);
        this.indices_.push(additionStarts[2] + x);
        this.indices_.push(base + line);
        finishTriangle();

        this.indices_.push(additionStarts[2] + x);
      }
      this.indices_.push(base + 1);
      this.indices_.push(base + line);
      finishTriangle();

      this.indices_.push(base + line + 1);
      // insert transition triangles
      var top = y == subdiv - 1 && doubles[0];
      var right = x == subdiv - 1 && doubles[1];
      if (top && !right) {
        this.indices_.push(additionStarts[0] + x);
        this.indices_.push(base + 1);
        finishTriangle();
        this.indices_.push(additionStarts[0] + x);
      } else if (right && !top) {
        this.indices_.push(base + line);
        this.indices_.push(additionStarts[1] + y);
        finishTriangle();

        this.indices_.push(additionStarts[1] + y);
      } else if (top && right) {
        this.indices_.push(additionStarts[0] + x);
        this.indices_.push(additionStarts[1] + y);
        finishTriangle();

        this.indices_.push(additionStarts[1] + y);
        this.indices_.push(additionStarts[0] + x);
        this.indices_.push(base + 1);
        finishTriangle();

        this.indices_.push(additionStarts[0] + x);
      }
      this.indices_.push(base + line);
      this.indices_.push(base + 1);
      finishTriangle();
    }
  }

  /* //TRIANGLE_STRIP version - buggy and not respecting doubles atm
  var line = 2*(subdiv+1);
  for (var y = 0; y < subdiv; ++y) {
    for (var x = 0; x < line; ++x) {
      if (y%2 == 0) {
        if (x%2 == 1) {
          this.indices_.push(
            offIndices + Math.floor(y/2)*line + Math.floor(x/2));
        } else {
          this.indices_.push(
            offIndices + (Math.floor(y/2)+0.5)*line + Math.floor(x/2));
        }
      } else {
        if (x%2 == 1) {
          this.indices_.push(
            offIndices + (Math.ceil(y/2)+0.5)*line - 1 - Math.floor(x/2));
        } else {
          this.indices_.push(
            offIndices + Math.ceil(y/2)*line - 1 - Math.floor(x/2));
        }
      }
    }
  }

  //degenerate the strip
  //var last = this.indices_.pop();
  //this.indices_.push(last, last);
  */
};
