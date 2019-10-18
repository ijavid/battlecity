/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2018 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */

var WSocket = require('ws');
var _ = require('lodash');


let lastMap = '';

let printBoardOnTextArea;

var log = function (string) {
    console.log(string);
    if (printBoardOnTextArea) {
        printLogOnTextArea(string);
    }
};

var printArray = function (array) {
    var result = [];
    for (var index in array) {
        var element = array[index];
        result.push(element.toString());
    }
    return "[" + result + "]";
};

var lastActions = [];

var processBoard = function (boardString) {
    var board = new Board(boardString);
    if (printBoardOnTextArea) {
        printBoardOnTextArea(board.boardAsString());
    }

    var logMessage = board + "\n\n";
    var answer = new DirectionSolver(board).get().toString();
    logMessage += "Answer: " + answer + "\n";
    logMessage += "-----------------------------------\n";

    log(logMessage);

    return answer;
};

// you can get this code after registration on the server with your email
var url = "http://dojorena.io/codenjoy-contest/board/player/kdfb27as2voc6d58zo7f?code=3872020734576834034&gameName=battlecity";

url = url.replace("http", "ws");
url = url.replace("board/player/", "ws?user=");
url = url.replace("?code=", "&code=");

var ws;

function connect() {
    ws = new WSocket(url);
    log('Opening...');

    ws.on('open', function () {
        log('Web socket client opened ' + url);
    });

    ws.on('close', function () {
        log('Web socket client closed');

        setTimeout(function () {
            connect();
        }, 5000);
    });

    ws.on('message', function (message) {

        console.log('new round');
        console.time('processing');


        var pattern = new RegExp(/^board=(.*)$/);
        var parameters = message.match(pattern);
        var boardString = parameters[1];

        var answer = processBoard(boardString);
        lastMap = new Board(boardString);

        ws.send(answer);
        console.timeEnd('processing');
        console.log('answer sent');
    });
}

connect();

var Elements = {

    NONE: ' ',
    BATTLE_WALL: '☼',
    BANG: 'Ѡ',

    CONSTRUCTION: '╬',

    CONSTRUCTION_DESTROYED_DOWN: '╩',
    CONSTRUCTION_DESTROYED_UP: '╦',
    CONSTRUCTION_DESTROYED_LEFT: '╠',
    CONSTRUCTION_DESTROYED_RIGHT: '╣',

    CONSTRUCTION_DESTROYED_DOWN_TWICE: '╨',
    CONSTRUCTION_DESTROYED_UP_TWICE: '╥',
    CONSTRUCTION_DESTROYED_LEFT_TWICE: '╞',
    CONSTRUCTION_DESTROYED_RIGHT_TWICE: '╡',

    CONSTRUCTION_DESTROYED_LEFT_RIGHT: '│',
    CONSTRUCTION_DESTROYED_UP_DOWN: '─',

    CONSTRUCTION_DESTROYED_UP_LEFT: '┌',
    CONSTRUCTION_DESTROYED_RIGHT_UP: '┐',
    CONSTRUCTION_DESTROYED_DOWN_LEFT: '└',
    CONSTRUCTION_DESTROYED_DOWN_RIGHT: '┘',

    CONSTRUCTION_DESTROYED: ' ',

    BULLET: '•',

    TANK_UP: '▲',
    TANK_RIGHT: '►',
    TANK_DOWN: '▼',
    TANK_LEFT: '◄',

    OTHER_TANK_UP: '˄',
    OTHER_TANK_RIGHT: '˃',
    OTHER_TANK_DOWN: '˅',
    OTHER_TANK_LEFT: '˂',

    AI_TANK_UP: '?',
    AI_TANK_RIGHT: '»',
    AI_TANK_DOWN: '¿',
    AI_TANK_LEFT: '«'

};

