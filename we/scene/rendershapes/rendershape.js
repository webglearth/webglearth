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
 * @fileoverview Base object for render shapes -
 *               possible visualisation style (sphere, plane, etc.).
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.RenderShape');

goog.require('we.gl.Shader');
goog.require('we.scene.LocatedProgram');
goog.require('we.shaderbank');



/**
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 */
we.scene.rendershapes.RenderShape = function(scene) {
  /**
   * @type {!we.scene.Scene}
   */
  this.scene = scene;

  /**
   * @type {we.scene.LocatedProgram}
   */
  this.locatedProgram = null;


  this.compileProgram();
};


/**
 * Compiles vertex and fragment shader program for this RenderShape.
 */
we.scene.rendershapes.RenderShape.prototype.compileProgram = function() {

  var dim = this.scene.getBufferDimensions();
  var gl = this.scene.context.gl;

  var fragmentShaderCode = we.shaderbank.getShaderCode('fs.glsl');

  fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
      dim.width.toFixed(1));
  fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
      dim.height.toFixed(1));

  var vertexShaderCode = we.shaderbank.getShaderCode('vs.glsl');

  vertexShaderCode = vertexShaderCode.replace('%VERTEX_TRANSFORM%',
      this.vertexTransform);

  vertexShaderCode = vertexShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
      dim.width.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
      dim.height.toFixed(1));
  vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIZE_INT%',
      (dim.width * dim.height).toFixed(0));
  vertexShaderCode = vertexShaderCode.replace('%BINARY_SEARCH_CYCLES_INT%',
      (Math.log(dim.width * dim.height) / Math.LN2).toFixed(0));
  vertexShaderCode = vertexShaderCode.replace('%LOOKUP_LEVELS_INT%',
      (we.scene.LOOKUP_FALLBACK_LEVELS + 1).toFixed(0));

  var fsshader = we.gl.Shader.create(this.scene.context, fragmentShaderCode,
      gl.FRAGMENT_SHADER);
  var vsshader = we.gl.Shader.create(this.scene.context, vertexShaderCode,
      gl.VERTEX_SHADER);

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsshader);
  gl.attachShader(shaderProgram, fsshader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error('Could not initialise shaders');
  }

  this.locatedProgram = new we.scene.LocatedProgram(shaderProgram,
      this.scene.context);
};


/**
 * RenderShape-specific vertex position transformation to be placed into shader.
 * @type {string}
 * @protected
 * @const
 */
we.scene.rendershapes.RenderShape.prototype.vertexTransform = '';


/**
 * Calculates proper distance according to current perspective settings so,
 * that requested number of tiles can fit vertically on the canvas.
 * @return {number} Calculated distance.
 */
we.scene.rendershapes.RenderShape.prototype.calcDistance = goog.abstractMethod;


/**
 * Applies needed translations and rotations to given context.
 */
we.scene.rendershapes.RenderShape.prototype.transformContext =
    goog.abstractMethod;


/**
 * Performs implementation-specific raytracing and calculates geo-space coords.
 * @param {!goog.math.Vec3} origin Point of origin.
 * @param {!goog.math.Vec3} direction Normalized vector direction.
 * @return {?Array.<number>} Array [lat, long] in radians or null.
 */
we.scene.rendershapes.RenderShape.prototype.traceRayToGeoSpace =
    goog.abstractMethod;


/**
 * Performs implementation-specific translation of
 * geo-space coords to model-space coords.
 * @param {number} lat Latitude in radians.
 * @param {number} lon Longitude in radians.
 * @return {goog.math.Vec3} Point in model-space.
 */
we.scene.rendershapes.RenderShape.prototype.getPointForLatLon =
    goog.abstractMethod;


/**
 * Calculates visibility of given point from "viewer" point.
 * This does NOT consider viewport clipping.
 * @param {!goog.math.Vec3} point Point in model-space.
 * @param {!goog.math.Vec3} viewer Point in model-space.
 * @return {boolean} Whether the point is visible from viewer or not.
 */
we.scene.rendershapes.RenderShape.prototype.isPointVisible =
    goog.abstractMethod;
