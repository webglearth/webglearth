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
 * @fileoverview Contains functions for texture initialization and loading.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Texture');

goog.require('goog.debug.Logger');


/**
 * Asynchronously loads texture from URL
 * @param {!we.gl.Context} context WebGL context.
 * @param {string} url URL of image to load.
 * @return {!WebGLTexture} WebGL texture handler.
 */
we.gl.Texture.load = function(context, url) {
  var gl = context.gl;

  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.onload = function() {
    handleLoadedTexture(texture);
  }
  texture.image.src = url;
  if (goog.DEBUG)
    we.gl.Texture.logger.info(texture.image.src + ' loading..');

  var handleLoadedTexture = function(texture) {

    if (goog.DEBUG)
      we.gl.Texture.logger.info(texture.image.src + ' loaded, copying..');

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (goog.DEBUG)
      we.gl.Texture.logger.info(texture.image.src + ' copied.');
  };

  return texture;
};


if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.gl.Texture.logger = goog.debug.Logger.getLogger('we.gl.Texture');
}
