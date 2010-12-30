
/**
 * @fileoverview Scene zooming using mouse wheel.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 */

goog.provide('we.ui.MouseZoomer');

goog.require('goog.Disposable');
goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');

goog.require('we.scene.Scene');



/**
 * Creates new mouse-wheel zoomer for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 * @extends {goog.Disposable}
 */
we.ui.MouseZoomer = function(scene) {
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
      goog.bind(function(e) {
        var newLevel = this.zoomLevel - e.deltaY / 12;
        this.setZoom(newLevel);
        e.preventDefault();
      }, scene));
};
goog.inherits(we.ui.MouseZoomer, goog.Disposable);


/** @inheritDoc */
we.ui.MouseZoomer.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  this.mouseWheelHandler_.dispose();
};
