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
 * @fileoverview Class containing functions for geo-related calculations.
 *               TODO: move more functions into this file.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.math.geo');

goog.require('goog.math');


/**
 * Calculates at what distance should given bounds be view to fit on screen.
 * @param {number} minlat ..
 * @param {number} maxlat ..
 * @param {number} minlon ..
 * @param {number} maxlon ..
 * @param {number} viewportAspectRatio Aspect ratio (w/h) of the viewport.
 * @param {number} fov Field-of-view in radians.
 * @return {number} Proposed distance.
 */
we.math.geo.calcDistanceToViewBounds = function(minlat, maxlat, minlon, maxlon,
                                                viewportAspectRatio, fov) {
  var centerLat = (minlat + maxlat) / 2;

  var distEW = we.scene.Earth.calculateDistance(centerLat, minlon,
                                                centerLat, maxlon);

  var distNS = we.scene.Earth.calculateDistance(minlat, 0,
                                                maxlat, 0);

  var aspectR = Math.min(Math.max(viewportAspectRatio, distEW / distNS), 1.0);

  // Create a LookAt using the experimentally derived distance formula.
  var alpha = goog.math.toRadians(goog.math.toDegrees(fov) /
                                  (aspectR + 0.4) - 2.0);
  var expandToDistance = Math.max(distNS, distEW);

  var beta = Math.min(Math.PI / 2,
                      alpha + expandToDistance / (2 * we.scene.EARTH_RADIUS));

  var lookAtRange = 1.5 * we.scene.EARTH_RADIUS *
      (Math.sin(beta) * Math.sqrt(1 + 1 / Math.pow(Math.tan(alpha), 2)) - 1);

  return lookAtRange;
};


/**
 * Calculates center of given bounds.
 * @param {number} minlat ..
 * @param {number} maxlat ..
 * @param {number} minlon ..
 * @param {number} maxlon ..
 * @return {Array.<number>} [lat, lon].
 */
we.math.geo.calcBoundsCenter = function(minlat, maxlat, minlon, maxlon) {
  minlon = goog.math.modulo(minlon, 2 * Math.PI);
  maxlon = goog.math.modulo(maxlon, 2 * Math.PI);

  var lonDiff = minlon - maxlon;
  if (lonDiff < -Math.PI) {
    minlon += 2 * Math.PI;
  } else if (lonDiff > Math.PI) {
    maxlon += 2 * Math.PI;
  }

  return [(minlat + maxlat) / 2, (minlon + maxlon) / 2];
};
