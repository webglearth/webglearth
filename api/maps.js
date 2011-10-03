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
 * @fileoverview WebGL Earth API Maps objects.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi.maps');
goog.provide('weapi.maps.MapType');

goog.require('goog.structs.Map');

goog.require('we.texturing.BingTileProvider');
goog.require('we.texturing.GenericTileProvider');
goog.require('we.texturing.GoogleTileProvider');
goog.require('we.texturing.MapQuestTileProvider');
goog.require('we.texturing.OSMTileProvider');
goog.require('we.texturing.WMSTileProvider');

goog.require('weapi.exports.Map');


/**
 * Constants for map names.
 * @enum {string}
 */
weapi.maps.MapType = {
  'MAPQUEST': 'mapquest',
  'OSM': 'osm',
  'BING': 'bing',
  'WMS': 'wms',
  'GOOGLE': 'gooogle',
  'CUSTOM': 'custom'
};


/**
 * @type {!goog.structs.Map}
 */
weapi.maps.mapMap = new goog.structs.Map();


/**
 * @param {!weapi.maps.MapType} type Type of the map.
 * @param {...*} var_args Optional parameters to be passed to the TileProvider.
 * @return {weapi.exports.Map} Initialized TileProvider.
 */
weapi.maps.initMap = function(type, var_args) {

  /** @type {string} */
  var key = type;
  if (goog.isDefAndNotNull(var_args) && var_args.length > 0)
    key += var_args[0];

  var tileProviderCtor;

  switch (type) {
    case weapi.maps.MapType.MAPQUEST:
      tileProviderCtor = we.texturing.MapQuestTileProvider;
      break;
    case weapi.maps.MapType.OSM:
      tileProviderCtor = we.texturing.OSMTileProvider;
      break;
    case weapi.maps.MapType.BING:
      tileProviderCtor = we.texturing.BingTileProvider;
      break;
    case weapi.maps.MapType.WMS:
      tileProviderCtor = we.texturing.WMSTileProvider;
      break;
    case weapi.maps.MapType.GOOGLE:
      tileProviderCtor = we.texturing.GoogleTileProvider;
      break;
    case weapi.maps.MapType.CUSTOM:
      tileProviderCtor = we.texturing.GenericTileProvider;
      break;
    default:
      alert('Unknown MapType \'' + type + '\' !');
      return null;
      break;
  }

  /*
   * This is a Proxy class for TileProvider which allows me to call TileProvider
   * constructors with var_args.
   */
  function construct(klass, var_args) {
    /**
     * @param {...*} var_args Arguments.
     * @constructor
     */
    function TPProxy(var_args) {
      klass.apply(this, var_args);
    };
    TPProxy.prototype = klass.prototype;
    return new TPProxy(var_args);
  }

  var tileProvider = construct(tileProviderCtor, var_args);

  var map = new weapi.exports.Map(tileProvider);

  weapi.maps.mapMap.set(key, map);

  return map;
};


/**
 * @param {!weapi.maps.MapType} type Type of the map.
 * @param {string=} opt_subtype Optional subtype of the map.
 * @return {weapi.exports.Map} TileProvider.
 */
weapi.maps.getMap = function(type, opt_subtype) {
  /** @type {string} */
  var key = type;
  if (goog.isDefAndNotNull(opt_subtype))
    key += opt_subtype;

  return /** @type {weapi.exports.Map} */ (weapi.maps.mapMap.get(key));
};


/**
 * Initializes maps that does not require any special parameters (keys etc.)
 */
weapi.maps.initStatics = function() {
  weapi.maps.initMap(weapi.maps.MapType.MAPQUEST);
  weapi.maps.initMap(weapi.maps.MapType.OSM);
};
