/**
 * @fileoverview Contains functions for creating simple plane.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Plane');

goog.require('we.gl.Mesh');

/**
 * Object representing a plane.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} width Width of plane.
 * @param {number} height Height of plane.
 * @constructor
 * @implements {we.gl.Mesh}
 */
we.gl.Plane = function(context, width, height) {
  /**
   * WebGL context
   * @type {!WebGLRenderingContext}
   */
  this.gl = context.gl;

  /** @inheritDoc */
  this.vertexBuffer = this.gl.createBuffer();

  /** @inheritDoc */
  this.texCoordBuffer = this.gl.createBuffer();

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
  var vertices = [
    width, height, 0.0,
    0.0, height, 0.0,
    width, 0.0, 0.0,
    0.0, 0.0, 0.0
  ];
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertices),
      this.gl.STATIC_DRAW
  );
  this.vertexBuffer.itemSize = 3;
  this.vertexBuffer.numItems = 4;


  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
  var coords = [
    1.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    0.0, 0.0
  ];
  this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(coords),
      this.gl.STATIC_DRAW
  );
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = 4;

};
