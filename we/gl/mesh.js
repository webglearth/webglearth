/**
 * @fileoverview Contains interface describing 3d object.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Mesh');

/**
 * Object representing a 3D mesh
 * @interface
 */
we.gl.Mesh = function() {};

/**
 * Buffer containing vertices
 * @type {Object}
 */
we.gl.Mesh.vertexBuffer;

/**
 * Buffer containing texture coordinates
 * @type {Object}
 */
we.gl.Mesh.texCoordBuffer;
