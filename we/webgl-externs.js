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
 * @fileoverview Definitions for WebGL.
 *  https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/WebGL-spec.html
 *
 * @externs
 */



/**
 * @constructor
 * @param {!Array.<*>|number} arg1 Source array or size of new array
 */
function Float32Array(arg1) {}



/**
 * @constructor
 */
function ArrayBufferView() {}



/**
 * @constructor
 */
function WebGLRenderingContext() {}



/**
 * @constructor
 */
function WebGLShader() {}



/**
 * @constructor
 */
function WebGLProgram() {}



/**
 * @constructor
 */
function WebGLUniformLocation() {}



/**
 * @constructor
 */
function WebGLTexture() {}



/**
 * @constructor
 */
function WebGLBuffer() {}


/**
 * @param {string} type Context type
 */
Element.getContext = function(type) {};


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.NO_ERROR = 0;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.CULL_FACE = 0x0B44;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.BLEND = 0x0BE2;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.BACK = 0x0405;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.DEPTH_TEST = 0x0B71;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.LEQUAL = 0x0203;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.SRC_ALPHA = 0x0302;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.SRC_ONE_MINUS_ALPHA = 0x0302;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.COLOR_BUFFER_BIT = 0x00004000;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.DEPTH_BUFFER_BIT = 0x00000100;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE_2D = 0x0DE1;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.UNPACK_FLIP_Y_WEBGL = 0x9240;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.RGBA = 0x1908;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE_MAG_FILTER = 0x2800;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE_MIN_FILTER = 0x2801;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE_WRAP_S = 0x2802;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE_WRAP_T = 0x2803;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.CLAMP_TO_EDGE = 0x812F;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.NEAREST = 0x2600;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.LINEAR = 0x2601;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.LINK_STATUS = 0x8B82;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TEXTURE0 = 0x84C0;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.ARRAY_BUFFER = 0x8892;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TRIANGLES = 0x0004;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.TRIANGLE_STRIP = 0x0005;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.COMPILE_STATUS = 0x8B81;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.FRAGMENT_SHADER = 0x8B30;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.VERTEX_SHADER = 0x8B31;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.STATIC_DRAW = 0x88E4;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.FLOAT = 0x1406;


/**
 * @type {number}
 * @const
 */
WebGLRenderingContext.prototype.UNSIGNED_BYTE = 0x1401;


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.enable = function(what) {};


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.cullFace = function(what) {};


/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
WebGLRenderingContext.prototype.clearColor = function(r, g, b, a) {};


/**
 * @param {number} z
 */
WebGLRenderingContext.prototype.clearDepth = function(z) {};


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.depthFunc = function(what) {};


/**
 * @param {number} what
 * @param {number} what2
 */
WebGLRenderingContext.prototype.blendFunc = function(what, what2) {};


/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
WebGLRenderingContext.prototype.viewport = function(x1, y1, x2, y2) {};


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.clear = function(what) {};


/**
 * @param {number} type
 * @return {!WebGLShader}
 */
WebGLRenderingContext.prototype.createShader = function(type) {};


/**
 * @return {!WebGLProgram}
 */
WebGLRenderingContext.prototype.createProgram = function() {};


/**
 * @param {!WebGLProgram} program
 * @param {!WebGLShader} shader
 */
WebGLRenderingContext.prototype.attachShader = function(program, shader) {};


/**
 * @param {!WebGLProgram} program
 */
WebGLRenderingContext.prototype.linkProgram = function(program) {};


/**
 * @param {!WebGLProgram} program
 * @param {number} what
 * @return {*}
 */
WebGLRenderingContext.prototype.getProgramParameter = function(program,
                                                               what) {};


/**
 * @param {WebGLProgram} program
 */
WebGLRenderingContext.prototype.useProgram = function(program) {};


/**
 * @param {!WebGLProgram} program
 * @param {string} what
 * @return {number}
 */
WebGLRenderingContext.prototype.getAttribLocation = function(program, what) {};


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.enableVertexAttribArray = function(what) {};


