
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
goog.require('goog.ui.AutoComplete.EventType');

goog.require('we.debug');
goog.require('we.gl.Context');
goog.require('we.scene.Scene');
goog.require('we.scene.rendershapes.Plane');
goog.require('we.scene.rendershapes.Sphere');
goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.GenericTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.TileProvider');
goog.require('we.ui.MouseZoomer');
goog.require('we.ui.SceneDragger');

goog.require('wedemo.ui.Nominatim');
goog.require('wedemo.ui.RenderShapeSelector');
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

    var upgradeRedirector = function() {
      window.document.location = 'http://www.webglearth.com/upgrade.html';
    }
      
    /**
     * @type {!we.gl.Context}
     */
    this.context = new we.gl.Context(/** @type {!Element} */(canvas),
        goog.dom.getElement('wedemo-fpsbox'), upgradeRedirector);
    this.context.setPerspective(50, 0.000001, 5);

    /**
     * @type {!goog.Timer}
     */
    this.loopTimer = new goog.Timer(15);
    goog.events.listen(
        this.loopTimer,
        goog.Timer.TICK,
        goog.bind(function() {this.context.renderFrame();}, this)
    );

    this.context.scene = new we.scene.Scene(this.context,
        goog.dom.getElement('wedemo-infobox'),
        goog.dom.getElement('wedemo-mapcopyright'),
        goog.dom.getElement('wedemo-maplogo'));

    /**
     * @type {!we.ui.SceneDragger}
     * @private
     */
    this.dragger_ = new we.ui.SceneDragger(this.context.scene);

    /**
     * @type {!we.ui.MouseZoomer}
     * @private
     */
    this.zoomer_ = new we.ui.MouseZoomer(this.context.scene);

    /**
     * @type {!wedemo.ui.TileProviderSelector}
     * @private
     */
    this.tpSelector_ = new wedemo.ui.TileProviderSelector(this.context.scene,
        /** @type {!Element} */(goog.dom.getElement('wedemo-tileprovider')));

    /**
     * @type {!wedemo.ui.RenderShapeSelector}
     * @private
     */
    this.rsSelector_ = new wedemo.ui.RenderShapeSelector(this.context.scene,
        /** @type {!Element} */(goog.dom.getElement('wedemo-rendershape')));


    /**
     * @type {!Element}
     */
    var nominatimInput = /** @type {!Element} */
        (goog.dom.getElement('wedemo-nominatim'));

    /**
     * @type {!wedemo.ui.Nominatim}
     * @private
     */
    this.nominatim_ = new wedemo.ui.Nominatim(nominatimInput);

    var runNominatimAction = goog.bind(function(item) {
      this.context.scene.setCenter(item['lon'], item['lat']);
    }, this);

    this.nominatim_.addEventListener(goog.ui.AutoComplete.EventType.UPDATE,
        function(e) {
          runNominatimAction(e.row);
        });

    goog.events.listen(goog.dom.getElement('wedemo-nominatimform'),
        goog.events.EventType.SUBMIT, goog.bind(function(e) {
          e.preventDefault();
          this.nominatim_.search(nominatimInput.value, 1, function(t, result) {
            if (result.length > 0) {
              runNominatimAction(result[0]);
            }
          });
        }, this));


    var updateHash = function() {
      var newhash = '#zoom=' + this.context.scene.zoomLevel.toFixed(2) +
          ';long=' + goog.math.toDegrees(
              this.context.scene.longitude).toFixed(5) +
          ';lat=' + goog.math.toDegrees(
              this.context.scene.latitude).toFixed(5);
      window.location.hash = newhash;
    }

    var fromHash = goog.bind(function() {
      var hash = window.location.hash;
      var getValue = function(name) {
        var start = hash.indexOf(name + '=') + name.length + 1;
        var end = hash.indexOf(';', start);
        return hash.substring(start, end > 0 ? end : hash.length);
      }
      this.context.scene.setZoom(getValue('zoom'));
      this.context.scene.setCenter(getValue('long'), getValue('lat'));
    }, this);

    /**
     * @type {!goog.Timer}
     */
    this.hashUpdateTimer = new goog.Timer(2000);
    goog.events.listen(this.hashUpdateTimer, goog.Timer.TICK,
        goog.bind(updateHash, this)
    );
    this.hashUpdateTimer.start();

    window.addEventListener(goog.events.EventType.HASHCHANGE,
                            fromHash, false);

    fromHash();

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
 * Adds rendershape
 * @param {string} name Name to be displayed.
 * @param {!we.scene.rendershapes.RenderShape} rendershape RenderShape to add.
 */
wedemo.App.prototype.addRenderShape = function(name, rendershape) {
  this.rsSelector_.addRenderShape(name, rendershape);
};


/**
 * Starts the inner loop
 */
wedemo.App.prototype.start = function() {
  if (goog.DEBUG) {
    wedemo.logger.info('Starting the loop...');
  }
  this.context.resize();
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

  if (!COMPILED) {
    app.addTileProvider(
        new we.texturing.GenericTileProvider('Local TMS',
            './natural-earth-III-balanced-001.merc/{z}/{x}/{y}.jpg',
            0, 5, 256, true));
  }
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'Aerial'));
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'AerialWithLabels'));
  app.addTileProvider(
      new we.texturing.BingTileProvider(wedemo.BING_KEY, 'Road'));
  app.addTileProvider(new we.texturing.OSMTileProvider());

  app.addRenderShape('Sphere',
                     new we.scene.rendershapes.Sphere(app.context.scene));
  app.addRenderShape('Flat',
                     new we.scene.rendershapes.Plane(app.context.scene));

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
