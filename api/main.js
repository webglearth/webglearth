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
goog.require('we.scene.Scene');
goog.require('we.ui.MouseZoomer');
goog.require('we.ui.SceneDragger');

goog.require('weapi.maps');
goog.require('weapi.maps.MapType');


//Dummy dependencies
goog.addDependency('',
                   ['goog.debug.ErrorHandler', 'goog.events.EventHandler'], []);



/**
 * @param {string} divid Div element ID.
 * @param {Object=} opt_options Options.
 * @constructor
 */
weapi.App = function(divid, opt_options) {

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
      goog.bind(function() {this.context.renderFrame();}, this)
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
      (goog.isDef(opt_options) && 'map' in opt_options) ?
      weapi.maps.getMap(opt_options['map']) : undefined,
      goog.dom.createDom('p', null, 'Powered by ',
      goog.dom.createDom('a',
          {href: 'http://www.webglearth.org/', style: 'color:#00f'},
          'WebGL Earth'),
      '.')
      );

  //Parsing options
  if (goog.isDef(opt_options) && 'zoom' in opt_options) {
    this.context.scene.earth.setZoom(opt_options['zoom']);
  }

  if (goog.isDef(opt_options) && 'center' in opt_options) {
    this.context.scene.camera.setPositionDegrees(opt_options['center'][0],
                                                 opt_options['center'][1]);
  }

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

  this.context.resize();
  this.loopTimer.start();
};


/**
 * @param {!weapi.maps.MapType} type Type of the map.
 * @param {string=} opt_subtype Optional subtype of the map.
 */
weapi.App.prototype.setMap = function(type, opt_subtype) {
  var tileProvider = weapi.maps.getMap(type, opt_subtype);

  if (goog.isDefAndNotNull(tileProvider)) {
    this.context.scene.earth.changeTileProvider(tileProvider);
  }
};
