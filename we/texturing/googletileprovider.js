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
 * @fileoverview Tile provider for Google maps.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author petr.pridal@klokantech.com (Petr Pridal)
 *
 */

goog.provide('we.texturing.GoogleTileProvider');

goog.require('goog.functions');
goog.require('goog.string');
goog.require('goog.structs.Set');

goog.require('we.texturing.TileProvider');
goog.require('we.texturing.TileProvider.AreaDescriptor');



/**
 * Tile provider for Google maps
 * @constructor
 * @param {!we.texturing.GoogleTileProvider.MapTypes} mapTypeId Type of the map.
 * @param {number=} opt_layerId ID of the layer to use - defaults to 0.
 * @param {Function=} opt_onGotReady Function to call when this TP gets ready.
 * @extends {we.texturing.TileProvider}
 * @inheritDoc
 */
we.texturing.GoogleTileProvider = function(mapTypeId,
                                           opt_layerId, opt_onGotReady) {
  goog.base(this, 'Google Maps - ' + mapTypeId);

  var scriptPath = 'http://maps.google.com/maps/api/' +
                   'js?v=3.5&sensor=false&callback=';

  /**
   * @type {google.maps.MapType}
   * @private
   */
  this.mapType_ = null;

  /**
   * @type {!we.texturing.GoogleTileProvider.MapTypes}
   * @private
   */
  this.mapTypeId_ = mapTypeId;

  /**
   * @type {number}
   * @private
   */
  this.layerId_ = opt_layerId || 0;

  /**
   * @type {Function}
   * @private
   */
  this.onGotReady_ = opt_onGotReady || goog.nullFunction;

  /**
   * @type {!goog.structs.Set}
   * @private
   */
  this.copyrights_ = new goog.structs.Set();

  /**
   * @type {number}
   * @private
   */
  this.loadingCopyrightsNum_ = 0;

  /**
   * @type {!Array.<!Element>}
   * @private
   */
  this.loadingCopyrights_ = [];

  var pickType = goog.bind(function() {
    this.mapType_ =
        we.texturing.GoogleTileProvider.sharedMapInstance.mapTypes[
        we.texturing.GoogleTileProvider.MapTypes.toGoogleMapsType(mapTypeId)];
    this.gotReady();
    this.onGotReady_();
  }, this);

  var onscriptload = function() {
    if (goog.isNull(we.texturing.GoogleTileProvider.sharedMapInstance)) {
      //Create Map instance
      we.texturing.GoogleTileProvider.sharedMapInstance =
          new google.maps.Map(goog.dom.createElement('div'));
    }

    if (we.texturing.GoogleTileProvider.sharedMapInstanceReady) {
      //Instance ready, pick MapType
      pickType();
    } else {
      //Not ready, join waiting queue
      google.maps.event.addListenerOnce(
          we.texturing.GoogleTileProvider.sharedMapInstance, 'idle',
          function() {
            we.texturing.GoogleTileProvider.sharedMapInstanceReady = true;
            pickType();
          });
    }
  }

  if (goog.isDefAndNotNull(goog.global['google']) &&
      google.maps &&
      google.maps.Map) {
    //Main script loaded
    onscriptload();
  } else if (!goog.isNull(
      we.texturing.GoogleTileProvider.sharedScriptCallbackName)) {
    //Already waiting for the script to load, join the callback queue
    goog.global[we.texturing.GoogleTileProvider.sharedScriptCallbackName] =
        goog.functions.sequence(
        goog.global[we.texturing.GoogleTileProvider.sharedScriptCallbackName],
        goog.bind(onscriptload, this));

  } else {
    //Not loaded and not waiting, start loading and wait on callback
    we.texturing.GoogleTileProvider.sharedScriptCallbackName =
        'googleMapsCallback' + goog.string.getRandomString();

    goog.global[we.texturing.GoogleTileProvider.sharedScriptCallbackName] =
        goog.bind(onscriptload, this);

    var scriptEl = goog.dom.createElement('script');
    goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);
    scriptEl.type = 'text/javascript';
    scriptEl.src =
        scriptPath + we.texturing.GoogleTileProvider.sharedScriptCallbackName;
  }

};
goog.inherits(we.texturing.GoogleTileProvider, we.texturing.TileProvider);


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.isReady = function() {
  return !goog.isNull(this.mapType_);
};


