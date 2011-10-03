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
 * @fileoverview Object representing UI popup.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.markers.Popup');

goog.require('goog.dom');

goog.require('we.utils');



/**
 * @param {string} contentHTML HTML content of the popup.
 * @param {number=} opt_maxWidth Maximal width of the popup (default = 300).
 * @param {boolean=} opt_closeButton Create close button? (default = true).
 * @constructor
 */
we.ui.markers.Popup = function(contentHTML, opt_maxWidth, opt_closeButton) {


  var content = goog.dom.createDom('div', {'class': 'we-pp-content'});
  content.innerHTML = contentHTML;

  var contentwrap = goog.dom.createDom('div',
                                       {'class': 'we-pp-wrapper'}, content);

  var tipcontainer = goog.dom.createDom(
      'div', {'class': 'we-pp-tip-cont'},
      goog.dom.createDom('div', {'class': 'we-pp-tip'}));

  /**
   * @type {!HTMLElement}
   * @private
   */
  this.popup_ = /** @type {!HTMLElement} */
      (goog.dom.createDom('div', {'class': 'we-pp'}));

  if (opt_closeButton !== false) {
    var closebutton = goog.dom.createDom('a',
                                         {'class': 'we-pp-close', 'href': '#'});
    closebutton.onclick = goog.bind(this.show, this, false);
    goog.dom.appendChild(this.popup_, closebutton);
  }
  goog.dom.appendChild(this.popup_, contentwrap);
  goog.dom.appendChild(this.popup_, tipcontainer);

  var width = (opt_maxWidth || 300);
  this.popup_.style.width = width.toFixed(0) + 'px';
  this.popup_.style.left = (-width / 2).toFixed(0) + 'px';

  this.show(false);
};


/**
 * @return {!HTMLElement} Element.
 */
we.ui.markers.Popup.prototype.getElement = function() {
  return this.popup_;
};


/**
 * Adjust some properties of this popup.
 * @param {number} markerHeight Height of the marker this popup is attached to.
 */
we.ui.markers.Popup.prototype.adjust = function(markerHeight) {
  this.popup_.style.bottom = markerHeight.toFixed(0) + 'px';
};


/**
 * Shows or hides the popup.
 * @param {boolean} visible Visible?
 */
we.ui.markers.Popup.prototype.show = function(visible) {
  if (visible) {
    this.popup_.style.opacity = 1.0;
    this.popup_.style.visibility = 'visible';
  } else {
    this.popup_.style.opacity = 0.0;

    //this breaks the fade-out animation, but is important to fix dragging
    //TODO: timeout and then visibility:hidden ?
    this.popup_.style.visibility = 'hidden';
  }
};


we.utils.addCss(
    '.we-pp-content p{margin:18px 0;text-align:justify;}' +
    '.we-pp-wrapper{padding:1px;text-align:left;border-radius:20px;}' +
    '.we-pp{z-index:100;-webkit-transition:opacity 0.2s linear;' +
    '-moz-transition:opacity 0.2s linear;-o-transition:opacity 0.2s linear;' +
    'transition:opacity 0.2s linear;position:absolute;}' +
    '.we-pp-wrapper,.we-pp-tip{background:white;box-shadow:0 1px 10px #888;' +
    '-moz-box-shadow:0 1px 10px #888;-webkit-box-shadow:0 1px 14px #999;}' +
    '.we-pp-close{background-image:url(data:image/png;base64,iVBORw0KGgoAAAAN' +
    'SUhEUgAAAAoAAAAKCAMAAAC67D+PAAAAk1BMVEX////Ny8vNy8vNy8vNy8vNy8vNy8vNy8vN' +
    'y8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vN' +
    'y8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vNy8vN' +
    'y8vNy8vNy8vNy8vNy8sw0horAAAAMHRSTlMA/bGBFK1LgjellwUx2+VZo73SE6z5fQYOtzLR' +
    'pxI22CC4g6ieV+yAEc8/ZocEHTzU+GNbAAAAV0lEQVQI1wXBBQKDMADAwLRl7szdgCks/3/d' +
    '7hh0ehl0W21IwZgNR44nTNVZribmC1WXqzVstmpIALu9Gg5HOJ1VNV64arjd1YKy8sEz+nrD' +
    '51tD0//xB/w6CnrIHetcAAAAAElFTkSuQmCC);position:absolute;top:9px;' +
    'right:9px;width:10px;height:10px;overflow:hidden;}' +
    '.we-pp-content{display:inline-block;margin:19px;' +
    'font:12px/1.4 "Helvetica Neue",Arial,Helvetica,sans-serif;}' +
    '.we-pp-tip-cont{margin:0 auto;width:40px;height:16px;position:relative;' +
    'overflow:hidden;}' +
    '.we-pp-tip{width:15px;height:15px;padding:1px;margin:-8px auto 0;' +
    '-moz-transform:rotate(45deg);-webkit-transform:rotate(45deg);' +
    '-o-transform:rotate(45deg);transform:rotate(45deg);}'
);
