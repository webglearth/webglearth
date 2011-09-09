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
 * @fileoverview Object managing ClipLevel "N".
 *
 * @author petr.sloup@klokantech.com (Petr Sloup)
 *
 */

goog.provide('we.scene.ClipLevelN');

goog.require('goog.Disposable');



/**
 * Creates "LevelN" texture and starts loading it's content.
 * @param {!we.texturing.TileProvider} tileprovider TileProvider to be cached.
 * @param {!we.gl.Context} context WebGL context.
 * @param {number} zoom Zoom level.
 * @constructor
 * @extends {goog.Disposable}
 */
we.scene.ClipLevelN = function(tileprovider, context, zoom) {
  /**
   * @type {!WebGLRenderingContext}
   * @private
   */
  this.gl_ = context.gl;
  var gl = this.gl_;

  var texture = gl.createTexture();
  /**
   * @type {WebGLTexture}
   */
  this.texture = texture;

  var tileCount = 1 << zoom;
  var tileSize = tileprovider.getTileSize();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tileSize * tileCount,
                tileSize * tileCount, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  var handleLoadedTile = function(tile) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    try {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, tile.x * tileSize,
          (tileCount - tile.y - 1) * tileSize, gl.RGBA,
          gl.UNSIGNED_BYTE, tile.getImage());
    } catch (DOMException) {
      if (tileprovider.canUseProxy() &&
          (tileprovider.setProxyHost(context.proxyHost) ||
          !tile.usedProxy(context.proxyHost))) {
        tileprovider.loadTile(tile, onload, onerror);
      } else {
        //TODO: solve duplicity with ClipLevel::bufferTile_
        context.onCorsError();
      }
    }
  };

  var onload = function(tile) {
    if (!gl.isTexture(texture)) return; //late tile
    handleLoadedTile(tile);
  }

  var onerror = function(tile) {
    if (!gl.isTexture(texture)) return; //late tile
    if (tile.failed >= 3) {
      if (goog.DEBUG)
        we.scene.Scene.logger.warning('The tile failed to load 3x - giving ' +
                                      'up. (' + tileprovider.name + ')');
      return;
    }
    tileprovider.loadTile(tile, onload, onerror);
  }

  for (var x = 0; x < tileCount; ++x) {
    for (var y = 0; y < tileCount; ++y) {
      tileprovider.loadTile(new we.texturing.Tile(zoom, x, y), onload, onerror);
    }
  }
};
goog.inherits(we.scene.ClipLevelN, goog.Disposable);


/** @inheritDoc */
we.scene.ClipLevelN.prototype.disposeInternal = function() {
  //goog.base(this, 'disposeInternal');
  this.gl_.deleteTexture(this.texture);
};
