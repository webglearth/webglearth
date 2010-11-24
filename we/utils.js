
/**
 * @fileoverview Contains some useful functions.
 *
 * @author slouppetr@gmail.com (Petr Sloup)
 *
 */

goog.provide('we.utils');


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
