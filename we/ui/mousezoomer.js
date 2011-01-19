
/**
 * @fileoverview Scene zooming using mouse wheel.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
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

  /**
   * @type {?number}
   * @private
   */
  this.dblClickListenKey_ = goog.events.listen(scene.context.canvas,
      goog.events.EventType.DBLCLICK,
      goog.bind(function(e) {
        this.setZoom(this.zoomLevel + 1);
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
          e.preventDefault();
          this.setZoom(this.zoomLevel - 1);
        }
      }, scene));

  /**
   * preventDefault on MOUSEUP is just not enough
   * @type {?number}
   * @private
   */
  this.noContextMenuListenKey_ = goog.events.listen(scene.context.canvas,
      goog.events.EventType.CONTEXTMENU, function(e) {e.preventDefault();});
};
goog.inherits(we.ui.MouseZoomer, goog.Disposable);


/** @inheritDoc */
we.ui.MouseZoomer.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  goog.events.unlistenByKey(this.listenKey_);
  goog.events.unlistenByKey(this.dblClickListenKey_);
  goog.events.unlistenByKey(this.rightClickListenKey_);
  goog.events.unlistenByKey(this.noContextMenuListenKey_);
  this.mouseWheelHandler_.dispose();
};
