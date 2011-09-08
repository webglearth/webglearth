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
 * @fileoverview WebGL Earth camera animator.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author leosamu@ai2.upv.es (Leonardo Salom)
 *
 */

goog.provide('we.scene.CameraAnimator');

goog.require('goog.events');
goog.require('goog.fx.Animation');
goog.require('goog.fx.Animation.EventType');
goog.require('goog.fx.AnimationParallelQueue');
goog.require('goog.fx.AnimationSerialQueue');
goog.require('goog.math');

goog.require('we.scene.Camera');
goog.require('we.scene.CameraEvent');


/**
 * @define {number} Animation duration in milliseconds.
 */
we.scene.CAMERA_ANIMATION_DURATION = 3000;


/**
 * @define {number} How much can the camera climb (or descent)
 *                  (in meters of altitude per meters of surface distance).
 */
we.scene.CAMERA_ANIMATION_MAX_ASCENT = 0.2;



/**
 * Camera object
 * @param {!we.scene.Camera} camera Camera to be animated by this object.
 * @constructor
 */
we.scene.CameraAnimator = function(camera) {

  /**
   * @type {!we.scene.Camera}
   * @private
   */
  this.camera_ = camera;

  /**
   * The animation queue, we divide it in horizontal and vertical animations
   * @type {goog.fx.AnimationParallelQueue}
   * @private
   */
  this.animation_ = null;

  /**
   * @type {Array.<number>}
   * @private
   */
  this.start_ = [];

  /**
   * @type {Array.<number>}
   * @private
   */
  this.end_ = [];
};


/**
 * Initiate and start the animation to given location.
 * @param {number} latitude Latitude in radians.
 * @param {number} longitude Longitude in radians.
 * @param {number=} opt_altitude Altitude (otherwise unchanged).
 * @param {number=} opt_heading Heading (otherwise 0).
 * @param {number=} opt_tilt Tilt (otherwise 0).
 */
we.scene.CameraAnimator.prototype.flyTo = function(latitude, longitude,
                                                   opt_altitude,
                                                   opt_heading, opt_tilt) {
  //TODO: animate everything in one animation, except altitude
  //altitude has to be divided into two animations: easein+easeout (serial)
  //everything+altitude(paralel)

  if (goog.isDefAndNotNull(this.animation_)) {
    this.onEnd_();
  }
  this.animation_ = new goog.fx.AnimationParallelQueue();

  var startPos = this.camera_.getPosition();

  this.start_ = [0, 0, this.camera_.getHeading(), this.camera_.getTilt()];

  this.end_ = [0, 0, opt_heading || 0, opt_tilt || 0];

  this.setStartAndEnd_(startPos[0], startPos[1], latitude, longitude);

  //in-out quintic
  var supereasing = function(t) {
    var t2 = t * t;
    var t3 = t * t * t;
    return 6 * t3 * t2 + -15 * t2 * t2 + 10 * t3;
  };

  var animationAlteringEvents = [goog.fx.Animation.EventType.BEGIN,
                                 goog.fx.Animation.EventType.ANIMATE,
                                 goog.fx.Animation.EventType.END];

  //animate most of the parameters in one animation,
  //only altitude has to be seperate
  var everythingAnim = new goog.fx.Animation(this.start_, this.end_,
      we.scene.CAMERA_ANIMATION_DURATION,
      supereasing);

  goog.events.listen(everythingAnim, animationAlteringEvents,
                     this.onEverythingAnimate_, false, this);

  this.animation_.add(everythingAnim);

  if (opt_altitude) {
    var distance = we.scene.Earth.calculateDistance(startPos[0], startPos[1],
                                                    latitude, longitude);

    var curAlt = this.camera_.getAltitude();

    var topPoint = Math.min(curAlt, opt_altitude) +
                       distance * we.scene.CAMERA_ANIMATION_MAX_ASCENT;

    //Don't allow the topPoint to be lower than highest of the two points
    topPoint = Math.max(Math.max(curAlt, opt_altitude), topPoint);

    var ascentAnim = new goog.fx.Animation([curAlt], [topPoint],
        we.scene.CAMERA_ANIMATION_DURATION / 2,
        supereasing);

    var descentAnim = new goog.fx.Animation([topPoint], [opt_altitude],
        we.scene.CAMERA_ANIMATION_DURATION / 2,
        supereasing);

    goog.events.listen(ascentAnim, animationAlteringEvents,
                       this.onAltitudeAnimate_, false, this);

    goog.events.listen(descentAnim, animationAlteringEvents,
                       this.onAltitudeAnimate_, false, this);

    var altitudeAnim = new goog.fx.AnimationSerialQueue();

    altitudeAnim.add(ascentAnim);
    altitudeAnim.add(descentAnim);

    this.animation_.add(altitudeAnim);

  }

  goog.events.listen(this.animation_, goog.fx.Animation.EventType.END,
                     this.onEnd_, false, this);

  this.animation_.play();
};


/**
 * Validates start and end location so that
 * the animation goes through the shortest path.
 * @param {number} latStart Latitude of the start point.
 * @param {number} lonStart Longitude of the end point.
 * @param {number} latEnd Latitude of the start point.
 * @param {number} lonEnd Longitude of the end point.
 * @private
 */
we.scene.CameraAnimator.prototype.setStartAndEnd_ = function(latStart, lonStart,
                                                             latEnd, lonEnd) {
  lonStart = goog.math.modulo(lonStart, 2 * Math.PI);
  lonEnd = goog.math.modulo(lonEnd, 2 * Math.PI);

  /*
    //not really needed, is it?
    var latDiff = latStart - latEnd;
    if (latDiff < -Math.PI) {
      latStart += 2*Math.PI;
    } else if (latDiff > Math.PI) {
      latEnd += 2*Math.PI;
    }*/

  var lonDiff = lonStart - lonEnd;
  if (lonDiff < -Math.PI) {
    lonStart += 2 * Math.PI;
  } else if (lonDiff > Math.PI) {
    lonEnd += 2 * Math.PI;
  }

  this.start_[0] = latStart;
  this.start_[1] = lonStart;
  this.end_[0] = latEnd;
  this.end_[1] = lonEnd;
};


/**
 * Animate everything except altitude
 * @param {goog.events.Event} e The event.
 * @private
 */
we.scene.CameraAnimator.prototype.onEverythingAnimate_ = function(e) {
  this.camera_.setPosition(e.coords[0], e.coords[1]);
  this.camera_.setHeading(e.coords[2]);
  this.camera_.setTilt(e.coords[3]);
};


/**
 * Animate altitude
 * @param {goog.events.Event} e The event.
 * @private
 */
we.scene.CameraAnimator.prototype.onAltitudeAnimate_ = function(e) {
  this.camera_.setAltitude(e.coords[0]);
};


/**
 * Called when animation ends
 * @private
 */
we.scene.CameraAnimator.prototype.onEnd_ = function() {
  if (goog.isDefAndNotNull(this.animation_)) {
    this.animation_.dispose();
    this.animation_ = null;
  }
};


/**
 * If the animation is in progress, cancel it
 */
we.scene.CameraAnimator.prototype.cancel = function() {
  this.onEnd_();
};