var D = function (index, dx, dy, name) {

    var changeX = function (x) {
        return x + dx;
    };

    var changeY = function (y) {
        return y + dy;
    };

    var change = function (point) {
        return point.moveTo(this);
    };

    var inverted = function () {
        switch (this) {
            case Direction.UP:
                return Direction.DOWN;
            case Direction.DOWN:
                return Direction.UP;
            case Direction.LEFT:
                return Direction.RIGHT;
            case Direction.RIGHT:
                return Direction.LEFT;
            default:
                return Direction.STOP;
        }
    };

    var toString = function () {
        return name;
    };

    return {
        changeX: changeX,

        changeY: changeY,

        change: change,

        inverted: inverted,

        toString: toString,

        getIndex: function () {
            return index;
        }
    };
};

var Direction = {
    UP: D(2, 0, 1, 'up'),                 // you can move
    DOWN: D(3, 0, -1, 'down'),
    LEFT: D(0, -1, 0, 'left'),
    RIGHT: D(1, 1, 0, 'right'),
    ACT: D(4, 0, 0, 'act'),               // fire
    STOP: D(5, 0, 0, '')                   // stay
};

Direction.values = function () {
    return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT, Direction.DRILL_LEFT, Direction.DRILL_RIGHT, Direction.STOP];
};

Direction.valueOf = function (index) {
    var directions = Direction.values();
    for (var i in directions) {
        var direction = directions[i];
        if (direction.getIndex() == index) {
            return direction;
        }
    }
    return Direction.STOP;
};

var Point = function (x, y) {
    return {
        equals: function (o) {
            return o.getX() == x && o.getY() == y;
        },

        toString: function () {
            return '[' + x + ',' + y + ']';
        },

        isOutOf: function (boardSize) {
            return x >= boardSize || y >= boardSize || x < 0 || y < 0;
        },

        getX: function () {
            return x;
        },

        getY: function () {
            return y;
        },

        moveTo: function (direction) {
            return pt(direction.changeX(x), direction.changeY(y));
        }
    }
};

var pt = function (x, y) {
    return new Point(x, y);
};

var LengthToXY = function (boardSize) {
    function inversionY(y) {
        return boardSize - 1 - y;
    }

    function inversionX(x) {
        return x;
    }

    return {
        getXY: function (length) {
            if (length == -1) {
                return null;
            }
            var x = inversionX(length % boardSize);
            var y = inversionY(Math.trunc(length / boardSize));
            return new Point(x, y);
        },

        getLength: function (x, y) {
            var xx = inversionX(x);
            var yy = inversionY(y);
            return yy * boardSize + xx;
        }
    };
};

