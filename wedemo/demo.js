
/**
 * @fileoverview WebGL Earth Demo Application object.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('wedemo');
goog.provide('wedemo.App');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');

goog.require('we');
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

goog.require('wedemo.ui.TileProviderSelector');

//Dummy dependencies
goog.addDependency('',
                   ['goog.debug.ErrorHandler', 'goog.events.EventHandler'], []);


/**
 * @define {string} Bing Maps API key. Should be set via compiler parameter.
 */
wedemo.BING_KEY = '';



/**
 * Creates new WebGL Earth Application object and initializes everything
 * @param {Element} canvas Canvas element.
 * @constructor
 */
wedemo.App = function(canvas) {
  if (goog.isNull(canvas)) return;

  if (goog.DEBUG) {
    we.debug.initDivConsole(goog.dom.getElement('wedemo-log'));
  }

  var innerInit = function() {
    if (goog.DEBUG)
      wedemo.logger.info('Initializing...');

    /**
     * @type {!we.gl.Context}
     * @private
     */
    this.context_ = new we.gl.Context(/** @type {!Element} */(canvas));
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
     * @type {!wedemo.ui.TileProviderSelector}
     * @private
     */
    this.tpSelector_ = new wedemo.ui.TileProviderSelector(this.context_.scene,
        tpSelectorEl);

    if (goog.DEBUG) {
      wedemo.logger.info('Done');
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
 * Adds tile provider
 * @param {!we.texturing.TileProvider} tileprovider Tile provider.
 */
wedemo.App.prototype.addTileProvider = function(tileprovider) {
  this.tpSelector_.addTileProvider(tileprovider);
};


/**
 * Starts the inner loop
 */
wedemo.App.prototype.start = function() {
  if (goog.DEBUG) {
    wedemo.logger.info('Starting the loop...');
  }
  this.context_.resize();
  this.loopTimer.start();
};


/**
 * Run the demo app.
 */
wedemo.run = function() {
  if (goog.DEBUG) {
    wedemo.logger.info('Running the demo...');
  }

  var app = new wedemo.App(goog.dom.getElement('wedemo-canvas'));

  app.addTileProvider(new we.texturing.MapQuestTileProvider());

  app.addTileProvider(
      new we.texturing.GenericTileProvider('Local TMS',
          './natural-earth-III-balanced-001.merc/{z}/{x}/{y}.jpg',
          0, 5, 256, true));
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'Aerial'));
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'AerialWithLabels'));
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'Road'));
  app.addTileProvider(new we.texturing.OSMTileProvider());

  app.start();
};


if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  wedemo.logger = goog.debug.Logger.getLogger('wedemo');
}

goog.exportSymbol('WEDemoRun', wedemo.run);
