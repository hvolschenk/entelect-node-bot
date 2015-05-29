// include the built-in filesystem module
var fs = require('fs'),
// include the built-in path module
path = require('path'),
// include the utils module
util = require('./util');

// build the map module as a plain object
module.exports = {
  /**
   * Loads the map file from file
   *
   * @method load
   * @param {String} aOutputPath The path where the file will reside
   */
  load: function(aOutputPath) {
    // the map file name
    var mapFile = 'map.txt',
    // the full path to the file
    filename = path.join(aOutputPath, mapFile),
    // the map text
    mapText = null;
    // check that the file exists
    if (!fs.existsSync(filename)) {
      // log an error, the file was not found
      util.logError('Map file not found: ' + filename);
    }
    else {
      // get the map text
      mapText = fs.readFileSync(filename, 'utf8');
    }
    // return the return object
    return mapText;
  }
};