
/**
 * @fileoverview Contains interface describing 3d object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
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
 * @type {WebGLBuffer}
 */
we.gl.Mesh.vertexBuffer;


/**
 * Buffer containing texture coordinates
 * @type {WebGLBuffer}
 */
we.gl.Mesh.texCoordBuffer;
