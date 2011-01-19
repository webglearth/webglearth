
/**
 * @fileoverview Contains interface describing 3d object.
 *
 * @author Petr Sloup <petr.sloup@klokantech.com>
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
