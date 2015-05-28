// include lodash
var _ = require('lodash'),
// include the built-in filesystem module
fs = require('fs'),
// include the built-in path module
path = require('path');

module.exports = {
  /**
   * Logs a message to the console
   *
   * @method log
   * @param {String} aMessage The message to log to the console (multiple)
   */
  log : function () {
    // write the error message to the console
    console.log.apply(this, arguments);
  },
  /**
   * Logs an error to the console
   *
   * @method logError
   * @param {String} aError The error message to log to the console (multiple)
   */
  logError : function () {
    // write the error message to the console
    console.error.apply(this, args);
  },
  /**
   * Outputs the chosen move to file
   *
   * @method outputMove
   * @param {String} aMove The move to make
   * @param {String} aOutputPath The path of where to store the move file
   * @param {Function} aCallback A callback method when the file is written
   */
  outputMove: function(aMove, aOutputPath, aCallback) {
    // the name of the file where the move must be written to
    var moveFile = 'move.txt',
    // the path to where the move file is
    filename = path.join(aOutputPath, moveFile),
    /**
     * logs a filesystem write error
     *
     * @method logWriteError
     * @param {String} aError The error that occurred
     */
    logWriteError = function (aError) {
      // see if an error was passed in
      if (aError) {
        // log the error to the console
        this.logError(aError);
      }
      // see if a callback function was passed in
      if (aCallback && _.isFunction(aCallback)) {
        // run the callback method
        aCallback();
      }
    };
    // check if the move file output path exists
    if (!fs.existsSync(aOutputPath)) {
      // synchronously create the new output path
        fs.mkdirSync(aOutputPath);
    }
    // write the move file
    fs.writeFile(filename, aMove, logWriteError);
  },

  randomInt: function(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
  }
};
