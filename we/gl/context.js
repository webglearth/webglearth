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
 * @fileoverview Contains functions for WebGL initialization.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Context');

goog.require('WebGLDebugUtils');

goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.events');
goog.require('goog.math.Matrix');

goog.require('we.math.TransformationMatrix');


/**
 * @define {boolean} Defines whether FPS should be calculated and displayed.
 */
we.CALC_FPS = true;



/**
 * Object wrapping a WebGL context.
 * @param {!Element} canvas Canvas element.
 * @param {Element=} opt_fpsbox Element to output fps information to.
 * @param {!function()=} opt_onfail Function to call if unable to get any valid
 *                                  WebGL context, otherwise throws error.
 * @constructor
 */
we.gl.Context = function(canvas, opt_fpsbox, opt_onfail) {
  /**
   * @param {!Element} canvas Canvas element.
   * @param {string} type Type of context to get.
   * @return {?WebGLRenderingContext} Context or null.
   */
  var tryGetContext = function(canvas, type) {
    try {
      var context = canvas.getContext(type);
      if (goog.isDefAndNotNull(context)) {
        if (goog.DEBUG)
          we.gl.Context.logger.info('got WebGL context of type ' + type);
        return context;
      }
    } catch (e) {
      if (goog.DEBUG)
        we.gl.Context.logger.shout(e);
    }
    return null;
  };

  /** @type {WebGLRenderingContext} */
  var gl = null;

  /**
   * @type {!Array.<string>}
   */
  var contextNames = ['webgl', 'experimental-webgl'];
  for (var i = 0; goog.isNull(gl) && i < contextNames.length; ++i) {
    gl = gl || tryGetContext(canvas, contextNames[i]);
  }

  if (goog.isNull(gl)) {
    if (goog.isDef(opt_onfail)) {
      opt_onfail();
    } else {
      throw Error('unable to get a valid WebGL context');
    }
  }

  if (goog.DEBUG) {
    /**
     * @param {number} err Error code.
     * @param {string} funcName Function name.
     * @param {Arguments} args Arguments of the function.
     */
    function logGLError(err, funcName, args) {
      we.gl.Context.logger.severe(
          WebGLDebugUtils.glEnumToString(err) +
          ' was caused by call to \"' + funcName + '\"');
    };

    gl = WebGLDebugUtils.makeDebugContext(gl, logGLError);
  }

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  /**
   * WebGL canvas
   * @type {!Element}
   */
  this.canvas = canvas;

  /**
   * Element for fps output.
   * @type {Element}
   * @private
   */
  this.fpsbox_ = opt_fpsbox || null;

  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = gl;

  /**
   * Viewport width
   * @type {number}
   */
  this.viewportWidth = canvas.width;

  /**
   * Viewport height
   * @type {number}
   */
  this.viewportHeight = canvas.height;

  gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);

  /**
   * Field-of-view in Y direction in radians
   * @type {number}
   */
  this.fov = 0;

  /**
   * Current zNear distance
   * @type {number}
   * @private
   */
  this.zNear_ = 0;

  /**
   * Current zFar distance
   * @type {number}
   * @private
   */
  this.zFar_ = 1;

  /**
   * Aspect ratio of viewport.
   * @type {number}
   */
  this.aspectRatio = this.viewportWidth / this.viewportHeight;

  /**
   * 4x4 projection matrix
   * @type {!goog.math.Matrix}
   */
  this.projectionMatrix = goog.math.Matrix.createIdentityMatrix(4);

  /**
   * 4x4 model-view matrix
   * @type {!we.math.TransformationMatrix}
   */
  this.modelViewMatrix = new we.math.TransformationMatrix();

  /**
   * ModelView-Projection Matrix - cached result
   * @type {!goog.math.Matrix}
   */
  this.mvpm = this.projectionMatrix;

  /**
   * ModelView-Projection Matrix Inversion - cached result
   * @type {goog.math.Matrix}
   */
  this.mvpmInverse = this.projectionMatrix;

  if (we.CALC_FPS) {
    /**
     * Last calculated FPS
     * @type {number}
     */
    this.fps = 0;

    /**
     * Calculated average frame time
     * @type {number}
     */
    this.averageFrameTime = 0;

    /**
     * Time when FPS was last calculated
     * @type {number}
     * @private
     */
    this.lastFpsCalc_ = 0;

    /**
     * Number of frames since last FPS calculation
     * @type {number}
     * @private
     */
    this.framesSinceLastFpsCalc_ = 0;

    /**
     * Number of milisecond spend with "actual"
     * rendering since last FPS calculation.
     * @type {number}
     * @private
     */
    this.frameTimeSinceLastFpsCalc_ = 0;
  }

  goog.events.listen(goog.global,
      goog.events.EventType.RESIZE,
      this.resize, false, this);


  if (goog.DEBUG)
    we.gl.Context.logger.info('Created');
};


/**
 * Checks whether vertex texture fetch is supported.
 * @return {boolean} gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS > 0.
 */
