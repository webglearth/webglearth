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
 * @fileoverview Contains some useful functions.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.utils');

goog.require('goog.math');


/**
 * Downloads content of the file.
 * @param {!string} url Url of the file to download.
 * @param {function(string)=} opt_callback If not set, request is synchronous.
 * @return {!string} Content of the file or empty string if asynchronous.
 */
we.utils.getFile = function(url, opt_callback) {
  var async = goog.isDef(opt_callback);
  var request = new XMLHttpRequest();

  if (async) {
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        opt_callback(request.responseText);
      }
    };
  }

  request.open('GET', url, async);
  request.send(null);

  return async ? '' : request.responseText;
};


/**
 * Chooses random element from the array.
 * @param {Array.<*>} source Source array.
 * @return {*} Random element.
 */
we.utils.randomElement = function(source) {
  return source[goog.math.randomInt(source.length)];
};


/**
 * @param {number} lon in radians.
 * @return {number} Longitude (-PI;+PI].
 */
we.utils.standardLongitudeRadians = function(lon) {
  var standard = goog.math.modulo(lon, 2 * Math.PI);
  return standard > Math.PI ? standard - 2 * Math.PI : standard;
};


/**
 * Appends given text to document's stylesheet.
 * @param {string} cssCode CSS code to append to head.
 */
we.utils.addCss = function(cssCode) {
  var styleEl = goog.dom.createElement('style');
  styleEl.type = 'text/css';
  if (styleEl.styleSheet) {
    styleEl.styleSheet.cssText = cssCode;
  } else {
    styleEl.appendChild(document.createTextNode(cssCode));
  }
  goog.dom.getElementsByTagNameAndClass('head')[0].appendChild(styleEl);
};
