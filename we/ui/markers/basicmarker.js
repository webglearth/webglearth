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
 * @fileoverview Base object for markers.
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.ui.markers.BasicMarker');

goog.require('goog.dom');

goog.require('we.ui.markers.AbstractMarker');



/**
 * @inheritDoc
 * @extends {we.ui.markers.AbstractMarker}
 * @constructor
 */
we.ui.markers.BasicMarker = function(lat, lon) {

  var image =
      'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48IURPQ1RZUEUgc3Zn' +
      'PjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMy' +
      'IiB3aWR0aD0iMTYiIHZlcnNpb249IjEuMSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUo' +
      'MCwtMTAyMC4zNjIyKSI+PHBhdGggc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIgZD0ibTE1' +
      'LDcuODdjMCwzLjQ3LTIuNzcsNi4yOC02LjE5LDYuMjhzLTYuMTktMi44MS02LjE5LTYu' +
      'MjgsMi43Ny02LjI4LDYuMTktNi4yOCw2LjE5LDIuODEsNi4xOSw2LjI4em0tNi4xNiwy' +
      'My4ydi0xNi41IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0idHJhbnNsYXRl' +
      'KC0wLjcwNzEwNjc4LDEwMjAuNzE1OCkiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVj' +
      'YXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjFweCIgZmlsbD0iI2UxMzUxZSIvPjwvZz48' +
      'L3N2Zz4=';

  var elementStyle = 'position:absolute;width:16px;height:32px;' +
                     'background-image:url(data:image/svg+xml;base64,' + image +
                     ');margin:-32px 0 0 -8px;opacity:0.8;';

  var el = goog.dom.createDom('div', {style: elementStyle});

  goog.base(this, lat, lon, /** @type {!HTMLElement} */ (el));

  this.show(false);
};
goog.inherits(we.ui.markers.BasicMarker, we.ui.markers.AbstractMarker);

