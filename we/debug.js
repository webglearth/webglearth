
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
