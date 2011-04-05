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
 * @fileoverview Contains utility functions for WebGL.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.gl.utils');

goog.require('goog.math.Matrix');
goog.require('goog.math.Vec3');


/**
 *
 * @param {number} x Screen-space coordinate X.
 * @param {number} y Screen-space coordinate Y.
 * @param {number} z Screen-space coordinate Z (depth).
 * @param {goog.math.Matrix} invertedMVP Inverted ModelView-Projections matrix.
 * @param {number} viewportWidth Width of viewport in pixels.
 * @param {number} viewportHeight Height of viewport in pixels.
 * @return {?goog.math.Vec3} Point location in model-space.
 */
we.gl.utils.unprojectPoint = function(x, y, z, invertedMVP,
                                      viewportWidth, viewportHeight) {
  if (goog.isNull(invertedMVP))
    return null;

  /**
   * @type {goog.math.Matrix}
   */
  var result = invertedMVP.multiply(new goog.math.Matrix([
    [x / viewportWidth * 2 - 1],
    [1 - 2 * y / viewportHeight], //Y axis has to be flipped
    [z * 2 - 1], [1]]));

  if (result.getValueAt(3, 0) == 0)
    return null;

  result = result.multiply(1 / result.getValueAt(3, 0));

  return new goog.math.Vec3(/** @type {number} */ (result.getValueAt(0, 0)),
                            /** @type {number} */ (result.getValueAt(1, 0)),
                            /** @type {number} */ (result.getValueAt(2, 0)));
};
