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
 * @fileoverview Scene dragging.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author petr.pridal@klokantech.com (Petr Pridal)
 *
 */

goog.provide('we.ui.SceneDragger');

goog.require('goog.Timer');
goog.require('goog.events');
goog.require('goog.fx.Animation');
goog.require('goog.fx.Animation.EventType');
goog.require('goog.fx.AnimationEvent');
goog.require('goog.fx.easing');
goog.require('goog.math');
goog.require('goog.ui.Component.EventType');

goog.require('we.scene.CameraAnimator');
goog.require('we.scene.Scene');



/**
 * Creates new dragger for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @param {we.scene.CameraAnimator=} opt_animator CameraAnimator to
 *                                                cancel on user input.
 * @constructor
 */
we.ui.SceneDragger = function(scene, opt_animator) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {boolean}
   * @private
   */
  this.dragging_ = false;

  /**
   * undefined - no rotation,
   * null - free rotation,
   * Array.<number> - fixed rotation around this coordinates
   * @type {undefined|null|Array.<number>}
   * @private
   */
  this.rotationTarget_ = undefined;

  /**
   * @type {number}
   * @private
   */
  this.rotationDistance_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.oldX_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.oldY_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.olderX_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.olderY_ = 0;

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = null;

  /**
   * @type {goog.fx.Animation}
   * @private
   */
  this.inertialAnimation_ = null;

  goog.events.listen(this.scene_.context.canvas,
                     goog.events.EventType.MOUSEDOWN,
                     goog.bind(this.onMouseDown_, this));

  goog.events.listen(goog.dom.getOwnerDocument(this.scene_.context.canvas),
                     goog.events.EventType.MOUSEUP,
                     goog.bind(this.onMouseUp_, this));

  /**
   * @type {we.scene.CameraAnimator}
   * @private
   */
  this.animator_ = opt_animator || null;
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.ui.SceneDragger.prototype.onMouseDown_ = function(e) {
  if (!e.isButton(goog.events.BrowserEvent.MouseButton.RIGHT) &&
      !e.ctrlKey && !e.altKey) {

    if (goog.isDefAndNotNull(this.animator_)) this.animator_.cancel();

    // Stop inertial animation
    if (this.inertialAnimation_) {
      this.inertialAnimation_.stop(false);
      this.inertialAnimation_.dispose();
      this.inertialAnimation_ = null;
    }

    this.dragging_ = true;
    this.olderX_ = this.oldX_ = e.screenX;
    this.olderY_ = this.oldY_ = e.screenY;


    if (e.isButton(goog.events.BrowserEvent.MouseButton.MIDDLE) ||
        (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT) &&
        e.shiftKey)) {
      this.rotationTarget_ = this.scene_.camera.getTarget();// ||*/
      //this.scene_.getLatLongForXY(e.offsetX, e.offsetY,
      //                            true);
      if (goog.isDefAndNotNull(this.rotationTarget_)) {
        if (window.debugMarker) {
          window.debugMarker.lat = goog.math.toDegrees(this.rotationTarget_[0]);
          window.debugMarker.lon = goog.math.toDegrees(this.rotationTarget_[1]);
          window.debugMarker.enable(true);
        }
        //TODO: Optimize !!
        if (this.scene_.camera.getTilt() == 0) {
          this.rotationDistance_ = this.scene_.camera.getAltitude();
        } else {
          var singamma =
              (1 + this.scene_.camera.getAltitude() / we.scene.EARTH_RADIUS) *
              Math.sin(this.scene_.camera.getTilt());
          var gamma = Math.PI - Math.asin(singamma);

          var beta = Math.PI - this.scene_.camera.getTilt() - gamma;
          this.rotationDistance_ =
              (Math.sin(beta) / Math.sin(this.scene_.camera.getTilt())) *
              we.scene.EARTH_RADIUS;
        }
      }
    }


    //Unregister onMouseMove_
    if (!goog.isNull(this.listenKey_)) {
      goog.events.unlistenByKey(this.listenKey_);
      this.listenKey_ = null;
    }


    //Register onMouseMove_
    this.listenKey_ = goog.events.listen(
        goog.dom.getOwnerDocument(this.scene_.context.canvas),
        goog.events.EventType.MOUSEMOVE,
        goog.bind(this.onMouseMove_, this));

    e.preventDefault();

  }
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.ui.SceneDragger.prototype.onMouseUp_ = function(e) {
  if (this.dragging_) {

    e.preventDefault();

    this.rotationTarget_ = undefined;
    if (window.debugMarker)
      window.debugMarker.enable(false);

    this.dragging_ = false;

    //Unregister onMouseMove_
    if (!goog.isNull(this.listenKey_)) {
      goog.events.unlistenByKey(this.listenKey_);
      this.listenKey_ = null;
    }

    if (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) {
      var xDiff = e.screenX - this.olderX_;
      var yDiff = e.screenY - this.olderY_;

      var diffLength = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));

      //Normalization
      var xFactor = xDiff / diffLength;
      var yFactor = yDiff / diffLength;

      if (this.oldX_ == this.olderX_ && this.oldY_ == this.olderY_) {
        // the mousemove event was already fired (probably Firefox) ->
        // double the diffLength to simulate the same behavior
        diffLength *= 2;
      }

      if (diffLength > 6) {

        var moveFactor = Math.max(15, diffLength) * 6;

        this.inertialStart_(moveFactor * xFactor, moveFactor * yFactor);
      }
    }
  }
};


