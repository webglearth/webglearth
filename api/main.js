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
 * @fileoverview WebGL Earth API Application object.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi');
goog.provide('weapi.App');

goog.require('goog.Timer');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('we.gl.Context');
goog.require('we.scene.CameraAnimator');
goog.require('we.scene.Scene');
goog.require('we.ui.MouseZoomer');
goog.require('we.ui.ScenePanner');
goog.require('we.ui.SceneTilter');
goog.require('we.ui.markers.MarkerManager');
goog.require('we.ui.markers.PrettyMarker');
goog.require('weapi.maps');
goog.require('weapi.maps.MapType');




//Dummy dependencies
goog.addDependency('',
                   ['goog.debug.ErrorHandler', 'goog.events.EventHandler'], []);



/**
 * @param {string} divid Div element ID.
 * @param {Object=} opt_options Application options.
 * @constructor
 */
weapi.App = function(divid, opt_options) {

  var options = opt_options || {};

  /** @type {Element} */
  var divEl = goog.dom.getElement(divid);

  if (goog.isNull(divEl)) return;


  /** @type {!Element} */
  var canvasEl = goog.dom.createDom('canvas',
      {style: 'width:100%;height:100%;'});


  var upgradeRedirector = function() {
    /** @type {!Element} */
    var upgradeLinkEl = goog.dom.createDom('a',
        {style: 'font-size:110%;display:block;width:100%;top:50%;' +
              'position:relative;text-align:center;color:#800000;' +
              'text-shadow:rgba(0,0,0,0.4) 0 0 6px;',
          href: 'http://www.webglearth.com/upgrade.html'
        }, 'You need a WebGL-enabled browser to run this application.');
    goog.dom.append(/** @type {!Element} */ (divEl), upgradeLinkEl);
  };

  /**
   * @type {!we.gl.Context}
   */
  this.context = new we.gl.Context(canvasEl, null, upgradeRedirector);

  if (!goog.isDefAndNotNull(this.context)) return;

  this.context.setPerspective(50, 0.000001, 5);


  /** @type {!Element} */
  var wrapperEl = goog.dom.createDom('div',
      {style: 'width:100%;height:100%;position:relative;'});

  goog.dom.append(divEl, wrapperEl);
  goog.dom.append(wrapperEl, canvasEl);


  weapi.maps.initStatics();

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


  /** @type {!Element} */
  var maplogoEl = goog.dom.createDom('img',
      {style: 'position:absolute;bottom:0;right:0'});

  /** @type {!Element} */
  var mapcopyrightEl = goog.dom.createDom('div',
      {style: 'position:absolute;bottom:5px;left:5px;width:75%;font-size:8px;' +
            'text-align:justify;color:#fff;font-family:Verdana,Arial;' +
            'text-shadow:rgba(0,0,0,0.8) 0 0 4px;'});

  goog.dom.append(wrapperEl, maplogoEl);
  goog.dom.append(wrapperEl, mapcopyrightEl);

  this.context.scene = new we.scene.Scene(this.context,
      undefined, //infobox
      mapcopyrightEl,
      maplogoEl,
      (goog.isDefAndNotNull(options['map'])) ?
          weapi.maps.getMap(options['map']).tp : undefined,
      goog.dom.createDom('p', null, 'Powered by ',
      goog.dom.createDom('a',
          {href: 'http://www.webglearth.org/', style: 'color:#00f'},
          'WebGL Earth'),
      '.'),
      options['atmosphere'] === false
      );

  /**
   * @type {!we.ui.markers.MarkerManager}
   * @private
   */
  this.markerManager_ = new we.ui.markers.MarkerManager(this.context.scene,
                                                        wrapperEl);
  /* Parsing options */
  /* Some options are parsed somewhere else: map, atmosphere */
  var pos = options['position'];
  var center = options['center'];
  if (goog.isDefAndNotNull(pos) && pos.length > 1) {
    this.context.scene.camera.setPositionDegrees(pos[0], pos[1]);
  } else if (goog.isDefAndNotNull(center) && center.length > 1) {
    this.context.scene.camera.setPositionDegrees(center[0], center[1]);
  }

  var zoom = options['zoom'];
  if (goog.isDefAndNotNull(zoom)) this.context.scene.earth.setZoom(zoom);

  var alt = options['altitude'];
  if (goog.isDefAndNotNull(alt)) this.context.scene.camera.setAltitude(alt);

  var proxy = options['proxyHost'];
  if (goog.isString(proxy)) this.context.proxyHost = proxy;

  /**
   * @type {!we.scene.CameraAnimator}
   * @private
   */
  this.animator_ = new we.scene.CameraAnimator(this.context.scene.camera);

  /**
   * @type {we.ui.ScenePanner}
   * @private
   */
  this.panner_ = null;

  if (options['panning'] !== false) {
    this.panner_ = new we.ui.ScenePanner(this.context.scene, this.animator_);
  }

  /**
   * @type {we.ui.SceneTilter}
   * @private
   */
  this.tilter_ = null;

  if (options['tilting'] !== false) {
    this.tilter_ = new we.ui.SceneTilter(this.context.scene, this.animator_);
  }

  /**
   * @type {we.ui.MouseZoomer}
   * @private
   */
  this.zoomer_ = null;

  if (options['zooming'] !== false) {
    this.zoomer_ = new we.ui.MouseZoomer(this.context.scene);
  }

  this.context.resize();
  this.loopTimer.start();
};


