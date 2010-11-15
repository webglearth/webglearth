/**
 * @fileoverview Contains functions for WebGL initialization.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Context');

goog.require('WebGLDebugUtils');

goog.require('goog.array');
goog.require('goog.debug.Logger');
goog.require('goog.dom');

goog.require('goog.i18n.NumberFormat');

goog.require('goog.math.Matrix');
goog.require('goog.math.Vec3');
goog.require('we.debug');

/**
 * @define {boolean} Defines whether FPS should be calculated and displayed.
 */
we.CALC_FPS = true;

/**
 * Object wrapping a WebGL context.
 * @param {!Element} canvas Canvas element.
 * @constructor
 */
we.gl.Context = function(canvas) {

  var tryGetContext = function(canvas, type) {
    try {
      var context = canvas.getContext(type);
      if (goog.DEBUG && context) {
        we.gl.Context.logger.info('got WebGL context of type ' + type);
      }
      return context;
    } catch (e) {
      we.gl.Context.logger.shout(e);
      return null;
    }
  };
  var gl = null;
  gl = gl || tryGetContext(canvas, 'experimental-webgl');

  if (gl == null || !gl) {
    throw Error('unable to get a valid WebGL context');
  }

  if (goog.DEBUG) {
    function logGLError(err, funcName, args) {
      we.gl.Context.logger.severe(
          WebGLDebugUtils.glEnumToString(err) +
          ' was caused by call to \"' + funcName + '\"');
    };

    gl = WebGLDebugUtils.makeDebugContext(gl, logGLError);
  }

  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.clearColor(0.0, 0.0, 0.0, 0.1);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  //gl.enable(gl.BLEND);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
   * 4x4 projection matrix
   * @type {!goog.math.Matrix}
   */
  this.projectionMatrix = goog.math.Matrix.createIdentityMatrix(4);

  /**
   * 4x4 model-view matrix
   * @type {!goog.math.Matrix}
   */
  this.modelViewMatrix = goog.math.Matrix.createIdentityMatrix(4);

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

    /**
     * Instance of formatter used to format frame time / fps
     * - it seems stupid recreating it every 2 seconds.
     * @type {!goog.i18n.NumberFormat}
     * @private
     */
    this.decimalFormatter_ = new goog.i18n.NumberFormat(
        goog.i18n.NumberFormat.Format.DECIMAL
        );
  }

  if (goog.DEBUG)
    we.gl.Context.logger.info('Created');
};

/**
 * Calculates projection matrix to represent desired perspective projection
 * @param {number} fovy Field-of-view in degrees.
 * @param {number} zNear Z-near plane.
 * @param {number} zFar Z-far plane.
 */
we.gl.Context.prototype.setPerspective = function(fovy, zNear, zFar) {
  var fovy_ = (Math.PI * fovy) / 180;
  var aspect = this.viewportWidth / this.viewportHeight;

  var f = 1 / Math.tan(fovy_ / 2);
  this.projectionMatrix = new goog.math.Matrix([
    [f / aspect, 0, 0, 0],
    [0, f, 0, 0],
    [0, 0, (zFar + zNear) / (zNear - zFar), 2 * zFar * zNear / (zNear - zFar)],
    [0, 0, -1, 0]
  ]);
};

/**
 * Loads 4x4 identity matrix as current model-view matrix
 */
we.gl.Context.prototype.loadIdentity = function() {
  this.modelViewMatrix = goog.math.Matrix.createIdentityMatrix(4);
};

/**
 * Multiplies current model-view matrix to represent translation by (x,y,z)
 * @param {number} x X translation.
 * @param {number} y Y translation.
 * @param {number} z Z translation.
 */
we.gl.Context.prototype.translate = function(x, y, z) {
  this.modelViewMatrix = this.modelViewMatrix.multiply(new goog.math.Matrix([
    [1, 0, 0, x],
    [0, 1, 0, y],
    [0, 0, 1, z],
    [0, 0, 0, 1]
  ]));
};

/**
 * Computes a matrix that performs a counterclockwise rotation of angle degrees
 * about the vector from the origin through the point (x, y, z).
 * @param {number} angle Angle to rotate.
 * @param {number} x X translation.
 * @param {number} y Y translation.
 * @param {number} z Z translation.
 */
we.gl.Context.prototype.rotate = function(angle, x, y, z) {
  var vec = (new goog.math.Vec3(x, y, z)).toArray();
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  this.modelViewMatrix = this.modelViewMatrix.multiply(new goog.math.Matrix([
    [x * x * (1 - c) + c, x * y * (1 - c) - z * s, x * z * (1 - c) + y * s, 0],
    [y * x * (1 - c) + z * s, y * y * (1 - c) + c, y * z * (1 - c) - x * s, 0],
    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, z * z * (1 - c) + c, 0],
    [0, 0, 0, 1]
  ]));
};

/**
 * Scene to be rendered
 * @type {we.scene.Scene}
 */
we.gl.Context.prototype.scene = null;

/**
 * Returns MatrixView-Projection matrix ready to pass to vertex shader
 * @return {!Float32Array} MatrixViewProjection matrix.
 */
we.gl.Context.prototype.getMVPM = function() {
  return new Float32Array(goog.array.flatten(this.projectionMatrix.multiply(
      this.modelViewMatrix
      ).getTranspose().toArray()));
};

/**
 * Render one frame.
 */
we.gl.Context.prototype.renderFrame = function() {
  var gl = this.gl;

  var time;

  if (we.CALC_FPS) {
    time = goog.now();
    if (this.lastFpsCalc_ < goog.now() - 2000) {
      this.fps = 1000 *
          this.framesSinceLastFpsCalc_ / (goog.now() - this.lastFpsCalc_);
      this.averageFrameTime =
          this.frameTimeSinceLastFpsCalc_ / this.framesSinceLastFpsCalc_;
      this.lastFpsCalc_ = goog.now();
      this.framesSinceLastFpsCalc_ = 0;
      this.frameTimeSinceLastFpsCalc_ = 0;

      goog.dom.getElement('fpsbox').innerHTML =
          this.decimalFormatter_.format(this.averageFrameTime) +
          ' ms / fps: ' +
          this.decimalFormatter_.format(this.fps);
    }

    this.framesSinceLastFpsCalc_++;
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  this.loadIdentity();

  if (goog.DEBUG && goog.isNull(this.scene)) {
    we.gl.Context.logger.shout('Scene is not set');
  }

  this.scene.draw();

  if (we.CALC_FPS) {
    this.frameTimeSinceLastFpsCalc_ += goog.now() - time;
  }

  //gl.clearColor(Math.random(), Math.random() * 0.5, Math.random() * 0.5, 1);
};
if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.gl.Context.logger = goog.debug.Logger.getLogger('we.gl.Context');
}