var Board = function (board) {
    var contains = function (a, obj) {
        var i = a.length;
        while (i--) {
            if (a[i].equals(obj)) {
                return true;
            }
        }
        return false;
    };

    var sort = function (all) {
        return all.sort(function (pt1, pt2) {
            return (pt1.getY() * 1000 + pt1.getX()) -
                (pt2.getY() * 1000 + pt2.getX());
        });
    }

    var removeDuplicates = function (all) {
        var result = [];
        for (var index in all) {
            var point = all[index];
            if (!contains(result, point)) {
                result.push(point);
            }
        }
        return sort(result);
    };

    var boardSize = function () {
        return Math.sqrt(board.length);
    };

    var size = boardSize();
    var xyl = new LengthToXY(size);

    var getMe = function () {
        var result = [];
        result = result.concat(findAll(Elements.TANK_UP));
        result = result.concat(findAll(Elements.TANK_DOWN));
        result = result.concat(findAll(Elements.TANK_LEFT));
        result = result.concat(findAll(Elements.TANK_RIGHT));
        if (result.lenght == 0) {
            return null;
        }
        return result[0];
    };

    var getMyDirection = function () {
        if (findAll(Elements.TANK_UP).length) return Direction.UP;
        if (findAll(Elements.TANK_DOWN).length) return Direction.DOWN;
        if (findAll(Elements.TANK_LEFT).length) return Direction.LEFT;
        if (findAll(Elements.TANK_RIGHT).length) return Direction.RIGHT;
        return Direction.STOP;
    };

    var getEnemies = function (noAi) {
        var result = [];
        if (!noAi) {
            result = result.concat(findAll(Elements.AI_TANK_UP));
            result = result.concat(findAll(Elements.AI_TANK_DOWN));
            result = result.concat(findAll(Elements.AI_TANK_LEFT));
            result = result.concat(findAll(Elements.AI_TANK_RIGHT));
        }
        result = result.concat(findAll(Elements.OTHER_TANK_UP));
        result = result.concat(findAll(Elements.OTHER_TANK_DOWN));
        result = result.concat(findAll(Elements.OTHER_TANK_LEFT));
        result = result.concat(findAll(Elements.OTHER_TANK_RIGHT));
        return result;
    };

    var getBullets = function () {
        var result = [];
        result = result.concat(findAll(Elements.BULLET));
        return result;
    }

    var isGameOver = function () {
        return getMe() == null;
    };

    var isBulletAt = function (x, y) {
        if (pt(x, y).isOutOf(size)) {
            return false;
        }

        return getAt(x, y) == Elements.BULLET;
    }

    var isAt = function (x, y, element) {
        if (pt(x, y).isOutOf(size)) {
            return false;
        }
        return getAt(x, y) == element;
    };

    var getAt = function (x, y) {
        if (pt(x, y).isOutOf(size)) {
            return Elements.BATTLE_WALL;
        }
        return board.charAt(xyl.getLength(x, y));
    };

    var boardAsString = function () {
        var result = "";
        for (var i = 0; i < size; i++) {
            result += board.substring(i * size, (i + 1) * size);
            result += "\n";
        }
        return result;
    };

    var getBarriers = function () {
        var result = [];
        result = result.concat(findAll(Elements.BATTLE_WALL));
        result = result.concat(findAll(Elements.CONSTRUCTION));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_DOWN));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_UP));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_LEFT));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_RIGHT));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_DOWN_TWICE));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_UP_TWICE));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_LEFT_TWICE));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_RIGHT_TWICE));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_LEFT_RIGHT));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_UP_DOWN));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_UP_LEFT));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_RIGHT_UP));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_DOWN_LEFT));
        result = result.concat(findAll(Elements.CONSTRUCTION_DESTROYED_DOWN_RIGHT));
        return sort(result);
    };

    var toString = function () {
        return '';
        /*util.format("Board:\n%s\n" +
            "My tank at: %s\n" +
            "Enemies at: %s\n" +
            "Bulets at: %s\n",
            boardAsString(),
            getMe(),
            getEnemies(),
            getBullets()
        );*/
    };

    var findAll = function (element) {
        var result = [];
        for (var i = 0; i < size * size; i++) {
            var point = xyl.getXY(i);
            if (isAt(point.getX(), point.getY(), element)) {
                result.push(point);
            }
        }
        return sort(result);
    };

    var isAnyOfAt = function (x, y, elements) {
        if (pt(x, y).isOutOf(size)) {
            return false;
        }
        for (var index in elements) {
            var element = elements[index];
            if (isAt(x, y, element)) {
                return true;
            }
        }
        return false;
    };

    // TODO применить этот подход в других js клиентах
    var getNear = function (x, y) {
        var result = [];
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue;
                result.push(getAt(x + dx, y + dy));
            }
        }
        return result;
    };

    var isNear = function (x, y, element) {
        return getNear(x, y).includes(element);
    };

    var isBarrierAt = function (x, y) {
        if (pt(x, y).isOutOf(size)) {
            return true;
        }

        return contains(getBarriers(), pt(x, y));
    };

    var countNear = function (x, y, element) {
        return getNear(x, y)
            .filter(function (value) {
                return value === element
            })
            .length;
    };

    return {
        size: boardSize,
        getMe: getMe,
        getEnemies: getEnemies,
        getBullets: getBullets,
        isGameOver: isGameOver,
        isAt: isAt,
        boardAsString: boardAsString,
        toString: toString,
        findAll: findAll,
        isAnyOfAt: isAnyOfAt,
        getNear: getNear,
        isNear: isNear,
        countNear: countNear,
        isBarrierAt: isBarrierAt,
        getBarriers: getBarriers,
        getAt: getAt,
        getMyDirection: getMyDirection
    };
};

