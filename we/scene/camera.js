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
goog.provide('we.scene.CameraEvent');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.math');
goog.require('goog.math.Vec2');

goog.require('we.utils');



/**
 * Camera object
 * @param {!we.scene.Scene} scene Scene.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
we.scene.Camera = function(scene) {

  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * Latitude in radians
   * @type {number}
   * @private
   */
  this.latitude_ = 0;

  /**
   * Longitude in radians
   * @type {number}
   * @private
   */
  this.longitude_ = 0;

  /**
   * Altitude of this camera in meters
   * @type {number}
   * @private
   */
  this.altitude_ = 10000000;

  /**
   * Camera heading in radians
   * @type {number}
   * @private
   */
  this.heading_ = 0;

  /**
   * Camera tilt in radians, [0,2*PI)
   * 0 - camera is pointed straight down
   * PI/2 - viewing along the horizon
   * PI - straight up at the sky
   * @type {number}
   * @private
   */
  this.tilt_ = 0;

  /**
   * Camera roll in radians, [-PI,+PI]
   * @type {number}
   * @private
   */
  this.roll_ = 0;
};
goog.inherits(we.scene.Camera, goog.events.EventTarget);


/**
 * Immediately sets position of this camera to given location.
 * @param {number} latitude Latitude in degrees.
 * @param {number} longitude Longitude in degrees.
 */
we.scene.Camera.prototype.setPositionDegrees = function(latitude, longitude) {
  this.setPosition(goog.math.toRadians(latitude),
                   goog.math.toRadians(longitude));
};


/**
 * Immediately sets position of this camera to given location.
 * @param {number} latitude Latitude in radians.
 * @param {number} longitude Longitude in radians.
 */
we.scene.Camera.prototype.setPosition = function(latitude, longitude) {
  // we can't allow latitude to be PI/2 (1.570796..)
  //    - some calculation would return Infinity/NaN
  this.latitude_ = goog.math.clamp(latitude, -1.57, 1.57);
  this.longitude_ = we.utils.standardLongitudeRadians(longitude);

  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.POSITIONCHANGED));
};


/**
 * Move the camera relatively to it's settings
 * @param {number} vertical Vertical change in radians.
 * @param {number} horizontal Horizontal change in radians.
 */
we.scene.Camera.prototype.moveRelative = function(vertical, horizontal) {
  var rotateAxes = function(angle) {
    var x = horizontal;
    horizontal = x * Math.cos(angle) - 2 * vertical * Math.sin(angle);
    vertical = x * Math.sin(angle) / 2 + vertical * Math.cos(angle);
  }

  rotateAxes(this.roll_);
  vertical /= Math.max(Math.abs(Math.cos(this.tilt_)), 0.1);
  rotateAxes(this.heading_);

  this.setPosition(this.latitude_ + vertical, this.longitude_ + horizontal);
};


/**
 * Rotates the camera around fixed point
 * @param {number} latitude Latitude of fixed point in radians.
 * @param {number} longitude Longitude of fixed point in radians.
 * @param {number} distance Distance of camera from the rotation point.
 * @param {number} horizontalAngle Angle in radians.
 * @param {number} verticalAngle Angle in radians.
 */
we.scene.Camera.prototype.rotateAround = function(latitude, longitude, distance,
                                                  horizontalAngle,
                                                  verticalAngle) {

  this.heading_ += horizontalAngle;

  //distance from the center of the Earth
  var distanceFromCOE = Math.sqrt(distance * distance +
      we.scene.EARTH_RADIUS * we.scene.EARTH_RADIUS);

  //maximum tilt that can be used so that the rotation target is still visible
  var maxTilt = Math.asin(we.scene.EARTH_RADIUS / distanceFromCOE);

  this.tilt_ = goog.math.clamp(this.tilt_ + verticalAngle,
                               -maxTilt, maxTilt);

  //angle between camera position and the target from the center of the Earth
  var beta = Math.asin((distance / we.scene.EARTH_RADIUS) *
                       Math.sin(this.tilt_));

  if (Math.abs(this.tilt_) < 0.0001) {
    this.setAltitude(distance);
  } else {
    //angle between the center of the Earth and camera position from the target
    var gamma = Math.PI - this.tilt_ - beta;

    this.setAltitude((Math.sin(gamma) / Math.sin(this.tilt_) - 1) *
                     we.scene.EARTH_RADIUS);
  }

  //move away from the target
  var nlat = latitude - Math.cos(this.heading_) * beta;
  this.setPosition(nlat,
                   longitude + Math.sin(this.heading_) * beta / Math.cos(nlat));

};


