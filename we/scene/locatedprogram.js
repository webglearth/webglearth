
/**
 * @fileoverview Contains object describing shader program
 *               swith located attributes and uniforms.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.LocatedProgram');

goog.require('we.gl.Context');



/**
 * @param {!WebGLProgram} program Shader program.
 * @param {!we.gl.Context} context Context.
 * @constructor
 */
we.scene.LocatedProgram = function(program, context) {
  var gl = context.gl;

  /**
   * @type {!WebGLProgram}
   */
  this.program = program;

  /**
   * @type {number}
   */
  this.vertexPositionAttribute =
      gl.getAttribLocation(this.program, 'aVertexPosition');
  gl.enableVertexAttribArray(this.vertexPositionAttribute);

  /**
   * @type {number}
   */
  this.textureCoordAttribute =
      gl.getAttribLocation(this.program, 'aTextureCoord');
  gl.enableVertexAttribArray(this.textureCoordAttribute);

  /**
   * @type {!WebGLUniformLocation}
   */
  this.mvpMatrixUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMVPMatrix');

  /**
   * @type {!WebGLUniformLocation}
   */
  this.tileBufferUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uTileBuffer');

  /**
   * @type {!WebGLUniformLocation}
   */
  this.metaBufferUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMetaBuffer');


  /**
   * @type {!WebGLUniformLocation}
   */
  this.tileSizeUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uTileSize');

  /**
   * @type {!WebGLUniformLocation}
   */
  this.zoomLevelUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uZoomLevel');

  /**
   * @type {!WebGLUniformLocation}
   */
  this.tileCountUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uTileCount');

  /**
   * @type {!WebGLUniformLocation}
   */
  this.offsetUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uOffset');
};


/**
 * @param {!WebGLRenderingContext} gl GL.
 * @param {!WebGLProgram} program Program.
 * @param {string} name Identifier.
 * @return {!WebGLUniformLocation} Validated location.
 * @private
 */
we.scene.LocatedProgram.prototype.getValidatedUniformLocation_ =
    function(gl, program, name) {
  var result = gl.getUniformLocation(program, name);
  if (!goog.isNull(result)) {
    return result;
  } else {
    throw Error('Invalid name');
  }
};
