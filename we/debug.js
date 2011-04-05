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
 * @fileoverview Provides basic debugging features.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.debug');

goog.require('goog.debug.DivConsole');
goog.require('goog.debug.FancyWindow');


/**
 * Initializes and enables debug window.
 */
we.debug.initDebugWindow = function() {
  var debugWindow = new goog.debug.FancyWindow('we-logwindow');
  debugWindow.setEnabled(true);
  debugWindow.init();
};


/**
 * Initializes and enables console div.
 * @param {Element} element The element to append to.
 */
we.debug.initDivConsole = function(element) {
  if (goog.isNull(element)) return;
  var divConsole = new goog.debug.DivConsole(element);
  divConsole.setCapturing(true);
};
