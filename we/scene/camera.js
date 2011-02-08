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
 * @fileoverview WebGL Earth camera object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Camera');

goog.require('goog.math');



/**
 * Camera object
 * @constructor
 */
we.scene.Camera = function() {
  /**
   * @type {number}
   * Distance from the surface, this has no units yet
   * (the distance is different for each RenderShape),
   * but it will probably be in meters.
   */
  this.distance = 0;

  /**
   * @type {number}
   */
  this.latitude = 0;

  /**
   * @type {number}
   */
  this.longitude = 0;

  /**
   * Camera heading in radians
   * @type {number}
   */
  this.heading = 0;

  /**
   * Camera tilt in radians, [0,2*PI)
   * 0 - camera is pointed straight down
   * PI/2 - viewing along the horizon
   * PI - straight up at the sky
   * @type {number}
   */
  this.tilt = 0;

  /**
   * Camera roll in radians, [-PI,+PI]
   * @type {number}
   */
  this.roll = 0;
};


/**
 * Immediately sets position of this camera to given location.
 * @param {number} latitude Latitude in degrees.
 * @param {number} longitude Longitude in degrees.
 */
we.scene.Camera.prototype.setPosition = function(latitude, longitude) {
  this.latitude = goog.math.toRadians(goog.math.clamp(latitude, -89, 89));
  this.longitude = goog.math.toRadians(longitude);
};


/**
 * Returns Array [latitude, longitude] converted to degrees.
 * @return {Array.<number>} Array [lat, long].
 */
we.scene.Camera.prototype.getPosition = function() {
  return [goog.math.toDegrees(this.latitude),
          goog.math.toDegrees(this.longitude)];
};
