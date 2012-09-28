/*
 * Copyright (C) 2012 Klokan Technologies GmbH (info@klokantech.com)
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
 * @fileoverview WebGL Earth API export definitions.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('weapi.exports.Polygon');

goog.require('we.ui.EditablePolygon');



/**
 * @param {!weapi.App} app .
 * @constructor
 * @extends {we.ui.EditablePolygon}
 */
weapi.exports.Polygon = function(app) {
  goog.base(this, /** @type {!we.scene.Scene} */(app.context.scene),
            app.markerManager);
};
goog.inherits(weapi.exports.Polygon, we.ui.EditablePolygon);

goog.exportSymbol('WebGLEarth.Polygon', weapi.exports.Polygon);

goog.exportSymbol('WebGLEarth.Polygon.prototype.enableClickToAdd',
                  weapi.exports.Polygon.prototype.enableClickToAdd);
goog.exportSymbol('WebGLEarth.Polygon.prototype.disableClickToAdd',
                  weapi.exports.Polygon.prototype.disableClickToAdd);

goog.exportSymbol('WebGLEarth.Polygon.prototype.setFillColor',
                  weapi.exports.Polygon.prototype.setFillColor);
goog.exportSymbol('WebGLEarth.Polygon.prototype.setStrokeColor',
                  weapi.exports.Polygon.prototype.setStrokeColor);

goog.exportSymbol('WebGLEarth.Polygon.prototype.setOnChange',
                  weapi.exports.Polygon.prototype.setOnChange);
goog.exportSymbol('WebGLEarth.Polygon.prototype.isValid',
                  weapi.exports.Polygon.prototype.isValid);
goog.exportSymbol('WebGLEarth.Polygon.prototype.getRoughArea',
                  weapi.exports.Polygon.prototype.getRoughArea);

goog.exportSymbol('WebGLEarth.Polygon.prototype.setIcon',
                  weapi.exports.Polygon.prototype.setIcon);
goog.exportSymbol('WebGLEarth.Polygon.prototype.showDraggers',
                  weapi.exports.Polygon.prototype.showDraggers);

goog.exportSymbol('WebGLEarth.Polygon.prototype.addPoint',
                  weapi.exports.Polygon.prototype.addPoint);
goog.exportSymbol('WebGLEarth.Polygon.prototype.movePoint',
                  weapi.exports.Polygon.prototype.movePoint);
goog.exportSymbol('WebGLEarth.Polygon.prototype.removePoint',
                  weapi.exports.Polygon.prototype.removePoint);

goog.exportSymbol('WebGLEarth.Polygon.prototype.getPoints',
                  weapi.exports.Polygon.prototype.getPoints);
