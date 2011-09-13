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
 * @fileoverview Pan Control.
 *
 * @author leosamu@ai2.upv.es (Leonardo Salom)
 * @author petr.sloup@klokantech.com (Petr Sloup)
 */

goog.provide('weapp.ui.PanControl');

goog.require('goog.Disposable');
goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Control');

goog.require('we.scene.Scene');



/**
 * Creates new pan control that modifies the pan on the scene.
 * @param {!we.scene.Scene} scene Scene.
 * @param {!Element} element Element to append this control to.
 * @constructor
 * @extends {goog.Disposable}
 */
weapp.ui.PanControl = function(scene, element) {
  /**
   * @type {!we.scene.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {!goog.Timer}
   * @private
   */
  this.timer_ = new goog.Timer(20);

  /**
   * @type {number}
   * @private
   */
  this.X_ = 0.1;

  /**
   * @type {number}
   * @private
   */
  this.Y_ = 0.1;

  /**
   * @type {boolean}
   * @private
   */
  this.isMouseDown_ = false;

  /**
   * @type {!goog.ui.Control}
   * @private
   */
  this.control_ = new goog.ui.Control('');
  this.control_.setDispatchTransitionEvents(goog.ui.Component.State.ALL,
      true);

  /**
   * @type {?number}
   * @private
   */
  this.activate_ = goog.events.listen(this.control_,
      goog.ui.Component.EventType.ACTIVATE,
      this.onActivate_, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.deactivate_ = goog.events.listen(this.control_,
      goog.ui.Component.EventType.DEACTIVATE,
      this.onDeactivate_, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.enter_ = goog.events.listen(this.control_,
      goog.ui.Component.EventType.ENTER,
      this.onEnter_, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.tick_ = goog.events.listen(this.timer_,
      goog.Timer.TICK,
      this.onTick_, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.mousemove_ = goog.events.listen(
      goog.dom.getOwnerDocument(this.scene_.context.canvas),
      goog.events.EventType.MOUSEMOVE,
      this.onMouseMove_, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.mousedown_ = goog.events.listen(
      goog.dom.getOwnerDocument(this.scene_.context.canvas),
      goog.events.EventType.MOUSEDOWN,
      function() {
        this.isMouseDown_ = true;
      }, false, this);

  /**
   * @type {?number}
   * @private
   */
  this.mouseup_ = goog.events.listen(
      goog.dom.getOwnerDocument(this.scene_.context.canvas),
      goog.events.EventType.MOUSEUP,
      function() {
        this.isMouseDown_ = false;
      }, false, this);

  this.control_.render(element);
};
goog.inherits(weapp.ui.PanControl, goog.Disposable);


/**
 * When cursor enters on the control set it as active if
 * mouse is at down state
 * @private
 */
weapp.ui.PanControl.prototype.onEnter_ = function() {
  if (this.isMouseDown_)
  {
    this.control_.setState(goog.ui.Component.State.ACTIVE, true);
    this.timer_.start();
  }
};


/**
 * When control state changes to active start the pan movement
 * @private
 */
weapp.ui.PanControl.prototype.onActivate_ = function() {
  this.timer_.start();
};


/**
 * When control becomes inactive stops the pan movement
 * @private
 */
weapp.ui.PanControl.prototype.onDeactivate_ = function() {
  if (this.timer_)
  {
    this.timer_.stop();
  }
};


/**
 * Moves the earth based on the position of the mouse on the control
 * @private
 */
weapp.ui.PanControl.prototype.onTick_ = function()
    {
  this.scenePixelMove_(this.X_, this.Y_);
};


/**
 * Modifies the pan movement based on mouse position
 * @param {goog.events.Event} e Mouse event to handle.
 * @private
 */
weapp.ui.PanControl.prototype.onMouseMove_ = function(e) {
  this.X_ = - (e.offsetX - (e.target.offsetWidth / 2)) * 2;
  this.Y_ = - (e.offsetY - (e.target.offsetHeight / 2));
};


/** @inheritDoc */
weapp.ui.PanControl.prototype.disposeInternal = function() {
  goog.events.unlistenByKey(this.activate_);
  goog.events.unlistenByKey(this.mousemove_);
  goog.events.unlistenByKey(this.mouseup_);
  goog.events.unlistenByKey(this.mousedown_);
  goog.events.unlistenByKey(this.deactivate_);
  goog.events.unlistenByKey(this.tick_);
  this.control_.dispose();
};


/**
 * Move the scene in given direction defined in actial window pixel coordinates
 * @param {number} xDiff Difference of position in pixels in x-axis.
 * @param {number} yDiff Difference of position in pixels in y-axis.
 * @private
 */
weapp.ui.PanControl.prototype.scenePixelMove_ = function(xDiff, yDiff) {
  //PI * (How much is 1px on the screen?) * (How much is visible?)
  var factor = Math.PI * (1 / this.scene_.context.canvas.height) *
      (this.scene_.tilesVertically /
      Math.pow(2, this.scene_.earth.calcZoom(true)));

  this.scene_.camera.moveRelative(yDiff * factor, -2 * xDiff * factor);
};
