/**
 * @fileoverview WebGL Earth scene handling.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.Scene');

goog.require('goog.debug.Logger');
goog.require('we.gl.Context');
goog.require('we.gl.Plane');
goog.require('we.gl.Shader');
goog.require('we.gl.Texture');

/**
 * Object handling scene data
 * @param {!we.gl.Context} context WebGL context.
 * @constructor
 */
we.Scene = function(context) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = context;
  var gl = context.gl;

  var fsshader = we.gl.Shader.createFromElement(context, 'shader-fs');
  var vsshader = we.gl.Shader.createFromElement(context, 'shader-vs');

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error('Could not initialise shaders');
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute =
      gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.textureCoordAttribute =
      gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  shaderProgram.mvpMatrixUniform =
      gl.getUniformLocation(shaderProgram, 'uMVPMatrix');
  shaderProgram.samplerUniform =
      gl.getUniformLocation(shaderProgram, 'uSampler');

  we.program = shaderProgram;

  we.plane = new we.gl.Plane(context, 5, 2.5);
  we.texture = we.gl.Texture.load(context,
      'http://a.tile.openstreetmap.org/0/0/0.png');
};

/**
 * Draw scene
 */
we.Scene.prototype.draw = function() {
  var gl = this.context.gl;

  this.context.translate(-2.5, -1.25, -5);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, we.texture);
  gl.uniform1i(we.program.samplerUniform, 0);

  var mvpm = this.context.getMVPM();

  gl.useProgram(we.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.vertexBuffer);
  gl.vertexAttribPointer(we.program.vertexPositionAttribute,
                         we.plane.vertexBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, we.plane.texCoordBuffer);
  gl.vertexAttribPointer(we.program.textureCoordAttribute,
      we.plane.texCoordBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  //gl.uniformMatrix4fv(we.program.pMatrixUniform, false, projection);
  gl.uniformMatrix4fv(we.program.mvpMatrixUniform, false, mvpm);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, we.plane.vertexBuffer.numItems);

};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.Scene.logger = goog.debug.Logger.getLogger('we.scene');
}
