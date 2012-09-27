/*
 * Copyright (C) 2012 Klokan Technologies GmbH (info@klokantech.com)
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
 * @fileoverview Object representing simple miniglobe.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.MiniGlobe');

goog.require('we.gl.Shader');
goog.require('we.shaderbank');



/**
 * @param {!we.scene.Scene} scene Scene.
 * @param {number} latBands .
 * @param {number} lngBands .
 * @param {string} textureUrl .
 * @constructor
 */
we.scene.MiniGlobe = function(scene, latBands, lngBands, textureUrl) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

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

  var radius = 1;
  var vertexPositionData = [], textureCoordData = [], indexData = [];
  for (var latNumber = 0; latNumber <= latBands; latNumber++) {
    var theta = latNumber * Math.PI / latBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= lngBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / lngBands;
      phi -= Math.PI / 2;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      var u = 1 - (longNumber / lngBands);
      var v = 1 - (latNumber / latBands);

      textureCoordData.push(u);
      textureCoordData.push(v);
      vertexPositionData.push(radius * x);
      vertexPositionData.push(radius * y);
      vertexPositionData.push(radius * z);
    }
  }

  for (var latNumber = 0; latNumber < latBands; latNumber++) {
    for (var longNumber = 0; longNumber < lngBands; longNumber++) {
      var first = (latNumber * (lngBands + 1)) + longNumber;
      var second = first + lngBands + 1;
      indexData.push(first + 1);
      indexData.push(second);
      indexData.push(first);

      indexData.push(first + 1);
      indexData.push(second + 1);
      indexData.push(second);
    }
  }

  this.vertexBuffer_ = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  this.vertexBuffer_.itemSize = 3;
  this.vertexBuffer_.numItems = vertexPositionData.length / 3;

  this.texCoordBuffer_ = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer_);
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(textureCoordData), gl.STATIC_DRAW);
  this.texCoordBuffer_.itemSize = 2;
  this.texCoordBuffer_.numItems = textureCoordData.length / 2;

  this.indexBuffer_ = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(indexData), gl.STATIC_DRAW);
  this.indexBuffer_.itemSize = 1;
  this.indexBuffer_.numItems = indexData.length;

  /**
   * @type {?WebGLTexture}
   * @private
   */
  this.texture_ = null;

  var image_ = new Image();
  image_.onload = goog.bind(function() {
    this.texture_ = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture_);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image_);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }, this);
  image_.src = textureUrl;

  var fragmentShaderCode = we.shaderbank.getShaderCode('miniglobe-fs.glsl');
  var vertexShaderCode = we.shaderbank.getShaderCode('miniglobe-vs.glsl');

  var fsshader = we.gl.Shader.create(this.context, fragmentShaderCode,
      gl.FRAGMENT_SHADER);
  var vsshader = we.gl.Shader.create(this.context, vertexShaderCode,
      gl.VERTEX_SHADER);

  this.program_ = gl.createProgram();
  if (goog.isNull(this.program_)) {
    throw Error('Unknown');
  }
  gl.attachShader(this.program_, vsshader);
  gl.attachShader(this.program_, fsshader);

  gl.bindAttribLocation(this.program_, 0, 'aVertexPosition');

  gl.linkProgram(this.program_);

  if (!gl.getProgramParameter(this.program_, gl.LINK_STATUS)) {
    throw Error('Shader program err: ' +
        gl.getProgramInfoLog(this.program_));
  }

  gl.useProgram(this.program_);

  this.vertexPositionAttribute =
      gl.getAttribLocation(this.program_, 'aVertexPosition');
  this.textureCoordAttribute =
      gl.getAttribLocation(this.program_, 'aTextureCoord');

  this.sMatrixUniform = gl.getUniformLocation(this.program_, 'uSMatrix');
  this.pMatrixUniform = gl.getUniformLocation(this.program_, 'uPMatrix');
  this.mvMatrixUniform = gl.getUniformLocation(this.program_, 'uMVMatrix');
  this.samplerUniform = gl.getUniformLocation(this.program_, 'uSampler');

  /**
   * @type {number}
   * @private
   */
  this.size_ = 128;

  /**
   * @type {number}
   * @private
   */
  this.padding_ = 0.1;
};


/**
 * @param {number} size Size of the mini globe in pixels.
 * @param {number=} opt_padding Relative padding (0.1 ~= 10% padding).
 */
we.scene.MiniGlobe.prototype.setSize = function(size, opt_padding) {
  this.size_ = size;
  if (goog.isDefAndNotNull(opt_padding)) this.padding_ = opt_padding;
};


/**
 * Draw
 */
we.scene.MiniGlobe.prototype.draw = function() {
  if (!goog.isDefAndNotNull(this.texture_)) return;
  var gl = this.gl;
  gl.useProgram(this.program_);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture_);
  gl.uniform1i(this.samplerUniform, 0);

  var relativeSize = this.size_ / this.context.canvas.height;
  var offset = 2 * (this.padding_ + 0.5) * relativeSize;

  var sm = new we.math.TransformationMatrix();
  sm.translate(1 - offset / this.context.aspectRatio, -1 + offset, 0);
  sm.scale(relativeSize, relativeSize, 1);

  var mvm = new we.math.TransformationMatrix();
  mvm.translate(0, 0, -1.1 / Math.tan(this.context.fov / 2));
  mvm.rotate100(this.scene_.camera.getLatitude());
  mvm.rotate010(-this.scene_.camera.getLongitude());

  //var mvm = new Float32Array(goog.array.flatten(
  //    this.context.modelViewMatrix.getStandardMatrix().
  //    getTranspose().toArray()));

  var pm = new Float32Array(goog.array.flatten(
      this.context.projectionMatrix.getTranspose().toArray()));

  gl.uniformMatrix4fv(this.mvMatrixUniform, false, new Float32Array(
      goog.array.flatten(mvm.getStandardMatrix().getTranspose().toArray())));
  gl.uniformMatrix4fv(this.pMatrixUniform, false, pm);
  gl.uniformMatrix4fv(this.sMatrixUniform, false, new Float32Array(
      goog.array.flatten(sm.getStandardMatrix().getTranspose().toArray())));

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer_);
  gl.vertexAttribPointer(this.vertexPositionAttribute,
                         this.vertexBuffer_.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer_);
  gl.vertexAttribPointer(this.textureCoordAttribute,
                         this.texCoordBuffer_.itemSize, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(this.vertexPositionAttribute);
  gl.enableVertexAttribArray(this.textureCoordAttribute);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer_);
  gl.drawElements(gl.TRIANGLES, this.indexBuffer_.numItems,
                  gl.UNSIGNED_SHORT, 0);

  gl.disableVertexAttribArray(this.vertexPositionAttribute);
  gl.disableVertexAttribArray(this.textureCoordAttribute);
};