var turn = 0;
var lastFire = -9;

var myBullet;


function getDirection(x1, y1, x2, y2) {
    var x = x1 - x2;
    var y = y1 - y2;
    if (x === 0 && y !== 0) {
        return y > 0 ? Direction.UP : Direction.DOWN;
    } else {
        return x > 0 ? Direction.RIGHT : Direction.LEFT;
    }
}

function getMyDirection(board) {
    if (board.findAll(Elements.TANK_UP).length) return Direction.UP;
    if (board.findAll(Elements.TANK_DOWN).length) return Direction.DOWN;
    if (board.findAll(Elements.TANK_LEFT).length) return Direction.LEFT;
    if (board.findAll(Elements.TANK_RIGHT).length) return Direction.RIGHT;
    return Direction.STOP;
}

function getEnemyDirection(x, y, board) {
    if (board.getAt(x, y) === Elements.OTHER_TANK_UP) return Direction.UP;
    if (board.getAt(x, y) === Elements.OTHER_TANK_DOWN) return Direction.DOWN;
    if (board.getAt(x, y) === Elements.OTHER_TANK_LEFT) return Direction.LEFT;
    if (board.getAt(x, y) === Elements.OTHER_TANK_RIGHT) return Direction.RIGHT;
    return Direction.STOP;
}

function getTargetMovingDirection(x, y, lastBoard) {
    if (lastBoard) {
        if (lastBoard.getAt(x - 1, y)) return Direction.LEFT;
        if (lastBoard.getAt(x + 1, y)) return Direction.RIGHT;
        if (lastBoard.getAt(x, y - 1)) return Direction.DOWN;
        if (lastBoard.getAt(x, y + 1)) return Direction.UP;
    }
    return Direction.STOP;
}

function isDirectionTowardsMe(direction, x, y, myX, myY) {
    if (direction === Direction.UP) return y + 1 === myY;
    if (direction === Direction.DOWN) return y - 1 === myY;
    if (direction === Direction.LEFT) return x - 1 === myX;
    if (direction === Direction.RIGHT) return x + 1 === myX;
}

var lastOneStep = null;
var lastStepCounter = 0;

