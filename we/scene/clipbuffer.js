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
 * @fileoverview WebGL Texture serving as buffer for ClipLevel.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.ClipBuffer');



/**
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of the buffer in pixels.
 * @param {number} height Height of the buffer in pixels.
 * @constructor
 */
we.scene.ClipBuffer = function(context, width, height) {
  /**
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.gl_ = context.gl;
  var gl = this.gl_;

  /**
   * @type {number}
   * @private
   */
  this.width_ = width;

  /**
   * @type {number}
   * @private
   */
  this.height_ = height;

  /**
   * @type {WebGLTexture}
   */
  this.texture = gl.createTexture();

  this.create_();
};


/**
 * Resizes this buffer. If dimensions are unchanged, does nothing.
 * @param {number} width New width.
 * @param {number} height New height.
 */
we.scene.ClipBuffer.prototype.resize = function(width, height) {
  if (this.width_ == width && this.height_ == height)
    return;

  this.width_ = width;
  this.height_ = height;

  this.gl_.deleteTexture(this.texture);

  this.texture = this.gl_.createTexture();

  this.create_();
};


/**
 * Recreates internal buffers. Useful when changing TileProvider.
 * @private
 */
we.scene.ClipBuffer.prototype.create_ = function() {
  var gl = this.gl_;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width_, this.height_, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
      we.scene.TRILINEAR_FILTERING ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
};


/**
 * Clears the buffer to contain transparent color.
 */
we.scene.ClipBuffer.prototype.clear = function() {
  this.gl_.deleteTexture(this.texture);

  this.texture = this.gl_.createTexture();

  this.create_();
};
