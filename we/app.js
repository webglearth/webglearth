
/**
 * @fileoverview WebGL Earth Application object.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we');
goog.provide('we.App');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.dom');

goog.require('goog.events');
goog.require('we.debug');
goog.require('we.gl.Context');
goog.require('we.scene.Scene');
goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.GenericTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.TileProvider');
goog.require('we.ui.MouseZoomer');
goog.require('we.ui.SceneDragger');
goog.require('we.ui.TileProviderSelector');

//Dummy dependencies
goog.addDependency('',
                   ['goog.debug.ErrorHandler', 'goog.events.EventHandler'], []);



/**
 * Creates new WebGL Earth Application object and initializes everything
 * @param {!Element} canvas Canvas element.
 * @constructor
 */
we.App = function(canvas) {
  if (goog.DEBUG) {
    we.debug.initDivConsole(goog.dom.getElement('log'));
  }

  var innerInit = function() {
    if (goog.DEBUG)
      we.logger.info('Initializing...');

    /**
     * @type {!we.gl.Context}
     * @private
     */
    this.context_ = new we.gl.Context(canvas);
    this.context_.setPerspective(50, 0.000001, 5);

    /**
     * @type {!goog.Timer}
     */
    this.loopTimer = new goog.Timer(15);
    goog.events.listen(
        this.loopTimer,
        goog.Timer.TICK,
        goog.bind(function() {this.context_.renderFrame();}, this)
    );

    this.context_.scene = new we.scene.Scene(this.context_);

    /**
     * @type {!we.ui.SceneDragger}
     * @private
     */
    this.dragger_ = new we.ui.SceneDragger(this.context_.scene);

    /**
     * @type {!we.ui.MouseZoomer}
     * @private
     */
    this.zoomer_ = new we.ui.MouseZoomer(this.context_.scene);


    var tpSelectorEl = goog.dom.createElement('div');
    goog.dom.insertSiblingBefore(tpSelectorEl, this.context_.canvas);

    /**
     * @type {!we.ui.TileProviderSelector}
     * @private
     */
    this.tpSelector_ = new we.ui.TileProviderSelector(this.context_.scene,
                                                      tpSelectorEl);

    if (goog.DEBUG) {
      we.logger.info('Done');
    }
  }

  if (goog.DEBUG) {
    try {
      innerInit.call(this);
    } catch (e) {
      goog.debug.Logger.getLogger('we.ex').shout(goog.debug.deepExpose(e));
    }
  } else {
    innerInit.call(this);
  }
};


/**
 * Starts the inner loop
 */
we.App.prototype.start = function() {
  if (goog.DEBUG) {
    we.logger.info('Starting the loop...');
  }
  this.context_.resize();
  this.loopTimer.start();
};


/**
 * Adds MapQuest OSM as selectable TileProvider
 */
we.App.prototype.addMapQuestTP = function() {
  this.tpSelector_.addTileProvider(new we.texturing.MapQuestTileProvider());
};


/**
 * Adds OpenStreetMaps as selectable TileProvider
 */
we.App.prototype.addOSMTP = function() {
  this.tpSelector_.addTileProvider(new we.texturing.OSMTileProvider());
};


/**
 * Adds all Bing Maps sources (Aerial, AerialWithLabels, Road)
 * as selectable TileProviders.
 * @param {string} key Bing maps key.
 */
we.App.prototype.addAllBingTPs = function(key) {
  this.tpSelector_.addTileProvider(
      new we.texturing.BingTileProvider(key, 'Aerial'));
  this.tpSelector_.addTileProvider(
      new we.texturing.BingTileProvider(key, 'AerialWithLabels'));
  this.tpSelector_.addTileProvider(
      new we.texturing.BingTileProvider(key, 'Road'));
};


/**
 * Adds all Bing Maps sources (Aerial, AerialWithLabels, Road)
 * as selectable TileProviders.
 * @param {string} name Human-readable name of this tile source.
 * @param {string} url URL of the tiles containing
 *                      replaceable parts ({sub},{z},{x},{y}).
 * @param {number} minZoom Minimal supported zoom.
 * @param {number} maxZoom Maximal supported zoom.
 * @param {number} tileSize Size of the tiles in pixels.
 * @param {boolean=} opt_flipY Flip Y axis.
 * @param {Array.<string>=} opt_subdomains Array of subdomains
 *                                          to be used for {sub} replacement.
 */
we.App.prototype.addCustomTP = function(name, url, minZoom, maxZoom, tileSize,
                                        opt_flipY, opt_subdomains) {
  this.tpSelector_.addTileProvider(
      new we.texturing.GenericTileProvider(name, url, minZoom, maxZoom,
                                           tileSize, opt_flipY,
                                           opt_subdomains));
};

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.logger = goog.debug.Logger.getLogger('we');
}

goog.exportSymbol('WebGLEarth', we.App);
goog.exportSymbol('WebGLEarth.prototype.start', we.App.prototype.start);
goog.exportSymbol('WebGLEarth.prototype.addMapQuestTP',
                  we.App.prototype.addMapQuestTP);
goog.exportSymbol('WebGLEarth.prototype.addOSMTP',
                  we.App.prototype.addOSMTP);
goog.exportSymbol('WebGLEarth.prototype.addAllBingTPs',
                  we.App.prototype.addAllBingTPs);
goog.exportSymbol('WebGLEarth.prototype.addCustomTP',
                  we.App.prototype.addCustomTP);
