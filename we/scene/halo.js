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
 * @fileoverview Object representing halo around the Earth.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Halo');

goog.require('we.gl.Shader');
goog.require('we.shaderbank');



/**
 * Halo around Earth
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 */
we.scene.Halo = function(scene) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = scene.context;

  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = scene.context.gl;
  var gl = this.gl;

  this.vertexBuffer_ = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
  var MAX = 1.1;
  var vertices = [
    MAX, MAX,
    -MAX, MAX,
    MAX, -MAX,
    -MAX, -MAX
  ];
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      gl.STATIC_DRAW
  );

  this.gradient_ = gl.createTexture();

  var gradientData = new Uint8Array([224, 224, 255, 255,
                                     207, 218, 250, 220,
                                     179, 194, 245, 180,
                                     137, 166, 237, 145,
                                     84, 123, 221, 110,
                                     51, 94, 198, 75,
                                     25, 67, 178, 30,
                                     13, 53, 161, 0]);

  gl.bindTexture(gl.TEXTURE_2D, this.gradient_);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 1, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, gradientData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var fragmentShaderCode = we.shaderbank.getShaderCode('halo-fs.glsl');
  var vertexShaderCode = we.shaderbank.getShaderCode('halo-vs.glsl');

  var fsshader = we.gl.Shader.create(this.context, fragmentShaderCode,
      this.gl.FRAGMENT_SHADER);
  var vsshader = we.gl.Shader.create(this.context, vertexShaderCode,
      this.gl.VERTEX_SHADER);

  this.program_ = this.gl.createProgram();
  if (goog.isNull(this.program_)) {
    throw Error('Unknown');
  }
  this.gl.attachShader(this.program_, vsshader);
  this.gl.attachShader(this.program_, fsshader);

  this.gl.bindAttribLocation(this.program_, 0, 'aVertexPosition');

  this.gl.linkProgram(this.program_);

  if (!this.gl.getProgramParameter(this.program_, this.gl.LINK_STATUS)) {
    throw Error('Shader program err: ' +
        this.gl.getProgramInfoLog(this.program_));
  }

  /**
   * @type {number}
   */
  this.vertexPositionAttribute =
      this.gl.getAttribLocation(this.program_, 'aVertexPosition');
  this.gl.enableVertexAttribArray(this.vertexPositionAttribute);

  /**
   * @type {WebGLUniformLocation}
   */
  this.mvMatrixUniform = this.gl.getUniformLocation(this.program_, 'uMVMatrix');

  /**
   * @type {WebGLUniformLocation}
   */
  this.pMatrixUniform = this.gl.getUniformLocation(this.program_, 'uPMatrix');

  /**
   * @type {WebGLUniformLocation}
   */
  this.gradientUniform = this.gl.getUniformLocation(this.program_, 'uGradient');
};


/**
 * Draw the halo
 */
we.scene.Halo.prototype.draw = function() {
  this.gl.useProgram(this.program_);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer_);
  this.gl.vertexAttribPointer(this.vertexPositionAttribute, 2, this.gl.FLOAT,
                              false, 0, 0);

  this.gl.activeTexture(this.gl.TEXTURE0);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.gradient_);
  this.gl.uniform1i(this.gradientUniform, 0);

  var mvm = new Float32Array(goog.array.flatten(
      this.context.modelViewMatrix.getStandardMatrix().
      getTranspose().toArray()));

  var pm = new Float32Array(goog.array.flatten(
      this.context.projectionMatrix.getTranspose().toArray()));

  this.gl.uniformMatrix4fv(this.mvMatrixUniform, false, mvm);
  this.gl.uniformMatrix4fv(this.pMatrixUniform, false, pm);

  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
};
