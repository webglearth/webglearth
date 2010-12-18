
/**
 * @fileoverview Base object for render shapes -
 *               possible visualisation style (sphere, plane, etc.)
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.rendershapes.RenderShape');

goog.require('we.gl.Context');
goog.require('we.gl.Shader');
goog.require('we.scene.LocatedProgram');
goog.require('we.utils');


/**
 * @param {!we.gl.Context} context Context.
 * @constructor
 */
we.scene.rendershapes.RenderShape = function(context) {
  /**
   * @type {!we.gl.Context}
   */
  this.context = context;
  
  /**
   * @type {we.scene.LocatedProgram}
   */
  this.locatedProgram = null;
};


/**
 * @param {number} width Width of the tilebuffer in tiles.
 * @param {number} height Height of the tilebuffer in tiles.
 * @param {number} lookupLevels Maximum number of zoom levels 
 *                              the shader should fall back.
 */
we.scene.rendershapes.RenderShape.prototype.compileProgram =
    function(width, height, lookupLevels) {
      var fragmentShaderCode = we.utils.getFile('fs.glsl');

      fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
          width.toFixed(1));
      fragmentShaderCode = fragmentShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
          height.toFixed(1));

      var vertexShaderCode = we.utils.getFile('vs.glsl');

      vertexShaderCode = vertexShaderCode.replace('%VERTEX_TRANSFORM%',
          this.vertexTransform_);
      
      vertexShaderCode = vertexShaderCode.replace('%BUFFER_WIDTH_FLOAT%',
          width.toFixed(1));
      vertexShaderCode = vertexShaderCode.replace('%BUFFER_HEIGHT_FLOAT%',
          height.toFixed(1));
      vertexShaderCode = vertexShaderCode.replace('%BUFFER_SIZE_INT%',
          (width * height).toFixed(0));
      vertexShaderCode = vertexShaderCode.replace('%BINARY_SEARCH_CYCLES_INT%',
          (Math.log(width * height) / Math.LN2).toFixed(0));
      vertexShaderCode = vertexShaderCode.replace('%LOOKUP_LEVELS_INT%',
          (lookupLevels + 1).toFixed(0));

      var fsshader = we.gl.Shader.create(this.context, fragmentShaderCode,
          this.context.gl.FRAGMENT_SHADER);
      var vsshader = we.gl.Shader.create(this.context, vertexShaderCode,
          this.context.gl.VERTEX_SHADER);

      var shaderProgram = this.context.gl.createProgram();
      this.context.gl.attachShader(shaderProgram, vsshader);
      this.context.gl.attachShader(shaderProgram, fsshader);
      this.context.gl.linkProgram(shaderProgram);

      if (!this.context.gl.getProgramParameter(shaderProgram,
                                               this.context.gl.LINK_STATUS)) {
        throw Error('Could not initialise shaders');
      }
      
      this.locatedProgram = new we.scene.LocatedProgram(shaderProgram,
                                                        this.context);
    };


/**
 * RenderShape-specific vertex position transformation to be placed into shader.
 * @type {string}
 * @protected
 * @const
 */
we.scene.rendershapes.RenderShape.prototype.vertexTransform_ = '';

    
/**
 * Calculates proper distance according to current perspective settings so,
 * that requested number of tiles can fit vertically on the canvas.
 * @param {number} latitude Latitude.
 * @param {number} longitude Longitude.
 * @param {number} zoom Zoom.
 * @param {number} tilesToBeSeen Requested amount of tiles to be seen.
 * @return {number} Calculated distance.
 */
we.scene.rendershapes.RenderShape.prototype.calcDistance = goog.abstractMethod;

    
/**
 * Applies needed translations and rotations to given context.
 * @param {number} latitude Latitude.
 * @param {number} longitude Longitude.
 * @param {number} distance Distance.
 * @param {number} tileCount Tile count in each dimension.
 */
we.scene.rendershapes.RenderShape.prototype.transformContext =
    goog.abstractMethod;