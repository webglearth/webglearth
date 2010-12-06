
/**
 * @fileoverview Scene dragging.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.scene.Dragger');

goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.ui.Component.EventType');

goog.require('we.scene.Scene');



/**
 * Creates new dragger for the given scene.
 * @param {!we.scene.Scene} scene Scene.
 * @constructor
 */
we.scene.Dragger = function(scene) {
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
   * @type {?number}
   * @private
   */
  this.listenKey_ = null;

  goog.events.listen(this.scene_.context.canvas,
                     goog.events.EventType.MOUSEDOWN,
                     goog.bind(this.onMouseDown_, this));

  goog.events.listen(this.scene_.context.canvas,
                     goog.events.EventType.MOUSEUP,
                     goog.bind(this.onMouseUp_, this));

  goog.events.listen(this.scene_.context.canvas,
                     goog.events.EventType.MOUSEOUT,
                     goog.bind(this.onMouseUp_, this));

};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.scene.Dragger.prototype.onMouseDown_ = function(e) {
  if (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) {
    this.dragging_ = true;
    this.oldX_ = e.offsetX;
    this.oldY_ = e.offsetY;
    this.listenKey_ = null;

    //if (goog.DEBUG)
    //  we.scene.Scene.logger.info('Registering MOUSEMOVE');

    //Register onMouseMove_
    this.listenKey_ = goog.events.listen(this.scene_.context.canvas,
                                         goog.events.EventType.MOUSEMOVE,
                                         goog.bind(this.onMouseMove_, this));

    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.scene.Dragger.prototype.onMouseUp_ = function(e) {
  if (this.dragging_ && (e.type != goog.events.EventType.MOUSEDOWN ||
      e.isButton(goog.events.BrowserEvent.MouseButton.LEFT))) {
    this.dragging_ = false;

    //Unregister onMouseMove_
    if (!goog.isNull(this.listenKey_)) {
      //if (goog.DEBUG)
      //  we.scene.Scene.logger.info('Unregistering MOUSEMOVE');
      goog.events.unlistenByKey(this.listenKey_);
    }

    e.preventDefault();
  }
};


/**
 * @param {!goog.events.BrowserEvent} e Event object.
 * @private
 */
we.scene.Dragger.prototype.onMouseMove_ = function(e) {
  if (e.isButton(goog.events.BrowserEvent.MouseButton.LEFT)) {

    var xDiff = e.offsetX - this.oldX_;
    var yDiff = e.offsetY - this.oldY_;

    //TODO: more exact calculation (just vertically?)
    //PI * (How much is 1px on the screen?) * (How much is visible?)
    var factor = Math.PI * (1 / this.scene_.context.canvas.height) *
        (we.scene.TILES_VERTICALLY / Math.pow(2, this.scene_.zoomLevel));

    this.scene_.longitude = this.scene_.longitude - xDiff * 2 * factor;
    this.scene_.latitude = this.scene_.latitude + yDiff * factor;


    if (Math.abs(this.scene_.latitude) > Math.PI / 2.1) {
      this.scene_.latitude = goog.math.sign(this.scene_.latitude) *
          (Math.PI / 2.1);
    }

    if (this.scene_.longitude > Math.PI) {
      this.scene_.longitude -= 2 * Math.PI;
    }

    if (this.scene_.longitude < -Math.PI) {
      this.scene_.longitude += 2 * Math.PI;
    }

    this.oldX_ = e.offsetX;
    this.oldY_ = e.offsetY;

    e.preventDefault();
  }
};
