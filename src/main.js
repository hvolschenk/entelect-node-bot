// include the map loader module
var mapLoader = require('./map'),
// include the current state of the game
stateLoader = require('./state'),
// include the move module
moveLoader = require('./move'),
// include the utility module
util = require('./util');

module.exports = main;

/**
 * Executes the bot and finds the next move
 *
 * @method main
 * @param {String} outputPath The path to write the move file to
 */
function main(outputPath) {
  // get the time the script starts
  var startTime = new Date(),
  // the current state of the game
  state = stateLoader.load(outputPath),
  // the current map
  map = mapLoader.load(outputPath),
  // the move to make
  move = moveLoader.getMove(state),
  /**
   * Logs the time it took to run the script
   *
   * @method logTotalTime
   */
  logTotalTime = function () {
    // the time the script ends
    var endTime = new Date(),
    // the total time that the script took to execute
    runTime = endTime - startTime;
    // log the total time to the terminal
    util.log('The script took ' + runTime + ' milliseconds to execute');
  };
  // log the map to the terminal
  util.log(map);
  // log the move to the terminal
  util.log('Move: ', move);
  // output the chosen move to file
  util.outputMove(move, outputPath, logTotalTime);
};