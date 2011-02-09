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
 * @param {we.scene.Scene=} opt_scene Scene.
 * @constructor
 */
we.scene.Camera = function(opt_scene) {

  /**
   * @type {we.scene.Scene}
   * @private
   */
  this.scene_ = opt_scene || null;

  /**
   * Latitude in radians
   * @type {number}
   */
  this.latitude = 0;

  /**
   * Longitude in radians
   * @type {number}
   */
  this.longitude = 0;

  /**
   * @type {number}
   * Altitude of this camera in meters
   */
  this.altitude = 1000;

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

  /**
   * Describes how this camera behaves, because either altitude or zoomLevel
   * has to change when moving north or south.
   * @type {boolean}
   */
  this.fixedAltitude = true;

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


/**
 * Sets this camera to fixed altitude
 * @param {number} altitude Altitude in meters.
 */
we.scene.Camera.prototype.setAltitude = function(altitude) {
  this.altitude = goog.math.clamp(altitude, 250, 10000000);
  this.fixedAltitude = true;
};


/**
 * @return {number} Altitude in meters.
 */
we.scene.Camera.prototype.getAltitude = function() {
  return this.altitude;
};


/**
 * Returns latlon of the place the camera is currently looking at
 * @param {!we.scene.Scene} scene Scene.
 * @return {?Array.<number>} Array [lat, lon] in radians or null.
 */
we.scene.Camera.prototype.getTarget = function(scene) {
  //This can be optimized a lot
  return scene.getLatLongForXY(scene.context.viewportWidth / 2,
                               scene.context.viewportHeight / 2, true);
};
