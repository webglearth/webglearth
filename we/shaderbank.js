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
 * @fileoverview Namespace for providing shader content.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.shaderbank');

goog.require('we.shaderbank.codes');
goog.require('we.utils');


/**
 * @define {boolean} Whether to use the compiled shaders from the shaderbank.
 */
we.shaderbank.USE_COMPILED_SHADERS = COMPILED;


/**
 * @define {string} Path to shaders scripts. Useful if the shaders are
 * in different location than _webpage_ running this javascript file(s).
 */
we.shaderbank.PATH_TO_SHADERS = '../we/shaders/';


/**
 * Returns source code of the shader.
 * @param {string} name Name of shader.
 * @return {string} Shader code.
 */
we.shaderbank.getShaderCode = function(name) {
  if (we.shaderbank.USE_COMPILED_SHADERS && name in we.shaderbank.codes) {
    return we.shaderbank.codes[name];
  } else {
    return we.utils.getFile(we.shaderbank.PATH_TO_SHADERS + name);
  }
};