var DirectionSolver = function (board) {

        return {
            /**
             * @return next hero action
             */
            get: function () {

                // return 'act';

                turn++;


                var tank = board.getMe();

                if (!tank) {
                    console.log('we are dead, do noting');
                    lastFire = -3;
                    return '';
                }

                const mx = tank.getX();
                const my = tank.getY();


                console.log('TANK AT', {x: mx, y: my, dir: getMyDirection(board).toString()});

                let reloading = turn === 0 ? false : (turn - lastFire) <= 3;


                function getTargetDirection(t) {
                    var x = t.getX() - tank.getX();
                    var y = t.getY() - tank.getY();
                    if (x === 0) {
                        return y > 0 ? Direction.UP : Direction.DOWN;
                    } else if(y === 0) {
                        return x > 0 ? Direction.RIGHT : Direction.LEFT;
                    } else {
                        return Direction.STOP;
                    }
                }

                function getTargetDistance(t) {
                    var x = t.getX() - tank.getX();
                    var y = t.getY() - tank.getY();
                    return Math.abs(y) + Math.abs(x);
                }

                function getSmallestTargetDistance(t) {
                    var x = t.getX() - tank.getX();
                    var y = t.getY() - tank.getY();
                    return Math.abs(x < y ? x : y);
                }

                function isShotClear(x, y, tx, ty) {
                    var dx = x - tx;
                    var dy = y - ty;
                    if (dx !== 0 && dy !== 0) {
                        return false;
                    }
                    let clear = true;
                    if (dy === 0) {
                        _.range(x, tx).forEach(i => {
                            clear = clear && !isBarrierAt(i, ty, board);
                        });
                    } else {
                        _.range(y, ty).forEach(i => {
                            clear = clear && !isBarrierAt(tx, i, board);
                        });
                    }
                    return clear;
                }

                function getBulletsNear(distance = 4) {
                    let result = [];
                    if (_.range(+1, distance + 1).reduce((b, i) => b || board.getAt(mx, my + i) === Elements.BULLET, false)) result.push(Direction.UP);
                    if (_.range(+1, distance + 1).reduce((b, i) => b || board.getAt(mx, my - i) === Elements.BULLET, false)) result.push(Direction.DOWN);
                    if (_.range(+1, distance + 1).reduce((b, i) => b || board.getAt(mx - i, my) === Elements.BULLET, false)) result.push(Direction.LEFT);
                    if (_.range(+1, distance + 1).reduce((b, i) => b || board.getAt(mx + i, my) === Elements.BULLET, false)) result.push(Direction.RIGHT);
                    return result;
                }

                function getUnSafeDirections() {
                    let result = [];
                    if (_.range(-3, +4).reduce((b, i) => b || board.getAt(mx + i, my + 1) === Elements.BULLET, false)) result.push(Direction.UP);
                    if (_.range(-3, +4).reduce((b, i) => b || board.getAt(mx + i, my - 1) === Elements.BULLET, false)) result.push(Direction.DOWN);
                    if (_.range(-3, +4).reduce((b, i) => b || board.getAt(mx - 1, my + i) === Elements.BULLET, false)) result.push(Direction.LEFT);
                    if (_.range(-3, +4).reduce((b, i) => b || board.getAt(mx + 1, my + i) === Elements.BULLET, false)) result.push(Direction.RIGHT);
                    return result;
                }

                function getFreePlaces() {
                    const result = [];
                    if (board.getAt(mx, my + 1) === Elements.NONE) result.push(Direction.UP);
                    if (board.getAt(mx, my - 1) === Elements.NONE) result.push(Direction.DOWN);
                    if (board.getAt(mx - 1, my) === Elements.NONE) result.push(Direction.LEFT);
                    if (board.getAt(mx + 1, my) === Elements.NONE) result.push(Direction.RIGHT);
                    return result;
                }

                const danger = getBulletsNear();

                if (danger.length) {
                    console.log('danger from: ', danger.map(d => d.toString()), 'empty', getFreePlaces().map(d => d.toString()));
                    const safer = getFreePlaces()
                        .filter(p => danger.indexOf(p) === -1)
                        .filter(p => danger.indexOf(p.inverted()) === -1);

                    if (safer.length) {
                        // move to safe place
                        console.log(' move to safe place: ', safer[0].toString());
                        lastStepCounter = 0;
                        return safer[0];
                    } else {
                        // we are dead...
                        console.log('danger - no move options we are dead in next round???');
                        if (!reloading) {
                            console.log('FIRE AT LAST CHANCE');
                            lastStepCounter = 0;
                            return Direction.ACT;
                        }
                    }
                }

                const safe = getFreePlaces();
                console.log('safe:', safe.map(s => s.toString()));

                const unsafe = getUnSafeDirections();
                console.log('unsafe:', unsafe.map(s => s.toString()));

                const bullets = getBulletsNear();
                console.log('bulletsFrom:', bullets.map(s => s.toString()));

                const possibleSteps = safe.filter(s => unsafe.indexOf(s) === -1 && bullets.indexOf(s) === -1);
                console.log('possibleSteps:', possibleSteps.map(s => s.toString()));

                function isPlayer(x, y) {
                    switch (board.getAt(x, y)) {
                        case Elements.OTHER_TANK_DOWN:
                        case Elements.OTHER_TANK_UP:
                        case Elements.OTHER_TANK_LEFT:
                        case Elements.OTHER_TANK_RIGHT:
                            return true;
                        default:
                            return false;
                    }
                }


                console.log('getting enemies');
                const em = board.getEnemies(false); //true);

                let target;

                console.log('mapping enemies');
                let targets = _.chain(em)
                    .map(t => ({
                        x: t.getX(),
                        y: t.getY(),
                        player: isPlayer(t.getX(), t.getY()),
                        tank: t,
                        inSight: t.getX() === tank.getX() || t.getY() === tank.getY(),
                        direction: getTargetDirection(t),
                        distance: getTargetDistance(t),
                        minDistance: getSmallestTargetDistance(t),
                        isShotClear: isShotClear(t.getX(), t.getY(), tank.getX(), tank.getY()),
                        // isWallInWay: isWallInWay(t),
                        // path: findPath(tank, t, board),
                        // pathOverWall: findPath(tank, t, board, true)

                        turetDirection: getEnemyDirection(t.getX(), t.getY(), board),
                        movingDirection: getTargetMovingDirection(t.getX(), t.getY(), lastMap)
                    }))
                    .sortBy('distance')
                    .value();

                console.log('looking for target');
                target = _.chain(targets)
                    .filter(e => e.inSight)
                    .filter(e => e.direction === board.getMyDirection())
                    .filter(e => e.isShotClear)
                    .first()
                    .value();

                if (target) {
                    console.log('target found - in direction');
                } else {
                    target = _.chain(targets)
                        .filter(e => e.inSight)
                        // .filter(e => e.direction === board.getMyDirection())
                        .filter(e => e.isShotClear)
                        .first()
                        .value();

                    if (target) {
                        console.log('target found - need to turn');
                    }
                }

                if (target) {
                    console.log('[+] locked on target, initiate fire system [+]\n\n', _.omit(target, ['direction', 'tank', 'path', 'turetDirection', 'movingDirection']));
                    console.log(target.direction.toString(), 'turetDirection:', target.turetDirection.toString(), 'movingDirection:', target.movingDirection.toString());
                    if (!reloading) {
                        if (getMyDirection(board) !== target.direction) {
                            console.log('[>>>] TURN AND FIRE [<<<]');
                            if (unsafe.indexOf(target.direction) > -1 && board.getAt(target.direction.changeX(mx), target.direction.changeY(my)) === Elements.NONE) {
                                console.log('direction is unsafe!!! STOPING');
                                lastStepCounter = 0;
                                return Direction.STOP;
                            }
                            lastFire = turn;
                            myBullet = target.direction;
                            return target.direction.toString() + ',act';
                        } else {
                            console.log('[***] FIRE [***]');
                            lastFire = turn;
                            myBullet = target.direction;
                            lastStepCounter = 0;
                            return Direction.ACT;
                        }
                    } else {
                        console.log('[---] RELOADING [---]');

                        const safer = possibleSteps.filter(d => d !== target.direction && d !== target.direction.inverted());
                        console.log('safe:', safer.map(s => s.toString()));

                        if (safer.length) {
                            console.log('MOVING TO SAFE');
                            lastStepCounter = 0;
                            return safer[0];
                        }

                        // myBullet = getMyDirection(board);
                        // return 'act';
                        if (board.getAt(target.direction.inverted().changeX(mx), target.direction.inverted().changeY(my)) === Elements.NONE) {
                            console.log('Reverse engine!');
                            // return target.direction.inverted().toString();
                        }

                        console.log('NO RETREAT! - KAMIKAZE!');
                        lastStepCounter = 0;
                        return target.direction.toString();

                    }
                }


                console.log('--- no target selected ---');

                if (!reloading) {
                    console.log('looking for prefire');
                    const distance = 2;
                }

                /*target = _.chain(targets)
                    .filter(a => a.player)
                    .sortBy(a => a.distance)
                    .first()
                    .value();*/

                // one step target

                const oneStepTargets = targets
                    .filter(t => {
                         return isShotClear(t.x, t.y, tank.getX()+1, tank.getY()) || isShotClear(t.x, t.y, tank.getX()-1, tank.getY())
                             || isShotClear(t.x, t.y, tank.getX(), tank.getY() +1) || isShotClear(t.x, t.y, tank.getX(), tank.getY() -1) ;
                }).map(t => {
                    if(t.x === tank.getX() + 1) t.oneStepDirection = Direction.RIGHT;
                    if(t.x === tank.getX() - 1) t.oneStepDirection = Direction.LEFT;
                    if(t.y === tank.getY() + 1) t.oneStepDirection = Direction.UP;
                    if(t.y === tank.getY() - 1) t.oneStepDirection = Direction.DOWN;

                    t.path = findPath(tank, t.tank, board);
                    return t;
                })
                    .filter(t => possibleSteps.indexOf(t.oneStepDirection) > -1)
                    .filter(t => t.path.length > 0);

                if (oneStepTargets.length) {
                    const oneStepTarget = oneStepTargets[0];
                    console.log('found one step target', _.pick(oneStepTarget, ['x', 'y']), oneStepTarget.path.length, oneStepTarget.direction.toString());

                    if (lastOneStep) {
                       if(lastOneStep.inverted() === oneStepTarget.oneStepDirection) {
                           lastStepCounter++;
                       } else {
                           lastStepCounter = 0;
                       }
                    }

                    if(lastStepCounter > 3 && !reloading) {
                        console.log('stucket at enemy', lastStepCounter, lastOneStep, oneStepTarget.oneStepDirection);
                        console.log('!!!FIRE!!!');
                        return getDirection(oneStepTarget.oneStepDirection.changeX(tank.getX()), oneStepTarget.oneStepDirection.changeY(tank.getY()), oneStepTarget.x, oneStepTarget.y) + ',act';
                    }

                    lastOneStep = oneStepTarget.oneStepDirection;
                    return oneStepTarget.oneStepDirection;
                }

                lastOneStep = null;
                lastStepCounter = 0;

                targets.slice(0, 5).forEach(t => t.path = findPath(tank, t.tank, board));

                target = _.chain(targets.slice(0, 5))
                    .filter(a => a.player)
                    .filter(a => a.path.length > 0)
                    .sortBy(a => a.path.length)
                    .first()
                    .value();

                if (target) {
                    target.path = findPath(tank, target.tank, board);
                    console.log('going for closest target', _.pick(target, ['x', 'y']), 'from: x', tank.getX(), 'y:', tank.getY());

                    if (target.path.length > 1) {

                        console.log('next step towards the target', target.path[1]);

                        const nextStep = 1; // target.path.length > 2 ? (turn % 2 ? 1 : 2) : 1;

                        let newx = target.path[nextStep][0];
                        let newy = target.path[nextStep][1];
                        let newDirection = getDirection(newx, newy, tank.getX(), tank.getY());


                        if (possibleSteps.indexOf(newDirection) > -1) {
                            console.log('direction is safe! approaching target', newDirection.toString());
                            return newDirection;
                        } else if (possibleSteps.length) {
                            console.log('direction is unsafe! moving different', possibleSteps[0].toString());
                            return possibleSteps[0];
                        } else {
                            console.log('no good moves... wait here...');
                            return Direction.STOP;
                        }
                    } else {
                        return target.direction;
                    }
                }

                console.log('--- still no target selected ---');

                const path = findPath(tank, {getX: () => 1, getY: () => 1}, board, true);
                let newx = path[1][0];
                let newy = path[1][1];
                let direction = getDirection(newx, newy, tank.getX(), tank.getY());

                if (reloading) {
                    return direction;
                } else {
                    myBullet = board.getMyDirection();
                    lastFire = turn;
                    return 'act';
                }

                console.log('do some random shit');
                const action = ['up', 'down', 'left', 'right', 'act', 'act', 'act', 'act'][Math.floor(Math.random() * (reloading ? 4 : 8))];
                if (action === 'act') {
                    myBullet = board.getMyDirection();
                    lastFire = turn;
                }
                return action;
            }


        };
    }