/**
 * @param {!WebGLProgram} program
 * @param {string} what
 * @return {WebGLUniformLocation}
 */
WebGLRenderingContext.prototype.getUniformLocation = function(program, what) {};


/**
 * @param {number} what
 */
WebGLRenderingContext.prototype.activeTexture = function(what) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {number} what2
 */
WebGLRenderingContext.prototype.uniform1i = function(what, what2) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {number} what2
 */
WebGLRenderingContext.prototype.uniform1f = function(what, what2) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {Float32Array|Array.<number>} what2
 */
WebGLRenderingContext.prototype.uniform2fv = function(what, what2) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {Float32Array} what2
 */
WebGLRenderingContext.prototype.uniform3fv = function(what, what2) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {Float32Array} what2
 */
WebGLRenderingContext.prototype.uniform4fv = function(what, what2) {};


/**
 * @param {number} what
 * @param {WebGLBuffer} buff
 */
WebGLRenderingContext.prototype.bindBuffer = function(what, buff) {};


/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 * @param {boolean} what4
 * @param {number} what5
 * @param {number} what6
 */
WebGLRenderingContext.prototype.vertexAttribPointer = function(what, what2,
                                                               what3, what4,
                                                               what5, what6) {};


/**
 * @param {!WebGLUniformLocation} what
 * @param {boolean} what2
 * @param {Float32Array} what3
 */
WebGLRenderingContext.prototype.uniformMatrix4fv = function(what, what2,
                                                            what3) {};


/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 */
WebGLRenderingContext.prototype.drawArrays = function(what, what2, what3) {};


/**
 * @param {!WebGLShader} shader
 * @param {string} what
 */
WebGLRenderingContext.prototype.shaderSource = function(shader, what) {};


/**
 * @param {!WebGLShader} shader
 */
WebGLRenderingContext.prototype.compileShader = function(shader) {};


/**
 * @param {!WebGLShader} shader
 * @param {number} what
 * @return {*}
 */
WebGLRenderingContext.prototype.getShaderParameter = function(shader, what) {};


/**
 * @param {!WebGLShader} shader
 * @return {string}
 */
WebGLRenderingContext.prototype.getShaderInfoLog = function(shader) {};


/**
 * @return {!WebGLBuffer}
 */
WebGLRenderingContext.prototype.createBuffer = function() {};


/**
 * @param {number} what
 * @param {Float32Array} what2
 * @param {number} what3
 */
WebGLRenderingContext.prototype.bufferData = function(what, what2, what3) {};


/**
 * @return {!WebGLTexture}
 */
WebGLRenderingContext.prototype.createTexture = function() {};


/**
 * @param {!WebGLTexture} what
 */
WebGLRenderingContext.prototype.deleteTexture = function(what) {};


/**
 * @param {number} what
 * @param {WebGLTexture} tex
 */
WebGLRenderingContext.prototype.bindTexture = function(what, tex) {};


/**
 * @param {number} what
 * @param {boolean} what2
 */
WebGLRenderingContext.prototype.pixelStorei = function(what, what2) {};


/**
 * @param {number} target
 * @param {number} level
 * @param {number} internalformat
 * @param {number} x width, format
 * @param {number} y height, type
 * @param {number|ImageData|Image|HTMLCanvasElement|HTMLVideoElement} z
 *                    border, pixels, image, canvas, video
 * @param {number=} format
 * @param {number=} type
 * @param {ArrayBufferView=} pixels
 */
WebGLRenderingContext.prototype.texImage2D =
    function(target, level, internalformat, x, y, z, format, type, pixels) {};


/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 * @param {number} what4
 * @param {number} what5
 * @param {number} what6
 * @param {Image} what7
 */
WebGLRenderingContext.prototype.texSubImage2D = function(what, what2, what3,
                                                         what4, what5, what6,
                                                         what7) {};


/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 */
WebGLRenderingContext.prototype.texParameteri = function(what, what2, what3) {};


/**
 * @return {number}
 */
WebGLRenderingContext.prototype.getError = function() {};
