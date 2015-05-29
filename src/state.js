// include the built-in filesystem module
var fs = require('fs'),
// include the built-in path module
path = require('path'),
// include the utils module
util = require('./util'),
// includes lodash
_ = require('lodash');

// the state module as a plain object
module.exports = {
  /**
   * Loads the game state from file
   *
   * @method load
   * @param {String} aOutputPath The path where the game state will be found each
   * round in a json file named state.json
   */
  load : function (aOutputPath) {
    // the filename of where the file must be loaded from
    var filename = path.join(aOutputPath, 'state.json'),
    // the game state
    gameState;
    // check if the file exists
    if (!fs.existsSync(filename)) {
      // log an error
      util.logError('State file not found: ' + filename);
      // return null as nothing was found
      return null;
    }
    // load the game state
    gameState = this.parse(JSON.parse(fs.readFileSync(filename)));
    // return the full game state
    return gameState;
  },
  /**
   * Parses the game state object into a smaller format
   *
   * @method parse
   * @param {Object} aGameState The current full game state from file
   * @return {Object} The parsed game state object
   */
  parse : function (aGameState) {
    // the new game state object
    var newGameState = {
      enemyAlien : [],
      enemyAlienDirection : 'right',
      enemyAlienFactory : [],
      enemyAlienWaveSize : 3,
      enemyBullet : [],
      enemyLives : 3,
      enemyMissile : [],
      enemyMissileLimit : 1,
      enemyMissileController : [],
      enemyShield : [],
      enemyShip : [],
      playerAlien : [],
      playerAlienDirection : 'right',
      playerAlienFactory : [],
      playerAlienWaveSize : 3,
      playerBullet : [],
      playerLives : 3,
      playerMissile : [],
      playerMissileLimit : 1,
      playerMissileController : [],
      playerShield : [],
      playerShip : [],
    },
    // a list of each row of the playing field
    rows = aGameState.Map.Rows,
    // unparsed player information
    playersInformation = aGameState.Players,
    // a list of type the width needs to be adjusted for
    adjustWidths = ['AlienFactory', 'MissileController', 'Ship'],
    // the player types to look through
    playerTypes = ['player', 'enemy'],
    /**
     * Handles the parsing of a single row of the map
     *
     * @method parseRow
     * @param {Object} aRow The row being parsed
     */
    parseRow = function (aRow) {
      /**
       * Parses a single object in a row
       *
       * @method parseObject
       * @param {Object} The object to parse
       */
      var parseObject = function (aObject) {
        // check that this object is not a wall, we do not need to load walls
        if (aObject !== null && aObject.Type !== 'Wall') {
          // proxy this so we don't need to redeclare all these vars for nothing
          (function () {
            // set whether this object is for our player or for the enemy
            var player = aObject.PlayerNumber === 1 ? 'player' : 'enemy',
            // build the new object to be built
            newObject = {
              id : aObject.Id,
              type : aObject.Type,
              x : aObject.X,
              y : aObject.Y
            },
            // set the new type's name
            type = player + aObject.Type;
            // add the new object to the type array
            newGameState[type].push(newObject);
          }).apply(this);
        }
      };
      // go through each object and parse it
      _.each(aRow, parseObject);
    },
    /**
     * Fixes the width of the object as the X ccordinates are the same
     *
     * @method fixWidth
     * @param {String} aType The name of the type to fix the width for
     */
    fixWidth = function (aType) {
      /**
       * Fixes the width for a certai player type
       *
       * @method fixPlayerWidth
       * @param {String} aPlayerType The player type
       */
      fixPlayerWidth = function (aPlayerType) {
        // the name of the key to fix
        var keyName = aPlayerType + aType,
        // the X-offset of the left hand side of the object
        leftOffset;
        // see if any of this type exists
        if (newGameState[keyName].length > 0) {
          // set the left offset of this type
          leftOffset = newGameState[keyName][0].x;
          // fix the second occurrence
          newGameState[keyName][1].x = leftOffset + 1;
          // fix the third occurence
          newGameState[keyName][2].x = leftOffset + 2;
        }
      };
      // go through each of the player types
      _.each(playerTypes, fixPlayerWidth);
    },
    /**
     * Parses enemy/player information
     *
     * @method loadPlayersInformation
     * @param {Object} aPlayerInformation Unparsed player information
     */
    parsePlayersInformation = function (aPlayersInformation) {
      /**
       * Parses a single player's information
       *
       * @method parsePlayerInformation
       * @param {Object} aPlayerInformation The player's information
       */
      var parseSinglePlayerInformation = function (aPlayerInformation) {
        // whether this is an enemy or a player
        var type = aPlayerInformation.PlayerNumber === 1 ? 'player' : 'enemy',
        // the player's amount of lives left
        lives = aPlayerInformation.Lives,
        // the player's missile limit
        missileLimit = aPlayerInformation.MissileLimit,
        // the direction the player's alien wave is moving
        direction = aPlayerInformation.AlienManager.DeltaX > 0 ? 'right' :
        'left',
        // the player's alien wave size
        alienWaveSize = aPlayerInformation.AlienWaveSize;
        // set the player's lives
        newGameState[type + 'Lives'] = lives;
        // set the player's missile limit
        newGameState[type + 'MissileLimit'] = missileLimit;
        // set the player's aliens' direction
        newGameState[type + 'AlienDirection'] = direction;
        // set the player's alien wave size
        newGameState[type + 'AlienWaveSize'] = alienWaveSize;
      };
      // parse each player's information seperately
      _.each(aPlayersInformation, parseSinglePlayerInformation);
    };
    // go through each row of the map and parse it
    _.each(rows, parseRow);
    // go through each of the type that need their width adjusted
    _.each(adjustWidths, fixWidth);
    // parse the player information
    parsePlayersInformation(playersInformation);
    // return the new game state
    return newGameState;
  }

};
