!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.scheduler=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* Generated by es6-transpiler v 0.7.14-2 */
// instantiates an audio context in the global scope if not there already
var context = window.audioContext || new AudioContext() || new webkitAudioContext();
window.audioContext = context;
module.exports = context;
},{}],2:[function(_dereq_,module,exports){
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio priority queue used by scheduler and transports
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 *
 * First rather stupid implementation to be optimized...
 */
'use strict';

var PriorityQueue = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var DPS$0 = Object.defineProperties;var proto$0={};

  function PriorityQueue() {
    this.__objects = [];
    this.reverse = false;
  }DPS$0(PriorityQueue.prototype,{head: {"get": head$get$0, "configurable":true,"enumerable":true}});DP$0(PriorityQueue,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  /* Get the index of an object in the object list */
  proto$0.__objectIndex = function(object) {
    for (var i = 0; i < this.__objects.length; i++) {
      if (object === this.__objects[i][0]) {
        return i;
      }
    }

    return -1;
  };

  /* Withdraw an object from the object list */
  proto$0.__removeObject = function(object) {
    var index = this.__objectIndex(object);

    if (index >= 0)
      this.__objects.splice(index, 1);

    if (this.__objects.length > 0)
      return this.__objects[0][1]; // return time of first object

    return Infinity;
  };

  proto$0.__sortObjects = function() {
    if (!this.reverse)
      this.__objects.sort(function(a, b) {
        return a[1] - b[1];
      });
    else
      this.__objects.sort(function(a, b) {
        return b[1] - a[1];
      });
  };

  /**
   * Insert an object to the queue
   * (for this primitive version: prevent sorting for each element by calling with "false" as third argument)
   */
  proto$0.insert = function(object, time) {var sort = arguments[2];if(sort === void 0)sort = true;
    if (time !== Infinity && time != -Infinity) {
      // add new object
      this.__objects.push([object, time]);

      if (sort)
        this.__sortObjects();

      return this.__objects[0][1]; // return time of first object
    }

    return this.__removeObject(object);
  };

  /**
   * Move an object to another time in the queue
   */
  proto$0.move = function(object, time) {
    if (time !== Infinity && time != -Infinity) {
      var index = this.__objectIndex(object);

      if (index < 0)
        this.__objects.push([object, time]); // add new object
      else
        this.__objects[index][1] = time; // update time of existing object

      this.__sortObjects();

      return this.__objects[0][1]; // return time of first object
    }

    return this.__removeObject(object);
  };

  /**
   * Remove an object from the queue
   */
  proto$0.remove = function(object) {
    return this.__removeObject(object);
  };

  /**
   * Clear queue
   */
  proto$0.clear = function() {
    this.__objects.length = 0; // clear object list
    return Infinity;
  };

  /**
   * Get first object in queue
   */
  function head$get$0() {
    return this.__objects[0][0];
  }
MIXIN$0(PriorityQueue.prototype,proto$0);proto$0=void 0;return PriorityQueue;})();

module.exports = PriorityQueue;
},{}],3:[function(_dereq_,module,exports){
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE scheduler singleton based on audio time
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */
'use strict';

var audioContext = _dereq_("../audio-context");
var PriorityQueue = _dereq_("../priority-queue");
var TimeEngine = _dereq_("../time-engine");

var Scheduler = (function(){var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var DPS$0 = Object.defineProperties;var proto$0={};
  function Scheduler() {
    this.__queue = new PriorityQueue();

    this.__currentTime = null;
    this.__nextTime = Infinity;
    this.__timeout = null;

    /**
     * scheduler (setTimeout) period
     * @type {Number}
     */
    this.period = 0.025;

    /**
     * scheduler lookahead time (> period)
     * @type {Number}
     */
    this.lookahead = 0.1;
  }DPS$0(Scheduler.prototype,{time: {"get": time$get$0, "configurable":true,"enumerable":true}});DP$0(Scheduler,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  // global setTimeout scheduling loop
  proto$0.__tick = function() {var this$0 = this;
    while (this.__nextTime <= audioContext.currentTime + this.lookahead) {
      this.__currentTime = this.__nextTime;

      var nextEngine = this.__queue.head;
      var nextEngineTime = Math.max(nextEngine.advanceTime(this.__currentTime), this.__currentTime);

      this.__nextTime = this.__queue.move(nextEngine, nextEngineTime);
    }

    this.__currentTime = null;
    this.__timeout = null;

    if (this.__nextTime !== Infinity) {
      this.__timeout = setTimeout(function()  {
        this$0.__tick();
      }, this.period * 1000);
    }
  };

  proto$0.__reschedule = function(time) {
    if (this.__nextTime !== Infinity) {
      if (!this.__timeout)
        this.__tick();
    } else if (this.__timeout) {
      clearTimeout(this.__timeout);
      this.__timeout = null;
    }
  };

  /**
   * Get scheduler time
   * @return {Number} current scheduler time including lookahead
   */
  function time$get$0() {
    return this.__currentTime || audioContext.currentTime + this.lookahead;
  }

  /**
   * Add a callback to the scheduler
   * @param {Function} callback function(time, audioTime) to be called
   * @param {Number} period callback period
   * @param {Number} delay of first callback
   * @return {Object} scheduled object that can be used to call remove and reschedule
   */
  proto$0.callback = function(callback) {var delay = arguments[1];if(delay === void 0)delay = 0;
    var object = {
      executeNext: function(time, audioTime) {
        callback(time, audioTime);
        return Infinity;
      }
    };

    this.__nextTime = this.__queue.insert(object, this.time + delay);
    this.__reschedule();

    return object;
  };

  /**
   * Add a periodically repeated callback to the scheduler
   * @param {Function} callback function(time, audioTime) to be called periodically
   * @param {Number} period callback period
   * @param {Number} delay of first callback
   * @return {Object} scheduled object that can be used to call remove and reschedule
   */
  proto$0.repeat = function(callback) {var period = arguments[1];if(period === void 0)period = 1;var delay = arguments[2];if(delay === void 0)delay = 0;
    var object = {
      period: period,
      executeNext: function(time, audioTime) {
        callback(time, audioTime);
        return this.period;
      }
    };

    this.__nextTime = this.__queue.insert(object, this.time + delay);
    this.__reschedule();

    return object;
  };

  /**
   * Add a time engine to the scheduler
   * @param {Object} engine time engine to be added to the scheduler
   * @param {Number} delay scheduling delay time
   */
  proto$0.add = function(engine) {var delay = arguments[1];if(delay === void 0)delay = 0;var this$0 = this;
    if (!engine.timeMaster && !engine.positionMaster) {
      if (engine.implementsTimeBased) {
        engine.timeMaster = this;

        engine.getMasterTime = function()  {
          return this$0.time;
        };

        engine.resetEngineTime = function(time)  {
          this$0.__nextTime = this$0.__queue.move(engine, time);
          this$0.__reschedule();
        };

        var nextEngineTime = engine.initTime(this.time + delay);
        this.__nextTime = this.__queue.insert(engine, nextEngineTime);
        this.__reschedule();
      } else {
        throw new Error("object cannot be added to scheduler");
      }
    } else {
      throw new Error("object already has a master");
    }
  };

  /**
   * Remove time engine from the scheduler
   * @param {Object} engine time engine or callback to be removed from the scheduler
   */
  proto$0.remove = function(engine) {
    if (engine.timeMaster === this) {
      engine.timeMaster = null;

      this.__nextTime = this.__queue.remove(engine);
      this.__reschedule();
    } else {
      throw new Error("object has not been added to this scheduler");
    }
  };

  /**
   * Reschedule a scheduled time engine or callback
   * @param {Object} engine time engine or callback to be rescheduled
   * @param {Number} time time when to reschedule
   */
  proto$0.reset = function(engine, time) {
    if (engine.timeMaster === this) {
      this.__nextTime = this.__queue.move(engine, time);
      this.__reschedule();
    } else {
      throw new Error("object has not been added to this scheduler");
    }
  };
MIXIN$0(Scheduler.prototype,proto$0);proto$0=void 0;return Scheduler;})();

module.exports = new Scheduler; // export scheduler singleton
},{"../audio-context":1,"../priority-queue":2,"../time-engine":4}],4:[function(_dereq_,module,exports){
/* written in ECMAscript 6 */
/**
 * @fileoverview WAVE audio time engine base class
 * @author Norbert.Schnell@ircam.fr, Victor.Saiz@ircam.fr, Karim.Barkati@ircam.fr
 */
"use strict";

var TimeEngine = (function(){var DP$0 = Object.defineProperty;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,Object.getOwnPropertyDescriptor(s,p));}}return t};var $proto$0={};
  function TimeEngine() {
    /**
     * Time master to which the time engine is synchronized
     * @type {Object}
     */
    this.__timeMaster = null;

    /**
     * Function provided by time master to get the master time
     * @type {Function}
     */
    this.getMasterTime = function() {
      return 0;
    };

    /**
     * Function provided by the time master to reset the engine's next time
     * @param {Number} time new engine time (immediately if not specified)
     */
    this.resetEngineTime = function(time) {};

    /**
     * Position master to which the time engine is synchronized
     * @type {Object}
     */
    this.__positionMaster = null;

    /**
     * Start position of the engine
     * @type {Object}
     */
    this.__startPosition = 0;

    /**
     * Function provided by position master to get the master position
     * @type {Function}
     */
    this.getMasterPosition = function() {
      return 0;
    };

    /**
     * Function provided by the position master to request resynchronizing the engine's position
     * @param {Number} time new engine time (immediately if not specified)
     */
    this.resyncEnginePosition = function() {};

    /**
     * Output audio node
     * @type {Object}
     */
    this.outputNode = null;
  }Object.defineProperties(TimeEngine.prototype, {timeMaster: {"get": timeMaster$get$0, "set": timeMaster$set$0, "configurable": true, "enumerable": true}, positionMaster: {"get": positionMaster$get$0, "set": positionMaster$set$0, "configurable": true, "enumerable": true}, implementsTimeBased: {"get": implementsTimeBased$get$0, "configurable": true, "enumerable": true}, implementsPositionBased: {"get": implementsPositionBased$get$0, "configurable": true, "enumerable": true}, implementsSpeedBased: {"get": implementsSpeedBased$get$0, "configurable": true, "enumerable": true}});DP$0(TimeEngine, "prototype", {"configurable": false, "enumerable": false, "writable": false});

  function timeMaster$set$0(timeMaster) {
    this.__timeMaster = timeMaster;
  }

  function timeMaster$get$0() {
    return this.__timeMaster;
  }

  function positionMaster$set$0(positionMaster) {
    this.__positionMaster = positionMaster;
  }

  function positionMaster$get$0() {
    return this.__positionMaster;
  }

  /**
   * Synchronize engine to master time ("time-based" interface, optional function)
   * @param {Number} time current master time (based on audio time)
   * @return {Number} first time
   *
   * This optional function is called by the time master and allows the engine to
   * return its first time.
   * If the engine returns Infinity or -Infinity, it is not called again until it is
   * reset by the time master or it calls resetEngineTime().
   */
  $proto$0.initTime = function(time) {
    return time;
  };

  /**
   * Advance engine time ("time-based" interface)
   * @param {Number} time current master time (based on audio time)
   * @return {Number} next engine time
   *
   * This function is called by the time master to let the engine do its work
   * synchronized to the master's time.
   * If the engine returns Infinity, it is not called again until it is restarted by
   * the time master or it calls resyncEnginePosition() with a valid position.
   */
  // advanceTime(time) {
  //   return time;
  // }

  /**
   * Synchronize engine to master position ("position-based" interface)
   * @param {Number} position current master position to synchronize to
   * @param {Number} time current master time (based on audio time)
   * @param {Number} speed current speed
   * @return {Number} next position (given the playing direction)
   *
   * This function is called by the msater and allows the engine for synchronizing
   * (seeking) to the current master position and to return its next position.
   * If the engine returns Infinity or -Infinity, it is not called again until it is
   * resynchronized by the position master or it calls resyncEnginePosition().
   */
  // syncPosition(time, position, speed) {
  //   return position;
  // }

  /**
   * Advance engine position ("position-based" interface)
   * @param {Number} time current master time (based on audio time)
   * @param {Number} position current master position
   * @param {Number} speed current speed
   * @return {Number} next engine position (given the playing direction)
   *
   * This function is called by the position master to let the engine do its work
   * aligned to the master's position.
   * If the engine returns Infinity or -Infinity, it is not called again until it is
   * resynchronized by the position master or it calls resyncEnginePosition().
   */
  // advancePosition(time, position, speed) {
  //   return position;
  // }

  /**
   * Set engine speed ("speed-based" interface)
   * @param {Number} speed current master speed
   *
   * This function is called by the speed master to propagate the master's speed to the engine.
   * The speed can be of any bewteen -16 and 16.
   * With a speed of 0 the engine is halted.
   */
  // set speed(speed) {
  // }

  /**
   * Seek engine to a given position ("speed-based" interface)
   * @param {Number} position position to seek to
   *
   * This function is called by the speed master to propagate position jumps to the engine.
   */
  // seek(speed) {
  // }

  /**
   * Return whether the time engine implements the time-based interface
   **/
  function implementsTimeBased$get$0() {
    return (this.advanceTime && this.advanceTime instanceof Function);
  }

  /**
   * Return whether the time engine implements the position-based interface
   **/
  function implementsPositionBased$get$0() {
    return (
      this.syncPosition && this.syncPosition instanceof Function &&
      this.advancePosition && this.advancePosition instanceof Function
    );
  }

  /**
   * Return whether the time engine implements the speed-based interface
   **/
  function implementsSpeedBased$get$0() {
    return (
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "speed") &&
      this.seek && this.seek instanceof Function
    );
  }

  /**
   * Connect audio node
   * @param {Object} target audio node
   */
  $proto$0.connect = function(target) {
    this.outputNode.connect(target);
    return this;
  };

  /**
   * Disconnect audio node
   * @param {Number} connection connection to be disconnected
   */
  $proto$0.disconnect = function(connection) {
    this.outputNode.disconnect(connection);
    return this;
  };
MIXIN$0(TimeEngine.prototype,$proto$0);$proto$0=void 0;return TimeEngine;})();

module.exports = TimeEngine;
},{}]},{},[3])
(3)
});