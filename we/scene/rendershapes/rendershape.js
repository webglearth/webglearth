
/**
 * @fileoverview Base object for render shapes -
 *               possible visualisation style (sphere, plane, etc.).
 *
 * @author Petr Sloup <petr.sloup@klokantech.com>
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
