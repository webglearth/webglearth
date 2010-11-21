
/**
 * @fileoverview Contains functions for creating segmented plane.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.SegmentedPlane');

goog.require('we.gl.Mesh');



/**
 * Object representing a segmented plane.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of plane in segments.
 * @param {number} height Height of plane in segments.
 * @param {number=} opt_subdiv Optional subdivision of each segment.
 * @constructor
 * @implements {we.gl.Mesh}
 */
we.scene.SegmentedPlane = function(context, width, height, opt_subdiv) {
  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = context.gl;

  opt_subdiv = opt_subdiv ? opt_subdiv : 1;
  width = width * opt_subdiv;
  height = height * opt_subdiv;

  /** @inheritDoc */
  this.vertexBuffer = this.gl.createBuffer();

  /** @inheritDoc */
  this.texCoordBuffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
  var numItems = width * height * 6 * 2;
  var vertices = new Float32Array(numItems * 2);
  var coords = new Float32Array(numItems * 2);

  for (var y = 0; y < height; ++y)
  {
    for (var x = 0; x < width; ++x)
    {
      var addVertex = function(i_, x_, y_) {
        var baseIndex = ((x * width + y) * 6 + i_);
        vertices[baseIndex * 2 + 0] = (x - width / 2 + x_) / opt_subdiv;
        vertices[baseIndex * 2 + 1] = (y - height / 2 + y_) / opt_subdiv;

        coords[baseIndex * 2 + 0] =
            (x % opt_subdiv) / opt_subdiv + x_ / opt_subdiv;
        coords[baseIndex * 2 + 1] =
            (y % opt_subdiv) / opt_subdiv + y_ / opt_subdiv;
      };
      addVertex(0, 1, 1);
      addVertex(1, 0, 1);
      addVertex(2, 1, 0);
      addVertex(3, 0, 1);
      addVertex(4, 0, 0);
      addVertex(5, 1, 0);
    }
  }
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      vertices,
      this.gl.STATIC_DRAW
  );
  this.vertexBuffer.itemSize = 2;
  this.vertexBuffer.numItems = numItems;

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      coords,
      this.gl.STATIC_DRAW
  );
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = numItems;
};
