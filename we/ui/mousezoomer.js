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
 * @fileoverview Scene zooming using mouse wheel.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

goog.provide('we.ui.MouseZoomer');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.fx.Animation');
goog.require('goog.fx.Animation.EventType');
goog.require('goog.fx.AnimationEvent');

goog.require('we.scene.Scene');


/**
 * @define {number} Number of levels to zoom on MouseWheel event.
 */
we.ui.MOUSERZOOMER_ZOOMSTEP = 0.5;


/**
 * @define {number} How to modify distance on MouseWheel event.
 */
we.ui.MOUSERZOOMER_DISTANCEMODIFIER = 2;


/**
 * @define {number} Duration of zooming animation in miliseconds.
 */
we.ui.MOUSERZOOMER_DURATION = 120;



/**
 * Creates new mouse-wheel zoomer for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 * @extends {goog.Disposable}
 */
we.ui.MouseZoomer = function(scene) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!goog.events.MouseWheelHandler}
   * @private
   */
  this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
      scene.context.canvas);

  /**
   * @type {?number}
   * @private
   */
  this.listenKey_ = goog.events.listen(this.mouseWheelHandler_,
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      function(e) {
        this.zoom_(-goog.math.sign(e.deltaY));
        e.preventDefault();
      }, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.dblClickListenKey_ = goog.events.listen(scene.context.canvas,
      goog.events.EventType.DBLCLICK,
      goog.bind(function(e) {
        this.camera.setAltitude(this.camera.getAltitude() / 2);
        var target = this.getLatLongForXY(e.offsetX, e.offsetY, true) ||
                     this.camera.getTarget(this);
        if (target) {
          var lon = (this.camera.getLongitude() + target[1]) / 2;
          if (Math.abs(this.camera.getLongitude() - target[1]) > Math.PI) {
            lon += Math.PI;
          }
          this.camera.setPosition((this.camera.getLatitude() + target[0]) / 2,
                                  lon);
        }
        e.preventDefault();
      }, scene));

  /**
   * @type {?number}
   * @private
   */
  this.rightClickListenKey_ = goog.events.listen(scene.context.canvas,
      goog.events.EventType.MOUSEUP,
      goog.bind(function(e) {
        if (e.isButton(goog.events.BrowserEvent.MouseButton.RIGHT)) {
          this.camera.setAltitude(this.camera.getAltitude() * 2);
          var target = this.getLatLongForXY(e.offsetX, e.offsetY, true) ||
                       this.camera.getTarget(this);
          if (target) {
            this.camera.setPosition(2 * this.camera.getLatitude() - target[0],
                                    2 * this.camera.getLongitude() - target[1]);
          }
          e.preventDefault();
        }
      }, scene));

  /**
   * preventDefault on MOUSEUP is just not enough
   * @type {?number}
   * @private
   */
  this.noContextMenuListenKey_ = goog.events.listen(scene.context.canvas,
      goog.events.EventType.CONTEXTMENU, function(e) {e.preventDefault();});

  /**
   * @type {goog.fx.Animation}
   * @private
   */
  this.animation_ = null;

  /**
   * @type {number}
   * @private
   */
  this.startX_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.targetX_ = 0;
};
goog.inherits(we.ui.MouseZoomer, goog.Disposable);


/**
 * Starts zooming in given direction or does nothing if zooming
 * in that direction is already in progress.
 * @param {number} direction Direction of zooming +1 means in, -1 means out.
 * @private
 */
we.ui.MouseZoomer.prototype.zoom_ = function(direction) {
  var duration = we.ui.MOUSERZOOMER_DURATION;
  direction *= -1;
  if (this.animation_) {
    if ((this.targetX_ > this.startX_) == (direction > 0)) { //Same dir
      return;
    } else { //Opposite direction - just revert to previous level
      this.animation_.dispose();
      this.animation_ = null;
      duration *= (this.scene_.camera.getAltitude() - this.startX_) /
                  (this.targetX_ - this.startX_);
      var tempX = this.targetX_;
      this.targetX_ = this.startX_;
      this.startX_ = tempX;
    }
  } else {
    this.startX_ = this.scene_.camera.getAltitude();
    this.targetX_ = this.scene_.camera.validateAltitude(this.startX_ *
        Math.pow(we.ui.MOUSERZOOMER_DISTANCEMODIFIER, direction));
  }

  if (isNaN(duration) || duration <= 0)
    return;

  var startPos = this.scene_.camera.getPosition();
  var target = this.scene_.camera.getTarget() || startPos;
  var ratio = this.targetX_ / this.scene_.camera.getAltitude();

  startPos.push(this.scene_.camera.getAltitude());

  this.animation_ = new goog.fx.Animation(startPos,
      [goog.math.lerp(target[0], startPos[0], ratio),
       goog.math.lerp(target[1], startPos[1], ratio),
       this.targetX_],
      duration);

  goog.events.listen(this.animation_,
      [goog.fx.Animation.EventType.ANIMATE, goog.fx.Animation.EventType.FINISH],
      function(e) {
        this.scene_.camera.setPosition(e.x, e.y);
        this.scene_.camera.setAltitude(e.z);
      }, false, this);

  goog.events.listen(this.animation_,
      [goog.fx.Animation.EventType.FINISH],
      this.endZooming_, false, this);

  this.animation_.play(false);
};


/**
 *
 * @param {!goog.fx.AnimationEvent} e Event object.
 * @private
 */
we.ui.MouseZoomer.prototype.endZooming_ = function(e) {
  if (this.animation_) {
    this.animation_.dispose();
    this.animation_ = null;
  }
};


/** @inheritDoc */
we.ui.MouseZoomer.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  goog.events.unlistenByKey(this.dblClickListenKey_);
  goog.events.unlistenByKey(this.rightClickListenKey_);
  goog.events.unlistenByKey(this.noContextMenuListenKey_);
  this.mouseWheelHandler_.dispose();
  this.animation_.dispose();
};
