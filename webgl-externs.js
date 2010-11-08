/**
 * @fileoverview Definitions for WebGL.
 *  https://cvs.khronos.org/svn/repos/registry/trunk/public/webgl/doc/spec/WebGL-spec.html
 *
 * @externs
 */

/**
 * @constructor
 * @param {!Array.<*>} source Source array
 */
function Float32Array(source) {}

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
 */
WebGLRenderingContext.CULL_FACE = 0x0B44;

/**
 * @type {number}
 */
WebGLRenderingContext.BLEND = 0x0BE2;

/**
 * @type {number}
 */
WebGLRenderingContext.BACK = 0x0405;

/**
 * @type {number}
 */
WebGLRenderingContext.DEPTH_TEST = 0x0B71;

/**
 * @type {number}
 */
WebGLRenderingContext.LEQUAL = 0x0203;

/**
 * @type {number}
 */
WebGLRenderingContext.SRC_ALPHA = 0x0302;

/**
 * @type {number}
 */
WebGLRenderingContext.SRC_ONE_MINUS_ALPHA = 0x0302;

/**
 * @type {number}
 */
WebGLRenderingContext.COLOR_BUFFER_BIT = 0x00004000;

/**
 * @type {number}
 */
WebGLRenderingContext.DEPTH_BUFFER_BIT = 0x00000100;

/**
 * @type {number}
 */
WebGLRenderingContext.TEXTURE_2D = 0x0DE1;

/**
 * @type {number}
 */
WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL = 0x9240;

/**
 * @type {number}
 */
WebGLRenderingContext.RGBA = 0x1908;

/**
 * @type {number}
 */
WebGLRenderingContext.TEXTURE_MAG_FILTER = 0x2800;

/**
 * @type {number}
 */
WebGLRenderingContext.TEXTURE_MIN_FILTER = 0x2801;

/**
 * @type {number}
 */
WebGLRenderingContext.LINEAR = 0x2601;

/**
 * @type {number}
 */
WebGLRenderingContext.LINK_STATUS = 0x8B82;

/**
 * @type {number}
 */
WebGLRenderingContext.TEXTURE0 = 0x84C0;

/**
 * @type {number}
 */
WebGLRenderingContext.ARRAY_BUFFER = 0x8892;

/**
 * @type {number}
 */
WebGLRenderingContext.TRIANGLE_STRIP = 0x0005;

/**
 * @type {number}
 */
WebGLRenderingContext.COMPILE_STATUS = 0x8B81;

/**
 * @type {number}
 */
WebGLRenderingContext.FRAGMENT_SHADER = 0x8B30;

/**
 * @type {number}
 */
WebGLRenderingContext.VERTEX_SHADER = 0x8B31;

/**
 * @type {number}
 */
WebGLRenderingContext.STATIC_DRAW = 0x88E4;

/**
 * @type {number}
 */
WebGLRenderingContext.FLOAT = 0x1406;

/**
 * @type {number}
 */
WebGLRenderingContext.UNSIGNED_BYTE = 0x1401;

/**
 * @param {number} what
 */
WebGLRenderingContext.enable = function(what) {};

/**
 * @param {number} what
 */
WebGLRenderingContext.cullFace = function(what) {};

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
WebGLRenderingContext.clearColor = function(r, g, b, a) {};

/**
 * @param {number} z
 */
WebGLRenderingContext.clearDepth = function(z) {};

/**
 * @param {number} what
 */
WebGLRenderingContext.depthFunc = function(what) {};

/**
 * @param {number} what
 * @param {number} what2
 */
WebGLRenderingContext.blendFunc = function(what, what2) {};

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
WebGLRenderingContext.viewport = function(x1, y1, x2, y2) {};

/**
 * @param {number} what
 */
WebGLRenderingContext.clear = function(what) {};

/**
 * @return {WebGLShader}
 */
WebGLRenderingContext.createShader = function() {};

/**
 * @return {WebGLProgram}
 */
WebGLRenderingContext.createProgram = function() {};

/**
 * @param {WebGLProgram} program
 * @param {WebGLShader} shader
 */
WebGLRenderingContext.attachShader = function(program, shader) {};

/**
 * @param {WebGLProgram} program
 */
WebGLRenderingContext.linkProgram = function(program) {};

/**
 * @param {WebGLProgram} program
 * @param {number} what
 * @return {*}
 */
WebGLRenderingContext.getProgramParameter = function(program, what) {};

/**
 * @param {WebGLProgram} program
 */
WebGLRenderingContext.useProgram = function(program) {};

/**
 * @param {WebGLProgram} program
 * @param {string} what
 * @return {number}
 */
WebGLRenderingContext.getAttribLocation = function(program, what) {};

/**
 * @param {number} what
 */
WebGLRenderingContext.enableVertexAttribArray = function(what) {};

/**
 * @param {WebGLProgram} program
 * @param {string} what
 * @return {WebGLUniformLocation}
 */
WebGLRenderingContext.getUniformLocation = function(program, what) {};

/**
 * @param {number} what
 */
WebGLRenderingContext.activeTexture = function(what) {};

/**
 * @param {WebGLUniformLocation} what
 * @param {number} what2
 */
WebGLRenderingContext.uniform1i = function(what, what2) {};

/**
 * @param {number} what
 * @param {WebGLBuffer} buff
 */
WebGLRenderingContext.bindBuffer = function(what, buff) {};

/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 * @param {boolean} what4
 * @param {number} what5
 * @param {number} what6
 */
WebGLRenderingContext.vertexAttribPointer = function(what, what2, what3,
                                                     what4, what5, what6) {};

/**
 * @param {WebGLUniformLocation} what
 * @param {boolean} what2
 * @param {Float32Array} what3
 */
WebGLRenderingContext.uniformMatrix4fv = function(what, what2, what3) {};

/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 */
WebGLRenderingContext.drawArrays = function(what, what2, what3) {};

/**
 * @param {WebGLShader} shader
 * @param {string} what
 */
WebGLRenderingContext.shaderSource = function(shader, what) {};

/**
 * @param {WebGLShader} shader
 */
WebGLRenderingContext.compileShader = function(shader) {};

/**
 * @param {WebGLShader} shader
 * @param {number} what
 * @return {*}
 */
WebGLRenderingContext.getShaderParameter = function(shader, what) {};

/**
 * @return {WebGLBuffer}
 */
WebGLRenderingContext.createBuffer = function() {};

/**
 * @param {number} what
 * @param {Float32Array} what2
 * @param {number} what3
 */
WebGLRenderingContext.bufferData = function(what, what2, what3) {};

/**
 * @return {WebGLTexture}
 */
WebGLRenderingContext.createTexture = function() {};

/**
 * @param {number} what
 * @param {WebGLTexture} tex
 */
WebGLRenderingContext.bindTexture = function(what, tex) {};

/**
 * @param {number} what
 * @param {boolean} what2
 */
WebGLRenderingContext.pixelStorei = function(what, what2) {};

/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 * @param {number} what4
 * @param {number} what5
 * @param {Image} what6
 */
WebGLRenderingContext.texImage2D = function(what, what2, what3,
                                            what4, what5, what6) {};

/**
 * @param {number} what
 * @param {number} what2
 * @param {number} what3
 */
WebGLRenderingContext.texParameteri = function(what, what2, what3) {};

/**
 * @return {number}
 */
WebGLRenderingContext.getError = function() {};
