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
   * @type {?number}
   * Altitude of this camera in meters
   * @private
   */
  this.altitude_ = 10000000;

  /**
   * @type {?number}
   * @private
   */
  this.zoom_ = 3;

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
  this.latitude_ = goog.math.clamp(latitude, -1.5, 1.5);
  this.longitude_ = we.utils.standardLongitudeRadians(longitude);

  if (this.fixedAltitude) {
    this.zoom_ = null;
    this.dispatchEvent(new we.scene.CameraEvent(
        we.scene.Camera.EventType.ZOOMCHANGED));
  } else {
    this.altitude_ = null;
    this.dispatchEvent(new we.scene.CameraEvent(
        we.scene.Camera.EventType.ALTITUDECHANGED));
  }
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
 * Sets this camera to fixed altitude
 * @param {number} altitude Altitude in meters.
 */
we.scene.Camera.prototype.setAltitude = function(altitude) {
  this.altitude_ = goog.math.clamp(altitude, 250, 10000000);

  if (!this.fixedAltitude) {
    this.calcZoom_(); //recount
  } else {
    this.zoom_ = null; //invalidate
  }

  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.ALTITUDECHANGED));
  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.ZOOMCHANGED));
};


/**
 * @return {number} Altitude in meters.
 */
we.scene.Camera.prototype.getAltitude = function() {
  if (goog.isNull(this.altitude_)) {
    this.calcAltitude_();
  }
  return /** @type {number} */(this.altitude_);
};


/**
 * Sets zoom level and calculates other appropriate cached variables
 * @param {number} zoom New zoom level.
 */
we.scene.Camera.prototype.setZoom = function(zoom) {
  this.zoom_ = goog.math.clamp(zoom, this.scene_.getMinZoom(),
                               this.scene_.getMaxZoom());

  if (this.fixedAltitude) {
    this.calcAltitude_(); //recount
  } else {
    this.altitude_ = null; //invalidate
  }

  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.ZOOMCHANGED));
  this.dispatchEvent(new we.scene.CameraEvent(
      we.scene.Camera.EventType.ALTITUDECHANGED));
};


/**
 * @return {number} Zoom level.
 */
we.scene.Camera.prototype.getZoom = function() {
  if (goog.isNull(this.zoom_)) {
    this.calcZoom_();
  }
  return /** @type {number} */(this.zoom_);
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


/**
 * Calculates zoom from altitude
 * @private
 */
we.scene.Camera.prototype.calcZoom_ = function() {
  var sizeISee = 2 * (this.altitude_ / we.scene.EARTH_RADIUS) *
                 Math.tan(this.scene_.context.fov / 2);
  var sizeOfOneTile = sizeISee / this.scene_.tilesVertically;
  var o = Math.cos(Math.abs(this.latitude_)) * 2 * Math.PI;

  this.zoom_ = goog.math.clamp(Math.log(o / sizeOfOneTile) / Math.LN2,
                               this.scene_.getMinZoom(),
                               this.scene_.getMaxZoom());
};


/**
 * Calculates altitude from zoom
 * @private
 */
we.scene.Camera.prototype.calcAltitude_ = function() {
  var o = Math.cos(Math.abs(this.latitude_)) * 2 * Math.PI;
  var thisPosDeformation = o / Math.pow(2, this.zoom_);
  var sizeIWannaSee = thisPosDeformation * this.scene_.tilesVertically;
  this.altitude_ = (1 / Math.tan(this.scene_.context.fov / 2)) *
      (sizeIWannaSee / 2) * we.scene.EARTH_RADIUS;
};


/**
 * Events fired by the camera.
 * @enum {string}
 */
we.scene.Camera.EventType = {
  /**
   * Dispatched when the zoom of the camera is changed or recalculated.
   */
  ZOOMCHANGED: 'zoomchanged',
  /**
   * Dispatched when the altitude of the camera is changed or recalculated.
   */
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