;

function isBarrierAt(x, y, board, allow) {
    switch (board.getAt(x, y)) {
        case Elements.BATTLE_WALL:
            return true;
        case Elements.CONSTRUCTION: //3
        case Elements.CONSTRUCTION_DESTROYED_DOWN: //2
        case Elements.CONSTRUCTION_DESTROYED_UP:
        case Elements.CONSTRUCTION_DESTROYED_LEFT:
        case Elements.CONSTRUCTION_DESTROYED_RIGHT:
        case Elements.CONSTRUCTION_DESTROYED_DOWN_TWICE: //1
        case Elements.CONSTRUCTION_DESTROYED_UP_TWICE:
        case Elements.CONSTRUCTION_DESTROYED_LEFT_TWICE:
        case Elements.CONSTRUCTION_DESTROYED_RIGHT_TWICE:
        case Elements.CONSTRUCTION_DESTROYED_LEFT_RIGHT:
        case Elements.CONSTRUCTION_DESTROYED_UP_DOWN:
        case Elements.CONSTRUCTION_DESTROYED_UP_LEFT:
        case Elements.CONSTRUCTION_DESTROYED_RIGHT_UP:
        case Elements.CONSTRUCTION_DESTROYED_DOWN_LEFT:
        case Elements.CONSTRUCTION_DESTROYED_DOWN_RIGHT:
            return !allow;
        default:
            return false;
    }
}


