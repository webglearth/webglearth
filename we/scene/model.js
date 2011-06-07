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
 * @fileoverview WebGL Earth model manager.
 *
 * @author tom.payne@camptocamp.com (Tom Payne)
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Model');

/* FIXME goog.Uri is only needed here because it's missing from
 *       goog.net.XhrIo
 */
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.net.XhrIo');

goog.require('we.gl.Context');
goog.require('we.gl.Mesh');
goog.require('we.gl.Shader');
goog.require('we.math.TransformationMatrix');
goog.require('we.shaderbank');


/**
 * @typedef {{vertexPositions: Array.<number>,
 *            vertexNormals: Array.<number>,
 *            indices: Array.<number>}}
 */
we.scene.JSONModelData;



/**
 * @extends {we.scene.AbstractModel}
 * @constructor
 * @param {!we.gl.Context} context WebGL context.
 * @param {Array.<number>} vertexPositions Vertex positions.
 * @param {Array.<number>} vertexNormals Vertex normals.
 * @param {Array.<number>} indices Indices.
 * @param {Array.<number>=} opt_color Uniform model color.
 */
we.scene.Model = function(context, vertexPositions, vertexNormals, indices,
                          opt_color) {

  /**
   * @type {!we.gl.Context}
   */
  this.context = context;

  var gl = this.context.gl;

  /**
   * @type {WebGLBuffer}
   */
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexPositions),
      gl.STATIC_DRAW
  );
  this.vertexBuffer.itemSize = 3;
  this.vertexBuffer.numItems = vertexPositions.length / 3;

  /**
   * @type {WebGLBuffer}
   */
  this.vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(vertexNormals),
      gl.STATIC_DRAW
  );
  this.vertexNormalBuffer.itemSize = 3;
  this.vertexNormalBuffer.numItems = vertexNormals.length / 3;

  /**
   * @type {WebGLBuffer}
   */
  this.texCoordBuffer = null;

  /**
   * @type {WebGLBuffer}
   */
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
  );
  this.indexBuffer.itemSize = 1;
  this.indexBuffer.numItems = indices.length;

  /**
   * @type {number}
   */
  this.numIndices = this.indexBuffer.numItems;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.color_ = (goog.isArray(opt_color) && opt_color.length >= 3) ?
                [opt_color[0], opt_color[1], opt_color[2]] : [0.8, 0.8, 0.8];

};


/**
 * @inheritDoc
 */
we.scene.Model.prototype.draw = function(program) {

  var gl = this.context.gl;

  var mvm = new Float32Array(goog.array.flatten(
      this.context.modelViewMatrix.getStandardMatrix().toArray()));
  gl.uniformMatrix4fv(program.mvMatrixUniform, false, mvm);

  var mvpm = new Float32Array(goog.array.flatten(
      this.context.flushMVPM().getTranspose().toArray()));
  gl.uniformMatrix4fv(program.mvpMatrixUniform, false, mvpm);

  var nm = new Float32Array(goog.array.flatten(
      this.context.modelViewMatrix.getInverseMat3().getTranspose().toArray()));
  gl.uniformMatrix3fv(program.nMatrixUniform, false, nm);

  gl.uniform3fv(program.colorUniform, this.color_);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.vertexAttribPointer(
      program.vertexPositionAttribute, this.vertexBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
  gl.vertexAttribPointer(
      program.vertexNormalAttribute, this.vertexNormalBuffer.itemSize,
      gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.drawElements(
      gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

};


/**
 * @return {goog.debug.Logger} Shared logger instance.
 */
we.scene.Model.getLogger = function() {
  return goog.debug.Logger.getLogger('we.scene.Model');
};
