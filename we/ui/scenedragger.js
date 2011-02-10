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
goog.require('we.scene.Scene');



/**
 * Creates new dragger for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 */
we.ui.SceneDragger = function(scene) {
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
  this.dragEndX_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.dragEndY_ = 0;

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = null;

  /**
   * @type {goog.Timer}
   * @private
   */
  this.dragEndTimer_ = new goog.Timer(20);

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

  goog.events.listen(this.dragEndTimer_,
      goog.Timer.TICK,
      this.onDragEndTick_, false, this);
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.ui.SceneDragger.prototype.onMouseDown_ = function(e) {
  if (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT) &&
      !e.ctrlKey && !e.altKey && !e.shiftKey) {

    // Stop inertial animation
    if (this.inertialAnimation_) {
      this.inertialAnimation_.stop(false);
      this.inertialAnimation_.dispose();
      this.inertialAnimation_ = null;
    }

    this.dragging_ = true;
    this.oldX_ = e.screenX;
    this.oldY_ = e.screenY;


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
  if (this.dragging_ && (e.type != goog.events.EventType.MOUSEDOWN ||
      e.isButton(goog.events.BrowserEvent.MouseButton.LEFT))) {

    this.dragEndX_ = e.screenX;
    this.dragEndY_ = e.screenY;

    e.preventDefault();

    this.dragEndTimer_.start();
  }
};


/**
 * Move the scene in given direction defined in actial window pixel coordinates
 * @param {number} xDiff Difference of position in pixels in x-axis.
 * @param {number} yDiff Difference of position in pixels in y-axis.
 * @private
 */
we.ui.SceneDragger.prototype.scenePixelMove_ = function(xDiff, yDiff) {

  //TODO: more exact calculation (just vertically?)
  //PI * (How much is 1px on the screen?) * (How much is visible?)
  var factor = Math.PI * (1 / this.scene_.context.canvas.height) *
      (this.scene_.tilesVertically / Math.pow(2, this.scene_.getZoom()));


  var rotateAxes = function(angle) {
    xDiff = xDiff * Math.cos(angle) + yDiff * Math.sin(angle);
    yDiff = yDiff * Math.cos(angle) - xDiff * Math.sin(angle);
  }

  //camera transformations
  rotateAxes(this.scene_.camera.roll);
  yDiff /= Math.max(Math.abs(Math.cos(this.scene_.camera.tilt)), 0.1);
  rotateAxes(this.scene_.camera.heading);

  this.scene_.camera.longitude =
      this.scene_.camera.longitude - xDiff * 2 * factor;
  this.scene_.camera.latitude =
      this.scene_.camera.latitude + yDiff * factor;


  if (Math.abs(this.scene_.camera.latitude) > Math.PI / 2.1) {
    this.scene_.camera.latitude = goog.math.sign(this.scene_.camera.latitude) *
        (Math.PI / 2.1);
  }

  if (this.scene_.camera.longitude > Math.PI) {
    this.scene_.camera.longitude -= 2 * Math.PI;
  }

  if (this.scene_.camera.longitude < -Math.PI) {
    this.scene_.camera.longitude += 2 * Math.PI;
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

  this.oldX_ = e.screenX;
  this.oldY_ = e.screenY;

  e.preventDefault();
};


/**
 * Method fired 20ms after MOUSEUP event. It calculates the move direction
 * and lenght and starts the inertial animation.
 * @private
 */
we.ui.SceneDragger.prototype.onDragEndTick_ = function() {
  this.dragEndTimer_.stop();

  this.dragging_ = false;

  //Unregister onMouseMove_
  if (!goog.isNull(this.listenKey_)) {
    goog.events.unlistenByKey(this.listenKey_);
    this.listenKey_ = null;
  }

  //Position change since dragEnd
  var xDiff = this.oldX_ - this.dragEndX_;
  var yDiff = this.oldY_ - this.dragEndY_;

  var diffLength = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));

  if (diffLength > 6) {

    //Normalization
    var xFactor = xDiff / diffLength;
    var yFactor = yDiff / diffLength;

    var moveFactor = Math.max(15, diffLength) * 8;

    this.inertialStart_(moveFactor * xFactor, moveFactor * yFactor);
  }

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