we.gl.Context.prototype.isVTFSupported = function() {
  return this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) !== 0;
};


/**
 * Calculates projection matrix to represent desired perspective projection
 * @param {number} fovy Field-of-view in degrees.
 * @param {number} zNear Z-near plane.
 * @param {number} zFar Z-far plane.
 */
we.gl.Context.prototype.setPerspective = function(fovy, zNear, zFar) {
  this.fov = goog.math.toRadians(fovy);
  this.zNear_ = zNear;
  this.zFar_ = zFar;
  this.aspectRatio = this.viewportWidth / this.viewportHeight;

  this.setPerspectiveInternal_();
};


/**
 * Calculates projection matrix to represent desired perspective projection
 * @private
 */
we.gl.Context.prototype.setPerspectiveInternal_ = function() {
  /** @type {number} */
  var f = 1 / Math.tan(this.fov / 2);
  this.projectionMatrix = new goog.math.Matrix([
    [f / this.aspectRatio, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, 0, 0], // last two numbers are for the z-buffer
    [0, 0, -1, 0]
  ]);
  this.redimensionZBufferInternal_();
};


/**
 * Performs necessary changes in the projection matrix
 * to change Z-Buffer dimensions
 * @param {number} zNear Z-near plane.
 * @param {number} zFar Z-far plane.
 */
we.gl.Context.prototype.redimensionZBuffer = function(zNear, zFar) {
  this.zNear_ = zNear;
  this.zFar_ = zFar;
  this.redimensionZBufferInternal_();
};


/**
 * Performs necessary changes in the projection matrix
 * to change Z-Buffer dimensions
 * @private
 */
we.gl.Context.prototype.redimensionZBufferInternal_ = function() {
  var diff = this.zNear_ - this.zFar_;
  this.projectionMatrix.setValueAt(2, 2, (this.zFar_ + this.zNear_) / diff);
  this.projectionMatrix.setValueAt(2, 3, 2 * this.zFar_ * this.zNear_ / diff);
};


/**
 * Changes context's state to reflect canvas's size change.
 */
we.gl.Context.prototype.resize = function() {
  this.viewportWidth =
      this.canvas.width = this.canvas.clientWidth;
  this.viewportHeight =
      this.canvas.height = this.canvas.clientHeight;
  this.gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
  this.aspectRatio = this.viewportWidth / this.viewportHeight;
  this.setPerspectiveInternal_();
  this.scene.recalcTilesVertically();
};


/**
 * Scene to be rendered
 * @type {we.scene.Scene}
 */
we.gl.Context.prototype.scene = null;


/**
 * Flushes all operations (translation, rotation, scaling) into the
 * ModelView-Projection Matrix and calculates mvpmInverse as well.
 * @return {!goog.math.Matrix} MatrixViewProjection matrix.
 */
we.gl.Context.prototype.flushMVPM = function() {
  this.mvpm = this.projectionMatrix.multiply(
      this.modelViewMatrix.getStandardMatrix());
  this.mvpmInverse = this.mvpm.getInverse();

  return this.mvpm;
};


/**
 * Render one frame.
 */
we.gl.Context.prototype.renderFrame = function() {
  /** @type {!WebGLRenderingContext} */
  var gl = this.gl;

  if (we.CALC_FPS && !goog.isNull(this.fpsbox_)) {
    /** @type {number} */
    var time = goog.now();
    if (this.lastFpsCalc_ < goog.now() - 2000) {
      this.fps = 1000 *
          this.framesSinceLastFpsCalc_ / (goog.now() - this.lastFpsCalc_);
      this.averageFrameTime =
          this.frameTimeSinceLastFpsCalc_ / this.framesSinceLastFpsCalc_;
      this.lastFpsCalc_ = goog.now();
      this.framesSinceLastFpsCalc_ = 0;
      this.frameTimeSinceLastFpsCalc_ = 0;

      this.fpsbox_.innerHTML =
          this.averageFrameTime.toFixed(2) +
          ' ms / fps: ' +
          this.fps.toFixed(2);
    }

    this.framesSinceLastFpsCalc_++;
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  this.modelViewMatrix.loadIdentity();

  if (goog.DEBUG && goog.isNull(this.scene)) {
    we.gl.Context.logger.shout('Scene is not set');
  }

  this.scene.draw();

  if (we.CALC_FPS && !goog.isNull(this.fpsbox_)) {
    this.frameTimeSinceLastFpsCalc_ += goog.now() - time;
  }

};


/**
 * Function to call when CORS does not seem to be supported in the browser.
 * May get called multiple times!
 * @type {!Function}
 */
we.gl.Context.prototype.onCorsError = goog.nullFunction;


/**
 * @type {string} URL of CORS-enabled proxy for loading images
 */
we.gl.Context.prototype.proxyHost = '';

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.gl.Context.logger = goog.debug.Logger.getLogger('we.gl.Context');
}
