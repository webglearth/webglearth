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
 * @fileoverview Scene tilting.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.SceneTilter');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');

goog.require('we.scene.CameraAnimator');
goog.require('we.scene.Scene');



/**
 * Creates new tilter for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @param {we.scene.CameraAnimator=} opt_animator CameraAnimator to
 *                                                cancel on user input.
 * @constructor
 */
we.ui.SceneTilter = function(scene, opt_animator) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

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
   * @type {?number}
   * @private
   */
  this.listenKey_ = null;

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
we.ui.SceneTilter.prototype.onMouseDown_ = function(e) {
  if (!e.isButton(goog.events.BrowserEvent.MouseButton.RIGHT) &&
      !e.ctrlKey && !e.altKey) {

    if (goog.isDefAndNotNull(this.animator_)) this.animator_.cancel();

    this.oldX_ = e.screenX;
    this.oldY_ = e.screenY;

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
we.ui.SceneTilter.prototype.onMouseUp_ = function(e) {
  e.preventDefault();

  this.rotationTarget_ = undefined;
  if (window.debugMarker)
    window.debugMarker.enable(false);

  //Unregister onMouseMove_
  if (!goog.isNull(this.listenKey_)) {
    goog.events.unlistenByKey(this.listenKey_);
    this.listenKey_ = null;
  }
};


/**
 * Move the scene in given direction defined in actial window pixel coordinates
 * @param {number} xDiff Difference of position in pixels in x-axis.
 * @param {number} yDiff Difference of position in pixels in y-axis.
 * @private
 */
we.ui.SceneTilter.prototype.scenePixelMove_ = function(xDiff, yDiff) {
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
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.ui.SceneTilter.prototype.onMouseMove_ = function(e) {
  var xDiff = e.screenX - this.oldX_;
  var yDiff = e.screenY - this.oldY_;

  this.scenePixelMove_(xDiff, yDiff);

  this.oldX_ = e.screenX;
  this.oldY_ = e.screenY;

  e.preventDefault();
};
