
/**
 * @fileoverview Namespace for providing shader content.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.shaderbank');

goog.require('we.shaderbank.codes');
goog.require('we.utils');


/**
 * @define {string} Path to shaders scripts. Useful if the shaders are
 * in different location than _webpage_ running this javascript file(s).
 */
we.shaderbank.PATH_TO_SHADERS = './we/shaders/';


/**
 * Returns source code of the shader.
 * @param {string} name Name of shader.
 * @return {string} Shader code.
 */
we.shaderbank.getShaderCode = function(name) {
  if (COMPILED && name in we.shaderbank.codes) {
    return we.shaderbank.codes[name];
  } else {
    return we.utils.getFile(we.shaderbank.PATH_TO_SHADERS + name);
  }
};
