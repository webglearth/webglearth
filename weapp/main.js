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
 * @fileoverview WebGL Earth Demo Application object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapp');
goog.provide('weapp.App');

goog.require('goog.Timer');
goog.require('goog.debug.Logger');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.AutoComplete.EventType');

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
goog.require('we.ui.markers.BasicMarker');
goog.require('we.ui.markers.MarkerManager');

goog.require('weapp.ui.Nominatim');
goog.require('weapp.ui.PanControl');
goog.require('weapp.ui.TileProviderSelector');
goog.require('weapp.ui.ZoomSlider');

//Dummy dependencies
goog.addDependency('',
                   ['goog.debug.ErrorHandler', 'goog.events.EventHandler'], []);


/**
 * @define {string} Bing Maps API key. Should be set via compiler parameter.
 */
weapp.BING_KEY = '';



/**
 * Creates new WebGL Earth Application object and initializes everything
 * @param {Element} canvas Canvas element.
 * @constructor
 */
weapp.App = function(canvas) {
  if (goog.isNull(canvas)) return;

  if (goog.DEBUG) {
    we.debug.initDivConsole(goog.dom.getElement('weapp-log'));
  }

  var innerInit = function() {
    if (goog.DEBUG)
      weapp.logger.info('Initializing...');

    var upgradeRedirector = function() {
      window.document.location = 'http://www.webglearth.com/upgrade.html';
    }

    /**
     * @type {!we.gl.Context}
     */
    this.context = new we.gl.Context(/** @type {!Element} */(canvas),
        goog.dom.getElement('weapp-fpsbox'), upgradeRedirector);
    this.context.setPerspective(50, 0.000001, 5);

    /**
     * @type {!goog.Timer}
     */
    this.loopTimer = new goog.Timer(15);
    goog.events.listen(
        this.loopTimer,
        goog.Timer.TICK,
        goog.bind(function() {
          this.context.renderFrame();
          this.markerManager_.updateMarkers();
        }, this)
    );

    this.context.scene = new we.scene.Scene(this.context,
        goog.dom.getElement('weapp-infobox'),
        goog.dom.getElement('weapp-mapcopyright'),
        goog.dom.getElement('weapp-maplogo'));

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
     * @type {!weapp.ui.TileProviderSelector}
     * @private
     */
    this.tpSelector_ = new weapp.ui.TileProviderSelector(this.context.scene,
        /** @type {!Element} */(goog.dom.getElement('weapp-tileprovider')));

    /**
     * @type {!weapp.ui.ZoomSlider}
     * @private
     */
    this.zslider_ = new weapp.ui.ZoomSlider(this.context.scene,
        /** @type {!Element} */(goog.dom.getElement('weapp-zoomslider')));

    /**
     * @type {!weapp.ui.PanControl}
     * @private
     */
    this.pcontrol_ = new weapp.ui.PanControl(this.context.scene,
        /** @type {!Element} */(goog.dom.getElement('weapp-pancontrol')));


    /**
     * @type {!Element}
     */
    var nominatimInput = /** @type {!Element} */
        (goog.dom.getElement('weapp-nominatim'));

    /**
     * @type {!weapp.ui.Nominatim}
     * @private
     */
    this.nominatim_ = new weapp.ui.Nominatim(nominatimInput);

    /**
     * @type {!we.ui.markers.MarkerManager}
     * @private
     */
    this.markerManager_ = new we.ui.markers.MarkerManager(this.context.scene,
                                                          canvas.parentNode);

    var nominMarker = new we.ui.markers.BasicMarker(0, 0);
    nominMarker.enable(false);
    this.markerManager_.addMarker('nominatimMarker', nominMarker);

    var runNominatimAction = goog.bind(function(item) {
      this.context.scene.camera.setPosition(item['lat'], item['lon']);
      this.context.scene.camera.tilt = 0;
      nominMarker.enable(true);
      nominMarker.lat = item['lat'];
      nominMarker.lon = item['lon'];
    }, this);

    this.nominatim_.addEventListener(goog.ui.AutoComplete.EventType.UPDATE,
        function(e) {
          runNominatimAction(e.row);
        });

    goog.events.listen(goog.dom.getElement('weapp-nominatimform'),
        goog.events.EventType.SUBMIT, goog.bind(function(e) {
          e.preventDefault();
          this.nominatim_.search(nominatimInput.value, 1, function(t, result) {
            if (result.length > 0) {
              runNominatimAction(result[0]);
            }
          });
        }, this));


    var updateHash = function() {
      var newhash = '#ll=' + goog.math.toDegrees(
          this.context.scene.camera.latitude).toFixed(5) +
          ',' + goog.math.toDegrees(
              this.context.scene.camera.longitude).toFixed(5) +
          (this.context.scene.camera.fixedAltitude ?
          ';alt=' + this.context.scene.camera.getAltitude().toFixed(0) :
          ';z=' + this.context.scene.getZoom().toFixed(2));
      window.location.hash = newhash;
    }

    var fromHash = goog.bind(function() {
      var hash = window.location.hash;
      var getValue = function(name) {
        var start = hash.indexOf(name + '=');
        if (start < 0) {
          return undefined;
        }
        start += name.length + 1;
        var end = hash.indexOf(';', start);
        return hash.substring(start, end > 0 ? end : hash.length);
      }

      var zoom = getValue('zoom') || getValue('z');
      if (!isNaN(zoom))
        this.context.scene.setZoom(zoom);

      var altitude = getValue('alt');
      if (!isNaN(altitude))
        this.context.scene.camera.setAltitude(altitude);

      var ll = getValue('ll');
      if (goog.isDefAndNotNull(ll)) {
        var llsplit = ll.split(',');
        if (llsplit.length > 1 && !isNaN(llsplit[0]) && !isNaN(llsplit[1]))
          this.context.scene.camera.setPosition(llsplit[0], llsplit[1]);
      } else {
        var lat = getValue('lat');
        var lon = getValue('lon') || getValue('long');
        if (!isNaN(lat) && !isNaN(lon))
          this.context.scene.camera.setPosition(lat, lon);
      }
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

    /**
     * @param {!goog.events.BrowserEvent} e Event.
     * @this {weapp.App}
     */
    var addMarker = function(e) {
      if (e.ctrlKey) {
        var coords = this.context.scene.getLatLongForXY(e.offsetX, e.offsetY);
        var marker = new we.ui.markers.BasicMarker(coords[0], coords[1]);
        this.markerManager_.addMarker(null, marker);
        e.preventDefault();
      }
    }
    goog.events.listen(this.context.canvas,
        goog.events.EventType.CLICK,
        goog.bind(addMarker, this));



    goog.events.listen(window.document,
        goog.events.EventType.KEYDOWN,
        function(e) {
          if (e.keyCode == 70 /* 'f' */ && e.ctrlKey) {
            this.fixedAltitude = !this.fixedAltitude;
            e.preventDefault();
          }
        },
        false, this.context.scene.camera);


    if (goog.DEBUG) {
      weapp.logger.info('Done');
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
weapp.App.prototype.addTileProvider = function(tileprovider) {
  this.tpSelector_.addTileProvider(tileprovider);
};


/**
 * Starts the inner loop
 */
weapp.App.prototype.start = function() {
  if (goog.DEBUG) {
    weapp.logger.info('Starting the loop...');
  }
  this.context.resize();
  this.loopTimer.start();
};


/**
 * Run the demo app.
 */
weapp.run = function() {
  if (goog.DEBUG) {
    weapp.logger.info('Running the demo...');
  }

  var app = new weapp.App(goog.dom.getElement('weapp-canvas'));

  if (!COMPILED) {
    app.addTileProvider(
        new we.texturing.GenericTileProvider('Local TMS',
            '../../resources/tms/{z}/{x}/{y}.jpg',
            0, 5, 256, true));
  }

  app.addTileProvider(new we.texturing.MapQuestTileProvider());
  app.addTileProvider(new we.texturing.OSMTileProvider());

  app.addTileProvider(
      new we.texturing.BingTileProvider('Aerial', weapp.BING_KEY));
  app.addTileProvider(
      new we.texturing.BingTileProvider('AerialWithLabels', weapp.BING_KEY));
  app.addTileProvider(
      new we.texturing.BingTileProvider('Road', weapp.BING_KEY));


  app.addTileProvider(new we.texturing.GenericTileProvider('CleanTOPO2',
      '../../resources/terrain/CleanTOPO2/{z}/{x}/{y}.png', 0, 5, 256));

  app.start();
};


if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  weapp.logger = goog.debug.Logger.getLogger('weapp');
}

goog.exportSymbol('WEApp', weapp.run);
