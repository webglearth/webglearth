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
goog.require('we.math.geo');
goog.require('we.scene.CameraAnimator');
goog.require('we.scene.Scene');
goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.GenericTileProvider');
goog.require('we.texturing.GoogleTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.TileProvider');
goog.require('we.ui.MouseZoomer');
goog.require('we.ui.SceneDragger');
goog.require('we.ui.markers.BasicMarker');
goog.require('we.ui.markers.MarkerManager');
goog.require('we.ui.markers.PrettyMarker');
goog.require('weapp.ui.Nominatim');
//goog.require('weapp.ui.OpacitySlider');
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
 * @define {boolean} Use local TMS tiles by default.
 */
weapp.LOCAL_TMS = false;


/**
 * @define {string} CORS-enabled proxy to use.
 */
weapp.PROXY_URL = 'http://srtm.webglearth.com/cgi-bin/corsproxy.fcgi?url=';



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

    this.context.proxyHost = weapp.PROXY_URL;
    var corsErrorOccurred = false;
    this.context.onCorsError = function() {
      if (!corsErrorOccurred) {
        corsErrorOccurred = true;
        //Redirect to the compatibility version on data hosting
        window.location = 'http://data.webglearth.com/';
      }
    };

    this.context.scene = new we.scene.Scene(this.context,
        goog.dom.getElement('weapp-infobox'),
        goog.dom.getElement('weapp-mapcopyright'),
        goog.dom.getElement('weapp-maplogo'));

    this.context.resize();

    /**
     * @type {!we.scene.CameraAnimator}
     * @private
     */
    this.animator_ = new we.scene.CameraAnimator(this.context.scene.camera);

    /**
     * @type {!we.ui.SceneDragger}
     * @private
     */
    this.dragger_ = new we.ui.SceneDragger(this.context.scene, this.animator_);

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

    // /**
    // * @type {!weapp.ui.OpacitySlider}
    // * @private
    // */
    //this.oslider_ = new weapp.ui.OpacitySlider(this.context.scene.earth,
    //    /** @type {!Element} */(goog.dom.getElement('weapp-opacityslider')));


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

    if (goog.DEBUG) {
      window.debugMarker = new we.ui.markers.BasicMarker(0, 0);
      window.debugMarker.enable(false);
      this.markerManager_.addMarker('debugMarker', window.debugMarker);
    }

    var runNominatimAction = goog.bind(function(item) {
      var bounds = item['boundingbox'];

      /*var markerTL = new we.ui.markers.BasicMarker(bounds[0], bounds[2]);
      this.markerManager_.addMarker(null, markerTL);

      var markerBR = new we.ui.markers.BasicMarker(bounds[1], bounds[3]);
      this.markerManager_.addMarker(null, markerBR);*/

      var lat = goog.math.toRadians(parseFloat(item['lat']));
      var lon = goog.math.toRadians(parseFloat(item['lon']));

      var altitude = we.math.geo.calcDistanceToViewBounds(
          goog.math.toRadians(parseFloat(bounds[0])),
          goog.math.toRadians(parseFloat(bounds[1])),
          goog.math.toRadians(parseFloat(bounds[2])),
          goog.math.toRadians(parseFloat(bounds[3])),
          this.context.aspectRatio, this.context.fov);

      var minalt = this.context.scene.earth.calcAltitudeForZoom(
          this.context.scene.getMaxZoom() + 0.1, lat);

      this.animator_.flyTo(lat, lon, Math.max(altitude, minalt));

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
      var pos = this.context.scene.camera.getPositionDegrees();
      var newhash = '#ll=' + pos[0].toFixed(5) + ',' + pos[1].toFixed(5) +
          ';alt=' + this.context.scene.camera.getAltitude().toFixed(0) +
          ';h=' + this.context.scene.camera.getHeading().toFixed(3) +
          ';t=' + this.context.scene.camera.getTilt().toFixed(3);
      window.location.hash = newhash;
    }

    var fromHash = goog.bind(function() {
      var params = window.location.hash.substr(1).split(';');
      var getValue = function(name) {
        name += '=';
        var pair = goog.array.find(params, function(el, i, a) {
          return el.indexOf(name) === 0;});

        if (goog.isDefAndNotNull(pair)) {
          var value = pair.substr(name.length);
          if (value.length > 0)
            return value;
        }
        return undefined;
      }

      var zoom = getValue('zoom') || getValue('z');
      if (!isNaN(zoom))
        this.context.scene.earth.setZoom(zoom);

      var altitude = getValue('alt');
      if (!isNaN(altitude))
        this.context.scene.camera.setAltitude(altitude);

      var tilt = getValue('t');
      if (!isNaN(tilt))
        this.context.scene.camera.setTilt(parseFloat(tilt));

      var heading = getValue('h');
      if (!isNaN(heading))
        this.context.scene.camera.setHeading(parseFloat(heading));

      var ll = getValue('ll');
      if (goog.isDefAndNotNull(ll)) {
        var llsplit = ll.split(',');
        if (llsplit.length > 1 && !isNaN(llsplit[0]) && !isNaN(llsplit[1]))
          this.context.scene.camera.setPositionDegrees(llsplit[0], llsplit[1]);
      } else {
        var lat = getValue('lat');
        var lon = getValue('lon') || getValue('long');
        if (!isNaN(lat) && !isNaN(lon))
          this.context.scene.camera.setPositionDegrees(lat, lon);
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
        var marker = new we.ui.markers.PrettyMarker(coords[0], coords[1],
            'Title', /** @type {!HTMLElement} */ (goog.dom.createDom('span', {},
            'This is an example of new PrettyMarker.' +
            ' You can easily customize this popup and ' +
            'even add links and other objects: ',
            goog.dom.createDom('br'), goog.dom.createDom('br'),
            goog.dom.createDom('a',
            {target: 'blank', href: 'http://www.klokantech.com/'},
            'Klokan Technologies'),
            goog.dom.createDom('br'), goog.dom.createDom('br')/*,
            goog.dom.createDom('iframe',
            {'width': 240, 'height': 210,
              'src': 'http://www.youtube.com/embed/xn8Y3wzLrXo',
              'frameborder': 0}
            )*/)));
        this.markerManager_.addMarker(null, marker);
        e.preventDefault();
      }
    }
    goog.events.listen(this.context.canvas,
        goog.events.EventType.CLICK,
        goog.bind(addMarker, this));

    if (goog.DEBUG) {
      weapp.logger.info('Done');
    }
  }

  if (goog.DEBUG) {
    try {
      innerInit.call(this);
    } catch (e) {
      goog.debug.Logger.getLogger('we.ex').shout('Exception', e);
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

  if (weapp.LOCAL_TMS) {
    app.addTileProvider(
        new we.texturing.GenericTileProvider('Local TMS',
            '../../resources/tms/{z}/{x}/{y}.jpg',
            0, 5, 256, true));
  }

  app.addTileProvider(
      new we.texturing.GoogleTileProvider(
          we.texturing.GoogleTileProvider.MapTypes.SATELLITE));

  app.addTileProvider(
      new we.texturing.GoogleTileProvider(
          we.texturing.GoogleTileProvider.MapTypes.ROADMAP));

  app.addTileProvider(
      new we.texturing.GoogleTileProvider(
          we.texturing.GoogleTileProvider.MapTypes.TERRAIN));

  app.addTileProvider(new we.texturing.MapQuestTileProvider());
  app.addTileProvider(new we.texturing.OSMTileProvider());

  app.addTileProvider(
      new we.texturing.BingTileProvider('Aerial', weapp.BING_KEY));
  app.addTileProvider(
      new we.texturing.BingTileProvider('AerialWithLabels', weapp.BING_KEY));
  app.addTileProvider(
      new we.texturing.BingTileProvider('Road', weapp.BING_KEY));

  if (goog.DEBUG) {
    app.addTileProvider(new we.texturing.GenericTileProvider('CleanTOPO2',
        'http://webglearth.googlecode.com/svn/resources/terrain/CleanTOPO2/' +
        '{z}/{x}/{y}.png', 0, 5, 256));
  }

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