/**
 * DEPRECATED
 * @param {!weapi.maps.MapType} type Type of the map.
 * @param {string=} opt_subtype Optional subtype of the map.
 */
weapi.App.prototype.setMap = function(type, opt_subtype) {
  var map = weapi.maps.getMap(type, opt_subtype);

  if (goog.isDefAndNotNull(map)) {
    this.context.scene.earth.changeTileProvider(map.tp);
  }
};


/**
 * @param {!weapi.exports.Map} map Map.
 */
weapi.App.prototype.setBaseMap = function(map) {
  this.context.scene.earth.changeTileProvider(map.tp);
};


/**
 * @param {weapi.exports.Map} map Map.
 */
weapi.App.prototype.setOverlayMap = function(map) {
  this.context.scene.earth.changeTileProvider(
      goog.isDefAndNotNull(map) ? map.tp : null, false, true);
};


/**
 * Wraps the listener function with a wrapper function
 * that adds some extended event info.
 * @param {function(Event)} listener Original listener function.
 * @return {function(Event)} Wrapper listener.
 * @private
 */
weapi.App.prototype.wrapListener_ = function(listener) {
  return goog.bind(function(e) {
    var coords = this.context.scene.getLatLongForXY(e.offsetX, e.offsetY);

    e.target = this;
    e['latitude'] = goog.isDefAndNotNull(coords) ? coords[0] : null;
    e['longitude'] = goog.isDefAndNotNull(coords) ? coords[1] : null;

    listener(e);
  }, this);
};


/**
 * Register event listener.
 * @param {string} type Event type.
 * @param {function(Event)} listener Function to call back.
 * @return {number?} listenKey.
 */
weapi.App.prototype.on = function(type, listener) {
  var key = goog.events.listen(this.context.canvas, type,
                               this.wrapListener_(listener));

  listener[goog.getUid(this) + '___eventKey_' + type] = key;

  return key;
};


/**
 * Unregister event listener.
 * @param {string|number|null} typeOrKey Event type or listenKey.
 * @param {function(Event)} listener Function that was used to register.
 */
weapi.App.prototype.off = function(typeOrKey, listener) {
  if (goog.isDefAndNotNull(listener)) {
    var key = listener[goog.getUid(this) + '___eventKey_' + typeOrKey];
    if (goog.isDefAndNotNull(key)) goog.events.unlistenByKey(key);
  } else if (!goog.isString(typeOrKey)) {
    goog.events.unlistenByKey(typeOrKey);
  }
};


/**
 * Unregister all event listeners of certain type.
 * @param {string} type Event type.
 */
weapi.App.prototype.offAll = function(type) {
  goog.events.removeAll(this.context.canvas, type);
};


/**
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 * @param {string=} opt_iconUrl URL of the icon to use instead of the default.
 * @param {number=} opt_width Width of the icon.
 * @param {number=} opt_height Height of the icon.
 * @return {!we.ui.markers.PrettyMarker} New marker.
 */
weapi.App.prototype.initMarker = function(lat, lon,
                                          opt_iconUrl, opt_width, opt_height) {
  var mark = new we.ui.markers.PrettyMarker(lat, lon,
                                            opt_iconUrl, opt_width, opt_height);

  this.markerManager_.addMarker(null, mark);

  return mark;
};
