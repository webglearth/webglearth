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
 * @fileoverview New marker type with extended functionality.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 * @author petr.pridal@klokantech.com (Petr Pridal)
 *
 */

goog.provide('we.ui.markers.PrettyMarker');

goog.require('goog.dom');

goog.require('we.ui.markers.AbstractMarker');



/**
 * @inheritDoc
 * @param {string} popuptitle Title of the popup.
 * @param {!HTMLElement} popupcontent Element with content of the popup.
 * @extends {we.ui.markers.AbstractMarker}
 * @constructor
 */
we.ui.markers.PrettyMarker = function(lat, lon, popuptitle, popupcontent) {

  var marker = goog.dom.createDom('div', {'class': 'leaflet-marker-icon'});

  var closebutton = goog.dom.createDom('a',
      {'class': 'leaflet-popup-close-button', 'href': '#'});

  var content = goog.dom.createDom('div', {'class': 'leaflet-popup-content'},
      goog.dom.createDom('h3', {}, popuptitle),
      goog.dom.createDom('p', {}, popupcontent));

  var contentwrap = goog.dom.createDom('div',
      {'class': 'leaflet-popup-content-wrapper'}, content);

  var tipcontainer = goog.dom.createDom(
      'div', {'class': 'leaflet-popup-tip-container'},
      goog.dom.createDom('div', {'class': 'leaflet-popup-tip'}));

  /**
   * @type {!HTMLElement}
   * @private
   */
  this.popup_ = /** @type {!HTMLElement} */
      (goog.dom.createDom('div', {'class': 'leaflet-popup'},
                        closebutton, contentwrap, tipcontainer));

  //wrapper for marker and popup
  var elwrap = goog.dom.createDom('div', {style: 'position:absolute;'},
                                  marker, this.popup_);

  goog.base(this, lat, lon, /** @type {!HTMLElement} */ (elwrap));

  this.show(false);
  this.showPopup(false);

  marker.onclick = goog.bind(this.showPopup, this, true);
  closebutton.onclick = goog.bind(this.showPopup, this, false);

};
goog.inherits(we.ui.markers.PrettyMarker, we.ui.markers.AbstractMarker);


/**
 * Shows or hides the popup.
 * @param {boolean} visible Visible?
 */
we.ui.markers.PrettyMarker.prototype.showPopup = function(visible) {
  if (visible) {
    //center the popup
    this.popup_.style.left = -Math.round((this.popup_.offsetWidth -
        this.element.offsetWidth) / 2) + 'px';
    this.popup_.style.opacity = 1.0;
    this.popup_.style.visibility = 'visible';
  } else {
    this.popup_.style.opacity = 0.0;

    //this breaks the fade-out animation, but is important to fix dragging
    //TODO: timeout and then visibility:hidden ?
    this.popup_.style.visibility = 'hidden';
  }
};