var PF = require('pathfinding');

function findPath(a, b, board, allow) {
    const grid = [];
    _.range(0, board.size()).forEach(y => {
        grid[y] = [];
        _.range(0, board.size()).forEach(x => {
                let value = 0;
                switch (board.getAt(x, y)) {
                    case Elements.BATTLE_WALL:
                        value = 1;
                        break;
                    case Elements.CONSTRUCTION: //3
                    case Elements.CONSTRUCTION_DESTROYED_DOWN: //2
                    case Elements.CONSTRUCTION_DESTROYED_UP:
                    case Elements.CONSTRUCTION_DESTROYED_LEFT:
                    case Elements.CONSTRUCTION_DESTROYED_RIGHT:
                    case Elements.CONSTRUCTION_DESTROYED_DOWN_TWICE: //1
                    case Elements.CONSTRUCTION_DESTROYED_UP_TWICE:
                    case Elements.CONSTRUCTION_DESTROYED_LEFT_TWICE:
                    case Elements.CONSTRUCTION_DESTROYED_RIGHT_TWICE:
                    case Elements.CONSTRUCTION_DESTROYED_LEFT_RIGHT:
                    case Elements.CONSTRUCTION_DESTROYED_UP_DOWN:
                    case Elements.CONSTRUCTION_DESTROYED_UP_LEFT:
                    case Elements.CONSTRUCTION_DESTROYED_RIGHT_UP:
                    case Elements.CONSTRUCTION_DESTROYED_DOWN_LEFT:
                    case Elements.CONSTRUCTION_DESTROYED_DOWN_RIGHT:
                        value = allow ? 0 : 1;
                        break;
                    default:
                        value = 0;
                }
                grid[y][x] = value;
            }
        )
    });

    var map = new PF.Grid(grid);
    var finder = new PF.BiAStarFinder();
    return finder.findPath(a.getX(), a.getY(), b.getX(), b.getY(), map);
}
