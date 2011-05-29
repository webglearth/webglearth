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

goog.provide('we.scene.ModelManager');

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
goog.require('we.scene.AbstractModel');
goog.require('we.scene.Model');
goog.require('we.scene.O3DModel');
goog.require('we.shaderbank');



/**
 * @constructor
 * @param {!we.gl.Context} context The context.
 */
we.scene.ModelManager = function(context) {

  /**
   * @type {!we.gl.Context}
   */
  this.context = context;

  /**
   * @type {Array.<!we.scene.AbstractModel>}
   */
  this.models = [];

  /**
   * @type {WebGLProgram}
   */
  this.program = null;

  this.compileProgram_();

};


/**
 * Adds a model.
 * @param {!we.scene.AbstractModel} model The model.
 */
we.scene.ModelManager.prototype.addModel = function(model) {
  this.models.push(model);
};


/**
 * Adds a model from a URL.
 * @param {string} url The URL.
 * @param {boolean=} opt_o3d The model is in O3D JSON format.
 */
we.scene.ModelManager.prototype.addModelFromUrl = function(url, opt_o3d) {
  if (goog.DEBUG) {
    we.scene.Model.getLogger().info('Loading ' + url);
  }
  goog.net.XhrIo.send(url, goog.bind(function(e) {
    if (e.target.isSuccess()) {
      /** @type {!we.scene.JSONModelData} */
      var data = e.target.getResponseJson();
      var model;
      if (opt_o3d) {
        model = new we.scene.O3DModel(this.context, data);
      } else {
        model = new we.scene.Model(
            this.context, data.vertexPositions, data.vertexNormals,
            data.indices);
      }
      this.models.push(model);
    } else if (goog.DEBUG) {
      we.scene.Model.getLogger().warning('Loading ' + url + ' failed');
    }
  }, this));
};


/**
 * @private
 */
we.scene.ModelManager.prototype.compileProgram_ = function() {

  var gl = this.context.gl;

  var fragmentShaderCode = we.shaderbank.getShaderCode('model-fs.glsl');
  var fsshader =
      we.gl.Shader.create(this.context, fragmentShaderCode, gl.FRAGMENT_SHADER);

  var vertexShaderCode = we.shaderbank.getShaderCode('model-vs.glsl');
  var vsshader =
      we.gl.Shader.create(this.context, vertexShaderCode, gl.VERTEX_SHADER);

  var program = gl.createProgram();
  if (goog.isNull(program)) {
    throw Error('Unknown');
  }
  gl.attachShader(program, vsshader);
  gl.attachShader(program, fsshader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw Error('Shader program err: ' + gl.getProgramInfoLog(program));
  }

  program.vertexPositionAttribute =
      gl.getAttribLocation(program, 'aVertexPosition');
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  program.vertexNormalAttribute =
      gl.getAttribLocation(program, 'aVertexNormal');
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  program.mvMatrixUniform = gl.getUniformLocation(program, 'uMVMatrix');
  program.mvpMatrixUniform = gl.getUniformLocation(program, 'uMVPMatrix');
  program.nMatrixUniform = gl.getUniformLocation(program, 'uNMatrix');

  this.program = program;

};


/**
 */
we.scene.ModelManager.prototype.draw = function() {

  var gl = this.context.gl;

  if (goog.array.isEmpty(this.models)) {
    return;
  }

  gl.useProgram(this.program);

  goog.array.forEach(this.models, goog.bind(function(model) {
    model.draw(this.program);
  }, this));

};
