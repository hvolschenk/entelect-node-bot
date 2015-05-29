// include a list of utility methods
var util = require('./util'),
// include lodash
_ = require('lodash');

// build the "move" module as a plain object
module.exports = {
  /**
   * Decides what the next best move would be
   *
   * @method getMove
   * @param {Object} aState The current state of the game
   * @return {String} The move to make (Nothing|MoveLeft|MoveRight|Shoot|
   * BuildAlienFactory|BuildMissileController|BuildShield)
   */
  getMove : function (aState) {
    // a list of moves to make
    var moves = {
      NOTHING : 'Nothing',
      MOVELEFT : 'MoveLeft',
      MOVERIGHT : 'MoveRight',
      SHOOT : 'Shoot',
      BUILDALIENFACTORY : 'BuildAlienFactory',
      BUILDMISSILECONTROLLER : 'BuildMissileController',
      BUILDSHIELD : 'BuildShield'
    },
    // a list of disallowed moves (ex. There is a bullet one space to the left)
    disallowedMoves = [],
    // the amount of lives the player has
    playerLives = aState.playerLives,
    // the player's ship
    playerShip = aState.playerShip,
    // the player's current x offsets
    playerX = playerShip.map(function (aPlayerShip) {
      // return the x offset of this ship
      return aPlayerShip.x;
    }),
    // the player's y offset
    playerY = playerShip[0] ? playerShip[0].y : 22,
    // the player's shields
    playerShields = aState.playerShield,
    /**
     * Dodges from oncoming projectiles
     *
     * @method dodge
     * @return {String} The move to make (MoveLeft|MoveRight)
     * @return {Null} No move found
     */
    dodge = function () {
      // all enemy projectiles
      var enemyProjectiles = aState.enemyMissile.concat(aState.enemyBullet),
      /**
       * Dodges from projectiles one row above
       *
       * @method dodgeVeryClose
       * @return {String} The move to make (MoveLeft|MoveRight)
       * @return {Null} When no dodge is necessary
       */
      dodgeVeryClose = function () {
        // enemy projectiles in the same row as the player's ship and one left
        var enemyProjectilesOneLeft = _.where(enemyProjectiles, {
          y : playerY - 1,
          x : playerX[0] - 1
        }),
        // enemy projectiles in the same row as the player's ship and one right
        enemyProjectilesOneRight = _.where(enemyProjectiles, {
          y : playerY - 1,
          x : playerX[2] + 1
        });
        // see if there is a bullet to the left of the ship
        if (enemyProjectilesOneLeft.length > 0) {
          // add the 'MoveLeft' command to the list of disallowed moves
          disallowedMoves.push(moves.MOVELEFT);
        }
        // see if there is a bullet to the right of the ship
        if (enemyProjectilesOneRight.length > 0) {
          // add the 'MoveRight' command to the list of disallowed moves
          disallowedMoves.push(moves.MOVERIGHT);
        }
        // return null as a fallback
        return null;
      },
      /**
       * Dodges from projectiles two rows away
       *
       * @method dodgeClose
       * @return {String} The move to make (MoveLeft|MoveRight)
       * @return {Null} When no dodge is necessary
       */
      dodgeClose = function () {
        //enemy projectiles two rows above the ship above the left wing
        var enemyProjectilesTwoAboveLeft = _.where(enemyProjectiles, {
          y : playerY - 2,
          x : playerX[0]
        }),
        //enemy projectiles two rows above the ship above the right wing
        enemyProjectilesTwoAboveRight = _.where(enemyProjectiles, {
          y : playerY - 2,
          x : playerX[2]
        }),
        // enemy projectiles two rows above and one row to the left
        enemyProjectilesTwoAboveTwoLeft = _.where(enemyProjectiles, {
          y : playerY - 2,
          x : playerX[0] - 1
        }),
        // enemy projectiles two rows above and one row to the right
        enemyProjectilesTwoAboveTwoRight = _.where(enemyProjectiles, {
          y : playerY - 2,
          x : playerX[2] + 1
        });
        // see if there is a projectile two rows above to the left
        if (enemyProjectilesTwoAboveLeft.length > 0) {
          // we have to move right now
          return moves.MOVERIGHT;
        }
        // see if there is a projectile two rows above to the right
        if (enemyProjectilesTwoAboveRight.length > 0) {
          // we have to move right now
          return moves.MOVELEFT;
        }
        // see if we will walk into a projectile on the left
        if (enemyProjectilesTwoAboveTwoLeft.length > 0) {
          // we are not allowed to move to the left
          disallowedMoves.push(moves.MOVELEFT);
        }
        // see if we will walk into a projectile on the right
        if (enemyProjectilesTwoAboveTwoRight.length > 0) {
          // we are not allowed to move to the left
          disallowedMoves.push(moves.MOVERIGHT);
        }
        // return null as a fallback
        return null;
      },
      /**
       * Dodges projectiles three rows away
       *
       * @method dodgeMidRange
       * @return {String} The move to make (MoveLeft|MoveRight)
       * @return {Null} When no dodge is necessary
       */
      dodgeMidRange = function () {
        // enemy projectiles three rows away in the middle of the ship
        var enemyProjectilesThreeAboveMiddle = _.where(enemyProjectiles, {
          y : playerY - 3,
          x : playerX[1]
        }),
        // move left
        left = moves.MOVELEFT,
        // move right
        right = moves.MOVERIGHT,
        // a list of directions to dodge
        directions = [left, right];
        // see if any projectiles were found two rows above, middle
        if (enemyProjectilesThreeAboveMiddle.length > 0) {
          // if the projectile is in the first 3 blocks the ship cannot fit past
          if (enemyProjectilesThreeAboveMiddle[0].x < 4) {
            // we have to move right
            return right;
          }
          else {
            // if the projectile is in the last 3 blocks the ship cannot fit
            if (enemyProjectilesThreeAboveMiddle[0].x > 14) {
              // we have to move left
              return left;
            }
          }
          // dodge in a random direction
          return directions[Math.floor(Math.random() * directions.length)];
        }
        // return null a a default
        return null;
      };
      // check all angles and move appropriately
      return dodgeVeryClose() || dodgeClose() || dodgeMidRange();
    },
    /**
     * Fires a shot, aiming to hit enemy aliens
     * 
     * @method shoot
     * @return {String} The move to make (Shoot)
     * @return {Null} When no alien factory is necessary or possible
     */
    shoot = function () {
      /**
       * Checks if an enemy alien will be hit when shooting from the player's
       * current location and then shoots if possible
       *
       * @method shootEnemyAlien
       * @return {String} The move to make (Shoot)
       * @return {Null} When no alien factory is necessary or possible
       */
      var shootEnemyAlien = function () {
        // a list of all enemy aliens
        var enemyAliens = JSON.parse(JSON.stringify(aState.enemyAlien)),
        // a list of friendly shields in front of the player
        shieldsInWay = _.where(playerShields, {x : playerX[1]}),
        /**
         * Whether an enemy alien will be hit from the current location
         *
         * @method canHitEnemyAlien
         * @return {String} The move to make (Shoot)
         * @return {Null} When no alien factory is necessary or possible
         */
        canHitEnemyAlien = function () {
          // the current direction of the enemy aliens
          var direction = aState.enemyAlienDirection,
          // the new fake player missile we will simulate through it's path
          playerMissile = {x : playerX[1], y : playerY-1, simulated : true},
          // a list of player missiles
          playerMissiles = JSON.parse(JSON.stringify(aState.playerMissile)),
          /**
           * Moves all enemy aliens and the player's missile on one space
           * simulating a single round
           *
           * @method simulateRound
           */
          simulateRound = function () {
            // enemy aliens in the very left column of the screen
            var enemyAliensLeft = _.where(enemyAliens, {x : 1}),
            // enemy aliens in the last column of the screen
            enemyAliensRight = _.where(enemyAliens, {x : 17}),
            // whether an alien was hit during this round
            enemyAlienHit = false,
            /**
             * Sets the new direction all enemy aliens will be moving in
             *
             * @method setEnemyAlienDirection
             * @return {String} The new direction we are moving in
             */
            setEnemyAlienDirection = function () {
              // if we are on the very left edge of the screen and our direction
              // is left we need to rather move down or the same for the right
              if ((direction === 'left' && enemyAliensLeft.length > 0) ||
              (direction === 'right' && enemyAliensRight.length > 0)) {
                // we need to move down this round
                return 'down';
              }
              // if we are on the very left edge of the screen and direction
              // is down we need to rather move right as we have moved down
              if (direction === 'down' && enemyAliensLeft.length > 0) {
                // we need to start moving right
                return 'right';
              }
              // if we are on the very right edge of the screen and direction
              // is down we need to rather move left as we have moved down
              if (direction === 'down' && enemyAliensRight.length > 0) {
                // we need to start moving right
                return 'left';
              }
              // as a default, return the current direction
              return direction;
            },
            /**
             * Adds a new row of enemy aliens if necessary
             *
             * @method addEnemyAliens
             */
            addEnemyAliens = function () {
              // get the lowest row the enemy has aliens in
              var lowestEnemyAlienRow = _.min(_.pluck(enemyAliens, "y")),
              // the size of the new enemy alien wave
              enemyAlienWaveSize = aState.enemyAlienWaveSize;
              // see if the lowest row is at 14 (2 below 12 which is the middle)
              if (lowestEnemyAlienRow === 15) {
                // save some variables from being created unnecessarily
                (function () {
                  // the starting column to place aliens
                  var startingColumn = direction === 'right' ? 2 :
                  16 - ((enemyAlienWaveSize - 1) * 3),
                  // the trigger column to add the enemy aliens
                  triggerColumn = direction === 'right' ? 2 : 16;
                  // see if there are enemy aliens in the trigger column
                  if (_.where(enemyAliens, {x : triggerColumn}).length > 0) {
                    // loop from the starting column to the last column
                    for (var i = startingColumn; i < 18; i = i + 3) {
                      // add an enemy alien in this column on the first row (13)
                      enemyAliens.push({x : i, y : 13, simulated : true});
                    }
                  }
                }).apply(this);
              }
            },
            /**
             * Whether our missile hits the enemy alien this round
             *
             * @method hitsEnemyAlien
             * @param {Object} aEnemyAlien The alien to check
             * @param {Integer} aAlienKey The array key of the alien
             */
            hitsEnemyAlien = function (aEnemyAlien, aAlienKey, aEnemyAliens) {
              // the enemy alien's y offset
              var alienY = aEnemyAlien.y,
              // the enemy alien's x offset
              alienX = aEnemyAlien.x;
              /**
               * checks whether a single bullet hits an enemy alien
               *
               * @method missileHitsEnemyAlien
               * @param {Object} aMissile The missile to check whether it hits
               * @param {Integer} aMissileKey The array key of the missile
               */
              missileHitsEnemyAlien = function (aMissile, aMissileKey) {
                // the player's missile's y offset
                var missileY = aMissile.y,
                // the player's missile's x offset
                missileX = aMissile.simulated ? aMissile.x : aMissile.x + 1;
                // check that the missile's current y offset is equal to the alien
                if (missileY === alienY && missileX === alienX) {
                  // make sure the alien and missile are not dead
                  if (!aEnemyAlien.dead && !aMissile.dead) {
                    // see if this missile is the simulated one
                    if (aMissile.simulated) {
                      // we have hit an enemy alien, mark it as such
                      enemyAlienHit = true;
                    }
                    else {
                      // remove the missile because it will now explode
                      aMissile.dead = true;
                      // remove the alien because it will now explode
                      aEnemyAlien.dead = true;
                    }
                  }
                }
              };
              // go through all missiles to see if any of them hit
              _.each(playerMissiles, missileHitsEnemyAlien);
            },

            /**
             * Moves a single enemy alien to it's new position
             *
             * @method moveEnemyAlien
             * @param {Object} aEnemyAlien The enemy alien to move
             * @param {Integer} aKey The key of the enemy alien in the array
             */
            moveEnemyAlien = function (aEnemyAlien, aKey) {
              // check which direction the enemy aliens are moving in
              switch (direction) {
                // when the enemy aliens move left
                case 'left':
                  // move the alien one space left
                  aEnemyAlien.x--;
                  break;
                // when the enemy aliens move right
                case 'right':
                  // move the alien one space to the right
                  aEnemyAlien.x++;
                  break;
                // when the enemy aliens move down
                case 'down':
                  // move the alien down
                  aEnemyAlien.y++;
                  break;
              }
              // after moving, check if the missile will hit this alien
              hitsEnemyAlien(aEnemyAlien, aKey);
            },
            /**
             * Moves the player's missile to it's new position
             *
             * @method movePlayerMissiles
             */
            movePlayerMissiles = function () {
              /**
               * Moves a single player missile as it would in one round
               *
               * @method movePlayerMissile
               * @param {Object} aPlayerMissile The player's missile
               */
              var movePlayerMissile = function (aPlayerMissile) {
                // update the missile's Y position, simulating an up movement
                aPlayerMissile.y--;
              };
              // update both player missiles
              _.each(playerMissiles, movePlayerMissile);
            };
            // update the direction we are going in
            direction = setEnemyAlienDirection();
            // add more enemy aliens
            addEnemyAliens();
            // move the player missile
            movePlayerMissiles();
            // go through each enemy alien
            _.each(enemyAliens, moveEnemyAlien);
            // return whether an enemy alien was hit
            return enemyAlienHit;
          },
          // the amount of rounds simulated
          roundsSimulated = 0;
          // add the simulated missile to the list of missiles
          playerMissiles.push(playerMissile);
          // see that no shields are in the way
          if (shieldsInWay.length === 0) {
            // it takes 10 rounds for a projectile to move past all enemy aliens
            for (roundsSimulated = 0; roundsSimulated < 10; roundsSimulated++) {
              // simulate a round and see if an enemy was hit
              if (simulateRound() === true) {
                // we may shoot
                return moves.SHOOT;
              }
            }
          }
          // return null as a default
          return null;
        };
        // return null by as a fallback
        return canHitEnemyAlien();
      };
      // see if we are allowed to fire a missile
      if (aState.playerMissileLimit > aState.playerMissile.length) {
        // return the result of all shooting actions
        return shootEnemyAlien();
      }
      else {
        // do not fire anything
        return null;
      }
    },
    /**
     * Buils an alien factory when it is available
     * The factory must be built in columns 2, 3 and 4, behind shield one
     *
     * @method buildAlienFactory
     * @return {String} The move to make (BuildAlienFactory)
     * @return {Null} When no alien factory is necessary or possible
     */
    buildAlienFactory = function () {
      // see that the player doesn't have an alien factory
      if (aState.playerAlienFactory.length === 0) {
        // see if the player has any lives to build an alien factory
        if (playerLives > 0) {
          // see if the ship is in the correct spot to build an alien factory
          if (playerX[0] === 2) {
            // build an alien factory
            return moves.BUILDALIENFACTORY;
          }
          else {
            // move to place the alien factory
            return playerX[0] > 0 ? moves.MOVELEFT : moves.MOVERIGHT;
          }
        }
      }
      // return null by default
      return null;
    },
    /**
     * Builds a missile controller when it's available
     * The controller must be built in columns 14, 15 and 16, behind shield two
     *
     * @method buildMissileController
     * @return {String} The move to make (BuildMissleContoller)
     * @return {Null} When no missile controller is necessary or possible
     */
    buildMissileController = function () {
      // see that the player doesn't have a missile controller
      if (aState.playerMissileController.length === 0) {
        // see if the player has enough lives to build a missile controller
        if (playerLives > 1) {
          // see if the ship is in the correct spot to build the controller
          if (playerX[0] === 14) {
            // build a missile controller
            return moves.BUILDMISSILECONTROLLER;
          }
          else {
            // move the player to the controller location
            return playerX[0] > 14 ? moves.MOVELEFT : moves.MOVERIGHT;
          }
        }
      }
      // return null as a default
      return null;
    },
    /**
     * Builds a shield
     *
     * @method buildShield
     * @return {String} The move to make (BuildShield)
     * @return {Null} When no shield is necessary or possible
     */
    buildShield = function () {
      // a list of shields and their corresponding x offsets
      var shields = [[2, 3, 4], [14, 15, 16]],
      // the amount of health each shield section has (0-9)
      shieldHealth = [0, 0],
      // the lowest shield between the two
      lowestShield = 0,
      // the amount of health left before going to repair
      tolerance = 4,
      // the shield that takes preference if both are low
      // 0 = left (alien factory), 1 = right (missile controller)
      preference = 0,
      /**
       * Works out the health (percentage) that a single shield has left
       *
       * @method getShieldHealth
       * @param {Array} aOffsets The x offsets of the shield positions
       * @param {Integer} aKey The key for this array item
       */
      getShieldHealth = function (aOffsets, aKey) {
        /**
         * Gets the health of player shields within a certain row
         *
         * @method getShieldRowHealth
         * @param {Integer} aOffset The x offset of the row
         */
        var getShieldRowHealth = function (aOffset) {
          // a list of shields within this offset
          var shieldsInRow = _.where(playerShields, {x : aOffset});
          // add the count to the correct shield health count
          shieldHealth[aKey] += shieldsInRow.length;
        };
        // go through each of the offsets
        _.each(aOffsets, getShieldRowHealth);
      },
      /**
       * Goes to the position where the shield is required and builds it
       *
       * @method goToAndBuildShield
       * @param {Integer} aShield The shield to build - 0 = left, 1 = right
       */
      goToAndBuildShield = function (aShield) {
        // the left offset of the ship
        var shipLeft = playerX[0],
        // the left offset of the shield
        shieldLeft = shields[aShield][0];
        // see if the ship is left of the shield
        if (shipLeft < shieldLeft) {
          // move to the right to repair the shield
          return moves.MOVERIGHT;
        }
        else {
          // see if the ship is right of the shield
          if (shipLeft > shieldLeft) {
            // move to the left to get to the shield
            return moves.MOVELEFT;
          }
          else {
            // we are on the shield, build it
            return moves.BUILDSHIELD;
          }
        }
      };
      // go through each shield and update it's health
      _.each(shields, getShieldHealth);
      // see if we can place a shield with our lives
      if (aState.playerLives > 0) {
        // see if the preferred shield is low health
        if (shieldHealth[preference] <= tolerance) {
          // go and repair this shield
          return goToAndBuildShield(preference);
        }
        else {
          // see if the non-preferrential shield is low health
          if (shieldHealth[1 - preference] <= tolerance) {
            // go and repair this shield
            return goToAndBuildShield(1 - preference);
          }
        }
      }
      // return null as a fallback
      return null;
    },
    /**
     * Moves the player's ship towards the same side as the bigger side of the
     * enemy alien wave
     *
     * @method trackEnemyAliens
     */
    trackEnemyAliens = function () {
      // a list of enemy aliens
      var enemyAliens = aState.enemyAlien,
      // a list of columns where the enemy has aliens
      enemyAlienColumns = _.uniq(_.pluck(enemyAliens, 'x')),
      // the amount of enemy alien columns
      enemyAlienColumnsCount = enemyAlienColumns.length,
      // whether the column count is of an even or odd length
      evenColumns = enemyAlienColumnsCount % 2 === 0,
      // the middle column (0 if the columns are even)
      middleColumn = Math.round(enemyAlienColumnsCount/2, 0) - 1,
      // the actual middle of the screen
      actualMiddleColumn = 9,
      // the eventual offset to move the ship by
      offset = 0,
      // the amount of emey aliens on the left and right hand side of the wave
      enemyAlienGroups = {
        left : 0,
        leftHighest : 0,
        right : 0,
        rightHighest : 0
      },
      /**
       * Increases the left or right count while checking a column, also
       * increases the lowest row for left and right
       *
       * @method increaseCount
       * @param {Integer} aColumn The column to increase the count for
       * @param {Integer} aKey The array key for this column
       */
      increaseCount = function (aColumn, aKey) {
        // get enemy aliens in this column
        var enemyAliensInColumn = _.where(enemyAliens, {x : aColumn}).length,
        // highest enemy y offset in this row
        highestY = _.max(_.pluck(enemyAliens, 'y')),
        // whether the left, right or no (false) side must be added to
        side = false;
        // see if we are working with an even amount of columns
        if (evenColumns) {
          // set which side the column is on
          side = aKey <= middleColumn ? 'left' : 'right';
        }
        else {
          // make sure that we are not working with the middle column
          if (aKey != middleColumn) {
            // set which side the column is on
            side = aKey <= middleColumn ? 'left' : 'right';
          }
        }
        // check that a side was found
        if (side) {
          // increment the count for that side
          enemyAlienGroups[side] += enemyAliensInColumn;
          // see if the highest y is higher than the current
          if (highestY > enemyAlienGroups[side + 'Highest']) {
            // set this as the new higest
            enemyAlienGroups[side + 'Highest'] = highestY;
          }
        }
      };
      // go through each of the columns and increase it's count
      _.each(enemyAlienColumns, increaseCount);
      // limit the offset to 4
      offset = enemyAlienColumns.length > 4 ? 4 : enemyAlienColumns.length;
      // set the real offset based on the amount of columns
      offset = enemyAlienGroups.left > enemyAlienGroups.right ? -offset :
      (enemyAlienGroups.left === enemyAlienGroups.right ? 0 : offset);
      // change the "actual middle" based on where we now want to be
      actualMiddleColumn += offset;
      // see if the player's ship is further left from the new middle
      if (playerX[1] < actualMiddleColumn) {
        // move to the right, we are too far left
        return moves.MOVERIGHT;
      }
      else {
        // see if the player's ship is further right than the new middle
        if (playerX[1] > actualMiddleColumn) {
          // move to the left, we are too far right
          return moves.MOVELEFT;
        }
      }
      // return null as a fallback
      return null;
    },
    // doing nothing
    nothing = moves.NOTHING,
    // the move to ultimately make (in order of importance)
    move =
    dodge() ||
    shoot() ||
    buildAlienFactory() ||
    buildMissileController() ||
    buildShield() ||
    trackEnemyAliens () ||
    nothing;
    // return which move to make
    return disallowedMoves.indexOf(move) > -1 ? nothing : move;
  }
};