/**
 * @type {?string}
 */
we.texturing.GoogleTileProvider.sharedScriptCallbackName = null;


/**
 * @type {google.maps.Map}
 */
we.texturing.GoogleTileProvider.sharedMapInstance = null;


/**
 * @type {boolean}
 */
we.texturing.GoogleTileProvider.sharedMapInstanceReady = false;


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getMinZoomLevel = function() {
  return goog.isNull(this.mapType_) ? 0 : (this.mapType_.minZoom || 0);
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getMaxZoomLevel = function() {
  return goog.isNull(this.mapType_) ? 18 : this.mapType_.maxZoom;
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getTileSize = function() {
  //TODO: Somehow handle non-square possibility
  return goog.isNull(this.mapType_) ? 256 : this.mapType_.tileSize.width;
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.loadTileInternal =
    function(tile, onload, opt_onerror) {
  var onload_ = function() {
    //TODO: better check if final tile is loaded
    if (tile.getImage().src != tile.getImage()['__src__']) return;
    tile.state = we.texturing.Tile.State.LOADED;
    this.loadingTileCounter--;
    onload(tile);
  };

  var onerror_ = function() {
    if (goog.DEBUG) {
      we.texturing.TileProvider.logger.severe('Error loading tile: ' +
                                              tile.getKey() + ' (' +
                                              this.name + ')');
    }
    tile.failed++;
    tile.state = we.texturing.Tile.State.ERROR;
    this.loadingTileCounter--;
    if (opt_onerror) opt_onerror(tile);
  };

  var imageGetter = goog.bind(function(node) {
    var imgs = node.getElementsByTagName('img');
    return imgs[this.layerId_] || imgs[0];
  }, this);

  tile.customImageGetter = imageGetter;

  var dataDisposer = function(node) {
    this.mapType_.releaseTile(node);
  };

  tile.customDataDisposer = goog.bind(dataDisposer, this);

  var node_ = this.mapType_.getTile(new google.maps.Point(tile.x, tile.y),
                                    tile.zoom, document);

  var img = imageGetter(node_);

  img.onload = goog.bind(onload_, this);
  img.onerror = goog.bind(onerror_, this);
  tile.setData(node_);

  tile.state = we.texturing.Tile.State.LOADING;

  this.loadingTileCounter++;

  //Loading was finished before attaching onload event
  /*if (img.complete && tile.state != we.texturing.Tile.State.LOADED) {
    if (goog.DEBUG)
      we.texturing.TileProvider.logger.info(
          'Google tile loaded too soon - fixing...');
    onload_(tile);
  }*/

};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.appendCopyrightContent =
    function(element) {
  if (this.copyrights_.getCount() > 0) {
    goog.dom.append(element, 'Map Data © ' + new Date().getFullYear() +
                    ' ' + this.copyrights_.getValues().join(', ') + ' – ');
  }
  goog.dom.append(element, goog.dom.createDom('a',
      {href: 'http://www.google.com/intl/en-US_US/help/terms_maps.html',
        target: '_blank'},
      'Terms of Use'));
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.getLogoUrl = function() {
  // return 'http://maps.gstatic.com/mapfiles/google_white.png';
  return 'data:image/png;base64,' +
      'iVBORw0KGgoAAAANSUhEUgAAAD4AAAAYCAMAAACV6r5dAAABI1BMVEUAAAAAAAAAAAAAAA' +
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABx' +
      'cXEAAAAAAAAAAAAAAAAAAAAAAAAAAAAJCQkLCwsRERESEhIZGRkjIyMsLCw6OjpNTU1WVl' +
      'ZhYWFvb28AAABycnJ5eXl8fHzc3NyFhYWGhoaHiIeLi4uSkpKWlpaYmJiampqenp6mpqah' +
      'oaGlpaWhoaGpqampqamrq6uqqqqur66vr6+usK6ysrK4uLi9vb3CwsLExMTJycnNzc3Q0N' +
      'DT09PU1NTV1dXX19fZ2dmDg4Pg4ODi4uLj4+Pj4+Pl5eXk5OTl5eXk5OTl5eXk5OTo6Ojq' +
      '6urv7+/x8fH5+fn9/f3////54OudAAAAYHRSTlNgXlpSTUY/Pjs5NTMwLSsoJiQiIB4cGh' +
      'cUEgoBAAYXJy43QElWWV1SFRwQQp2LiaQyqYmwRIi1hwi5hyiEWrxsfwW/xMTJycW3qA2a' +
      'jweNi4+YAdios7vFy5/g6vD2/P7aB358AAADLElEQVR4XpWUe3OiSBTFOxpMfDsqKt2dZG' +
      'eiBBlx8zABx3EiZBJk8phsMyb4wvv9P8VexCpnq7aym/PX6Uv/qpt7uBDOuRB8IzRva2AY' +
      'xinbbkNcrKvTqdGrMvtt2hoG4Es63+JIa9PAM03PX81GNf1NXPAR3O5av+GCn858kvlQLe' +
      '+bcJfRORORYuB3G/sHuJXsbZ1wZbYgaU23bPrxcqd4wGMygsQ/bKynCN/WCTegsxtfWa8d' +
      'HVhxe3oNigTaZ+OzorPIDofD62EtOv0H14a4RUGKKLOwWUAIxWxLcPr8apo+jDOHXJlGdu' +
      'XldT6YeuNwdWeWI5wNgnusf61YnJyu5uSQb4THTBckV8m44GaVl3kiV0n54JTkmZvKmeCT' +
      '6PTUYPFtv7q3AFURZAgLUuds0xw+hG+7skVPQlCv4UzSbNqFkDxAK23lfThb49MVyQ8e/J' +
      'tWXZDeKmy1t0n8BRd7GH47gL4LHQyCF2fwJ9q8YPfQLyGenC3V+8moKRUOOTlewFX+ERP9' +
      'YaA+T8DZwxX7BTe3cJG1GVde4MqBm/QjN0CN8J0ZdLrpUlU/YJxQD+Y7mhDYZRNv7MFd0s' +
      'JMnuHiNo6Y/oJOawnn5ePASTSe8HkAV/uyrq+DYydL+J7BmChNz8NPXVg265jZBMg5duUI' +
      '669LkjlxfXfhJGSOuPSAe5Q4eSKULytw/6C4qmAz02NwU4z3wn4i/QLfs4wPw7NdrZ5NzK' +
      'GTstafTdqHebfUGAyYIPyx3fVhOXm6vr5f+M1q1gn9kRH0E8d0zw1dtJdJ2eY058KyW8M3' +
      'mTvNlg8wCzyZIs7tuqQ6ruuNTJVkNL3YMs2vrYxMLZpXTfNLMyMzakw8x4fVebmnqt3jek' +
      'q96v+U2jpfz7teK2SzxUq7qumM2Uq7UqtpDOt2o12N7OHr/GczlezDItmoVeqKjkC+dKQz' +
      'xONxsi1LtzaTiH7juLB0EcWgSkeaVRiDWheWiAE7nrj/EuP0BdRcNKGjJanheqP/iUdD7n' +
      '/EpOSgL2mcvwtHRbdevk5x/qRP7P24oAX1YuxctnIy5e/HMZrGh0Kx3MY43o1vo/mX3/jf' +
      'zoX94Q7k9zgAAAAASUVORK5CYII=';
};


/** @inheritDoc */
we.texturing.GoogleTileProvider.prototype.requestNewCopyrightInfo =
    function(areas) {
  var scriptPath = 'http://maps.google.com/maps?';

  this.copyrights_ = new goog.structs.Set();

  var origGAddCopyright = goog.global['GAddCopyright'];
  var origGVerify = goog.global['GVerify'];
  var origGAppFeatures = goog.global['GAppFeatures'];

  var GAddCopyright = function() {
    if (arguments.length > 7 && arguments[7].length > 0)
      this.copyrights_.add(arguments[7]);
  }

  var GAppFeatures = function() {
    this.loadingCopyrightsNum_--;

    if (this.loadingCopyrightsNum_ <= 0) {
      //finish
      goog.global['GAddCopyright'] = origGAddCopyright;
      goog.global['GVerify'] = origGVerify;
      goog.global['GAppFeatures'] = origGAppFeatures;

      goog.array.forEach(this.loadingCopyrights_, function(el, index, arr) {
        el.parentNode.removeChild(el);
      });

      this.loadingCopyrights_ = [];

      this.copyrightInfoChangedHandler();
    }
  }

  goog.global['GAddCopyright'] = goog.bind(GAddCopyright, this);
  goog.global['GVerify'] = goog.functions.TRUE;
  goog.global['GAppFeatures'] = goog.bind(GAppFeatures, this);

  goog.array.forEach(areas, function(el, index, arr) {
    var scriptEl = goog.dom.createElement('script');
    goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(scriptEl);
    scriptEl.type = 'text/javascript';

    this.loadingCopyrights_.push(scriptEl);

    scriptEl.src = scriptPath + 'vp=' + el.getCenterInDegreesToString() +
        '&z=' + el.zoomLevel + '&spn=' + el.getSpanInDegreesToString() + '&t=' +
        we.texturing.GoogleTileProvider.MapTypes.toLetterId(this.mapTypeId_);

    this.loadingCopyrightsNum_++;
  }, this);
};


/**
 * Map types.
 * @enum {string}
 */
we.texturing.GoogleTileProvider.MapTypes = {
  TERRAIN: 'Terrain',
  SATELLITE: 'Satellite',
  HYBRID: 'Hybrid',
  ROADMAP: 'Roadmap'
};


/**
 * @param {!we.texturing.GoogleTileProvider.MapTypes} mapType Type of the map.
 * @return {!google.maps.MapTypeId} Description.
 */
we.texturing.GoogleTileProvider.MapTypes.toGoogleMapsType = function(mapType) {
  switch (mapType) {
    case we.texturing.GoogleTileProvider.MapTypes.TERRAIN:
      return google.maps.MapTypeId.TERRAIN;
    case we.texturing.GoogleTileProvider.MapTypes.HYBRID:
      return google.maps.MapTypeId.HYBRID;
    case we.texturing.GoogleTileProvider.MapTypes.ROADMAP:
      return google.maps.MapTypeId.ROADMAP;
    default:
    case we.texturing.GoogleTileProvider.MapTypes.SATELLITE:
      return google.maps.MapTypeId.SATELLITE;
  }
};


/**
 * @param {!we.texturing.GoogleTileProvider.MapTypes} mapType Type of the map.
 * @return {!string} One letter identifier.
 */
we.texturing.GoogleTileProvider.MapTypes.toLetterId = function(mapType) {
  switch (mapType) {
    case we.texturing.GoogleTileProvider.MapTypes.TERRAIN:
      return 'p';
    case we.texturing.GoogleTileProvider.MapTypes.HYBRID:
      return 'h';
    case we.texturing.GoogleTileProvider.MapTypes.ROADMAP:
      return 'm';
    default:
    case we.texturing.GoogleTileProvider.MapTypes.SATELLITE:
      return 'k';
  }
};


/**
 * Ugly hack for Google Maps - make all img tags CORS-enabled
 * TODO: remove when (if) solved
 * @type {function(string): !Element}
 */
we.texturing.GoogleTileProvider.createElementOrig =
    goog.bind(document.createElement, document);


/**
 * @param {string} arg ...
 * @return {!Element} ...
 */
document.createElement = function(arg) {
  var el = we.texturing.GoogleTileProvider.createElementOrig(arg);
  if (arg == 'img')
    el.crossOrigin = '';
  return el;
};