/**
 * Returns Array [latitude, longitude] converted to degrees.
 * @return {Array.<number>} Array [lat, long].
 */
we.scene.Camera.prototype.getPositionDegrees = function() {
  return [goog.math.toDegrees(this.latitude_),
          goog.math.toDegrees(this.longitude_)];
};


/**
 * Returns Array [latitude, longitude] in radians.
 * @return {Array.<number>} Array [lat, long].
 */
we.scene.Camera.prototype.getPosition = function() {
  return [this.latitude_, this.longitude_];
};


/**
 * @return {number} Latitude.
 */
we.scene.Camera.prototype.getLatitude = function() {
  return this.latitude_;
};


/**
 * @return {number} Longitude.
 */
we.scene.Camera.prototype.getLongitude = function() {
  return this.longitude_;
};


/**
 * Validates given altitude
 * @param {number} altitude Altitude in meters.
 * @return {number} Closest allowed altitude.
 */
we.scene.Camera.prototype.validateAltitude = function(altitude) {
  return goog.math.clamp(altitude, 250, 10000000);
};


/**
 * Sets this camera to fixed altitude
 * @param {number} altitude Altitude in meters.
 */
we.scene.Camera.prototype.setAltitude = function(altitude) {
  this.altitude_ = this.validateAltitude(altitude);

  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.ALTITUDECHANGED));
};


/**
 * @return {number} Altitude in meters.
 */
we.scene.Camera.prototype.getAltitude = function() {
  return this.altitude_;
};


/**
 * Returns latlon of the place the camera is currently looking at
 * @return {?Array.<number>} Array [lat, lon] in radians or null.
 */
we.scene.Camera.prototype.getTarget = function() {
  //This can be optimized a lot
  return this.scene_.getLatLongForXY(this.scene_.context.viewportWidth / 2,
                                     this.scene_.context.viewportHeight / 2,
                                     true);
};


/**
 * @param {number} heading ...
 */
we.scene.Camera.prototype.setHeading = function(heading) {
  this.heading_ = heading;
};


/**
 * @param {number} tilt ...
 */
we.scene.Camera.prototype.setTilt = function(tilt) {
  this.tilt_ = tilt;
};


/**
 * @param {number} roll ...
 */
we.scene.Camera.prototype.setRoll = function(roll) {
  this.roll_ = roll;
};


/**
 * @return {number} Heading.
 */
we.scene.Camera.prototype.getHeading = function() {
  return this.heading_;
};


/**
 * @return {number} Tilt.
 */
we.scene.Camera.prototype.getTilt = function() {
  return this.tilt_;
};


/**
 * @return {number} Roll.
 */
we.scene.Camera.prototype.getRoll = function() {
  return this.roll_;
};


/**
 * Events fired by the camera.
 * @enum {string}
 */
we.scene.Camera.EventType = {
  POSITIONCHANGED: 'poschanged',
  ALTITUDECHANGED: 'altchanged'
};



/**
 * Class for an scene event object.
 * @param {string} type Event type.
 * @constructor
 * @extends {goog.events.Event}
 */
we.scene.CameraEvent = function(type) {
  goog.events.Event.call(this, type);
};
goog.inherits(we.scene.CameraEvent, goog.events.Event);