/**
 * Move the scene in given direction defined in actial window pixel coordinates
 * @param {number} xDiff Difference of position in pixels in x-axis.
 * @param {number} yDiff Difference of position in pixels in y-axis.
 * @private
 */
we.ui.SceneDragger.prototype.scenePixelMove_ = function(xDiff, yDiff) {
  if (goog.isDef(this.rotationTarget_)) { //Rotation mode
    var deltaX = (xDiff / this.scene_.context.canvas.width) * Math.PI * -2;
    var deltaY = (yDiff / this.scene_.context.canvas.height) * Math.PI / 2;

    if (!goog.isNull(this.rotationTarget_)) { //Rotation around fixed target
      this.scene_.camera.rotateAround(
          this.rotationTarget_[0], this.rotationTarget_[1],
          this.rotationDistance_, deltaX, deltaY);
    } else { //Free rotation
      this.scene_.camera.setHeading(this.scene_.camera.getHeading() + deltaX);
      this.scene_.camera.setTilt(this.scene_.camera.getTilt() + deltaY);
    }
  } else { //Pan mode
    //PI * (How much is 1px on the screen?) * (How much is visible?)
    var factor = Math.PI * (1 / this.scene_.context.canvas.height) *
        (this.scene_.tilesVertically /
        Math.pow(2, this.scene_.earth.calcZoom(true)));

    this.scene_.camera.moveRelative(yDiff * factor, -2 * xDiff * factor);
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.ui.SceneDragger.prototype.onMouseMove_ = function(e) {

  var xDiff = e.screenX - this.oldX_;
  var yDiff = e.screenY - this.oldY_;

  this.scenePixelMove_(xDiff, yDiff);

  this.olderX_ = this.oldX_;
  this.olderY_ = this.oldY_;

  this.oldX_ = e.screenX;
  this.oldY_ = e.screenY;

  e.preventDefault();
};


/**
 * Inertial scrolling (aka kinetic scrolling) animation with easing
 * @param {number} xDiff Difference of position in pixels in x-axis.
 * @param {number} yDiff Difference of position in pixels in y-axis.
 * @param {number=} opt_duration Duration of the animation.
 * @private
 */
we.ui.SceneDragger.prototype.inertialStart_ =
    function(xDiff, yDiff, opt_duration) {

  var duration = opt_duration || 1300;

  this.inertialAnimation_ = new goog.fx.Animation(
      [this.oldX_, this.oldY_],
      [this.oldX_ + xDiff, this.oldY_ + yDiff],
      duration, goog.fx.easing.easeOut);

  goog.events.listen(this.inertialAnimation_,
      [goog.fx.Animation.EventType.ANIMATE],
      this.inertialMoveTick_, false, this);
  this.inertialAnimation_.play(false);
};


/**
 * The animation tick for inertial scrolling
 * @param {!goog.fx.AnimationEvent} e Event object.
 * @private
 */
we.ui.SceneDragger.prototype.inertialMoveTick_ = function(e) {
  this.scenePixelMove_(e.x - this.oldX_, e.y - this.oldY_);
  this.oldX_ = e.x;
  this.oldY_ = e.y;
};
