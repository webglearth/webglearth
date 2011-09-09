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
 * @fileoverview Contains object describing shader program
 *               swith located attributes and uniforms.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.LocatedProgram');



/**
 * @param {!WebGLProgram} program Shader program.
 * @param {!we.gl.Context} context Context.
 * @param {boolean} overlay Overlay?
 * @param {boolean} terrain Terrain?
 * @constructor
 */
we.scene.LocatedProgram = function(program, context, overlay, terrain) {
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
   * @type {WebGLUniformLocation}
   */
  this.mvpMatrixUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMVPMatrix');


  //Texture A

  /**
   * @type {WebGLUniformLocation}
   */
  this.metaL0AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMetaL0A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.metaL1AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMetaL1A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.metaL2AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uMetaL2A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.levelOffsetsAUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uOffLA');

  /**
   * @type {WebGLUniformLocation}
   */
  this.bufferL0AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uBufferL0A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.bufferL1AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uBufferL1A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.bufferL2AUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uBufferL2A');

  /**
   * @type {WebGLUniformLocation}
   */
  this.bufferLnAUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uBufferLnA');


  //Texture B
  if (overlay) {
    /**
     * @type {WebGLUniformLocation}
     */
    this.metaL0BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMetaL0B');

    /**
     * @type {WebGLUniformLocation}
     */
    this.metaL1BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMetaL1B');

    /**
     * @type {WebGLUniformLocation}
     */
    this.metaL2BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMetaL2B');

    /**
     * @type {WebGLUniformLocation}
     */
    this.levelOffsetsBUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uOffLB');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferL0BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferL0B');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferL1BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferL1B');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferL2BUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferL2B');


    /**
     * @type {WebGLUniformLocation}
     */
    this.mixFactorUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMixFactor');
  }

  //Texture T
  if (terrain) {
    /**
     * @type {WebGLUniformLocation}
     */
    this.degradationTUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uDegradationT');

    /**
     * @type {WebGLUniformLocation}
     */
    this.metaL0TUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMetaL0T');

    /**
     * @type {WebGLUniformLocation}
     */
    this.metaL1TUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uMetaL1T');

    /**
     * @type {WebGLUniformLocation}
     */
    this.levelOffsetsTUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uOffLT');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferL0TUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferL0T');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferL1TUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferL1T');

    /**
     * @type {WebGLUniformLocation}
     */
    this.bufferLnTUniform =
        this.getValidatedUniformLocation_(gl, this.program, 'uBufferLnT');
  }
  /**
   * @type {WebGLUniformLocation}
   */
  this.tileCountUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uTileCount');

  /**
   * @type {WebGLUniformLocation}
   */
  this.offsetUniform =
      this.getValidatedUniformLocation_(gl, this.program, 'uOffset');
};


/**
 * @param {!WebGLRenderingContext} gl GL.
 * @param {!WebGLProgram} program Program.
 * @param {string} name Identifier.
 * @return {WebGLUniformLocation} Validated location.
 * @private
 */
we.scene.LocatedProgram.prototype.getValidatedUniformLocation_ =
    function(gl, program, name) {
  var result = gl.getUniformLocation(program, name);
  if (goog.isNull(result)) {
    if (goog.DEBUG) {
      we.scene.Scene.logger.warning('Invalid name ' + name);
    } else {
      throw Error('Invalid name ' + name);
    }
  }
  return result;
};
