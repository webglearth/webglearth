
/**
 * @fileoverview Contains abstract class describing object providing tiles.
 *
 * @author Petr Sloup <petr.sloup@klokantech.com>
 *
 */

goog.provide('we.texturing.TileProvider');

goog.require('goog.debug.Logger');

goog.require('we.texturing.Tile');
goog.require('we.texturing.Tile.State');



/**
 * Abstract class describing object providing tiles
 * @param {string} name Name.
 * @constructor
 */
we.texturing.TileProvider = function(name) {
  /**
   * @type {string}
   */
  this.name = name;
};


/**
 * @return {number} Minimum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMinZoomLevel = function() {return 0;};


/**
 * @return {number} Maximum zoom level of this TileProvider.
 */
we.texturing.TileProvider.prototype.getMaxZoomLevel = goog.abstractMethod;


/**
 * @return {number} Size of one side of the tile in pixels.
 */
we.texturing.TileProvider.prototype.getTileSize = goog.abstractMethod;


/**
 * @param {number} zoom Zoom level.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {string} URL of the tile.
 */
we.texturing.TileProvider.prototype.getTileURL = goog.abstractMethod;


/**
 * @type {!function(we.texturing.Tile)}
 */
we.texturing.TileProvider.prototype.tileLoadedHandler = goog.nullFunction;


/**
 * Number of currently loading tiles.
 * @type {number}
 */
we.texturing.TileProvider.prototype.loadingTileCounter = 0;


/**
 * Determines URL for given tile and starts loading it.
 * @param {!we.texturing.Tile} tile Tile to be loaded.
 * @return {boolean} Returns whether the TileProvider is ready to load the tile.
 */
we.texturing.TileProvider.prototype.loadTile = function(tile) {
  tile.image = new Image();
  var onload = function(tileprovider) {return (function() {
    //if (goog.DEBUG)
    //  we.texturing.TileProvider.logger.info('Loaded tile ' + tile.getKey());
    tile.state = we.texturing.Tile.State.LOADED;
    tileprovider.loadingTileCounter--;
    tileprovider.tileLoadedHandler(tile);
  })};
  var onerror = function(tileprovider) {return (function() {
    if (goog.DEBUG) {
      we.texturing.TileProvider.logger.severe('Error loading tile: ' +
                                              tile.getKey());
    }
    tile.state = we.texturing.Tile.State.ERROR;
    tileprovider.loadingTileCounter--;
  })};
  tile.image.onload = onload(this);
  tile.image.onerror = onerror(this);
  tile.state = we.texturing.Tile.State.LOADING;
  tile.image.src = this.getTileURL(tile.zoom, tile.x, tile.y);
  //if (goog.DEBUG)
  //  we.texturing.TileProvider.logger.info('Loading tile ' + tile.getKey());

  this.loadingTileCounter++;

  return true;
};


/**
 * Fills given Element with copyright info.
 * @param {!Element} element Element where the copyright info
 * should be appended to.
 */
we.texturing.TileProvider.prototype.appendCopyrightContent =
    function(element) {};


/**
 * Returns URL of the logo that should be displayed somewhere.
 * @return {?string} Url of the logo or null if not required.
 */
we.texturing.TileProvider.prototype.getLogoUrl = function() {return null;};


/**
 * @type {!function(we.texturing.TileProvider)}
 */
we.texturing.TileProvider.prototype.copyrightInfoChangedHandler =
    goog.nullFunction;

if (goog.DEBUG) {
  /**
   * Shared logger instance
   * @type {goog.debug.Logger}
   */
  we.texturing.TileProvider.logger =
      goog.debug.Logger.getLogger('we.texturing.TileProvider');
}
