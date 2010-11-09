/**
 * @fileoverview Contains functions for creating shaders.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.gl.Shader');

goog.require('goog.debug.Logger');

goog.require('goog.dom');
goog.require('we.gl.Context');

/**
 * Function compiling a shader
 * @param {!we.gl.Context} context WebGL context.
 * @param {string} shaderCode GLSL source code.
 * @param {number} shaderType gl.FRAGMENT_SHADER or gl.VERTEX_SHADER.
 * @return {!WebGLShader} Compiled WebGL shader.
 */
we.gl.Shader.create = function(context, shaderCode, shaderType) {
  var shader = context.gl.createShader(shaderType);

  if (goog.DEBUG)
    we.gl.Shader.logger.info('Compiling...');

  context.gl.shaderSource(shader, shaderCode);
  context.gl.compileShader(shader);

  if (!context.gl.getShaderParameter(shader, context.gl.COMPILE_STATUS)) {
    throw Error('Shader err: ' + context.gl.getShaderInfoLog(shader));
  } else if (goog.DEBUG) {
    we.gl.Shader.logger.info('Done');
  }

  return shader;
};

/**
 * Creates shader from Element
 * @param {!we.gl.Context} context WebGL context.
 * @param {(!Element|string)} element DOM Element.
 * @return {!WebGLShader} Compiled WebGL shader.
 */
we.gl.Shader.createFromElement = function(context, element) {
  if (goog.DEBUG)
    we.gl.Shader.logger.info('Loading shader from \"' + element + '\"..');

  var shaderScript = goog.dom.getElement(element);
  if (!shaderScript) {
    throw Error('Err creating shader from element ' + element);
  }

  var str = '';
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var type;
  if (shaderScript.type == 'x-shader/x-fragment') {
    type = context.gl.FRAGMENT_SHADER;
  } else if (shaderScript.type == 'x-shader/x-vertex') {
    type = context.gl.VERTEX_SHADER;
  } else {
    throw Error('Unknown shader type');
  }

  return we.gl.Shader.create(context, str, type);
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.gl.Shader.logger = goog.debug.Logger.getLogger('we.gl.Shader');
}
