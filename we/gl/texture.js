
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
