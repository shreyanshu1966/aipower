var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// node_modules/fastdom/fastdom.js
var require_fastdom = __commonJS({
  "node_modules/fastdom/fastdom.js"(exports, module) {
    !function(win) {
      "use strict";
      var debug = 0 ? console.log.bind(console, "[fastdom]") : function() {
      };
      var raf = win.requestAnimationFrame || win.webkitRequestAnimationFrame || win.mozRequestAnimationFrame || win.msRequestAnimationFrame || function(cb) {
        return setTimeout(cb, 16);
      };
      function FastDom() {
        var self = this;
        self.reads = [];
        self.writes = [];
        self.raf = raf.bind(win);
        debug("initialized", self);
      }
      FastDom.prototype = {
        constructor: FastDom,
        /**
         * We run this inside a try catch
         * so that if any jobs error, we
         * are able to recover and continue
         * to flush the batch until it's empty.
         *
         * @param {Array} tasks
         */
        runTasks: function(tasks) {
          debug("run tasks");
          var task;
          while (task = tasks.shift()) task();
        },
        /**
         * Adds a job to the read batch and
         * schedules a new frame if need be.
         *
         * @param  {Function} fn
         * @param  {Object} ctx the context to be bound to `fn` (optional).
         * @public
         */
        measure: function(fn, ctx) {
          debug("measure");
          var task = !ctx ? fn : fn.bind(ctx);
          this.reads.push(task);
          scheduleFlush(this);
          return task;
        },
        /**
         * Adds a job to the
         * write batch and schedules
         * a new frame if need be.
         *
         * @param  {Function} fn
         * @param  {Object} ctx the context to be bound to `fn` (optional).
         * @public
         */
        mutate: function(fn, ctx) {
          debug("mutate");
          var task = !ctx ? fn : fn.bind(ctx);
          this.writes.push(task);
          scheduleFlush(this);
          return task;
        },
        /**
         * Clears a scheduled 'read' or 'write' task.
         *
         * @param {Object} task
         * @return {Boolean} success
         * @public
         */
        clear: function(task) {
          debug("clear", task);
          return remove(this.reads, task) || remove(this.writes, task);
        },
        /**
         * Extend this FastDom with some
         * custom functionality.
         *
         * Because fastdom must *always* be a
         * singleton, we're actually extending
         * the fastdom instance. This means tasks
         * scheduled by an extension still enter
         * fastdom's global task queue.
         *
         * The 'super' instance can be accessed
         * from `this.fastdom`.
         *
         * @example
         *
         * var myFastdom = fastdom.extend({
         *   initialize: function() {
         *     // runs on creation
         *   },
         *
         *   // override a method
         *   measure: function(fn) {
         *     // do extra stuff ...
         *
         *     // then call the original
         *     return this.fastdom.measure(fn);
         *   },
         *
         *   ...
         * });
         *
         * @param  {Object} props  properties to mixin
         * @return {FastDom}
         */
        extend: function(props) {
          debug("extend", props);
          if (typeof props != "object") throw new Error("expected object");
          var child = Object.create(this);
          mixin(child, props);
          child.fastdom = this;
          if (child.initialize) child.initialize();
          return child;
        },
        // override this with a function
        // to prevent Errors in console
        // when tasks throw
        catch: null
      };
      function scheduleFlush(fastdom6) {
        if (!fastdom6.scheduled) {
          fastdom6.scheduled = true;
          fastdom6.raf(flush.bind(null, fastdom6));
          debug("flush scheduled");
        }
      }
      function flush(fastdom6) {
        debug("flush");
        var writes = fastdom6.writes;
        var reads = fastdom6.reads;
        var error;
        try {
          debug("flushing reads", reads.length);
          fastdom6.runTasks(reads);
          debug("flushing writes", writes.length);
          fastdom6.runTasks(writes);
        } catch (e) {
          error = e;
        }
        fastdom6.scheduled = false;
        if (reads.length || writes.length) scheduleFlush(fastdom6);
        if (error) {
          debug("task errored", error.message);
          if (fastdom6.catch) fastdom6.catch(error);
          else throw error;
        }
      }
      function remove(array, item) {
        var index = array.indexOf(item);
        return !!~index && !!array.splice(index, 1);
      }
      function mixin(target, source) {
        for (var key in source) {
          if (source.hasOwnProperty(key)) target[key] = source[key];
        }
      }
      var exports2 = win.fastdom = win.fastdom || new FastDom();
      if (typeof define == "function") define(function() {
        return exports2;
      });
      else if (typeof module == "object") module.exports = exports2;
    }(typeof window !== "undefined" ? window : typeof exports != "undefined" ? exports : globalThis);
  }
});

// node_modules/ev-emitter/ev-emitter.js
var require_ev_emitter = __commonJS({
  "node_modules/ev-emitter/ev-emitter.js"(exports, module) {
    (function(global, factory) {
      if (typeof define == "function" && define.amd) {
        define(factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory();
      } else {
        global.EvEmitter = factory();
      }
    })(typeof window != "undefined" ? window : exports, function() {
      "use strict";
      function EvEmitter() {
      }
      var proto = EvEmitter.prototype;
      proto.on = function(eventName, listener) {
        if (!eventName || !listener) {
          return;
        }
        var events = this._events = this._events || {};
        var listeners = events[eventName] = events[eventName] || [];
        if (listeners.indexOf(listener) == -1) {
          listeners.push(listener);
        }
        return this;
      };
      proto.once = function(eventName, listener) {
        if (!eventName || !listener) {
          return;
        }
        this.on(eventName, listener);
        var onceEvents = this._onceEvents = this._onceEvents || {};
        var onceListeners = onceEvents[eventName] = onceEvents[eventName] || {};
        onceListeners[listener] = true;
        return this;
      };
      proto.off = function(eventName, listener) {
        var listeners = this._events && this._events[eventName];
        if (!listeners || !listeners.length) {
          return;
        }
        var index = listeners.indexOf(listener);
        if (index != -1) {
          listeners.splice(index, 1);
        }
        return this;
      };
      proto.emitEvent = function(eventName, args) {
        var listeners = this._events && this._events[eventName];
        if (!listeners || !listeners.length) {
          return;
        }
        listeners = listeners.slice(0);
        args = args || [];
        var onceListeners = this._onceEvents && this._onceEvents[eventName];
        for (var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          var isOnce = onceListeners && onceListeners[listener];
          if (isOnce) {
            this.off(eventName, listener);
            delete onceListeners[listener];
          }
          listener.apply(this, args);
        }
        return this;
      };
      proto.allOff = function() {
        delete this._events;
        delete this._onceEvents;
      };
      return EvEmitter;
    });
  }
});

// node_modules/get-size/get-size.js
var require_get_size = __commonJS({
  "node_modules/get-size/get-size.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define(factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory();
      } else {
        window2.getSize = factory();
      }
    })(window, function factory() {
      "use strict";
      function getStyleSize(value) {
        var num = parseFloat(value);
        var isValid = value.indexOf("%") == -1 && !isNaN(num);
        return isValid && num;
      }
      function noop() {
      }
      var logError = typeof console == "undefined" ? noop : function(message) {
        console.error(message);
      };
      var measurements = [
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "paddingBottom",
        "marginLeft",
        "marginRight",
        "marginTop",
        "marginBottom",
        "borderLeftWidth",
        "borderRightWidth",
        "borderTopWidth",
        "borderBottomWidth"
      ];
      var measurementsLength = measurements.length;
      function getZeroSize() {
        var size = {
          width: 0,
          height: 0,
          innerWidth: 0,
          innerHeight: 0,
          outerWidth: 0,
          outerHeight: 0
        };
        for (var i = 0; i < measurementsLength; i++) {
          var measurement = measurements[i];
          size[measurement] = 0;
        }
        return size;
      }
      function getStyle(elem) {
        var style = getComputedStyle(elem);
        if (!style) {
          logError("Style returned " + style + ". Are you running this code in a hidden iframe on Firefox? See https://bit.ly/getsizebug1");
        }
        return style;
      }
      var isSetup = false;
      var isBoxSizeOuter;
      function setup() {
        if (isSetup) {
          return;
        }
        isSetup = true;
        var div = document.createElement("div");
        div.style.width = "200px";
        div.style.padding = "1px 2px 3px 4px";
        div.style.borderStyle = "solid";
        div.style.borderWidth = "1px 2px 3px 4px";
        div.style.boxSizing = "border-box";
        var body = document.body || document.documentElement;
        body.appendChild(div);
        var style = getStyle(div);
        isBoxSizeOuter = Math.round(getStyleSize(style.width)) == 200;
        getSize.isBoxSizeOuter = isBoxSizeOuter;
        body.removeChild(div);
      }
      function getSize(elem) {
        setup();
        if (typeof elem == "string") {
          elem = document.querySelector(elem);
        }
        if (!elem || typeof elem != "object" || !elem.nodeType) {
          return;
        }
        var style = getStyle(elem);
        if (style.display == "none") {
          return getZeroSize();
        }
        var size = {};
        size.width = elem.offsetWidth;
        size.height = elem.offsetHeight;
        var isBorderBox = size.isBorderBox = style.boxSizing == "border-box";
        for (var i = 0; i < measurementsLength; i++) {
          var measurement = measurements[i];
          var value = style[measurement];
          var num = parseFloat(value);
          size[measurement] = !isNaN(num) ? num : 0;
        }
        var paddingWidth = size.paddingLeft + size.paddingRight;
        var paddingHeight = size.paddingTop + size.paddingBottom;
        var marginWidth = size.marginLeft + size.marginRight;
        var marginHeight = size.marginTop + size.marginBottom;
        var borderWidth = size.borderLeftWidth + size.borderRightWidth;
        var borderHeight = size.borderTopWidth + size.borderBottomWidth;
        var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;
        var styleWidth = getStyleSize(style.width);
        if (styleWidth !== false) {
          size.width = styleWidth + // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
        }
        var styleHeight = getStyleSize(style.height);
        if (styleHeight !== false) {
          size.height = styleHeight + // add padding and border unless it's already including it
          (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
        }
        size.innerWidth = size.width - (paddingWidth + borderWidth);
        size.innerHeight = size.height - (paddingHeight + borderHeight);
        size.outerWidth = size.width + marginWidth;
        size.outerHeight = size.height + marginHeight;
        return size;
      }
      return getSize;
    });
  }
});

// node_modules/desandro-matches-selector/matches-selector.js
var require_matches_selector = __commonJS({
  "node_modules/desandro-matches-selector/matches-selector.js"(exports, module) {
    (function(window2, factory) {
      "use strict";
      if (typeof define == "function" && define.amd) {
        define(factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory();
      } else {
        window2.matchesSelector = factory();
      }
    })(window, function factory() {
      "use strict";
      var matchesMethod = function() {
        var ElemProto = window.Element.prototype;
        if (ElemProto.matches) {
          return "matches";
        }
        if (ElemProto.matchesSelector) {
          return "matchesSelector";
        }
        var prefixes = ["webkit", "moz", "ms", "o"];
        for (var i = 0; i < prefixes.length; i++) {
          var prefix = prefixes[i];
          var method = prefix + "MatchesSelector";
          if (ElemProto[method]) {
            return method;
          }
        }
      }();
      return function matchesSelector(elem, selector) {
        return elem[matchesMethod](selector);
      };
    });
  }
});

// node_modules/fizzy-ui-utils/utils.js
var require_utils = __commonJS({
  "node_modules/fizzy-ui-utils/utils.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "desandro-matches-selector/matches-selector"
        ], function(matchesSelector) {
          return factory(window2, matchesSelector);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_matches_selector()
        );
      } else {
        window2.fizzyUIUtils = factory(
          window2,
          window2.matchesSelector
        );
      }
    })(window, function factory(window2, matchesSelector) {
      "use strict";
      var utils = {};
      utils.extend = function(a, b) {
        for (var prop in b) {
          a[prop] = b[prop];
        }
        return a;
      };
      utils.modulo = function(num, div) {
        return (num % div + div) % div;
      };
      var arraySlice = Array.prototype.slice;
      utils.makeArray = function(obj) {
        if (Array.isArray(obj)) {
          return obj;
        }
        if (obj === null || obj === void 0) {
          return [];
        }
        var isArrayLike = typeof obj == "object" && typeof obj.length == "number";
        if (isArrayLike) {
          return arraySlice.call(obj);
        }
        return [obj];
      };
      utils.removeFrom = function(ary, obj) {
        var index = ary.indexOf(obj);
        if (index != -1) {
          ary.splice(index, 1);
        }
      };
      utils.getParent = function(elem, selector) {
        while (elem.parentNode && elem != document.body) {
          elem = elem.parentNode;
          if (matchesSelector(elem, selector)) {
            return elem;
          }
        }
      };
      utils.getQueryElement = function(elem) {
        if (typeof elem == "string") {
          return document.querySelector(elem);
        }
        return elem;
      };
      utils.handleEvent = function(event2) {
        var method = "on" + event2.type;
        if (this[method]) {
          this[method](event2);
        }
      };
      utils.filterFindElements = function(elems, selector) {
        elems = utils.makeArray(elems);
        var ffElems = [];
        elems.forEach(function(elem) {
          if (!(elem instanceof HTMLElement)) {
            return;
          }
          if (!selector) {
            ffElems.push(elem);
            return;
          }
          if (matchesSelector(elem, selector)) {
            ffElems.push(elem);
          }
          var childElems = elem.querySelectorAll(selector);
          for (var i = 0; i < childElems.length; i++) {
            ffElems.push(childElems[i]);
          }
        });
        return ffElems;
      };
      utils.debounceMethod = function(_class, methodName, threshold) {
        threshold = threshold || 100;
        var method = _class.prototype[methodName];
        var timeoutName = methodName + "Timeout";
        _class.prototype[methodName] = function() {
          var timeout = this[timeoutName];
          clearTimeout(timeout);
          var args = arguments;
          var _this = this;
          this[timeoutName] = setTimeout(function() {
            method.apply(_this, args);
            delete _this[timeoutName];
          }, threshold);
        };
      };
      utils.docReady = function(callback) {
        var readyState = document.readyState;
        if (readyState == "complete" || readyState == "interactive") {
          setTimeout(callback);
        } else {
          document.addEventListener("DOMContentLoaded", callback);
        }
      };
      utils.toDashed = function(str) {
        return str.replace(/(.)([A-Z])/g, function(match, $1, $2) {
          return $1 + "-" + $2;
        }).toLowerCase();
      };
      var console2 = window2.console;
      utils.htmlInit = function(WidgetClass, namespace) {
        utils.docReady(function() {
          var dashedNamespace = utils.toDashed(namespace);
          var dataAttr = "data-" + dashedNamespace;
          var dataAttrElems = document.querySelectorAll("[" + dataAttr + "]");
          var jsDashElems = document.querySelectorAll(".js-" + dashedNamespace);
          var elems = utils.makeArray(dataAttrElems).concat(utils.makeArray(jsDashElems));
          var dataOptionsAttr = dataAttr + "-options";
          var jQuery = window2.jQuery;
          elems.forEach(function(elem) {
            var attr = elem.getAttribute(dataAttr) || elem.getAttribute(dataOptionsAttr);
            var options;
            try {
              options = attr && JSON.parse(attr);
            } catch (error) {
              if (console2) {
                console2.error("Error parsing " + dataAttr + " on " + elem.className + ": " + error);
              }
              return;
            }
            var instance = new WidgetClass(elem, options);
            if (jQuery) {
              jQuery.data(elem, namespace, instance);
            }
          });
        });
      };
      return utils;
    });
  }
});

// node_modules/flickity/js/cell.js
var require_cell = __commonJS({
  "node_modules/flickity/js/cell.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "get-size/get-size"
        ], function(getSize) {
          return factory(window2, getSize);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_get_size()
        );
      } else {
        window2.Flickity = window2.Flickity || {};
        window2.Flickity.Cell = factory(
          window2,
          window2.getSize
        );
      }
    })(window, function factory(window2, getSize) {
      "use strict";
      function Cell(elem, parent) {
        this.element = elem;
        this.parent = parent;
        this.create();
      }
      var proto = Cell.prototype;
      proto.create = function() {
        this.element.style.position = "absolute";
        this.element.setAttribute("aria-hidden", "true");
        this.x = 0;
        this.shift = 0;
      };
      proto.destroy = function() {
        this.unselect();
        this.element.style.position = "";
        var side = this.parent.originSide;
        this.element.style[side] = "";
        this.element.removeAttribute("aria-hidden");
      };
      proto.getSize = function() {
        this.size = getSize(this.element);
      };
      proto.setPosition = function(x) {
        this.x = x;
        this.updateTarget();
        this.renderPosition(x);
      };
      proto.updateTarget = proto.setDefaultTarget = function() {
        var marginProperty = this.parent.originSide == "left" ? "marginLeft" : "marginRight";
        this.target = this.x + this.size[marginProperty] + this.size.width * this.parent.cellAlign;
      };
      proto.renderPosition = function(x) {
        var side = this.parent.originSide;
        this.element.style[side] = this.parent.getPositionValue(x);
      };
      proto.select = function() {
        this.element.classList.add("is-selected");
        this.element.removeAttribute("aria-hidden");
      };
      proto.unselect = function() {
        this.element.classList.remove("is-selected");
        this.element.setAttribute("aria-hidden", "true");
      };
      proto.wrapShift = function(shift) {
        this.shift = shift;
        this.renderPosition(this.x + this.parent.slideableWidth * shift);
      };
      proto.remove = function() {
        this.element.parentNode.removeChild(this.element);
      };
      return Cell;
    });
  }
});

// node_modules/flickity/js/slide.js
var require_slide = __commonJS({
  "node_modules/flickity/js/slide.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define(factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory();
      } else {
        window2.Flickity = window2.Flickity || {};
        window2.Flickity.Slide = factory();
      }
    })(window, function factory() {
      "use strict";
      function Slide(parent) {
        this.parent = parent;
        this.isOriginLeft = parent.originSide == "left";
        this.cells = [];
        this.outerWidth = 0;
        this.height = 0;
      }
      var proto = Slide.prototype;
      proto.addCell = function(cell) {
        this.cells.push(cell);
        this.outerWidth += cell.size.outerWidth;
        this.height = Math.max(cell.size.outerHeight, this.height);
        if (this.cells.length == 1) {
          this.x = cell.x;
          var beginMargin = this.isOriginLeft ? "marginLeft" : "marginRight";
          this.firstMargin = cell.size[beginMargin];
        }
      };
      proto.updateTarget = function() {
        var endMargin = this.isOriginLeft ? "marginRight" : "marginLeft";
        var lastCell = this.getLastCell();
        var lastMargin = lastCell ? lastCell.size[endMargin] : 0;
        var slideWidth = this.outerWidth - (this.firstMargin + lastMargin);
        this.target = this.x + this.firstMargin + slideWidth * this.parent.cellAlign;
      };
      proto.getLastCell = function() {
        return this.cells[this.cells.length - 1];
      };
      proto.select = function() {
        this.cells.forEach(function(cell) {
          cell.select();
        });
      };
      proto.unselect = function() {
        this.cells.forEach(function(cell) {
          cell.unselect();
        });
      };
      proto.getCellElements = function() {
        return this.cells.map(function(cell) {
          return cell.element;
        });
      };
      return Slide;
    });
  }
});

// node_modules/flickity/js/animate.js
var require_animate = __commonJS({
  "node_modules/flickity/js/animate.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "fizzy-ui-utils/utils"
        ], function(utils) {
          return factory(window2, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_utils()
        );
      } else {
        window2.Flickity = window2.Flickity || {};
        window2.Flickity.animatePrototype = factory(
          window2,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, utils) {
      "use strict";
      var proto = {};
      proto.startAnimation = function() {
        if (this.isAnimating) {
          return;
        }
        this.isAnimating = true;
        this.restingFrames = 0;
        this.animate();
      };
      proto.animate = function() {
        this.applyDragForce();
        this.applySelectedAttraction();
        var previousX = this.x;
        this.integratePhysics();
        this.positionSlider();
        this.settle(previousX);
        if (this.isAnimating) {
          var _this = this;
          requestAnimationFrame(function animateFrame() {
            _this.animate();
          });
        }
      };
      proto.positionSlider = function() {
        var x = this.x;
        if (this.options.wrapAround && this.cells.length > 1) {
          x = utils.modulo(x, this.slideableWidth);
          x -= this.slideableWidth;
          this.shiftWrapCells(x);
        }
        this.setTranslateX(x, this.isAnimating);
        this.dispatchScrollEvent();
      };
      proto.setTranslateX = function(x, is3d) {
        x += this.cursorPosition;
        x = this.options.rightToLeft ? -x : x;
        var translateX = this.getPositionValue(x);
        this.slider.style.transform = is3d ? "translate3d(" + translateX + ",0,0)" : "translateX(" + translateX + ")";
      };
      proto.dispatchScrollEvent = function() {
        var firstSlide = this.slides[0];
        if (!firstSlide) {
          return;
        }
        var positionX = -this.x - firstSlide.target;
        var progress = positionX / this.slidesWidth;
        this.dispatchEvent("scroll", null, [progress, positionX]);
      };
      proto.positionSliderAtSelected = function() {
        if (!this.cells.length) {
          return;
        }
        this.x = -this.selectedSlide.target;
        this.velocity = 0;
        this.positionSlider();
      };
      proto.getPositionValue = function(position) {
        if (this.options.percentPosition) {
          return Math.round(position / this.size.innerWidth * 1e4) * 0.01 + "%";
        } else {
          return Math.round(position) + "px";
        }
      };
      proto.settle = function(previousX) {
        var isResting = !this.isPointerDown && Math.round(this.x * 100) == Math.round(previousX * 100);
        if (isResting) {
          this.restingFrames++;
        }
        if (this.restingFrames > 2) {
          this.isAnimating = false;
          delete this.isFreeScrolling;
          this.positionSlider();
          this.dispatchEvent("settle", null, [this.selectedIndex]);
        }
      };
      proto.shiftWrapCells = function(x) {
        var beforeGap = this.cursorPosition + x;
        this._shiftCells(this.beforeShiftCells, beforeGap, -1);
        var afterGap = this.size.innerWidth - (x + this.slideableWidth + this.cursorPosition);
        this._shiftCells(this.afterShiftCells, afterGap, 1);
      };
      proto._shiftCells = function(cells, gap, shift) {
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];
          var cellShift = gap > 0 ? shift : 0;
          cell.wrapShift(cellShift);
          gap -= cell.size.outerWidth;
        }
      };
      proto._unshiftCells = function(cells) {
        if (!cells || !cells.length) {
          return;
        }
        for (var i = 0; i < cells.length; i++) {
          cells[i].wrapShift(0);
        }
      };
      proto.integratePhysics = function() {
        this.x += this.velocity;
        this.velocity *= this.getFrictionFactor();
      };
      proto.applyForce = function(force) {
        this.velocity += force;
      };
      proto.getFrictionFactor = function() {
        return 1 - this.options[this.isFreeScrolling ? "freeScrollFriction" : "friction"];
      };
      proto.getRestingPosition = function() {
        return this.x + this.velocity / (1 - this.getFrictionFactor());
      };
      proto.applyDragForce = function() {
        if (!this.isDraggable || !this.isPointerDown) {
          return;
        }
        var dragVelocity = this.dragX - this.x;
        var dragForce = dragVelocity - this.velocity;
        this.applyForce(dragForce);
      };
      proto.applySelectedAttraction = function() {
        var dragDown = this.isDraggable && this.isPointerDown;
        if (dragDown || this.isFreeScrolling || !this.slides.length) {
          return;
        }
        var distance = this.selectedSlide.target * -1 - this.x;
        var force = distance * this.options.selectedAttraction;
        this.applyForce(force);
      };
      return proto;
    });
  }
});

// node_modules/flickity/js/flickity.js
var require_flickity = __commonJS({
  "node_modules/flickity/js/flickity.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "ev-emitter/ev-emitter",
          "get-size/get-size",
          "fizzy-ui-utils/utils",
          "./cell",
          "./slide",
          "./animate"
        ], function(EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
          return factory(window2, EvEmitter, getSize, utils, Cell, Slide, animatePrototype);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_ev_emitter(),
          require_get_size(),
          require_utils(),
          require_cell(),
          require_slide(),
          require_animate()
        );
      } else {
        var _Flickity = window2.Flickity;
        window2.Flickity = factory(
          window2,
          window2.EvEmitter,
          window2.getSize,
          window2.fizzyUIUtils,
          _Flickity.Cell,
          _Flickity.Slide,
          _Flickity.animatePrototype
        );
      }
    })(window, function factory(window2, EvEmitter, getSize, utils, Cell, Slide, animatePrototype) {
      "use strict";
      var jQuery = window2.jQuery;
      var getComputedStyle2 = window2.getComputedStyle;
      var console2 = window2.console;
      function moveElements(elems, toElem) {
        elems = utils.makeArray(elems);
        while (elems.length) {
          toElem.appendChild(elems.shift());
        }
      }
      var GUID = 0;
      var instances = {};
      function Flickity10(element, options) {
        var queryElement = utils.getQueryElement(element);
        if (!queryElement) {
          if (console2) {
            console2.error("Bad element for Flickity: " + (queryElement || element));
          }
          return;
        }
        this.element = queryElement;
        if (this.element.flickityGUID) {
          var instance = instances[this.element.flickityGUID];
          if (instance) instance.option(options);
          return instance;
        }
        if (jQuery) {
          this.$element = jQuery(this.element);
        }
        this.options = utils.extend({}, this.constructor.defaults);
        this.option(options);
        this._create();
      }
      Flickity10.defaults = {
        accessibility: true,
        // adaptiveHeight: false,
        cellAlign: "center",
        // cellSelector: undefined,
        // contain: false,
        freeScrollFriction: 0.075,
        // friction when free-scrolling
        friction: 0.28,
        // friction when selecting
        namespaceJQueryEvents: true,
        // initialIndex: 0,
        percentPosition: true,
        resize: true,
        selectedAttraction: 0.025,
        setGallerySize: true
        // watchCSS: false,
        // wrapAround: false
      };
      Flickity10.createMethods = [];
      var proto = Flickity10.prototype;
      utils.extend(proto, EvEmitter.prototype);
      proto._create = function() {
        var id = this.guid = ++GUID;
        this.element.flickityGUID = id;
        instances[id] = this;
        this.selectedIndex = 0;
        this.restingFrames = 0;
        this.x = 0;
        this.velocity = 0;
        this.originSide = this.options.rightToLeft ? "right" : "left";
        this.viewport = document.createElement("div");
        this.viewport.className = "flickity-viewport";
        this._createSlider();
        if (this.options.resize || this.options.watchCSS) {
          window2.addEventListener("resize", this);
        }
        for (var eventName in this.options.on) {
          var listener = this.options.on[eventName];
          this.on(eventName, listener);
        }
        Flickity10.createMethods.forEach(function(method) {
          this[method]();
        }, this);
        if (this.options.watchCSS) {
          this.watchCSS();
        } else {
          this.activate();
        }
      };
      proto.option = function(opts) {
        utils.extend(this.options, opts);
      };
      proto.activate = function() {
        if (this.isActive) {
          return;
        }
        this.isActive = true;
        this.element.classList.add("flickity-enabled");
        if (this.options.rightToLeft) {
          this.element.classList.add("flickity-rtl");
        }
        this.getSize();
        var cellElems = this._filterFindCellElements(this.element.children);
        moveElements(cellElems, this.slider);
        this.viewport.appendChild(this.slider);
        this.element.appendChild(this.viewport);
        this.reloadCells();
        if (this.options.accessibility) {
          this.element.tabIndex = 0;
          this.element.addEventListener("keydown", this);
        }
        this.emitEvent("activate");
        this.selectInitialIndex();
        this.isInitActivated = true;
        this.dispatchEvent("ready");
      };
      proto._createSlider = function() {
        var slider = document.createElement("div");
        slider.className = "flickity-slider";
        slider.style[this.originSide] = 0;
        this.slider = slider;
      };
      proto._filterFindCellElements = function(elems) {
        return utils.filterFindElements(elems, this.options.cellSelector);
      };
      proto.reloadCells = function() {
        this.cells = this._makeCells(this.slider.children);
        this.positionCells();
        this._getWrapShiftCells();
        this.setGallerySize();
      };
      proto._makeCells = function(elems) {
        var cellElems = this._filterFindCellElements(elems);
        var cells = cellElems.map(function(cellElem) {
          return new Cell(cellElem, this);
        }, this);
        return cells;
      };
      proto.getLastCell = function() {
        return this.cells[this.cells.length - 1];
      };
      proto.getLastSlide = function() {
        return this.slides[this.slides.length - 1];
      };
      proto.positionCells = function() {
        this._sizeCells(this.cells);
        this._positionCells(0);
      };
      proto._positionCells = function(index) {
        index = index || 0;
        this.maxCellHeight = index ? this.maxCellHeight || 0 : 0;
        var cellX = 0;
        if (index > 0) {
          var startCell = this.cells[index - 1];
          cellX = startCell.x + startCell.size.outerWidth;
        }
        var len = this.cells.length;
        for (var i = index; i < len; i++) {
          var cell = this.cells[i];
          cell.setPosition(cellX);
          cellX += cell.size.outerWidth;
          this.maxCellHeight = Math.max(cell.size.outerHeight, this.maxCellHeight);
        }
        this.slideableWidth = cellX;
        this.updateSlides();
        this._containSlides();
        this.slidesWidth = len ? this.getLastSlide().target - this.slides[0].target : 0;
      };
      proto._sizeCells = function(cells) {
        cells.forEach(function(cell) {
          cell.getSize();
        });
      };
      proto.updateSlides = function() {
        this.slides = [];
        if (!this.cells.length) {
          return;
        }
        var slide = new Slide(this);
        this.slides.push(slide);
        var isOriginLeft = this.originSide == "left";
        var nextMargin = isOriginLeft ? "marginRight" : "marginLeft";
        var canCellFit = this._getCanCellFit();
        this.cells.forEach(function(cell, i) {
          if (!slide.cells.length) {
            slide.addCell(cell);
            return;
          }
          var slideWidth = slide.outerWidth - slide.firstMargin + (cell.size.outerWidth - cell.size[nextMargin]);
          if (canCellFit.call(this, i, slideWidth)) {
            slide.addCell(cell);
          } else {
            slide.updateTarget();
            slide = new Slide(this);
            this.slides.push(slide);
            slide.addCell(cell);
          }
        }, this);
        slide.updateTarget();
        this.updateSelectedSlide();
      };
      proto._getCanCellFit = function() {
        var groupCells = this.options.groupCells;
        if (!groupCells) {
          return function() {
            return false;
          };
        } else if (typeof groupCells == "number") {
          var number = parseInt(groupCells, 10);
          return function(i) {
            return i % number !== 0;
          };
        }
        var percentMatch = typeof groupCells == "string" && groupCells.match(/^(\d+)%$/);
        var percent = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 1;
        return function(i, slideWidth) {
          return slideWidth <= (this.size.innerWidth + 1) * percent;
        };
      };
      proto._init = proto.reposition = function() {
        this.positionCells();
        this.positionSliderAtSelected();
      };
      proto.getSize = function() {
        this.size = getSize(this.element);
        this.setCellAlign();
        this.cursorPosition = this.size.innerWidth * this.cellAlign;
      };
      var cellAlignShorthands = {
        // cell align, then based on origin side
        center: {
          left: 0.5,
          right: 0.5
        },
        left: {
          left: 0,
          right: 1
        },
        right: {
          right: 0,
          left: 1
        }
      };
      proto.setCellAlign = function() {
        var shorthand = cellAlignShorthands[this.options.cellAlign];
        this.cellAlign = shorthand ? shorthand[this.originSide] : this.options.cellAlign;
      };
      proto.setGallerySize = function() {
        if (this.options.setGallerySize) {
          var height = this.options.adaptiveHeight && this.selectedSlide ? this.selectedSlide.height : this.maxCellHeight;
          this.viewport.style.height = height + "px";
        }
      };
      proto._getWrapShiftCells = function() {
        if (!this.options.wrapAround) {
          return;
        }
        this._unshiftCells(this.beforeShiftCells);
        this._unshiftCells(this.afterShiftCells);
        var gapX = this.cursorPosition;
        var cellIndex = this.cells.length - 1;
        this.beforeShiftCells = this._getGapCells(gapX, cellIndex, -1);
        gapX = this.size.innerWidth - this.cursorPosition;
        this.afterShiftCells = this._getGapCells(gapX, 0, 1);
      };
      proto._getGapCells = function(gapX, cellIndex, increment) {
        var cells = [];
        while (gapX > 0) {
          var cell = this.cells[cellIndex];
          if (!cell) {
            break;
          }
          cells.push(cell);
          cellIndex += increment;
          gapX -= cell.size.outerWidth;
        }
        return cells;
      };
      proto._containSlides = function() {
        if (!this.options.contain || this.options.wrapAround || !this.cells.length) {
          return;
        }
        var isRightToLeft = this.options.rightToLeft;
        var beginMargin = isRightToLeft ? "marginRight" : "marginLeft";
        var endMargin = isRightToLeft ? "marginLeft" : "marginRight";
        var contentWidth = this.slideableWidth - this.getLastCell().size[endMargin];
        var isContentSmaller = contentWidth < this.size.innerWidth;
        var beginBound = this.cursorPosition + this.cells[0].size[beginMargin];
        var endBound = contentWidth - this.size.innerWidth * (1 - this.cellAlign);
        this.slides.forEach(function(slide) {
          if (isContentSmaller) {
            slide.target = contentWidth * this.cellAlign;
          } else {
            slide.target = Math.max(slide.target, beginBound);
            slide.target = Math.min(slide.target, endBound);
          }
        }, this);
      };
      proto.dispatchEvent = function(type, event2, args) {
        var emitArgs = event2 ? [event2].concat(args) : args;
        this.emitEvent(type, emitArgs);
        if (jQuery && this.$element) {
          type += this.options.namespaceJQueryEvents ? ".flickity" : "";
          var $event = type;
          if (event2) {
            var jQEvent = new jQuery.Event(event2);
            jQEvent.type = type;
            $event = jQEvent;
          }
          this.$element.trigger($event, args);
        }
      };
      proto.select = function(index, isWrap, isInstant) {
        if (!this.isActive) {
          return;
        }
        index = parseInt(index, 10);
        this._wrapSelect(index);
        if (this.options.wrapAround || isWrap) {
          index = utils.modulo(index, this.slides.length);
        }
        if (!this.slides[index]) {
          return;
        }
        var prevIndex = this.selectedIndex;
        this.selectedIndex = index;
        this.updateSelectedSlide();
        if (isInstant) {
          this.positionSliderAtSelected();
        } else {
          this.startAnimation();
        }
        if (this.options.adaptiveHeight) {
          this.setGallerySize();
        }
        this.dispatchEvent("select", null, [index]);
        if (index != prevIndex) {
          this.dispatchEvent("change", null, [index]);
        }
        this.dispatchEvent("cellSelect");
      };
      proto._wrapSelect = function(index) {
        var len = this.slides.length;
        var isWrapping = this.options.wrapAround && len > 1;
        if (!isWrapping) {
          return index;
        }
        var wrapIndex = utils.modulo(index, len);
        var delta = Math.abs(wrapIndex - this.selectedIndex);
        var backWrapDelta = Math.abs(wrapIndex + len - this.selectedIndex);
        var forewardWrapDelta = Math.abs(wrapIndex - len - this.selectedIndex);
        if (!this.isDragSelect && backWrapDelta < delta) {
          index += len;
        } else if (!this.isDragSelect && forewardWrapDelta < delta) {
          index -= len;
        }
        if (index < 0) {
          this.x -= this.slideableWidth;
        } else if (index >= len) {
          this.x += this.slideableWidth;
        }
      };
      proto.previous = function(isWrap, isInstant) {
        this.select(this.selectedIndex - 1, isWrap, isInstant);
      };
      proto.next = function(isWrap, isInstant) {
        this.select(this.selectedIndex + 1, isWrap, isInstant);
      };
      proto.updateSelectedSlide = function() {
        var slide = this.slides[this.selectedIndex];
        if (!slide) {
          return;
        }
        this.unselectSelectedSlide();
        this.selectedSlide = slide;
        slide.select();
        this.selectedCells = slide.cells;
        this.selectedElements = slide.getCellElements();
        this.selectedCell = slide.cells[0];
        this.selectedElement = this.selectedElements[0];
      };
      proto.unselectSelectedSlide = function() {
        if (this.selectedSlide) {
          this.selectedSlide.unselect();
        }
      };
      proto.selectInitialIndex = function() {
        var initialIndex = this.options.initialIndex;
        if (this.isInitActivated) {
          this.select(this.selectedIndex, false, true);
          return;
        }
        if (initialIndex && typeof initialIndex == "string") {
          var cell = this.queryCell(initialIndex);
          if (cell) {
            this.selectCell(initialIndex, false, true);
            return;
          }
        }
        var index = 0;
        if (initialIndex && this.slides[initialIndex]) {
          index = initialIndex;
        }
        this.select(index, false, true);
      };
      proto.selectCell = function(value, isWrap, isInstant) {
        var cell = this.queryCell(value);
        if (!cell) {
          return;
        }
        var index = this.getCellSlideIndex(cell);
        this.select(index, isWrap, isInstant);
      };
      proto.getCellSlideIndex = function(cell) {
        for (var i = 0; i < this.slides.length; i++) {
          var slide = this.slides[i];
          var index = slide.cells.indexOf(cell);
          if (index != -1) {
            return i;
          }
        }
      };
      proto.getCell = function(elem) {
        for (var i = 0; i < this.cells.length; i++) {
          var cell = this.cells[i];
          if (cell.element == elem) {
            return cell;
          }
        }
      };
      proto.getCells = function(elems) {
        elems = utils.makeArray(elems);
        var cells = [];
        elems.forEach(function(elem) {
          var cell = this.getCell(elem);
          if (cell) {
            cells.push(cell);
          }
        }, this);
        return cells;
      };
      proto.getCellElements = function() {
        return this.cells.map(function(cell) {
          return cell.element;
        });
      };
      proto.getParentCell = function(elem) {
        var cell = this.getCell(elem);
        if (cell) {
          return cell;
        }
        elem = utils.getParent(elem, ".flickity-slider > *");
        return this.getCell(elem);
      };
      proto.getAdjacentCellElements = function(adjCount, index) {
        if (!adjCount) {
          return this.selectedSlide.getCellElements();
        }
        index = index === void 0 ? this.selectedIndex : index;
        var len = this.slides.length;
        if (1 + adjCount * 2 >= len) {
          return this.getCellElements();
        }
        var cellElems = [];
        for (var i = index - adjCount; i <= index + adjCount; i++) {
          var slideIndex = this.options.wrapAround ? utils.modulo(i, len) : i;
          var slide = this.slides[slideIndex];
          if (slide) {
            cellElems = cellElems.concat(slide.getCellElements());
          }
        }
        return cellElems;
      };
      proto.queryCell = function(selector) {
        if (typeof selector == "number") {
          return this.cells[selector];
        }
        if (typeof selector == "string") {
          if (selector.match(/^[#.]?[\d/]/)) {
            return;
          }
          selector = this.element.querySelector(selector);
        }
        return this.getCell(selector);
      };
      proto.uiChange = function() {
        this.emitEvent("uiChange");
      };
      proto.childUIPointerDown = function(event2) {
        if (event2.type != "touchstart") {
          event2.preventDefault();
        }
        this.focus();
      };
      proto.onresize = function() {
        this.watchCSS();
        this.resize();
      };
      utils.debounceMethod(Flickity10, "onresize", 150);
      proto.resize = function() {
        if (!this.isActive) {
          return;
        }
        this.getSize();
        if (this.options.wrapAround) {
          this.x = utils.modulo(this.x, this.slideableWidth);
        }
        this.positionCells();
        this._getWrapShiftCells();
        this.setGallerySize();
        this.emitEvent("resize");
        var selectedElement = this.selectedElements && this.selectedElements[0];
        this.selectCell(selectedElement, false, true);
      };
      proto.watchCSS = function() {
        var watchOption = this.options.watchCSS;
        if (!watchOption) {
          return;
        }
        var afterContent = getComputedStyle2(this.element, ":after").content;
        if (afterContent.indexOf("flickity") != -1) {
          this.activate();
        } else {
          this.deactivate();
        }
      };
      proto.onkeydown = function(event2) {
        var isNotFocused = document.activeElement && document.activeElement != this.element;
        if (!this.options.accessibility || isNotFocused) {
          return;
        }
        var handler = Flickity10.keyboardHandlers[event2.keyCode];
        if (handler) {
          handler.call(this);
        }
      };
      Flickity10.keyboardHandlers = {
        // left arrow
        37: function() {
          var leftMethod = this.options.rightToLeft ? "next" : "previous";
          this.uiChange();
          this[leftMethod]();
        },
        // right arrow
        39: function() {
          var rightMethod = this.options.rightToLeft ? "previous" : "next";
          this.uiChange();
          this[rightMethod]();
        }
      };
      proto.focus = function() {
        var prevScrollY = window2.pageYOffset;
        this.element.focus({ preventScroll: true });
        if (window2.pageYOffset != prevScrollY) {
          window2.scrollTo(window2.pageXOffset, prevScrollY);
        }
      };
      proto.deactivate = function() {
        if (!this.isActive) {
          return;
        }
        this.element.classList.remove("flickity-enabled");
        this.element.classList.remove("flickity-rtl");
        this.unselectSelectedSlide();
        this.cells.forEach(function(cell) {
          cell.destroy();
        });
        this.element.removeChild(this.viewport);
        moveElements(this.slider.children, this.element);
        if (this.options.accessibility) {
          this.element.removeAttribute("tabIndex");
          this.element.removeEventListener("keydown", this);
        }
        this.isActive = false;
        this.emitEvent("deactivate");
      };
      proto.destroy = function() {
        this.deactivate();
        window2.removeEventListener("resize", this);
        this.allOff();
        this.emitEvent("destroy");
        if (jQuery && this.$element) {
          jQuery.removeData(this.element, "flickity");
        }
        delete this.element.flickityGUID;
        delete instances[this.guid];
      };
      utils.extend(proto, animatePrototype);
      Flickity10.data = function(elem) {
        elem = utils.getQueryElement(elem);
        var id = elem && elem.flickityGUID;
        return id && instances[id];
      };
      utils.htmlInit(Flickity10, "flickity");
      if (jQuery && jQuery.bridget) {
        jQuery.bridget("flickity", Flickity10);
      }
      Flickity10.setJQuery = function(jq) {
        jQuery = jq;
      };
      Flickity10.Cell = Cell;
      Flickity10.Slide = Slide;
      return Flickity10;
    });
  }
});

// node_modules/unipointer/unipointer.js
var require_unipointer = __commonJS({
  "node_modules/unipointer/unipointer.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "ev-emitter/ev-emitter"
        ], function(EvEmitter) {
          return factory(window2, EvEmitter);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_ev_emitter()
        );
      } else {
        window2.Unipointer = factory(
          window2,
          window2.EvEmitter
        );
      }
    })(window, function factory(window2, EvEmitter) {
      "use strict";
      function noop() {
      }
      function Unipointer() {
      }
      var proto = Unipointer.prototype = Object.create(EvEmitter.prototype);
      proto.bindStartEvent = function(elem) {
        this._bindStartEvent(elem, true);
      };
      proto.unbindStartEvent = function(elem) {
        this._bindStartEvent(elem, false);
      };
      proto._bindStartEvent = function(elem, isAdd) {
        isAdd = isAdd === void 0 ? true : isAdd;
        var bindMethod = isAdd ? "addEventListener" : "removeEventListener";
        var startEvent = "mousedown";
        if ("ontouchstart" in window2) {
          startEvent = "touchstart";
        } else if (window2.PointerEvent) {
          startEvent = "pointerdown";
        }
        elem[bindMethod](startEvent, this);
      };
      proto.handleEvent = function(event2) {
        var method = "on" + event2.type;
        if (this[method]) {
          this[method](event2);
        }
      };
      proto.getTouch = function(touches) {
        for (var i = 0; i < touches.length; i++) {
          var touch = touches[i];
          if (touch.identifier == this.pointerIdentifier) {
            return touch;
          }
        }
      };
      proto.onmousedown = function(event2) {
        var button = event2.button;
        if (button && (button !== 0 && button !== 1)) {
          return;
        }
        this._pointerDown(event2, event2);
      };
      proto.ontouchstart = function(event2) {
        this._pointerDown(event2, event2.changedTouches[0]);
      };
      proto.onpointerdown = function(event2) {
        this._pointerDown(event2, event2);
      };
      proto._pointerDown = function(event2, pointer) {
        if (event2.button || this.isPointerDown) {
          return;
        }
        this.isPointerDown = true;
        this.pointerIdentifier = pointer.pointerId !== void 0 ? (
          // pointerId for pointer events, touch.indentifier for touch events
          pointer.pointerId
        ) : pointer.identifier;
        this.pointerDown(event2, pointer);
      };
      proto.pointerDown = function(event2, pointer) {
        this._bindPostStartEvents(event2);
        this.emitEvent("pointerDown", [event2, pointer]);
      };
      var postStartEvents = {
        mousedown: ["mousemove", "mouseup"],
        touchstart: ["touchmove", "touchend", "touchcancel"],
        pointerdown: ["pointermove", "pointerup", "pointercancel"]
      };
      proto._bindPostStartEvents = function(event2) {
        if (!event2) {
          return;
        }
        var events = postStartEvents[event2.type];
        events.forEach(function(eventName) {
          window2.addEventListener(eventName, this);
        }, this);
        this._boundPointerEvents = events;
      };
      proto._unbindPostStartEvents = function() {
        if (!this._boundPointerEvents) {
          return;
        }
        this._boundPointerEvents.forEach(function(eventName) {
          window2.removeEventListener(eventName, this);
        }, this);
        delete this._boundPointerEvents;
      };
      proto.onmousemove = function(event2) {
        this._pointerMove(event2, event2);
      };
      proto.onpointermove = function(event2) {
        if (event2.pointerId == this.pointerIdentifier) {
          this._pointerMove(event2, event2);
        }
      };
      proto.ontouchmove = function(event2) {
        var touch = this.getTouch(event2.changedTouches);
        if (touch) {
          this._pointerMove(event2, touch);
        }
      };
      proto._pointerMove = function(event2, pointer) {
        this.pointerMove(event2, pointer);
      };
      proto.pointerMove = function(event2, pointer) {
        this.emitEvent("pointerMove", [event2, pointer]);
      };
      proto.onmouseup = function(event2) {
        this._pointerUp(event2, event2);
      };
      proto.onpointerup = function(event2) {
        if (event2.pointerId == this.pointerIdentifier) {
          this._pointerUp(event2, event2);
        }
      };
      proto.ontouchend = function(event2) {
        var touch = this.getTouch(event2.changedTouches);
        if (touch) {
          this._pointerUp(event2, touch);
        }
      };
      proto._pointerUp = function(event2, pointer) {
        this._pointerDone();
        this.pointerUp(event2, pointer);
      };
      proto.pointerUp = function(event2, pointer) {
        this.emitEvent("pointerUp", [event2, pointer]);
      };
      proto._pointerDone = function() {
        this._pointerReset();
        this._unbindPostStartEvents();
        this.pointerDone();
      };
      proto._pointerReset = function() {
        this.isPointerDown = false;
        delete this.pointerIdentifier;
      };
      proto.pointerDone = noop;
      proto.onpointercancel = function(event2) {
        if (event2.pointerId == this.pointerIdentifier) {
          this._pointerCancel(event2, event2);
        }
      };
      proto.ontouchcancel = function(event2) {
        var touch = this.getTouch(event2.changedTouches);
        if (touch) {
          this._pointerCancel(event2, touch);
        }
      };
      proto._pointerCancel = function(event2, pointer) {
        this._pointerDone();
        this.pointerCancel(event2, pointer);
      };
      proto.pointerCancel = function(event2, pointer) {
        this.emitEvent("pointerCancel", [event2, pointer]);
      };
      Unipointer.getPointerPoint = function(pointer) {
        return {
          x: pointer.pageX,
          y: pointer.pageY
        };
      };
      return Unipointer;
    });
  }
});

// node_modules/unidragger/unidragger.js
var require_unidragger = __commonJS({
  "node_modules/unidragger/unidragger.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "unipointer/unipointer"
        ], function(Unipointer) {
          return factory(window2, Unipointer);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_unipointer()
        );
      } else {
        window2.Unidragger = factory(
          window2,
          window2.Unipointer
        );
      }
    })(window, function factory(window2, Unipointer) {
      "use strict";
      function Unidragger() {
      }
      var proto = Unidragger.prototype = Object.create(Unipointer.prototype);
      proto.bindHandles = function() {
        this._bindHandles(true);
      };
      proto.unbindHandles = function() {
        this._bindHandles(false);
      };
      proto._bindHandles = function(isAdd) {
        isAdd = isAdd === void 0 ? true : isAdd;
        var bindMethod = isAdd ? "addEventListener" : "removeEventListener";
        var touchAction = isAdd ? this._touchActionValue : "";
        for (var i = 0; i < this.handles.length; i++) {
          var handle = this.handles[i];
          this._bindStartEvent(handle, isAdd);
          handle[bindMethod]("click", this);
          if (window2.PointerEvent) {
            handle.style.touchAction = touchAction;
          }
        }
      };
      proto._touchActionValue = "none";
      proto.pointerDown = function(event2, pointer) {
        var isOkay = this.okayPointerDown(event2);
        if (!isOkay) {
          return;
        }
        this.pointerDownPointer = {
          pageX: pointer.pageX,
          pageY: pointer.pageY
        };
        event2.preventDefault();
        this.pointerDownBlur();
        this._bindPostStartEvents(event2);
        this.emitEvent("pointerDown", [event2, pointer]);
      };
      var cursorNodes = {
        TEXTAREA: true,
        INPUT: true,
        SELECT: true,
        OPTION: true
      };
      var clickTypes = {
        radio: true,
        checkbox: true,
        button: true,
        submit: true,
        image: true,
        file: true
      };
      proto.okayPointerDown = function(event2) {
        var isCursorNode = cursorNodes[event2.target.nodeName];
        var isClickType = clickTypes[event2.target.type];
        var isOkay = !isCursorNode || isClickType;
        if (!isOkay) {
          this._pointerReset();
        }
        return isOkay;
      };
      proto.pointerDownBlur = function() {
        var focused = document.activeElement;
        var canBlur = focused && focused.blur && focused != document.body;
        if (canBlur) {
          focused.blur();
        }
      };
      proto.pointerMove = function(event2, pointer) {
        var moveVector = this._dragPointerMove(event2, pointer);
        this.emitEvent("pointerMove", [event2, pointer, moveVector]);
        this._dragMove(event2, pointer, moveVector);
      };
      proto._dragPointerMove = function(event2, pointer) {
        var moveVector = {
          x: pointer.pageX - this.pointerDownPointer.pageX,
          y: pointer.pageY - this.pointerDownPointer.pageY
        };
        if (!this.isDragging && this.hasDragStarted(moveVector)) {
          this._dragStart(event2, pointer);
        }
        return moveVector;
      };
      proto.hasDragStarted = function(moveVector) {
        return Math.abs(moveVector.x) > 3 || Math.abs(moveVector.y) > 3;
      };
      proto.pointerUp = function(event2, pointer) {
        this.emitEvent("pointerUp", [event2, pointer]);
        this._dragPointerUp(event2, pointer);
      };
      proto._dragPointerUp = function(event2, pointer) {
        if (this.isDragging) {
          this._dragEnd(event2, pointer);
        } else {
          this._staticClick(event2, pointer);
        }
      };
      proto._dragStart = function(event2, pointer) {
        this.isDragging = true;
        this.isPreventingClicks = true;
        this.dragStart(event2, pointer);
      };
      proto.dragStart = function(event2, pointer) {
        this.emitEvent("dragStart", [event2, pointer]);
      };
      proto._dragMove = function(event2, pointer, moveVector) {
        if (!this.isDragging) {
          return;
        }
        this.dragMove(event2, pointer, moveVector);
      };
      proto.dragMove = function(event2, pointer, moveVector) {
        event2.preventDefault();
        this.emitEvent("dragMove", [event2, pointer, moveVector]);
      };
      proto._dragEnd = function(event2, pointer) {
        this.isDragging = false;
        setTimeout((function() {
          delete this.isPreventingClicks;
        }).bind(this));
        this.dragEnd(event2, pointer);
      };
      proto.dragEnd = function(event2, pointer) {
        this.emitEvent("dragEnd", [event2, pointer]);
      };
      proto.onclick = function(event2) {
        if (this.isPreventingClicks) {
          event2.preventDefault();
        }
      };
      proto._staticClick = function(event2, pointer) {
        if (this.isIgnoringMouseUp && event2.type == "mouseup") {
          return;
        }
        this.staticClick(event2, pointer);
        if (event2.type != "mouseup") {
          this.isIgnoringMouseUp = true;
          setTimeout((function() {
            delete this.isIgnoringMouseUp;
          }).bind(this), 400);
        }
      };
      proto.staticClick = function(event2, pointer) {
        this.emitEvent("staticClick", [event2, pointer]);
      };
      Unidragger.getPointerPoint = Unipointer.getPointerPoint;
      return Unidragger;
    });
  }
});

// node_modules/flickity/js/drag.js
var require_drag = __commonJS({
  "node_modules/flickity/js/drag.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "unidragger/unidragger",
          "fizzy-ui-utils/utils"
        ], function(Flickity10, Unidragger, utils) {
          return factory(window2, Flickity10, Unidragger, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_flickity(),
          require_unidragger(),
          require_utils()
        );
      } else {
        window2.Flickity = factory(
          window2,
          window2.Flickity,
          window2.Unidragger,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, Flickity10, Unidragger, utils) {
      "use strict";
      utils.extend(Flickity10.defaults, {
        draggable: ">1",
        dragThreshold: 3
      });
      Flickity10.createMethods.push("_createDrag");
      var proto = Flickity10.prototype;
      utils.extend(proto, Unidragger.prototype);
      proto._touchActionValue = "pan-y";
      var isTouch = "createTouch" in document;
      var isTouchmoveScrollCanceled = false;
      proto._createDrag = function() {
        this.on("activate", this.onActivateDrag);
        this.on("uiChange", this._uiChangeDrag);
        this.on("deactivate", this.onDeactivateDrag);
        this.on("cellChange", this.updateDraggable);
        if (isTouch && !isTouchmoveScrollCanceled) {
          window2.addEventListener("touchmove", function() {
          });
          isTouchmoveScrollCanceled = true;
        }
      };
      proto.onActivateDrag = function() {
        this.handles = [this.viewport];
        this.bindHandles();
        this.updateDraggable();
      };
      proto.onDeactivateDrag = function() {
        this.unbindHandles();
        this.element.classList.remove("is-draggable");
      };
      proto.updateDraggable = function() {
        if (this.options.draggable == ">1") {
          this.isDraggable = this.slides.length > 1;
        } else {
          this.isDraggable = this.options.draggable;
        }
        if (this.isDraggable) {
          this.element.classList.add("is-draggable");
        } else {
          this.element.classList.remove("is-draggable");
        }
      };
      proto.bindDrag = function() {
        this.options.draggable = true;
        this.updateDraggable();
      };
      proto.unbindDrag = function() {
        this.options.draggable = false;
        this.updateDraggable();
      };
      proto._uiChangeDrag = function() {
        delete this.isFreeScrolling;
      };
      proto.pointerDown = function(event2, pointer) {
        if (!this.isDraggable) {
          this._pointerDownDefault(event2, pointer);
          return;
        }
        var isOkay = this.okayPointerDown(event2);
        if (!isOkay) {
          return;
        }
        this._pointerDownPreventDefault(event2);
        this.pointerDownFocus(event2);
        if (document.activeElement != this.element) {
          this.pointerDownBlur();
        }
        this.dragX = this.x;
        this.viewport.classList.add("is-pointer-down");
        this.pointerDownScroll = getScrollPosition();
        window2.addEventListener("scroll", this);
        this._pointerDownDefault(event2, pointer);
      };
      proto._pointerDownDefault = function(event2, pointer) {
        this.pointerDownPointer = {
          pageX: pointer.pageX,
          pageY: pointer.pageY
        };
        this._bindPostStartEvents(event2);
        this.dispatchEvent("pointerDown", event2, [pointer]);
      };
      var focusNodes = {
        INPUT: true,
        TEXTAREA: true,
        SELECT: true
      };
      proto.pointerDownFocus = function(event2) {
        var isFocusNode = focusNodes[event2.target.nodeName];
        if (!isFocusNode) {
          this.focus();
        }
      };
      proto._pointerDownPreventDefault = function(event2) {
        var isTouchStart = event2.type == "touchstart";
        var isTouchPointer = event2.pointerType == "touch";
        var isFocusNode = focusNodes[event2.target.nodeName];
        if (!isTouchStart && !isTouchPointer && !isFocusNode) {
          event2.preventDefault();
        }
      };
      proto.hasDragStarted = function(moveVector) {
        return Math.abs(moveVector.x) > this.options.dragThreshold;
      };
      proto.pointerUp = function(event2, pointer) {
        delete this.isTouchScrolling;
        this.viewport.classList.remove("is-pointer-down");
        this.dispatchEvent("pointerUp", event2, [pointer]);
        this._dragPointerUp(event2, pointer);
      };
      proto.pointerDone = function() {
        window2.removeEventListener("scroll", this);
        delete this.pointerDownScroll;
      };
      proto.dragStart = function(event2, pointer) {
        if (!this.isDraggable) {
          return;
        }
        this.dragStartPosition = this.x;
        this.startAnimation();
        window2.removeEventListener("scroll", this);
        this.dispatchEvent("dragStart", event2, [pointer]);
      };
      proto.pointerMove = function(event2, pointer) {
        var moveVector = this._dragPointerMove(event2, pointer);
        this.dispatchEvent("pointerMove", event2, [pointer, moveVector]);
        this._dragMove(event2, pointer, moveVector);
      };
      proto.dragMove = function(event2, pointer, moveVector) {
        if (!this.isDraggable) {
          return;
        }
        event2.preventDefault();
        this.previousDragX = this.dragX;
        var direction = this.options.rightToLeft ? -1 : 1;
        if (this.options.wrapAround) {
          moveVector.x %= this.slideableWidth;
        }
        var dragX = this.dragStartPosition + moveVector.x * direction;
        if (!this.options.wrapAround && this.slides.length) {
          var originBound = Math.max(-this.slides[0].target, this.dragStartPosition);
          dragX = dragX > originBound ? (dragX + originBound) * 0.5 : dragX;
          var endBound = Math.min(-this.getLastSlide().target, this.dragStartPosition);
          dragX = dragX < endBound ? (dragX + endBound) * 0.5 : dragX;
        }
        this.dragX = dragX;
        this.dragMoveTime = /* @__PURE__ */ new Date();
        this.dispatchEvent("dragMove", event2, [pointer, moveVector]);
      };
      proto.dragEnd = function(event2, pointer) {
        if (!this.isDraggable) {
          return;
        }
        if (this.options.freeScroll) {
          this.isFreeScrolling = true;
        }
        var index = this.dragEndRestingSelect();
        if (this.options.freeScroll && !this.options.wrapAround) {
          var restingX = this.getRestingPosition();
          this.isFreeScrolling = -restingX > this.slides[0].target && -restingX < this.getLastSlide().target;
        } else if (!this.options.freeScroll && index == this.selectedIndex) {
          index += this.dragEndBoostSelect();
        }
        delete this.previousDragX;
        this.isDragSelect = this.options.wrapAround;
        this.select(index);
        delete this.isDragSelect;
        this.dispatchEvent("dragEnd", event2, [pointer]);
      };
      proto.dragEndRestingSelect = function() {
        var restingX = this.getRestingPosition();
        var distance = Math.abs(this.getSlideDistance(-restingX, this.selectedIndex));
        var positiveResting = this._getClosestResting(restingX, distance, 1);
        var negativeResting = this._getClosestResting(restingX, distance, -1);
        var index = positiveResting.distance < negativeResting.distance ? positiveResting.index : negativeResting.index;
        return index;
      };
      proto._getClosestResting = function(restingX, distance, increment) {
        var index = this.selectedIndex;
        var minDistance = Infinity;
        var condition = this.options.contain && !this.options.wrapAround ? (
          // if contain, keep going if distance is equal to minDistance
          function(dist, minDist) {
            return dist <= minDist;
          }
        ) : function(dist, minDist) {
          return dist < minDist;
        };
        while (condition(distance, minDistance)) {
          index += increment;
          minDistance = distance;
          distance = this.getSlideDistance(-restingX, index);
          if (distance === null) {
            break;
          }
          distance = Math.abs(distance);
        }
        return {
          distance: minDistance,
          // selected was previous index
          index: index - increment
        };
      };
      proto.getSlideDistance = function(x, index) {
        var len = this.slides.length;
        var isWrapAround = this.options.wrapAround && len > 1;
        var slideIndex = isWrapAround ? utils.modulo(index, len) : index;
        var slide = this.slides[slideIndex];
        if (!slide) {
          return null;
        }
        var wrap = isWrapAround ? this.slideableWidth * Math.floor(index / len) : 0;
        return x - (slide.target + wrap);
      };
      proto.dragEndBoostSelect = function() {
        if (this.previousDragX === void 0 || !this.dragMoveTime || // or if drag was held for 100 ms
        /* @__PURE__ */ new Date() - this.dragMoveTime > 100) {
          return 0;
        }
        var distance = this.getSlideDistance(-this.dragX, this.selectedIndex);
        var delta = this.previousDragX - this.dragX;
        if (distance > 0 && delta > 0) {
          return 1;
        } else if (distance < 0 && delta < 0) {
          return -1;
        }
        return 0;
      };
      proto.staticClick = function(event2, pointer) {
        var clickedCell = this.getParentCell(event2.target);
        var cellElem = clickedCell && clickedCell.element;
        var cellIndex = clickedCell && this.cells.indexOf(clickedCell);
        this.dispatchEvent("staticClick", event2, [pointer, cellElem, cellIndex]);
      };
      proto.onscroll = function() {
        var scroll = getScrollPosition();
        var scrollMoveX = this.pointerDownScroll.x - scroll.x;
        var scrollMoveY = this.pointerDownScroll.y - scroll.y;
        if (Math.abs(scrollMoveX) > 3 || Math.abs(scrollMoveY) > 3) {
          this._pointerDone();
        }
      };
      function getScrollPosition() {
        return {
          x: window2.pageXOffset,
          y: window2.pageYOffset
        };
      }
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/prev-next-button.js
var require_prev_next_button = __commonJS({
  "node_modules/flickity/js/prev-next-button.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "unipointer/unipointer",
          "fizzy-ui-utils/utils"
        ], function(Flickity10, Unipointer, utils) {
          return factory(window2, Flickity10, Unipointer, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_flickity(),
          require_unipointer(),
          require_utils()
        );
      } else {
        factory(
          window2,
          window2.Flickity,
          window2.Unipointer,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, Flickity10, Unipointer, utils) {
      "use strict";
      var svgURI = "http://www.w3.org/2000/svg";
      function PrevNextButton(direction, parent) {
        this.direction = direction;
        this.parent = parent;
        this._create();
      }
      PrevNextButton.prototype = Object.create(Unipointer.prototype);
      PrevNextButton.prototype._create = function() {
        this.isEnabled = true;
        this.isPrevious = this.direction == -1;
        var leftDirection = this.parent.options.rightToLeft ? 1 : -1;
        this.isLeft = this.direction == leftDirection;
        var element = this.element = document.createElement("button");
        element.className = "flickity-button flickity-prev-next-button";
        element.className += this.isPrevious ? " previous" : " next";
        element.setAttribute("type", "button");
        this.disable();
        element.setAttribute("aria-label", this.isPrevious ? "Previous" : "Next");
        var svg = this.createSVG();
        element.appendChild(svg);
        this.parent.on("select", this.update.bind(this));
        this.on("pointerDown", this.parent.childUIPointerDown.bind(this.parent));
      };
      PrevNextButton.prototype.activate = function() {
        this.bindStartEvent(this.element);
        this.element.addEventListener("click", this);
        this.parent.element.appendChild(this.element);
      };
      PrevNextButton.prototype.deactivate = function() {
        this.parent.element.removeChild(this.element);
        this.unbindStartEvent(this.element);
        this.element.removeEventListener("click", this);
      };
      PrevNextButton.prototype.createSVG = function() {
        var svg = document.createElementNS(svgURI, "svg");
        svg.setAttribute("class", "flickity-button-icon");
        svg.setAttribute("viewBox", "0 0 100 100");
        var path = document.createElementNS(svgURI, "path");
        var pathMovements = getArrowMovements(this.parent.options.arrowShape);
        path.setAttribute("d", pathMovements);
        path.setAttribute("class", "arrow");
        if (!this.isLeft) {
          path.setAttribute("transform", "translate(100, 100) rotate(180) ");
        }
        svg.appendChild(path);
        return svg;
      };
      function getArrowMovements(shape) {
        if (typeof shape == "string") {
          return shape;
        }
        return "M " + shape.x0 + ",50 L " + shape.x1 + "," + (shape.y1 + 50) + " L " + shape.x2 + "," + (shape.y2 + 50) + " L " + shape.x3 + ",50  L " + shape.x2 + "," + (50 - shape.y2) + " L " + shape.x1 + "," + (50 - shape.y1) + " Z";
      }
      PrevNextButton.prototype.handleEvent = utils.handleEvent;
      PrevNextButton.prototype.onclick = function() {
        if (!this.isEnabled) {
          return;
        }
        this.parent.uiChange();
        var method = this.isPrevious ? "previous" : "next";
        this.parent[method]();
      };
      PrevNextButton.prototype.enable = function() {
        if (this.isEnabled) {
          return;
        }
        this.element.disabled = false;
        this.isEnabled = true;
      };
      PrevNextButton.prototype.disable = function() {
        if (!this.isEnabled) {
          return;
        }
        this.element.disabled = true;
        this.isEnabled = false;
      };
      PrevNextButton.prototype.update = function() {
        var slides = this.parent.slides;
        if (this.parent.options.wrapAround && slides.length > 1) {
          this.enable();
          return;
        }
        var lastIndex = slides.length ? slides.length - 1 : 0;
        var boundIndex = this.isPrevious ? 0 : lastIndex;
        var method = this.parent.selectedIndex == boundIndex ? "disable" : "enable";
        this[method]();
      };
      PrevNextButton.prototype.destroy = function() {
        this.deactivate();
        this.allOff();
      };
      utils.extend(Flickity10.defaults, {
        prevNextButtons: true,
        arrowShape: {
          x0: 10,
          x1: 60,
          y1: 50,
          x2: 70,
          y2: 40,
          x3: 30
        }
      });
      Flickity10.createMethods.push("_createPrevNextButtons");
      var proto = Flickity10.prototype;
      proto._createPrevNextButtons = function() {
        if (!this.options.prevNextButtons) {
          return;
        }
        this.prevButton = new PrevNextButton(-1, this);
        this.nextButton = new PrevNextButton(1, this);
        this.on("activate", this.activatePrevNextButtons);
      };
      proto.activatePrevNextButtons = function() {
        this.prevButton.activate();
        this.nextButton.activate();
        this.on("deactivate", this.deactivatePrevNextButtons);
      };
      proto.deactivatePrevNextButtons = function() {
        this.prevButton.deactivate();
        this.nextButton.deactivate();
        this.off("deactivate", this.deactivatePrevNextButtons);
      };
      Flickity10.PrevNextButton = PrevNextButton;
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/page-dots.js
var require_page_dots = __commonJS({
  "node_modules/flickity/js/page-dots.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "unipointer/unipointer",
          "fizzy-ui-utils/utils"
        ], function(Flickity10, Unipointer, utils) {
          return factory(window2, Flickity10, Unipointer, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_flickity(),
          require_unipointer(),
          require_utils()
        );
      } else {
        factory(
          window2,
          window2.Flickity,
          window2.Unipointer,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, Flickity10, Unipointer, utils) {
      "use strict";
      function PageDots(parent) {
        this.parent = parent;
        this._create();
      }
      PageDots.prototype = Object.create(Unipointer.prototype);
      PageDots.prototype._create = function() {
        this.holder = document.createElement("ol");
        this.holder.className = "flickity-page-dots";
        this.dots = [];
        this.handleClick = this.onClick.bind(this);
        this.on("pointerDown", this.parent.childUIPointerDown.bind(this.parent));
      };
      PageDots.prototype.activate = function() {
        this.setDots();
        this.holder.addEventListener("click", this.handleClick);
        this.bindStartEvent(this.holder);
        this.parent.element.appendChild(this.holder);
      };
      PageDots.prototype.deactivate = function() {
        this.holder.removeEventListener("click", this.handleClick);
        this.unbindStartEvent(this.holder);
        this.parent.element.removeChild(this.holder);
      };
      PageDots.prototype.setDots = function() {
        var delta = this.parent.slides.length - this.dots.length;
        if (delta > 0) {
          this.addDots(delta);
        } else if (delta < 0) {
          this.removeDots(-delta);
        }
      };
      PageDots.prototype.addDots = function(count) {
        var fragment = document.createDocumentFragment();
        var newDots = [];
        var length = this.dots.length;
        var max = length + count;
        for (var i = length; i < max; i++) {
          var dot = document.createElement("li");
          dot.className = "dot";
          dot.setAttribute("aria-label", "Page dot " + (i + 1));
          fragment.appendChild(dot);
          newDots.push(dot);
        }
        this.holder.appendChild(fragment);
        this.dots = this.dots.concat(newDots);
      };
      PageDots.prototype.removeDots = function(count) {
        var removeDots = this.dots.splice(this.dots.length - count, count);
        removeDots.forEach(function(dot) {
          this.holder.removeChild(dot);
        }, this);
      };
      PageDots.prototype.updateSelected = function() {
        if (this.selectedDot) {
          this.selectedDot.className = "dot";
          this.selectedDot.removeAttribute("aria-current");
        }
        if (!this.dots.length) {
          return;
        }
        this.selectedDot = this.dots[this.parent.selectedIndex];
        this.selectedDot.className = "dot is-selected";
        this.selectedDot.setAttribute("aria-current", "step");
      };
      PageDots.prototype.onTap = // old method name, backwards-compatible
      PageDots.prototype.onClick = function(event2) {
        var target = event2.target;
        if (target.nodeName != "LI") {
          return;
        }
        this.parent.uiChange();
        var index = this.dots.indexOf(target);
        this.parent.select(index);
      };
      PageDots.prototype.destroy = function() {
        this.deactivate();
        this.allOff();
      };
      Flickity10.PageDots = PageDots;
      utils.extend(Flickity10.defaults, {
        pageDots: true
      });
      Flickity10.createMethods.push("_createPageDots");
      var proto = Flickity10.prototype;
      proto._createPageDots = function() {
        if (!this.options.pageDots) {
          return;
        }
        this.pageDots = new PageDots(this);
        this.on("activate", this.activatePageDots);
        this.on("select", this.updateSelectedPageDots);
        this.on("cellChange", this.updatePageDots);
        this.on("resize", this.updatePageDots);
        this.on("deactivate", this.deactivatePageDots);
      };
      proto.activatePageDots = function() {
        this.pageDots.activate();
      };
      proto.updateSelectedPageDots = function() {
        this.pageDots.updateSelected();
      };
      proto.updatePageDots = function() {
        this.pageDots.setDots();
      };
      proto.deactivatePageDots = function() {
        this.pageDots.deactivate();
      };
      Flickity10.PageDots = PageDots;
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/player.js
var require_player = __commonJS({
  "node_modules/flickity/js/player.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "ev-emitter/ev-emitter",
          "fizzy-ui-utils/utils",
          "./flickity"
        ], function(EvEmitter, utils, Flickity10) {
          return factory(EvEmitter, utils, Flickity10);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          require_ev_emitter(),
          require_utils(),
          require_flickity()
        );
      } else {
        factory(
          window2.EvEmitter,
          window2.fizzyUIUtils,
          window2.Flickity
        );
      }
    })(window, function factory(EvEmitter, utils, Flickity10) {
      "use strict";
      function Player(parent) {
        this.parent = parent;
        this.state = "stopped";
        this.onVisibilityChange = this.visibilityChange.bind(this);
        this.onVisibilityPlay = this.visibilityPlay.bind(this);
      }
      Player.prototype = Object.create(EvEmitter.prototype);
      Player.prototype.play = function() {
        if (this.state == "playing") {
          return;
        }
        var isPageHidden = document.hidden;
        if (isPageHidden) {
          document.addEventListener("visibilitychange", this.onVisibilityPlay);
          return;
        }
        this.state = "playing";
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        this.tick();
      };
      Player.prototype.tick = function() {
        if (this.state != "playing") {
          return;
        }
        var time = this.parent.options.autoPlay;
        time = typeof time == "number" ? time : 3e3;
        var _this = this;
        this.clear();
        this.timeout = setTimeout(function() {
          _this.parent.next(true);
          _this.tick();
        }, time);
      };
      Player.prototype.stop = function() {
        this.state = "stopped";
        this.clear();
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
      };
      Player.prototype.clear = function() {
        clearTimeout(this.timeout);
      };
      Player.prototype.pause = function() {
        if (this.state == "playing") {
          this.state = "paused";
          this.clear();
        }
      };
      Player.prototype.unpause = function() {
        if (this.state == "paused") {
          this.play();
        }
      };
      Player.prototype.visibilityChange = function() {
        var isPageHidden = document.hidden;
        this[isPageHidden ? "pause" : "unpause"]();
      };
      Player.prototype.visibilityPlay = function() {
        this.play();
        document.removeEventListener("visibilitychange", this.onVisibilityPlay);
      };
      utils.extend(Flickity10.defaults, {
        pauseAutoPlayOnHover: true
      });
      Flickity10.createMethods.push("_createPlayer");
      var proto = Flickity10.prototype;
      proto._createPlayer = function() {
        this.player = new Player(this);
        this.on("activate", this.activatePlayer);
        this.on("uiChange", this.stopPlayer);
        this.on("pointerDown", this.stopPlayer);
        this.on("deactivate", this.deactivatePlayer);
      };
      proto.activatePlayer = function() {
        if (!this.options.autoPlay) {
          return;
        }
        this.player.play();
        this.element.addEventListener("mouseenter", this);
      };
      proto.playPlayer = function() {
        this.player.play();
      };
      proto.stopPlayer = function() {
        this.player.stop();
      };
      proto.pausePlayer = function() {
        this.player.pause();
      };
      proto.unpausePlayer = function() {
        this.player.unpause();
      };
      proto.deactivatePlayer = function() {
        this.player.stop();
        this.element.removeEventListener("mouseenter", this);
      };
      proto.onmouseenter = function() {
        if (!this.options.pauseAutoPlayOnHover) {
          return;
        }
        this.player.pause();
        this.element.addEventListener("mouseleave", this);
      };
      proto.onmouseleave = function() {
        this.player.unpause();
        this.element.removeEventListener("mouseleave", this);
      };
      Flickity10.Player = Player;
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/add-remove-cell.js
var require_add_remove_cell = __commonJS({
  "node_modules/flickity/js/add-remove-cell.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "fizzy-ui-utils/utils"
        ], function(Flickity10, utils) {
          return factory(window2, Flickity10, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_flickity(),
          require_utils()
        );
      } else {
        factory(
          window2,
          window2.Flickity,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, Flickity10, utils) {
      "use strict";
      function getCellsFragment(cells) {
        var fragment = document.createDocumentFragment();
        cells.forEach(function(cell) {
          fragment.appendChild(cell.element);
        });
        return fragment;
      }
      var proto = Flickity10.prototype;
      proto.insert = function(elems, index) {
        var cells = this._makeCells(elems);
        if (!cells || !cells.length) {
          return;
        }
        var len = this.cells.length;
        index = index === void 0 ? len : index;
        var fragment = getCellsFragment(cells);
        var isAppend = index == len;
        if (isAppend) {
          this.slider.appendChild(fragment);
        } else {
          var insertCellElement = this.cells[index].element;
          this.slider.insertBefore(fragment, insertCellElement);
        }
        if (index === 0) {
          this.cells = cells.concat(this.cells);
        } else if (isAppend) {
          this.cells = this.cells.concat(cells);
        } else {
          var endCells = this.cells.splice(index, len - index);
          this.cells = this.cells.concat(cells).concat(endCells);
        }
        this._sizeCells(cells);
        this.cellChange(index, true);
      };
      proto.append = function(elems) {
        this.insert(elems, this.cells.length);
      };
      proto.prepend = function(elems) {
        this.insert(elems, 0);
      };
      proto.remove = function(elems) {
        var cells = this.getCells(elems);
        if (!cells || !cells.length) {
          return;
        }
        var minCellIndex = this.cells.length - 1;
        cells.forEach(function(cell) {
          cell.remove();
          var index = this.cells.indexOf(cell);
          minCellIndex = Math.min(index, minCellIndex);
          utils.removeFrom(this.cells, cell);
        }, this);
        this.cellChange(minCellIndex, true);
      };
      proto.cellSizeChange = function(elem) {
        var cell = this.getCell(elem);
        if (!cell) {
          return;
        }
        cell.getSize();
        var index = this.cells.indexOf(cell);
        this.cellChange(index);
      };
      proto.cellChange = function(changedCellIndex, isPositioningSlider) {
        var prevSelectedElem = this.selectedElement;
        this._positionCells(changedCellIndex);
        this._getWrapShiftCells();
        this.setGallerySize();
        var cell = this.getCell(prevSelectedElem);
        if (cell) {
          this.selectedIndex = this.getCellSlideIndex(cell);
        }
        this.selectedIndex = Math.min(this.slides.length - 1, this.selectedIndex);
        this.emitEvent("cellChange", [changedCellIndex]);
        this.select(this.selectedIndex);
        if (isPositioningSlider) {
          this.positionSliderAtSelected();
        }
      };
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/lazyload.js
var require_lazyload = __commonJS({
  "node_modules/flickity/js/lazyload.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "fizzy-ui-utils/utils"
        ], function(Flickity10, utils) {
          return factory(window2, Flickity10, utils);
        });
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          window2,
          require_flickity(),
          require_utils()
        );
      } else {
        factory(
          window2,
          window2.Flickity,
          window2.fizzyUIUtils
        );
      }
    })(window, function factory(window2, Flickity10, utils) {
      "use strict";
      Flickity10.createMethods.push("_createLazyload");
      var proto = Flickity10.prototype;
      proto._createLazyload = function() {
        this.on("select", this.lazyLoad);
      };
      proto.lazyLoad = function() {
        var lazyLoad = this.options.lazyLoad;
        if (!lazyLoad) {
          return;
        }
        var adjCount = typeof lazyLoad == "number" ? lazyLoad : 0;
        var cellElems = this.getAdjacentCellElements(adjCount);
        var lazyImages = [];
        cellElems.forEach(function(cellElem) {
          var lazyCellImages = getCellLazyImages(cellElem);
          lazyImages = lazyImages.concat(lazyCellImages);
        });
        lazyImages.forEach(function(img) {
          new LazyLoader(img, this);
        }, this);
      };
      function getCellLazyImages(cellElem) {
        if (cellElem.nodeName == "IMG") {
          var lazyloadAttr = cellElem.getAttribute("data-flickity-lazyload");
          var srcAttr = cellElem.getAttribute("data-flickity-lazyload-src");
          var srcsetAttr = cellElem.getAttribute("data-flickity-lazyload-srcset");
          if (lazyloadAttr || srcAttr || srcsetAttr) {
            return [cellElem];
          }
        }
        var lazySelector = "img[data-flickity-lazyload], img[data-flickity-lazyload-src], img[data-flickity-lazyload-srcset]";
        var imgs = cellElem.querySelectorAll(lazySelector);
        return utils.makeArray(imgs);
      }
      function LazyLoader(img, flickity) {
        this.img = img;
        this.flickity = flickity;
        this.load();
      }
      LazyLoader.prototype.handleEvent = utils.handleEvent;
      LazyLoader.prototype.load = function() {
        this.img.addEventListener("load", this);
        this.img.addEventListener("error", this);
        var src = this.img.getAttribute("data-flickity-lazyload") || this.img.getAttribute("data-flickity-lazyload-src");
        var srcset = this.img.getAttribute("data-flickity-lazyload-srcset");
        this.img.src = src;
        if (srcset) {
          this.img.setAttribute("srcset", srcset);
        }
        this.img.removeAttribute("data-flickity-lazyload");
        this.img.removeAttribute("data-flickity-lazyload-src");
        this.img.removeAttribute("data-flickity-lazyload-srcset");
      };
      LazyLoader.prototype.onload = function(event2) {
        this.complete(event2, "flickity-lazyloaded");
      };
      LazyLoader.prototype.onerror = function(event2) {
        this.complete(event2, "flickity-lazyerror");
      };
      LazyLoader.prototype.complete = function(event2, className) {
        this.img.removeEventListener("load", this);
        this.img.removeEventListener("error", this);
        var cell = this.flickity.getParentCell(this.img);
        var cellElem = cell && cell.element;
        this.flickity.cellSizeChange(cellElem);
        this.img.classList.add(className);
        this.flickity.dispatchEvent("lazyLoad", event2, cellElem);
      };
      Flickity10.LazyLoader = LazyLoader;
      return Flickity10;
    });
  }
});

// node_modules/flickity/js/index.js
var require_js = __commonJS({
  "node_modules/flickity/js/index.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "./flickity",
          "./drag",
          "./prev-next-button",
          "./page-dots",
          "./player",
          "./add-remove-cell",
          "./lazyload"
        ], factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          require_flickity(),
          require_drag(),
          require_prev_next_button(),
          require_page_dots(),
          require_player(),
          require_add_remove_cell(),
          require_lazyload()
        );
      }
    })(window, function factory(Flickity10) {
      return Flickity10;
    });
  }
});

// node_modules/flickity-fade/flickity-fade.js
var require_flickity_fade = __commonJS({
  "node_modules/flickity-fade/flickity-fade.js"(exports, module) {
    (function(window2, factory) {
      if (typeof define == "function" && define.amd) {
        define([
          "flickity/js/index",
          "fizzy-ui-utils/utils"
        ], factory);
      } else if (typeof module == "object" && module.exports) {
        module.exports = factory(
          require_js(),
          require_utils()
        );
      } else {
        factory(
          window2.Flickity,
          window2.fizzyUIUtils
        );
      }
    })(exports, function factory(Flickity10, utils) {
      var Slide = Flickity10.Slide;
      var slideUpdateTarget = Slide.prototype.updateTarget;
      Slide.prototype.updateTarget = function() {
        slideUpdateTarget.apply(this, arguments);
        if (!this.parent.options.fade) {
          return;
        }
        var slideTargetX = this.target - this.x;
        var firstCellX = this.cells[0].x;
        this.cells.forEach(function(cell) {
          var targetX = cell.x - firstCellX - slideTargetX;
          cell.renderPosition(targetX);
        });
      };
      Slide.prototype.setOpacity = function(alpha) {
        this.cells.forEach(function(cell) {
          cell.element.style.opacity = alpha;
        });
      };
      var proto = Flickity10.prototype;
      Flickity10.createMethods.push("_createFade");
      proto._createFade = function() {
        this.fadeIndex = this.selectedIndex;
        this.prevSelectedIndex = this.selectedIndex;
        this.on("select", this.onSelectFade);
        this.on("dragEnd", this.onDragEndFade);
        this.on("settle", this.onSettleFade);
        this.on("activate", this.onActivateFade);
        this.on("deactivate", this.onDeactivateFade);
      };
      var updateSlides = proto.updateSlides;
      proto.updateSlides = function() {
        updateSlides.apply(this, arguments);
        if (!this.options.fade) {
          return;
        }
        this.slides.forEach(function(slide, i) {
          var alpha = i == this.selectedIndex ? 1 : 0;
          slide.setOpacity(alpha);
        }, this);
      };
      proto.onSelectFade = function() {
        this.fadeIndex = Math.min(this.prevSelectedIndex, this.slides.length - 1);
        this.prevSelectedIndex = this.selectedIndex;
      };
      proto.onSettleFade = function() {
        delete this.didDragEnd;
        if (!this.options.fade) {
          return;
        }
        this.selectedSlide.setOpacity(1);
        var fadedSlide = this.slides[this.fadeIndex];
        if (fadedSlide && this.fadeIndex != this.selectedIndex) {
          this.slides[this.fadeIndex].setOpacity(0);
        }
      };
      proto.onDragEndFade = function() {
        this.didDragEnd = true;
      };
      proto.onActivateFade = function() {
        if (this.options.fade) {
          this.element.classList.add("is-fade");
        }
      };
      proto.onDeactivateFade = function() {
        if (!this.options.fade) {
          return;
        }
        this.element.classList.remove("is-fade");
        this.slides.forEach(function(slide) {
          slide.setOpacity("");
        });
      };
      var positionSlider = proto.positionSlider;
      proto.positionSlider = function() {
        if (!this.options.fade) {
          positionSlider.apply(this, arguments);
          return;
        }
        this.fadeSlides();
        this.dispatchScrollEvent();
      };
      var positionSliderAtSelected = proto.positionSliderAtSelected;
      proto.positionSliderAtSelected = function() {
        if (this.options.fade) {
          this.setTranslateX(0);
        }
        positionSliderAtSelected.apply(this, arguments);
      };
      proto.fadeSlides = function() {
        if (this.slides.length < 2) {
          return;
        }
        var indexes = this.getFadeIndexes();
        var fadeSlideA = this.slides[indexes.a];
        var fadeSlideB = this.slides[indexes.b];
        var distance = this.wrapDifference(fadeSlideA.target, fadeSlideB.target);
        var progress = this.wrapDifference(fadeSlideA.target, -this.x);
        progress = progress / distance;
        fadeSlideA.setOpacity(1 - progress);
        fadeSlideB.setOpacity(progress);
        var fadeHideIndex = indexes.a;
        if (this.isDragging) {
          fadeHideIndex = progress > 0.5 ? indexes.a : indexes.b;
        }
        var isNewHideIndex = this.fadeHideIndex != void 0 && this.fadeHideIndex != fadeHideIndex && this.fadeHideIndex != indexes.a && this.fadeHideIndex != indexes.b;
        if (isNewHideIndex) {
          this.slides[this.fadeHideIndex].setOpacity(0);
        }
        this.fadeHideIndex = fadeHideIndex;
      };
      proto.getFadeIndexes = function() {
        if (!this.isDragging && !this.didDragEnd) {
          return {
            a: this.fadeIndex,
            b: this.selectedIndex
          };
        }
        if (this.options.wrapAround) {
          return this.getFadeDragWrapIndexes();
        } else {
          return this.getFadeDragLimitIndexes();
        }
      };
      proto.getFadeDragWrapIndexes = function() {
        var distances = this.slides.map(function(slide, i) {
          return this.getSlideDistance(-this.x, i);
        }, this);
        var absDistances = distances.map(function(distance2) {
          return Math.abs(distance2);
        });
        var minDistance = Math.min.apply(Math, absDistances);
        var closestIndex = absDistances.indexOf(minDistance);
        var distance = distances[closestIndex];
        var len = this.slides.length;
        var delta = distance >= 0 ? 1 : -1;
        return {
          a: closestIndex,
          b: utils.modulo(closestIndex + delta, len)
        };
      };
      proto.getFadeDragLimitIndexes = function() {
        var dragIndex = 0;
        for (var i = 0; i < this.slides.length - 1; i++) {
          var slide = this.slides[i];
          if (-this.x < slide.target) {
            break;
          }
          dragIndex = i;
        }
        return {
          a: dragIndex,
          b: dragIndex + 1
        };
      };
      proto.wrapDifference = function(a, b) {
        var diff = b - a;
        if (!this.options.wrapAround) {
          return diff;
        }
        var diffPlus = diff + this.slideableWidth;
        var diffMinus = diff - this.slideableWidth;
        if (Math.abs(diffPlus) < Math.abs(diff)) {
          diff = diffPlus;
        }
        if (Math.abs(diffMinus) < Math.abs(diff)) {
          diff = diffMinus;
        }
        return diff;
      };
      var _getWrapShiftCells = proto._getWrapShiftCells;
      proto._getWrapShiftCells = function() {
        if (!this.options.fade) {
          _getWrapShiftCells.apply(this, arguments);
        }
      };
      var shiftWrapCells = proto.shiftWrapCells;
      proto.shiftWrapCells = function() {
        if (!this.options.fade) {
          shiftWrapCells.apply(this, arguments);
        }
      };
      return Flickity10;
    });
  }
});

// node_modules/photoswipe/dist/photoswipe.js
var require_photoswipe = __commonJS({
  "node_modules/photoswipe/dist/photoswipe.js"(exports, module) {
    (function(root, factory) {
      if (typeof define === "function" && define.amd) {
        define(factory);
      } else if (typeof exports === "object") {
        module.exports = factory();
      } else {
        root.PhotoSwipe = factory();
      }
    })(exports, function() {
      "use strict";
      var PhotoSwipe2 = function(template, UiClass, items, options) {
        var framework = {
          features: null,
          bind: function(target, type, listener, unbind) {
            var methodName = (unbind ? "remove" : "add") + "EventListener";
            type = type.split(" ");
            for (var i = 0; i < type.length; i++) {
              if (type[i]) {
                target[methodName](type[i], listener, false);
              }
            }
          },
          isArray: function(obj) {
            return obj instanceof Array;
          },
          createEl: function(classes, tag) {
            var el = document.createElement(tag || "div");
            if (classes) {
              el.className = classes;
            }
            return el;
          },
          getScrollY: function() {
            var yOffset = window.pageYOffset;
            return yOffset !== void 0 ? yOffset : document.documentElement.scrollTop;
          },
          unbind: function(target, type, listener) {
            framework.bind(target, type, listener, true);
          },
          removeClass: function(el, className) {
            var reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
            el.className = el.className.replace(reg, " ").replace(/^\s\s*/, "").replace(/\s\s*$/, "");
          },
          addClass: function(el, className) {
            if (!framework.hasClass(el, className)) {
              el.className += (el.className ? " " : "") + className;
            }
          },
          hasClass: function(el, className) {
            return el.className && new RegExp("(^|\\s)" + className + "(\\s|$)").test(el.className);
          },
          getChildByClass: function(parentEl, childClassName) {
            var node = parentEl.firstChild;
            while (node) {
              if (framework.hasClass(node, childClassName)) {
                return node;
              }
              node = node.nextSibling;
            }
          },
          arraySearch: function(array, value, key) {
            var i = array.length;
            while (i--) {
              if (array[i][key] === value) {
                return i;
              }
            }
            return -1;
          },
          extend: function(o1, o2, preventOverwrite) {
            for (var prop in o2) {
              if (o2.hasOwnProperty(prop)) {
                if (preventOverwrite && o1.hasOwnProperty(prop)) {
                  continue;
                }
                o1[prop] = o2[prop];
              }
            }
          },
          easing: {
            sine: {
              out: function(k) {
                return Math.sin(k * (Math.PI / 2));
              },
              inOut: function(k) {
                return -(Math.cos(Math.PI * k) - 1) / 2;
              }
            },
            cubic: {
              out: function(k) {
                return --k * k * k + 1;
              }
            }
            /*
            			elastic: {
            				out: function ( k ) {
            
            					var s, a = 0.1, p = 0.4;
            					if ( k === 0 ) return 0;
            					if ( k === 1 ) return 1;
            					if ( !a || a < 1 ) { a = 1; s = p / 4; }
            					else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
            					return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
            
            				},
            			},
            			back: {
            				out: function ( k ) {
            					var s = 1.70158;
            					return --k * k * ( ( s + 1 ) * k + s ) + 1;
            				}
            			}
            		*/
          },
          /**
           * 
           * @return {object}
           * 
           * {
           *  raf : request animation frame function
           *  caf : cancel animation frame function
           *  transfrom : transform property key (with vendor), or null if not supported
           *  oldIE : IE8 or below
           * }
           * 
           */
          detectFeatures: function() {
            if (framework.features) {
              return framework.features;
            }
            var helperEl = framework.createEl(), helperStyle = helperEl.style, vendor = "", features = {};
            features.oldIE = document.all && !document.addEventListener;
            features.touch = "ontouchstart" in window;
            if (window.requestAnimationFrame) {
              features.raf = window.requestAnimationFrame;
              features.caf = window.cancelAnimationFrame;
            }
            features.pointerEvent = !!window.PointerEvent || navigator.msPointerEnabled;
            if (!features.pointerEvent) {
              var ua = navigator.userAgent;
              if (/iP(hone|od)/.test(navigator.platform)) {
                var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
                if (v && v.length > 0) {
                  v = parseInt(v[1], 10);
                  if (v >= 1 && v < 8) {
                    features.isOldIOSPhone = true;
                  }
                }
              }
              var match = ua.match(/Android\s([0-9\.]*)/);
              var androidversion = match ? match[1] : 0;
              androidversion = parseFloat(androidversion);
              if (androidversion >= 1) {
                if (androidversion < 4.4) {
                  features.isOldAndroid = true;
                }
                features.androidVersion = androidversion;
              }
              features.isMobileOpera = /opera mini|opera mobi/i.test(ua);
            }
            var styleChecks = ["transform", "perspective", "animationName"], vendors = ["", "webkit", "Moz", "ms", "O"], styleCheckItem, styleName;
            for (var i = 0; i < 4; i++) {
              vendor = vendors[i];
              for (var a = 0; a < 3; a++) {
                styleCheckItem = styleChecks[a];
                styleName = vendor + (vendor ? styleCheckItem.charAt(0).toUpperCase() + styleCheckItem.slice(1) : styleCheckItem);
                if (!features[styleCheckItem] && styleName in helperStyle) {
                  features[styleCheckItem] = styleName;
                }
              }
              if (vendor && !features.raf) {
                vendor = vendor.toLowerCase();
                features.raf = window[vendor + "RequestAnimationFrame"];
                if (features.raf) {
                  features.caf = window[vendor + "CancelAnimationFrame"] || window[vendor + "CancelRequestAnimationFrame"];
                }
              }
            }
            if (!features.raf) {
              var lastTime = 0;
              features.raf = function(fn) {
                var currTime = (/* @__PURE__ */ new Date()).getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() {
                  fn(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
              };
              features.caf = function(id) {
                clearTimeout(id);
              };
            }
            features.svg = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
            framework.features = features;
            return features;
          }
        };
        framework.detectFeatures();
        if (framework.features.oldIE) {
          framework.bind = function(target, type, listener, unbind) {
            type = type.split(" ");
            var methodName = (unbind ? "detach" : "attach") + "Event", evName, _handleEv = function() {
              listener.handleEvent.call(listener);
            };
            for (var i = 0; i < type.length; i++) {
              evName = type[i];
              if (evName) {
                if (typeof listener === "object" && listener.handleEvent) {
                  if (!unbind) {
                    listener["oldIE" + evName] = _handleEv;
                  } else {
                    if (!listener["oldIE" + evName]) {
                      return false;
                    }
                  }
                  target[methodName]("on" + evName, listener["oldIE" + evName]);
                } else {
                  target[methodName]("on" + evName, listener);
                }
              }
            }
          };
        }
        var self = this;
        var DOUBLE_TAP_RADIUS = 25, NUM_HOLDERS = 3;
        var _options = {
          allowPanToNext: true,
          spacing: 0.12,
          bgOpacity: 1,
          mouseUsed: false,
          loop: true,
          pinchToClose: true,
          closeOnScroll: true,
          closeOnVerticalDrag: true,
          verticalDragRange: 0.75,
          hideAnimationDuration: 333,
          showAnimationDuration: 333,
          showHideOpacity: false,
          focus: true,
          escKey: true,
          arrowKeys: true,
          mainScrollEndFriction: 0.35,
          panEndFriction: 0.35,
          isClickableElement: function(el) {
            return el.tagName === "A";
          },
          getDoubleTapZoom: function(isMouseClick, item) {
            if (isMouseClick) {
              return 1;
            } else {
              return item.initialZoomLevel < 0.7 ? 1 : 1.33;
            }
          },
          maxSpreadZoom: 1.33,
          modal: true,
          // not fully implemented yet
          scaleMode: "fit"
          // TODO
        };
        framework.extend(_options, options);
        var _getEmptyPoint = function() {
          return { x: 0, y: 0 };
        };
        var _isOpen, _isDestroying, _closedByScroll, _currentItemIndex, _containerStyle, _containerShiftIndex, _currPanDist = _getEmptyPoint(), _startPanOffset = _getEmptyPoint(), _panOffset = _getEmptyPoint(), _upMoveEvents, _downEvents, _globalEventHandlers, _viewportSize = {}, _currZoomLevel, _startZoomLevel, _translatePrefix, _translateSufix, _updateSizeInterval, _itemsNeedUpdate, _currPositionIndex = 0, _offset = {}, _slideSize = _getEmptyPoint(), _itemHolders, _prevItemIndex, _indexDiff = 0, _dragStartEvent, _dragMoveEvent, _dragEndEvent, _dragCancelEvent, _transformKey, _pointerEventEnabled, _isFixedPosition = true, _likelyTouchDevice, _modules = [], _requestAF, _cancelAF, _initalClassName, _initalWindowScrollY, _oldIE, _currentWindowScrollY, _features, _windowVisibleSize = {}, _renderMaxResolution = false, _orientationChangeTimeout, _registerModule = function(name, module2) {
          framework.extend(self, module2.publicMethods);
          _modules.push(name);
        }, _getLoopedId = function(index) {
          var numSlides = _getNumItems();
          if (index > numSlides - 1) {
            return index - numSlides;
          } else if (index < 0) {
            return numSlides + index;
          }
          return index;
        }, _listeners = {}, _listen = function(name, fn) {
          if (!_listeners[name]) {
            _listeners[name] = [];
          }
          return _listeners[name].push(fn);
        }, _shout = function(name) {
          var listeners = _listeners[name];
          if (listeners) {
            var args = Array.prototype.slice.call(arguments);
            args.shift();
            for (var i = 0; i < listeners.length; i++) {
              listeners[i].apply(self, args);
            }
          }
        }, _getCurrentTime = function() {
          return (/* @__PURE__ */ new Date()).getTime();
        }, _applyBgOpacity = function(opacity) {
          _bgOpacity = opacity;
          self.bg.style.opacity = opacity * _options.bgOpacity;
        }, _applyZoomTransform = function(styleObj, x, y, zoom, item) {
          if (!_renderMaxResolution || item && item !== self.currItem) {
            zoom = zoom / (item ? item.fitRatio : self.currItem.fitRatio);
          }
          styleObj[_transformKey] = _translatePrefix + x + "px, " + y + "px" + _translateSufix + " scale(" + zoom + ")";
        }, _applyCurrentZoomPan = function(allowRenderResolution) {
          if (_currZoomElementStyle) {
            if (allowRenderResolution) {
              if (_currZoomLevel > self.currItem.fitRatio) {
                if (!_renderMaxResolution) {
                  _setImageSize(self.currItem, false, true);
                  _renderMaxResolution = true;
                }
              } else {
                if (_renderMaxResolution) {
                  _setImageSize(self.currItem);
                  _renderMaxResolution = false;
                }
              }
            }
            _applyZoomTransform(_currZoomElementStyle, _panOffset.x, _panOffset.y, _currZoomLevel);
          }
        }, _applyZoomPanToItem = function(item) {
          if (item.container) {
            _applyZoomTransform(
              item.container.style,
              item.initialPosition.x,
              item.initialPosition.y,
              item.initialZoomLevel,
              item
            );
          }
        }, _setTranslateX = function(x, elStyle) {
          elStyle[_transformKey] = _translatePrefix + x + "px, 0px" + _translateSufix;
        }, _moveMainScroll = function(x, dragging) {
          if (!_options.loop && dragging) {
            var newSlideIndexOffset = _currentItemIndex + (_slideSize.x * _currPositionIndex - x) / _slideSize.x, delta2 = Math.round(x - _mainScrollPos.x);
            if (newSlideIndexOffset < 0 && delta2 > 0 || newSlideIndexOffset >= _getNumItems() - 1 && delta2 < 0) {
              x = _mainScrollPos.x + delta2 * _options.mainScrollEndFriction;
            }
          }
          _mainScrollPos.x = x;
          _setTranslateX(x, _containerStyle);
        }, _calculatePanOffset = function(axis, zoomLevel) {
          var m = _midZoomPoint[axis] - _offset[axis];
          return _startPanOffset[axis] + _currPanDist[axis] + m - m * (zoomLevel / _startZoomLevel);
        }, _equalizePoints = function(p1, p22) {
          p1.x = p22.x;
          p1.y = p22.y;
          if (p22.id) {
            p1.id = p22.id;
          }
        }, _roundPoint = function(p3) {
          p3.x = Math.round(p3.x);
          p3.y = Math.round(p3.y);
        }, _mouseMoveTimeout = null, _onFirstMouseMove = function() {
          if (_mouseMoveTimeout) {
            framework.unbind(document, "mousemove", _onFirstMouseMove);
            framework.addClass(template, "pswp--has_mouse");
            _options.mouseUsed = true;
            _shout("mouseUsed");
          }
          _mouseMoveTimeout = setTimeout(function() {
            _mouseMoveTimeout = null;
          }, 100);
        }, _bindEvents = function() {
          framework.bind(document, "keydown", self);
          if (_features.transform) {
            framework.bind(self.scrollWrap, "click", self);
          }
          if (!_options.mouseUsed) {
            framework.bind(document, "mousemove", _onFirstMouseMove);
          }
          framework.bind(window, "resize scroll orientationchange", self);
          _shout("bindEvents");
        }, _unbindEvents = function() {
          framework.unbind(window, "resize scroll orientationchange", self);
          framework.unbind(window, "scroll", _globalEventHandlers.scroll);
          framework.unbind(document, "keydown", self);
          framework.unbind(document, "mousemove", _onFirstMouseMove);
          if (_features.transform) {
            framework.unbind(self.scrollWrap, "click", self);
          }
          if (_isDragging) {
            framework.unbind(window, _upMoveEvents, self);
          }
          clearTimeout(_orientationChangeTimeout);
          _shout("unbindEvents");
        }, _calculatePanBounds = function(zoomLevel, update) {
          var bounds = _calculateItemSize(self.currItem, _viewportSize, zoomLevel);
          if (update) {
            _currPanBounds = bounds;
          }
          return bounds;
        }, _getMinZoomLevel = function(item) {
          if (!item) {
            item = self.currItem;
          }
          return item.initialZoomLevel;
        }, _getMaxZoomLevel = function(item) {
          if (!item) {
            item = self.currItem;
          }
          return item.w > 0 ? _options.maxSpreadZoom : 1;
        }, _modifyDestPanOffset = function(axis, destPanBounds, destPanOffset, destZoomLevel) {
          if (destZoomLevel === self.currItem.initialZoomLevel) {
            destPanOffset[axis] = self.currItem.initialPosition[axis];
            return true;
          } else {
            destPanOffset[axis] = _calculatePanOffset(axis, destZoomLevel);
            if (destPanOffset[axis] > destPanBounds.min[axis]) {
              destPanOffset[axis] = destPanBounds.min[axis];
              return true;
            } else if (destPanOffset[axis] < destPanBounds.max[axis]) {
              destPanOffset[axis] = destPanBounds.max[axis];
              return true;
            }
          }
          return false;
        }, _setupTransforms = function() {
          if (_transformKey) {
            var allow3dTransform = _features.perspective && !_likelyTouchDevice;
            _translatePrefix = "translate" + (allow3dTransform ? "3d(" : "(");
            _translateSufix = _features.perspective ? ", 0px)" : ")";
            return;
          }
          _transformKey = "left";
          framework.addClass(template, "pswp--ie");
          _setTranslateX = function(x, elStyle) {
            elStyle.left = x + "px";
          };
          _applyZoomPanToItem = function(item) {
            var zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio, s = item.container.style, w = zoomRatio * item.w, h = zoomRatio * item.h;
            s.width = w + "px";
            s.height = h + "px";
            s.left = item.initialPosition.x + "px";
            s.top = item.initialPosition.y + "px";
          };
          _applyCurrentZoomPan = function() {
            if (_currZoomElementStyle) {
              var s = _currZoomElementStyle, item = self.currItem, zoomRatio = item.fitRatio > 1 ? 1 : item.fitRatio, w = zoomRatio * item.w, h = zoomRatio * item.h;
              s.width = w + "px";
              s.height = h + "px";
              s.left = _panOffset.x + "px";
              s.top = _panOffset.y + "px";
            }
          };
        }, _onKeyDown = function(e) {
          var keydownAction = "";
          if (_options.escKey && e.keyCode === 27) {
            keydownAction = "close";
          } else if (_options.arrowKeys) {
            if (e.keyCode === 37) {
              keydownAction = "prev";
            } else if (e.keyCode === 39) {
              keydownAction = "next";
            }
          }
          if (keydownAction) {
            if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
              if (e.preventDefault) {
                e.preventDefault();
              } else {
                e.returnValue = false;
              }
              self[keydownAction]();
            }
          }
        }, _onGlobalClick = function(e) {
          if (!e) {
            return;
          }
          if (_moved || _zoomStarted || _mainScrollAnimating || _verticalDragInitiated) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, _updatePageScrollOffset = function() {
          self.setScrollOffset(0, framework.getScrollY());
        };
        var _animations = {}, _numAnimations = 0, _stopAnimation = function(name) {
          if (_animations[name]) {
            if (_animations[name].raf) {
              _cancelAF(_animations[name].raf);
            }
            _numAnimations--;
            delete _animations[name];
          }
        }, _registerStartAnimation = function(name) {
          if (_animations[name]) {
            _stopAnimation(name);
          }
          if (!_animations[name]) {
            _numAnimations++;
            _animations[name] = {};
          }
        }, _stopAllAnimations = function() {
          for (var prop in _animations) {
            if (_animations.hasOwnProperty(prop)) {
              _stopAnimation(prop);
            }
          }
        }, _animateProp = function(name, b, endProp, d, easingFn, onUpdate, onComplete) {
          var startAnimTime = _getCurrentTime(), t;
          _registerStartAnimation(name);
          var animloop = function() {
            if (_animations[name]) {
              t = _getCurrentTime() - startAnimTime;
              if (t >= d) {
                _stopAnimation(name);
                onUpdate(endProp);
                if (onComplete) {
                  onComplete();
                }
                return;
              }
              onUpdate((endProp - b) * easingFn(t / d) + b);
              _animations[name].raf = _requestAF(animloop);
            }
          };
          animloop();
        };
        var publicMethods = {
          // make a few local variables and functions public
          shout: _shout,
          listen: _listen,
          viewportSize: _viewportSize,
          options: _options,
          isMainScrollAnimating: function() {
            return _mainScrollAnimating;
          },
          getZoomLevel: function() {
            return _currZoomLevel;
          },
          getCurrentIndex: function() {
            return _currentItemIndex;
          },
          isDragging: function() {
            return _isDragging;
          },
          isZooming: function() {
            return _isZooming;
          },
          setScrollOffset: function(x, y) {
            _offset.x = x;
            _currentWindowScrollY = _offset.y = y;
            _shout("updateScrollOffset", _offset);
          },
          applyZoomPan: function(zoomLevel, panX, panY, allowRenderResolution) {
            _panOffset.x = panX;
            _panOffset.y = panY;
            _currZoomLevel = zoomLevel;
            _applyCurrentZoomPan(allowRenderResolution);
          },
          init: function() {
            if (_isOpen || _isDestroying) {
              return;
            }
            var i;
            self.framework = framework;
            self.template = template;
            self.bg = framework.getChildByClass(template, "pswp__bg");
            _initalClassName = template.className;
            _isOpen = true;
            _features = framework.detectFeatures();
            _requestAF = _features.raf;
            _cancelAF = _features.caf;
            _transformKey = _features.transform;
            _oldIE = _features.oldIE;
            self.scrollWrap = framework.getChildByClass(template, "pswp__scroll-wrap");
            self.container = framework.getChildByClass(self.scrollWrap, "pswp__container");
            _containerStyle = self.container.style;
            self.itemHolders = _itemHolders = [
              { el: self.container.children[0], wrap: 0, index: -1 },
              { el: self.container.children[1], wrap: 0, index: -1 },
              { el: self.container.children[2], wrap: 0, index: -1 }
            ];
            _itemHolders[0].el.style.display = _itemHolders[2].el.style.display = "none";
            _setupTransforms();
            _globalEventHandlers = {
              resize: self.updateSize,
              // Fixes: iOS 10.3 resize event
              // does not update scrollWrap.clientWidth instantly after resize
              // https://github.com/dimsemenov/PhotoSwipe/issues/1315
              orientationchange: function() {
                clearTimeout(_orientationChangeTimeout);
                _orientationChangeTimeout = setTimeout(function() {
                  if (_viewportSize.x !== self.scrollWrap.clientWidth) {
                    self.updateSize();
                  }
                }, 500);
              },
              scroll: _updatePageScrollOffset,
              keydown: _onKeyDown,
              click: _onGlobalClick
            };
            var oldPhone = _features.isOldIOSPhone || _features.isOldAndroid || _features.isMobileOpera;
            if (!_features.animationName || !_features.transform || oldPhone) {
              _options.showAnimationDuration = _options.hideAnimationDuration = 0;
            }
            for (i = 0; i < _modules.length; i++) {
              self["init" + _modules[i]]();
            }
            if (UiClass) {
              var ui = self.ui = new UiClass(self, framework);
              ui.init();
            }
            _shout("firstUpdate");
            _currentItemIndex = _currentItemIndex || _options.index || 0;
            if (isNaN(_currentItemIndex) || _currentItemIndex < 0 || _currentItemIndex >= _getNumItems()) {
              _currentItemIndex = 0;
            }
            self.currItem = _getItemAt(_currentItemIndex);
            if (_features.isOldIOSPhone || _features.isOldAndroid) {
              _isFixedPosition = false;
            }
            template.setAttribute("aria-hidden", "false");
            if (_options.modal) {
              if (!_isFixedPosition) {
                template.style.position = "absolute";
                template.style.top = framework.getScrollY() + "px";
              } else {
                template.style.position = "fixed";
              }
            }
            if (_currentWindowScrollY === void 0) {
              _shout("initialLayout");
              _currentWindowScrollY = _initalWindowScrollY = framework.getScrollY();
            }
            var rootClasses = "pswp--open ";
            if (_options.mainClass) {
              rootClasses += _options.mainClass + " ";
            }
            if (_options.showHideOpacity) {
              rootClasses += "pswp--animate_opacity ";
            }
            rootClasses += _likelyTouchDevice ? "pswp--touch" : "pswp--notouch";
            rootClasses += _features.animationName ? " pswp--css_animation" : "";
            rootClasses += _features.svg ? " pswp--svg" : "";
            framework.addClass(template, rootClasses);
            self.updateSize();
            _containerShiftIndex = -1;
            _indexDiff = null;
            for (i = 0; i < NUM_HOLDERS; i++) {
              _setTranslateX((i + _containerShiftIndex) * _slideSize.x, _itemHolders[i].el.style);
            }
            if (!_oldIE) {
              framework.bind(self.scrollWrap, _downEvents, self);
            }
            _listen("initialZoomInEnd", function() {
              self.setContent(_itemHolders[0], _currentItemIndex - 1);
              self.setContent(_itemHolders[2], _currentItemIndex + 1);
              _itemHolders[0].el.style.display = _itemHolders[2].el.style.display = "block";
              if (_options.focus) {
                template.focus();
              }
              _bindEvents();
            });
            self.setContent(_itemHolders[1], _currentItemIndex);
            self.updateCurrItem();
            _shout("afterInit");
            if (!_isFixedPosition) {
              _updateSizeInterval = setInterval(function() {
                if (!_numAnimations && !_isDragging && !_isZooming && _currZoomLevel === self.currItem.initialZoomLevel) {
                  self.updateSize();
                }
              }, 1e3);
            }
            framework.addClass(template, "pswp--visible");
          },
          // Close the gallery, then destroy it
          close: function() {
            if (!_isOpen) {
              return;
            }
            _isOpen = false;
            _isDestroying = true;
            _shout("close");
            _unbindEvents();
            _showOrHide(self.currItem, null, true, self.destroy);
          },
          // destroys the gallery (unbinds events, cleans up intervals and timeouts to avoid memory leaks)
          destroy: function() {
            _shout("destroy");
            if (_showOrHideTimeout) {
              clearTimeout(_showOrHideTimeout);
            }
            template.setAttribute("aria-hidden", "true");
            template.className = _initalClassName;
            if (_updateSizeInterval) {
              clearInterval(_updateSizeInterval);
            }
            framework.unbind(self.scrollWrap, _downEvents, self);
            framework.unbind(window, "scroll", self);
            _stopDragUpdateLoop();
            _stopAllAnimations();
            _listeners = null;
          },
          /**
           * Pan image to position
           * @param {Number} x     
           * @param {Number} y     
           * @param {Boolean} force Will ignore bounds if set to true.
           */
          panTo: function(x, y, force) {
            if (!force) {
              if (x > _currPanBounds.min.x) {
                x = _currPanBounds.min.x;
              } else if (x < _currPanBounds.max.x) {
                x = _currPanBounds.max.x;
              }
              if (y > _currPanBounds.min.y) {
                y = _currPanBounds.min.y;
              } else if (y < _currPanBounds.max.y) {
                y = _currPanBounds.max.y;
              }
            }
            _panOffset.x = x;
            _panOffset.y = y;
            _applyCurrentZoomPan();
          },
          handleEvent: function(e) {
            e = e || window.event;
            if (_globalEventHandlers[e.type]) {
              _globalEventHandlers[e.type](e);
            }
          },
          goTo: function(index) {
            index = _getLoopedId(index);
            var diff = index - _currentItemIndex;
            _indexDiff = diff;
            _currentItemIndex = index;
            self.currItem = _getItemAt(_currentItemIndex);
            _currPositionIndex -= diff;
            _moveMainScroll(_slideSize.x * _currPositionIndex);
            _stopAllAnimations();
            _mainScrollAnimating = false;
            self.updateCurrItem();
          },
          next: function() {
            self.goTo(_currentItemIndex + 1);
          },
          prev: function() {
            self.goTo(_currentItemIndex - 1);
          },
          // update current zoom/pan objects
          updateCurrZoomItem: function(emulateSetContent) {
            if (emulateSetContent) {
              _shout("beforeChange", 0);
            }
            if (_itemHolders[1].el.children.length) {
              var zoomElement = _itemHolders[1].el.children[0];
              if (framework.hasClass(zoomElement, "pswp__zoom-wrap")) {
                _currZoomElementStyle = zoomElement.style;
              } else {
                _currZoomElementStyle = null;
              }
            } else {
              _currZoomElementStyle = null;
            }
            _currPanBounds = self.currItem.bounds;
            _startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
            _panOffset.x = _currPanBounds.center.x;
            _panOffset.y = _currPanBounds.center.y;
            if (emulateSetContent) {
              _shout("afterChange");
            }
          },
          invalidateCurrItems: function() {
            _itemsNeedUpdate = true;
            for (var i = 0; i < NUM_HOLDERS; i++) {
              if (_itemHolders[i].item) {
                _itemHolders[i].item.needsUpdate = true;
              }
            }
          },
          updateCurrItem: function(beforeAnimation) {
            if (_indexDiff === 0) {
              return;
            }
            var diffAbs = Math.abs(_indexDiff), tempHolder;
            if (beforeAnimation && diffAbs < 2) {
              return;
            }
            self.currItem = _getItemAt(_currentItemIndex);
            _renderMaxResolution = false;
            _shout("beforeChange", _indexDiff);
            if (diffAbs >= NUM_HOLDERS) {
              _containerShiftIndex += _indexDiff + (_indexDiff > 0 ? -NUM_HOLDERS : NUM_HOLDERS);
              diffAbs = NUM_HOLDERS;
            }
            for (var i = 0; i < diffAbs; i++) {
              if (_indexDiff > 0) {
                tempHolder = _itemHolders.shift();
                _itemHolders[NUM_HOLDERS - 1] = tempHolder;
                _containerShiftIndex++;
                _setTranslateX((_containerShiftIndex + 2) * _slideSize.x, tempHolder.el.style);
                self.setContent(tempHolder, _currentItemIndex - diffAbs + i + 1 + 1);
              } else {
                tempHolder = _itemHolders.pop();
                _itemHolders.unshift(tempHolder);
                _containerShiftIndex--;
                _setTranslateX(_containerShiftIndex * _slideSize.x, tempHolder.el.style);
                self.setContent(tempHolder, _currentItemIndex + diffAbs - i - 1 - 1);
              }
            }
            if (_currZoomElementStyle && Math.abs(_indexDiff) === 1) {
              var prevItem = _getItemAt(_prevItemIndex);
              if (prevItem.initialZoomLevel !== _currZoomLevel) {
                _calculateItemSize(prevItem, _viewportSize);
                _setImageSize(prevItem);
                _applyZoomPanToItem(prevItem);
              }
            }
            _indexDiff = 0;
            self.updateCurrZoomItem();
            _prevItemIndex = _currentItemIndex;
            _shout("afterChange");
          },
          updateSize: function(force) {
            if (!_isFixedPosition && _options.modal) {
              var windowScrollY = framework.getScrollY();
              if (_currentWindowScrollY !== windowScrollY) {
                template.style.top = windowScrollY + "px";
                _currentWindowScrollY = windowScrollY;
              }
              if (!force && _windowVisibleSize.x === window.innerWidth && _windowVisibleSize.y === window.innerHeight) {
                return;
              }
              _windowVisibleSize.x = window.innerWidth;
              _windowVisibleSize.y = window.innerHeight;
              template.style.height = _windowVisibleSize.y + "px";
            }
            _viewportSize.x = self.scrollWrap.clientWidth;
            _viewportSize.y = self.scrollWrap.clientHeight;
            _updatePageScrollOffset();
            _slideSize.x = _viewportSize.x + Math.round(_viewportSize.x * _options.spacing);
            _slideSize.y = _viewportSize.y;
            _moveMainScroll(_slideSize.x * _currPositionIndex);
            _shout("beforeResize");
            if (_containerShiftIndex !== void 0) {
              var holder, item, hIndex;
              for (var i = 0; i < NUM_HOLDERS; i++) {
                holder = _itemHolders[i];
                _setTranslateX((i + _containerShiftIndex) * _slideSize.x, holder.el.style);
                hIndex = _currentItemIndex + i - 1;
                if (_options.loop && _getNumItems() > 2) {
                  hIndex = _getLoopedId(hIndex);
                }
                item = _getItemAt(hIndex);
                if (item && (_itemsNeedUpdate || item.needsUpdate || !item.bounds)) {
                  self.cleanSlide(item);
                  self.setContent(holder, hIndex);
                  if (i === 1) {
                    self.currItem = item;
                    self.updateCurrZoomItem(true);
                  }
                  item.needsUpdate = false;
                } else if (holder.index === -1 && hIndex >= 0) {
                  self.setContent(holder, hIndex);
                }
                if (item && item.container) {
                  _calculateItemSize(item, _viewportSize);
                  _setImageSize(item);
                  _applyZoomPanToItem(item);
                }
              }
              _itemsNeedUpdate = false;
            }
            _startZoomLevel = _currZoomLevel = self.currItem.initialZoomLevel;
            _currPanBounds = self.currItem.bounds;
            if (_currPanBounds) {
              _panOffset.x = _currPanBounds.center.x;
              _panOffset.y = _currPanBounds.center.y;
              _applyCurrentZoomPan(true);
            }
            _shout("resize");
          },
          // Zoom current item to
          zoomTo: function(destZoomLevel, centerPoint, speed, easingFn, updateFn) {
            if (centerPoint) {
              _startZoomLevel = _currZoomLevel;
              _midZoomPoint.x = Math.abs(centerPoint.x) - _panOffset.x;
              _midZoomPoint.y = Math.abs(centerPoint.y) - _panOffset.y;
              _equalizePoints(_startPanOffset, _panOffset);
            }
            var destPanBounds = _calculatePanBounds(destZoomLevel, false), destPanOffset = {};
            _modifyDestPanOffset("x", destPanBounds, destPanOffset, destZoomLevel);
            _modifyDestPanOffset("y", destPanBounds, destPanOffset, destZoomLevel);
            var initialZoomLevel = _currZoomLevel;
            var initialPanOffset = {
              x: _panOffset.x,
              y: _panOffset.y
            };
            _roundPoint(destPanOffset);
            var onUpdate = function(now) {
              if (now === 1) {
                _currZoomLevel = destZoomLevel;
                _panOffset.x = destPanOffset.x;
                _panOffset.y = destPanOffset.y;
              } else {
                _currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
                _panOffset.x = (destPanOffset.x - initialPanOffset.x) * now + initialPanOffset.x;
                _panOffset.y = (destPanOffset.y - initialPanOffset.y) * now + initialPanOffset.y;
              }
              if (updateFn) {
                updateFn(now);
              }
              _applyCurrentZoomPan(now === 1);
            };
            if (speed) {
              _animateProp("customZoomTo", 0, 1, speed, easingFn || framework.easing.sine.inOut, onUpdate);
            } else {
              onUpdate(1);
            }
          }
        };
        var MIN_SWIPE_DISTANCE = 30, DIRECTION_CHECK_OFFSET = 10;
        var _gestureStartTime, _gestureCheckSpeedTime, p = {}, p2 = {}, delta = {}, _currPoint = {}, _startPoint = {}, _currPointers = [], _startMainScrollPos = {}, _releaseAnimData, _posPoints = [], _tempPoint = {}, _isZoomingIn, _verticalDragInitiated, _oldAndroidTouchEndTimeout, _currZoomedItemIndex = 0, _centerPoint = _getEmptyPoint(), _lastReleaseTime = 0, _isDragging, _isMultitouch, _zoomStarted, _moved, _dragAnimFrame, _mainScrollShifted, _currentPoints, _isZooming, _currPointsDistance, _startPointsDistance, _currPanBounds, _mainScrollPos = _getEmptyPoint(), _currZoomElementStyle, _mainScrollAnimating, _midZoomPoint = _getEmptyPoint(), _currCenterPoint = _getEmptyPoint(), _direction, _isFirstMove, _opacityChanged, _bgOpacity, _wasOverInitialZoom, _isEqualPoints = function(p1, p22) {
          return p1.x === p22.x && p1.y === p22.y;
        }, _isNearbyPoints = function(touch0, touch1) {
          return Math.abs(touch0.x - touch1.x) < DOUBLE_TAP_RADIUS && Math.abs(touch0.y - touch1.y) < DOUBLE_TAP_RADIUS;
        }, _calculatePointsDistance = function(p1, p22) {
          _tempPoint.x = Math.abs(p1.x - p22.x);
          _tempPoint.y = Math.abs(p1.y - p22.y);
          return Math.sqrt(_tempPoint.x * _tempPoint.x + _tempPoint.y * _tempPoint.y);
        }, _stopDragUpdateLoop = function() {
          if (_dragAnimFrame) {
            _cancelAF(_dragAnimFrame);
            _dragAnimFrame = null;
          }
        }, _dragUpdateLoop = function() {
          if (_isDragging) {
            _dragAnimFrame = _requestAF(_dragUpdateLoop);
            _renderMovement();
          }
        }, _canPan = function() {
          return !(_options.scaleMode === "fit" && _currZoomLevel === self.currItem.initialZoomLevel);
        }, _closestElement = function(el, fn) {
          if (!el || el === document) {
            return false;
          }
          if (el.getAttribute("class") && el.getAttribute("class").indexOf("pswp__scroll-wrap") > -1) {
            return false;
          }
          if (fn(el)) {
            return el;
          }
          return _closestElement(el.parentNode, fn);
        }, _preventObj = {}, _preventDefaultEventBehaviour = function(e, isDown) {
          _preventObj.prevent = !_closestElement(e.target, _options.isClickableElement);
          _shout("preventDragEvent", e, isDown, _preventObj);
          return _preventObj.prevent;
        }, _convertTouchToPoint = function(touch, p3) {
          p3.x = touch.pageX;
          p3.y = touch.pageY;
          p3.id = touch.identifier;
          return p3;
        }, _findCenterOfPoints = function(p1, p22, pCenter) {
          pCenter.x = (p1.x + p22.x) * 0.5;
          pCenter.y = (p1.y + p22.y) * 0.5;
        }, _pushPosPoint = function(time, x, y) {
          if (time - _gestureCheckSpeedTime > 50) {
            var o = _posPoints.length > 2 ? _posPoints.shift() : {};
            o.x = x;
            o.y = y;
            _posPoints.push(o);
            _gestureCheckSpeedTime = time;
          }
        }, _calculateVerticalDragOpacityRatio = function() {
          var yOffset = _panOffset.y - self.currItem.initialPosition.y;
          return 1 - Math.abs(yOffset / (_viewportSize.y / 2));
        }, _ePoint1 = {}, _ePoint2 = {}, _tempPointsArr = [], _tempCounter, _getTouchPoints = function(e) {
          while (_tempPointsArr.length > 0) {
            _tempPointsArr.pop();
          }
          if (!_pointerEventEnabled) {
            if (e.type.indexOf("touch") > -1) {
              if (e.touches && e.touches.length > 0) {
                _tempPointsArr[0] = _convertTouchToPoint(e.touches[0], _ePoint1);
                if (e.touches.length > 1) {
                  _tempPointsArr[1] = _convertTouchToPoint(e.touches[1], _ePoint2);
                }
              }
            } else {
              _ePoint1.x = e.pageX;
              _ePoint1.y = e.pageY;
              _ePoint1.id = "";
              _tempPointsArr[0] = _ePoint1;
            }
          } else {
            _tempCounter = 0;
            _currPointers.forEach(function(p3) {
              if (_tempCounter === 0) {
                _tempPointsArr[0] = p3;
              } else if (_tempCounter === 1) {
                _tempPointsArr[1] = p3;
              }
              _tempCounter++;
            });
          }
          return _tempPointsArr;
        }, _panOrMoveMainScroll = function(axis, delta2) {
          var panFriction, overDiff = 0, newOffset = _panOffset[axis] + delta2[axis], startOverDiff, dir = delta2[axis] > 0, newMainScrollPosition = _mainScrollPos.x + delta2.x, mainScrollDiff = _mainScrollPos.x - _startMainScrollPos.x, newPanPos, newMainScrollPos;
          if (newOffset > _currPanBounds.min[axis] || newOffset < _currPanBounds.max[axis]) {
            panFriction = _options.panEndFriction;
          } else {
            panFriction = 1;
          }
          newOffset = _panOffset[axis] + delta2[axis] * panFriction;
          if (_options.allowPanToNext || _currZoomLevel === self.currItem.initialZoomLevel) {
            if (!_currZoomElementStyle) {
              newMainScrollPos = newMainScrollPosition;
            } else if (_direction === "h" && axis === "x" && !_zoomStarted) {
              if (dir) {
                if (newOffset > _currPanBounds.min[axis]) {
                  panFriction = _options.panEndFriction;
                  overDiff = _currPanBounds.min[axis] - newOffset;
                  startOverDiff = _currPanBounds.min[axis] - _startPanOffset[axis];
                }
                if ((startOverDiff <= 0 || mainScrollDiff < 0) && _getNumItems() > 1) {
                  newMainScrollPos = newMainScrollPosition;
                  if (mainScrollDiff < 0 && newMainScrollPosition > _startMainScrollPos.x) {
                    newMainScrollPos = _startMainScrollPos.x;
                  }
                } else {
                  if (_currPanBounds.min.x !== _currPanBounds.max.x) {
                    newPanPos = newOffset;
                  }
                }
              } else {
                if (newOffset < _currPanBounds.max[axis]) {
                  panFriction = _options.panEndFriction;
                  overDiff = newOffset - _currPanBounds.max[axis];
                  startOverDiff = _startPanOffset[axis] - _currPanBounds.max[axis];
                }
                if ((startOverDiff <= 0 || mainScrollDiff > 0) && _getNumItems() > 1) {
                  newMainScrollPos = newMainScrollPosition;
                  if (mainScrollDiff > 0 && newMainScrollPosition < _startMainScrollPos.x) {
                    newMainScrollPos = _startMainScrollPos.x;
                  }
                } else {
                  if (_currPanBounds.min.x !== _currPanBounds.max.x) {
                    newPanPos = newOffset;
                  }
                }
              }
            }
            if (axis === "x") {
              if (newMainScrollPos !== void 0) {
                _moveMainScroll(newMainScrollPos, true);
                if (newMainScrollPos === _startMainScrollPos.x) {
                  _mainScrollShifted = false;
                } else {
                  _mainScrollShifted = true;
                }
              }
              if (_currPanBounds.min.x !== _currPanBounds.max.x) {
                if (newPanPos !== void 0) {
                  _panOffset.x = newPanPos;
                } else if (!_mainScrollShifted) {
                  _panOffset.x += delta2.x * panFriction;
                }
              }
              return newMainScrollPos !== void 0;
            }
          }
          if (!_mainScrollAnimating) {
            if (!_mainScrollShifted) {
              if (_currZoomLevel > self.currItem.fitRatio) {
                _panOffset[axis] += delta2[axis] * panFriction;
              }
            }
          }
        }, _onDragStart = function(e) {
          if (e.type === "mousedown" && e.button > 0) {
            return;
          }
          if (_initialZoomRunning) {
            e.preventDefault();
            return;
          }
          if (_oldAndroidTouchEndTimeout && e.type === "mousedown") {
            return;
          }
          if (_preventDefaultEventBehaviour(e, true)) {
            e.preventDefault();
          }
          _shout("pointerDown");
          if (_pointerEventEnabled) {
            var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, "id");
            if (pointerIndex < 0) {
              pointerIndex = _currPointers.length;
            }
            _currPointers[pointerIndex] = { x: e.pageX, y: e.pageY, id: e.pointerId };
          }
          var startPointsList = _getTouchPoints(e), numPoints = startPointsList.length;
          _currentPoints = null;
          _stopAllAnimations();
          if (!_isDragging || numPoints === 1) {
            _isDragging = _isFirstMove = true;
            framework.bind(window, _upMoveEvents, self);
            _isZoomingIn = _wasOverInitialZoom = _opacityChanged = _verticalDragInitiated = _mainScrollShifted = _moved = _isMultitouch = _zoomStarted = false;
            _direction = null;
            _shout("firstTouchStart", startPointsList);
            _equalizePoints(_startPanOffset, _panOffset);
            _currPanDist.x = _currPanDist.y = 0;
            _equalizePoints(_currPoint, startPointsList[0]);
            _equalizePoints(_startPoint, _currPoint);
            _startMainScrollPos.x = _slideSize.x * _currPositionIndex;
            _posPoints = [{
              x: _currPoint.x,
              y: _currPoint.y
            }];
            _gestureCheckSpeedTime = _gestureStartTime = _getCurrentTime();
            _calculatePanBounds(_currZoomLevel, true);
            _stopDragUpdateLoop();
            _dragUpdateLoop();
          }
          if (!_isZooming && numPoints > 1 && !_mainScrollAnimating && !_mainScrollShifted) {
            _startZoomLevel = _currZoomLevel;
            _zoomStarted = false;
            _isZooming = _isMultitouch = true;
            _currPanDist.y = _currPanDist.x = 0;
            _equalizePoints(_startPanOffset, _panOffset);
            _equalizePoints(p, startPointsList[0]);
            _equalizePoints(p2, startPointsList[1]);
            _findCenterOfPoints(p, p2, _currCenterPoint);
            _midZoomPoint.x = Math.abs(_currCenterPoint.x) - _panOffset.x;
            _midZoomPoint.y = Math.abs(_currCenterPoint.y) - _panOffset.y;
            _currPointsDistance = _startPointsDistance = _calculatePointsDistance(p, p2);
          }
        }, _onDragMove = function(e) {
          e.preventDefault();
          if (_pointerEventEnabled) {
            var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, "id");
            if (pointerIndex > -1) {
              var p3 = _currPointers[pointerIndex];
              p3.x = e.pageX;
              p3.y = e.pageY;
            }
          }
          if (_isDragging) {
            var touchesList = _getTouchPoints(e);
            if (!_direction && !_moved && !_isZooming) {
              if (_mainScrollPos.x !== _slideSize.x * _currPositionIndex) {
                _direction = "h";
              } else {
                var diff = Math.abs(touchesList[0].x - _currPoint.x) - Math.abs(touchesList[0].y - _currPoint.y);
                if (Math.abs(diff) >= DIRECTION_CHECK_OFFSET) {
                  _direction = diff > 0 ? "h" : "v";
                  _currentPoints = touchesList;
                }
              }
            } else {
              _currentPoints = touchesList;
            }
          }
        }, _renderMovement = function() {
          if (!_currentPoints) {
            return;
          }
          var numPoints = _currentPoints.length;
          if (numPoints === 0) {
            return;
          }
          _equalizePoints(p, _currentPoints[0]);
          delta.x = p.x - _currPoint.x;
          delta.y = p.y - _currPoint.y;
          if (_isZooming && numPoints > 1) {
            _currPoint.x = p.x;
            _currPoint.y = p.y;
            if (!delta.x && !delta.y && _isEqualPoints(_currentPoints[1], p2)) {
              return;
            }
            _equalizePoints(p2, _currentPoints[1]);
            if (!_zoomStarted) {
              _zoomStarted = true;
              _shout("zoomGestureStarted");
            }
            var pointsDistance = _calculatePointsDistance(p, p2);
            var zoomLevel = _calculateZoomLevel(pointsDistance);
            if (zoomLevel > self.currItem.initialZoomLevel + self.currItem.initialZoomLevel / 15) {
              _wasOverInitialZoom = true;
            }
            var zoomFriction = 1, minZoomLevel = _getMinZoomLevel(), maxZoomLevel = _getMaxZoomLevel();
            if (zoomLevel < minZoomLevel) {
              if (_options.pinchToClose && !_wasOverInitialZoom && _startZoomLevel <= self.currItem.initialZoomLevel) {
                var minusDiff = minZoomLevel - zoomLevel;
                var percent = 1 - minusDiff / (minZoomLevel / 1.2);
                _applyBgOpacity(percent);
                _shout("onPinchClose", percent);
                _opacityChanged = true;
              } else {
                zoomFriction = (minZoomLevel - zoomLevel) / minZoomLevel;
                if (zoomFriction > 1) {
                  zoomFriction = 1;
                }
                zoomLevel = minZoomLevel - zoomFriction * (minZoomLevel / 3);
              }
            } else if (zoomLevel > maxZoomLevel) {
              zoomFriction = (zoomLevel - maxZoomLevel) / (minZoomLevel * 6);
              if (zoomFriction > 1) {
                zoomFriction = 1;
              }
              zoomLevel = maxZoomLevel + zoomFriction * minZoomLevel;
            }
            if (zoomFriction < 0) {
              zoomFriction = 0;
            }
            _currPointsDistance = pointsDistance;
            _findCenterOfPoints(p, p2, _centerPoint);
            _currPanDist.x += _centerPoint.x - _currCenterPoint.x;
            _currPanDist.y += _centerPoint.y - _currCenterPoint.y;
            _equalizePoints(_currCenterPoint, _centerPoint);
            _panOffset.x = _calculatePanOffset("x", zoomLevel);
            _panOffset.y = _calculatePanOffset("y", zoomLevel);
            _isZoomingIn = zoomLevel > _currZoomLevel;
            _currZoomLevel = zoomLevel;
            _applyCurrentZoomPan();
          } else {
            if (!_direction) {
              return;
            }
            if (_isFirstMove) {
              _isFirstMove = false;
              if (Math.abs(delta.x) >= DIRECTION_CHECK_OFFSET) {
                delta.x -= _currentPoints[0].x - _startPoint.x;
              }
              if (Math.abs(delta.y) >= DIRECTION_CHECK_OFFSET) {
                delta.y -= _currentPoints[0].y - _startPoint.y;
              }
            }
            _currPoint.x = p.x;
            _currPoint.y = p.y;
            if (delta.x === 0 && delta.y === 0) {
              return;
            }
            if (_direction === "v" && _options.closeOnVerticalDrag) {
              if (!_canPan()) {
                _currPanDist.y += delta.y;
                _panOffset.y += delta.y;
                var opacityRatio = _calculateVerticalDragOpacityRatio();
                _verticalDragInitiated = true;
                _shout("onVerticalDrag", opacityRatio);
                _applyBgOpacity(opacityRatio);
                _applyCurrentZoomPan();
                return;
              }
            }
            _pushPosPoint(_getCurrentTime(), p.x, p.y);
            _moved = true;
            _currPanBounds = self.currItem.bounds;
            var mainScrollChanged = _panOrMoveMainScroll("x", delta);
            if (!mainScrollChanged) {
              _panOrMoveMainScroll("y", delta);
              _roundPoint(_panOffset);
              _applyCurrentZoomPan();
            }
          }
        }, _onDragRelease = function(e) {
          if (_features.isOldAndroid) {
            if (_oldAndroidTouchEndTimeout && e.type === "mouseup") {
              return;
            }
            if (e.type.indexOf("touch") > -1) {
              clearTimeout(_oldAndroidTouchEndTimeout);
              _oldAndroidTouchEndTimeout = setTimeout(function() {
                _oldAndroidTouchEndTimeout = 0;
              }, 600);
            }
          }
          _shout("pointerUp");
          if (_preventDefaultEventBehaviour(e, false)) {
            e.preventDefault();
          }
          var releasePoint;
          if (_pointerEventEnabled) {
            var pointerIndex = framework.arraySearch(_currPointers, e.pointerId, "id");
            if (pointerIndex > -1) {
              releasePoint = _currPointers.splice(pointerIndex, 1)[0];
              if (navigator.msPointerEnabled) {
                var MSPOINTER_TYPES = {
                  4: "mouse",
                  // event.MSPOINTER_TYPE_MOUSE
                  2: "touch",
                  // event.MSPOINTER_TYPE_TOUCH 
                  3: "pen"
                  // event.MSPOINTER_TYPE_PEN
                };
                releasePoint.type = MSPOINTER_TYPES[e.pointerType];
                if (!releasePoint.type) {
                  releasePoint.type = e.pointerType || "mouse";
                }
              } else {
                releasePoint.type = e.pointerType || "mouse";
              }
            }
          }
          var touchList = _getTouchPoints(e), gestureType, numPoints = touchList.length;
          if (e.type === "mouseup") {
            numPoints = 0;
          }
          if (numPoints === 2) {
            _currentPoints = null;
            return true;
          }
          if (numPoints === 1) {
            _equalizePoints(_startPoint, touchList[0]);
          }
          if (numPoints === 0 && !_direction && !_mainScrollAnimating) {
            if (!releasePoint) {
              if (e.type === "mouseup") {
                releasePoint = { x: e.pageX, y: e.pageY, type: "mouse" };
              } else if (e.changedTouches && e.changedTouches[0]) {
                releasePoint = { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY, type: "touch" };
              }
            }
            _shout("touchRelease", e, releasePoint);
          }
          var releaseTimeDiff = -1;
          if (numPoints === 0) {
            _isDragging = false;
            framework.unbind(window, _upMoveEvents, self);
            _stopDragUpdateLoop();
            if (_isZooming) {
              releaseTimeDiff = 0;
            } else if (_lastReleaseTime !== -1) {
              releaseTimeDiff = _getCurrentTime() - _lastReleaseTime;
            }
          }
          _lastReleaseTime = numPoints === 1 ? _getCurrentTime() : -1;
          if (releaseTimeDiff !== -1 && releaseTimeDiff < 150) {
            gestureType = "zoom";
          } else {
            gestureType = "swipe";
          }
          if (_isZooming && numPoints < 2) {
            _isZooming = false;
            if (numPoints === 1) {
              gestureType = "zoomPointerUp";
            }
            _shout("zoomGestureEnded");
          }
          _currentPoints = null;
          if (!_moved && !_zoomStarted && !_mainScrollAnimating && !_verticalDragInitiated) {
            return;
          }
          _stopAllAnimations();
          if (!_releaseAnimData) {
            _releaseAnimData = _initDragReleaseAnimationData();
          }
          _releaseAnimData.calculateSwipeSpeed("x");
          if (_verticalDragInitiated) {
            var opacityRatio = _calculateVerticalDragOpacityRatio();
            if (opacityRatio < _options.verticalDragRange) {
              self.close();
            } else {
              var initalPanY = _panOffset.y, initialBgOpacity = _bgOpacity;
              _animateProp("verticalDrag", 0, 1, 300, framework.easing.cubic.out, function(now) {
                _panOffset.y = (self.currItem.initialPosition.y - initalPanY) * now + initalPanY;
                _applyBgOpacity((1 - initialBgOpacity) * now + initialBgOpacity);
                _applyCurrentZoomPan();
              });
              _shout("onVerticalDrag", 1);
            }
            return;
          }
          if ((_mainScrollShifted || _mainScrollAnimating) && numPoints === 0) {
            var itemChanged = _finishSwipeMainScrollGesture(gestureType, _releaseAnimData);
            if (itemChanged) {
              return;
            }
            gestureType = "zoomPointerUp";
          }
          if (_mainScrollAnimating) {
            return;
          }
          if (gestureType !== "swipe") {
            _completeZoomGesture();
            return;
          }
          if (!_mainScrollShifted && _currZoomLevel > self.currItem.fitRatio) {
            _completePanGesture(_releaseAnimData);
          }
        }, _initDragReleaseAnimationData = function() {
          var lastFlickDuration, tempReleasePos;
          var s = {
            lastFlickOffset: {},
            lastFlickDist: {},
            lastFlickSpeed: {},
            slowDownRatio: {},
            slowDownRatioReverse: {},
            speedDecelerationRatio: {},
            speedDecelerationRatioAbs: {},
            distanceOffset: {},
            backAnimDestination: {},
            backAnimStarted: {},
            calculateSwipeSpeed: function(axis) {
              if (_posPoints.length > 1) {
                lastFlickDuration = _getCurrentTime() - _gestureCheckSpeedTime + 50;
                tempReleasePos = _posPoints[_posPoints.length - 2][axis];
              } else {
                lastFlickDuration = _getCurrentTime() - _gestureStartTime;
                tempReleasePos = _startPoint[axis];
              }
              s.lastFlickOffset[axis] = _currPoint[axis] - tempReleasePos;
              s.lastFlickDist[axis] = Math.abs(s.lastFlickOffset[axis]);
              if (s.lastFlickDist[axis] > 20) {
                s.lastFlickSpeed[axis] = s.lastFlickOffset[axis] / lastFlickDuration;
              } else {
                s.lastFlickSpeed[axis] = 0;
              }
              if (Math.abs(s.lastFlickSpeed[axis]) < 0.1) {
                s.lastFlickSpeed[axis] = 0;
              }
              s.slowDownRatio[axis] = 0.95;
              s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
              s.speedDecelerationRatio[axis] = 1;
            },
            calculateOverBoundsAnimOffset: function(axis, speed) {
              if (!s.backAnimStarted[axis]) {
                if (_panOffset[axis] > _currPanBounds.min[axis]) {
                  s.backAnimDestination[axis] = _currPanBounds.min[axis];
                } else if (_panOffset[axis] < _currPanBounds.max[axis]) {
                  s.backAnimDestination[axis] = _currPanBounds.max[axis];
                }
                if (s.backAnimDestination[axis] !== void 0) {
                  s.slowDownRatio[axis] = 0.7;
                  s.slowDownRatioReverse[axis] = 1 - s.slowDownRatio[axis];
                  if (s.speedDecelerationRatioAbs[axis] < 0.05) {
                    s.lastFlickSpeed[axis] = 0;
                    s.backAnimStarted[axis] = true;
                    _animateProp(
                      "bounceZoomPan" + axis,
                      _panOffset[axis],
                      s.backAnimDestination[axis],
                      speed || 300,
                      framework.easing.sine.out,
                      function(pos) {
                        _panOffset[axis] = pos;
                        _applyCurrentZoomPan();
                      }
                    );
                  }
                }
              }
            },
            // Reduces the speed by slowDownRatio (per 10ms)
            calculateAnimOffset: function(axis) {
              if (!s.backAnimStarted[axis]) {
                s.speedDecelerationRatio[axis] = s.speedDecelerationRatio[axis] * (s.slowDownRatio[axis] + s.slowDownRatioReverse[axis] - s.slowDownRatioReverse[axis] * s.timeDiff / 10);
                s.speedDecelerationRatioAbs[axis] = Math.abs(s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis]);
                s.distanceOffset[axis] = s.lastFlickSpeed[axis] * s.speedDecelerationRatio[axis] * s.timeDiff;
                _panOffset[axis] += s.distanceOffset[axis];
              }
            },
            panAnimLoop: function() {
              if (_animations.zoomPan) {
                _animations.zoomPan.raf = _requestAF(s.panAnimLoop);
                s.now = _getCurrentTime();
                s.timeDiff = s.now - s.lastNow;
                s.lastNow = s.now;
                s.calculateAnimOffset("x");
                s.calculateAnimOffset("y");
                _applyCurrentZoomPan();
                s.calculateOverBoundsAnimOffset("x");
                s.calculateOverBoundsAnimOffset("y");
                if (s.speedDecelerationRatioAbs.x < 0.05 && s.speedDecelerationRatioAbs.y < 0.05) {
                  _panOffset.x = Math.round(_panOffset.x);
                  _panOffset.y = Math.round(_panOffset.y);
                  _applyCurrentZoomPan();
                  _stopAnimation("zoomPan");
                  return;
                }
              }
            }
          };
          return s;
        }, _completePanGesture = function(animData) {
          animData.calculateSwipeSpeed("y");
          _currPanBounds = self.currItem.bounds;
          animData.backAnimDestination = {};
          animData.backAnimStarted = {};
          if (Math.abs(animData.lastFlickSpeed.x) <= 0.05 && Math.abs(animData.lastFlickSpeed.y) <= 0.05) {
            animData.speedDecelerationRatioAbs.x = animData.speedDecelerationRatioAbs.y = 0;
            animData.calculateOverBoundsAnimOffset("x");
            animData.calculateOverBoundsAnimOffset("y");
            return true;
          }
          _registerStartAnimation("zoomPan");
          animData.lastNow = _getCurrentTime();
          animData.panAnimLoop();
        }, _finishSwipeMainScrollGesture = function(gestureType, _releaseAnimData2) {
          var itemChanged;
          if (!_mainScrollAnimating) {
            _currZoomedItemIndex = _currentItemIndex;
          }
          var itemsDiff;
          if (gestureType === "swipe") {
            var totalShiftDist = _currPoint.x - _startPoint.x, isFastLastFlick = _releaseAnimData2.lastFlickDist.x < 10;
            if (totalShiftDist > MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData2.lastFlickOffset.x > 20)) {
              itemsDiff = -1;
            } else if (totalShiftDist < -MIN_SWIPE_DISTANCE && (isFastLastFlick || _releaseAnimData2.lastFlickOffset.x < -20)) {
              itemsDiff = 1;
            }
          }
          var nextCircle;
          if (itemsDiff) {
            _currentItemIndex += itemsDiff;
            if (_currentItemIndex < 0) {
              _currentItemIndex = _options.loop ? _getNumItems() - 1 : 0;
              nextCircle = true;
            } else if (_currentItemIndex >= _getNumItems()) {
              _currentItemIndex = _options.loop ? 0 : _getNumItems() - 1;
              nextCircle = true;
            }
            if (!nextCircle || _options.loop) {
              _indexDiff += itemsDiff;
              _currPositionIndex -= itemsDiff;
              itemChanged = true;
            }
          }
          var animateToX = _slideSize.x * _currPositionIndex;
          var animateToDist = Math.abs(animateToX - _mainScrollPos.x);
          var finishAnimDuration;
          if (!itemChanged && animateToX > _mainScrollPos.x !== _releaseAnimData2.lastFlickSpeed.x > 0) {
            finishAnimDuration = 333;
          } else {
            finishAnimDuration = Math.abs(_releaseAnimData2.lastFlickSpeed.x) > 0 ? animateToDist / Math.abs(_releaseAnimData2.lastFlickSpeed.x) : 333;
            finishAnimDuration = Math.min(finishAnimDuration, 400);
            finishAnimDuration = Math.max(finishAnimDuration, 250);
          }
          if (_currZoomedItemIndex === _currentItemIndex) {
            itemChanged = false;
          }
          _mainScrollAnimating = true;
          _shout("mainScrollAnimStart");
          _animateProp(
            "mainScroll",
            _mainScrollPos.x,
            animateToX,
            finishAnimDuration,
            framework.easing.cubic.out,
            _moveMainScroll,
            function() {
              _stopAllAnimations();
              _mainScrollAnimating = false;
              _currZoomedItemIndex = -1;
              if (itemChanged || _currZoomedItemIndex !== _currentItemIndex) {
                self.updateCurrItem();
              }
              _shout("mainScrollAnimComplete");
            }
          );
          if (itemChanged) {
            self.updateCurrItem(true);
          }
          return itemChanged;
        }, _calculateZoomLevel = function(touchesDistance) {
          return 1 / _startPointsDistance * touchesDistance * _startZoomLevel;
        }, _completeZoomGesture = function() {
          var destZoomLevel = _currZoomLevel, minZoomLevel = _getMinZoomLevel(), maxZoomLevel = _getMaxZoomLevel();
          if (_currZoomLevel < minZoomLevel) {
            destZoomLevel = minZoomLevel;
          } else if (_currZoomLevel > maxZoomLevel) {
            destZoomLevel = maxZoomLevel;
          }
          var destOpacity = 1, onUpdate, initialOpacity = _bgOpacity;
          if (_opacityChanged && !_isZoomingIn && !_wasOverInitialZoom && _currZoomLevel < minZoomLevel) {
            self.close();
            return true;
          }
          if (_opacityChanged) {
            onUpdate = function(now) {
              _applyBgOpacity((destOpacity - initialOpacity) * now + initialOpacity);
            };
          }
          self.zoomTo(destZoomLevel, 0, 200, framework.easing.cubic.out, onUpdate);
          return true;
        };
        _registerModule("Gestures", {
          publicMethods: {
            initGestures: function() {
              var addEventNames = function(pref, down, move, up, cancel) {
                _dragStartEvent = pref + down;
                _dragMoveEvent = pref + move;
                _dragEndEvent = pref + up;
                if (cancel) {
                  _dragCancelEvent = pref + cancel;
                } else {
                  _dragCancelEvent = "";
                }
              };
              _pointerEventEnabled = _features.pointerEvent;
              if (_pointerEventEnabled && _features.touch) {
                _features.touch = false;
              }
              if (_pointerEventEnabled) {
                if (navigator.msPointerEnabled) {
                  addEventNames("MSPointer", "Down", "Move", "Up", "Cancel");
                } else {
                  addEventNames("pointer", "down", "move", "up", "cancel");
                }
              } else if (_features.touch) {
                addEventNames("touch", "start", "move", "end", "cancel");
                _likelyTouchDevice = true;
              } else {
                addEventNames("mouse", "down", "move", "up");
              }
              _upMoveEvents = _dragMoveEvent + " " + _dragEndEvent + " " + _dragCancelEvent;
              _downEvents = _dragStartEvent;
              if (_pointerEventEnabled && !_likelyTouchDevice) {
                _likelyTouchDevice = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;
              }
              self.likelyTouchDevice = _likelyTouchDevice;
              _globalEventHandlers[_dragStartEvent] = _onDragStart;
              _globalEventHandlers[_dragMoveEvent] = _onDragMove;
              _globalEventHandlers[_dragEndEvent] = _onDragRelease;
              if (_dragCancelEvent) {
                _globalEventHandlers[_dragCancelEvent] = _globalEventHandlers[_dragEndEvent];
              }
              if (_features.touch) {
                _downEvents += " mousedown";
                _upMoveEvents += " mousemove mouseup";
                _globalEventHandlers.mousedown = _globalEventHandlers[_dragStartEvent];
                _globalEventHandlers.mousemove = _globalEventHandlers[_dragMoveEvent];
                _globalEventHandlers.mouseup = _globalEventHandlers[_dragEndEvent];
              }
              if (!_likelyTouchDevice) {
                _options.allowPanToNext = false;
              }
            }
          }
        });
        var _showOrHideTimeout, _showOrHide = function(item, img, out, completeFn) {
          if (_showOrHideTimeout) {
            clearTimeout(_showOrHideTimeout);
          }
          _initialZoomRunning = true;
          _initialContentSet = true;
          var thumbBounds;
          if (item.initialLayout) {
            thumbBounds = item.initialLayout;
            item.initialLayout = null;
          } else {
            thumbBounds = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
          }
          var duration = out ? _options.hideAnimationDuration : _options.showAnimationDuration;
          var onComplete = function() {
            _stopAnimation("initialZoom");
            if (!out) {
              _applyBgOpacity(1);
              if (img) {
                img.style.display = "block";
              }
              framework.addClass(template, "pswp--animated-in");
              _shout("initialZoom" + (out ? "OutEnd" : "InEnd"));
            } else {
              self.template.removeAttribute("style");
              self.bg.removeAttribute("style");
            }
            if (completeFn) {
              completeFn();
            }
            _initialZoomRunning = false;
          };
          if (!duration || !thumbBounds || thumbBounds.x === void 0) {
            _shout("initialZoom" + (out ? "Out" : "In"));
            _currZoomLevel = item.initialZoomLevel;
            _equalizePoints(_panOffset, item.initialPosition);
            _applyCurrentZoomPan();
            template.style.opacity = out ? 0 : 1;
            _applyBgOpacity(1);
            if (duration) {
              setTimeout(function() {
                onComplete();
              }, duration);
            } else {
              onComplete();
            }
            return;
          }
          var startAnimation = function() {
            var closeWithRaf = _closedByScroll, fadeEverything = !self.currItem.src || self.currItem.loadError || _options.showHideOpacity;
            if (item.miniImg) {
              item.miniImg.style.webkitBackfaceVisibility = "hidden";
            }
            if (!out) {
              _currZoomLevel = thumbBounds.w / item.w;
              _panOffset.x = thumbBounds.x;
              _panOffset.y = thumbBounds.y - _initalWindowScrollY;
              self[fadeEverything ? "template" : "bg"].style.opacity = 1e-3;
              _applyCurrentZoomPan();
            }
            _registerStartAnimation("initialZoom");
            if (out && !closeWithRaf) {
              framework.removeClass(template, "pswp--animated-in");
            }
            if (fadeEverything) {
              if (out) {
                framework[(closeWithRaf ? "remove" : "add") + "Class"](template, "pswp--animate_opacity");
              } else {
                setTimeout(function() {
                  framework.addClass(template, "pswp--animate_opacity");
                }, 30);
              }
            }
            _showOrHideTimeout = setTimeout(function() {
              _shout("initialZoom" + (out ? "Out" : "In"));
              if (!out) {
                _currZoomLevel = item.initialZoomLevel;
                _equalizePoints(_panOffset, item.initialPosition);
                _applyCurrentZoomPan();
                _applyBgOpacity(1);
                if (fadeEverything) {
                  template.style.opacity = 1;
                } else {
                  _applyBgOpacity(1);
                }
                _showOrHideTimeout = setTimeout(onComplete, duration + 20);
              } else {
                var destZoomLevel = thumbBounds.w / item.w, initialPanOffset = {
                  x: _panOffset.x,
                  y: _panOffset.y
                }, initialZoomLevel = _currZoomLevel, initalBgOpacity = _bgOpacity, onUpdate = function(now) {
                  if (now === 1) {
                    _currZoomLevel = destZoomLevel;
                    _panOffset.x = thumbBounds.x;
                    _panOffset.y = thumbBounds.y - _currentWindowScrollY;
                  } else {
                    _currZoomLevel = (destZoomLevel - initialZoomLevel) * now + initialZoomLevel;
                    _panOffset.x = (thumbBounds.x - initialPanOffset.x) * now + initialPanOffset.x;
                    _panOffset.y = (thumbBounds.y - _currentWindowScrollY - initialPanOffset.y) * now + initialPanOffset.y;
                  }
                  _applyCurrentZoomPan();
                  if (fadeEverything) {
                    template.style.opacity = 1 - now;
                  } else {
                    _applyBgOpacity(initalBgOpacity - now * initalBgOpacity);
                  }
                };
                if (closeWithRaf) {
                  _animateProp("initialZoom", 0, 1, duration, framework.easing.cubic.out, onUpdate, onComplete);
                } else {
                  onUpdate(1);
                  _showOrHideTimeout = setTimeout(onComplete, duration + 20);
                }
              }
            }, out ? 25 : 90);
          };
          startAnimation();
        };
        var _items, _tempPanAreaSize = {}, _imagesToAppendPool = [], _initialContentSet, _initialZoomRunning, _controllerDefaultOptions = {
          index: 0,
          errorMsg: '<div class="pswp__error-msg"><a href="%url%" target="_blank">The image</a> could not be loaded.</div>',
          forceProgressiveLoading: false,
          // TODO
          preload: [1, 1],
          getNumItemsFn: function() {
            return _items.length;
          }
        };
        var _getItemAt, _getNumItems, _initialIsLoop, _getZeroBounds = function() {
          return {
            center: { x: 0, y: 0 },
            max: { x: 0, y: 0 },
            min: { x: 0, y: 0 }
          };
        }, _calculateSingleItemPanBounds = function(item, realPanElementW, realPanElementH) {
          var bounds = item.bounds;
          bounds.center.x = Math.round((_tempPanAreaSize.x - realPanElementW) / 2);
          bounds.center.y = Math.round((_tempPanAreaSize.y - realPanElementH) / 2) + item.vGap.top;
          bounds.max.x = realPanElementW > _tempPanAreaSize.x ? Math.round(_tempPanAreaSize.x - realPanElementW) : bounds.center.x;
          bounds.max.y = realPanElementH > _tempPanAreaSize.y ? Math.round(_tempPanAreaSize.y - realPanElementH) + item.vGap.top : bounds.center.y;
          bounds.min.x = realPanElementW > _tempPanAreaSize.x ? 0 : bounds.center.x;
          bounds.min.y = realPanElementH > _tempPanAreaSize.y ? item.vGap.top : bounds.center.y;
        }, _calculateItemSize = function(item, viewportSize, zoomLevel) {
          if (item.src && !item.loadError) {
            var isInitial = !zoomLevel;
            if (isInitial) {
              if (!item.vGap) {
                item.vGap = { top: 0, bottom: 0 };
              }
              _shout("parseVerticalMargin", item);
            }
            _tempPanAreaSize.x = viewportSize.x;
            _tempPanAreaSize.y = viewportSize.y - item.vGap.top - item.vGap.bottom;
            if (isInitial) {
              var hRatio = _tempPanAreaSize.x / item.w;
              var vRatio = _tempPanAreaSize.y / item.h;
              item.fitRatio = hRatio < vRatio ? hRatio : vRatio;
              var scaleMode = _options.scaleMode;
              if (scaleMode === "orig") {
                zoomLevel = 1;
              } else if (scaleMode === "fit") {
                zoomLevel = item.fitRatio;
              }
              if (zoomLevel > 1) {
                zoomLevel = 1;
              }
              item.initialZoomLevel = zoomLevel;
              if (!item.bounds) {
                item.bounds = _getZeroBounds();
              }
            }
            if (!zoomLevel) {
              return;
            }
            _calculateSingleItemPanBounds(item, item.w * zoomLevel, item.h * zoomLevel);
            if (isInitial && zoomLevel === item.initialZoomLevel) {
              item.initialPosition = item.bounds.center;
            }
            return item.bounds;
          } else {
            item.w = item.h = 0;
            item.initialZoomLevel = item.fitRatio = 1;
            item.bounds = _getZeroBounds();
            item.initialPosition = item.bounds.center;
            return item.bounds;
          }
        }, _appendImage = function(index, item, baseDiv, img, preventAnimation, keepPlaceholder) {
          if (item.loadError) {
            return;
          }
          if (img) {
            item.imageAppended = true;
            _setImageSize(item, img, item === self.currItem && _renderMaxResolution);
            baseDiv.appendChild(img);
            if (keepPlaceholder) {
              setTimeout(function() {
                if (item && item.loaded && item.placeholder) {
                  item.placeholder.style.display = "none";
                  item.placeholder = null;
                }
              }, 500);
            }
          }
        }, _preloadImage = function(item) {
          item.loading = true;
          item.loaded = false;
          var img = item.img = framework.createEl("pswp__img", "img");
          var onComplete = function() {
            item.loading = false;
            item.loaded = true;
            if (item.loadComplete) {
              item.loadComplete(item);
            } else {
              item.img = null;
            }
            img.onload = img.onerror = null;
            img = null;
          };
          img.onload = onComplete;
          img.onerror = function() {
            item.loadError = true;
            onComplete();
          };
          img.src = item.src;
          return img;
        }, _checkForError = function(item, cleanUp) {
          if (item.src && item.loadError && item.container) {
            if (cleanUp) {
              item.container.innerHTML = "";
            }
            item.container.innerHTML = _options.errorMsg.replace("%url%", item.src);
            return true;
          }
        }, _setImageSize = function(item, img, maxRes) {
          if (!item.src) {
            return;
          }
          if (!img) {
            img = item.container.lastChild;
          }
          var w = maxRes ? item.w : Math.round(item.w * item.fitRatio), h = maxRes ? item.h : Math.round(item.h * item.fitRatio);
          if (item.placeholder && !item.loaded) {
            item.placeholder.style.width = w + "px";
            item.placeholder.style.height = h + "px";
          }
          img.style.width = w + "px";
          img.style.height = h + "px";
        }, _appendImagesPool = function() {
          if (_imagesToAppendPool.length) {
            var poolItem;
            for (var i = 0; i < _imagesToAppendPool.length; i++) {
              poolItem = _imagesToAppendPool[i];
              if (poolItem.holder.index === poolItem.index) {
                _appendImage(poolItem.index, poolItem.item, poolItem.baseDiv, poolItem.img, false, poolItem.clearPlaceholder);
              }
            }
            _imagesToAppendPool = [];
          }
        };
        _registerModule("Controller", {
          publicMethods: {
            lazyLoadItem: function(index) {
              index = _getLoopedId(index);
              var item = _getItemAt(index);
              if (!item || (item.loaded || item.loading) && !_itemsNeedUpdate) {
                return;
              }
              _shout("gettingData", index, item);
              if (!item.src) {
                return;
              }
              _preloadImage(item);
            },
            initController: function() {
              framework.extend(_options, _controllerDefaultOptions, true);
              self.items = _items = items;
              _getItemAt = self.getItemAt;
              _getNumItems = _options.getNumItemsFn;
              _initialIsLoop = _options.loop;
              if (_getNumItems() < 3) {
                _options.loop = false;
              }
              _listen("beforeChange", function(diff) {
                var p3 = _options.preload, isNext = diff === null ? true : diff >= 0, preloadBefore = Math.min(p3[0], _getNumItems()), preloadAfter = Math.min(p3[1], _getNumItems()), i;
                for (i = 1; i <= (isNext ? preloadAfter : preloadBefore); i++) {
                  self.lazyLoadItem(_currentItemIndex + i);
                }
                for (i = 1; i <= (isNext ? preloadBefore : preloadAfter); i++) {
                  self.lazyLoadItem(_currentItemIndex - i);
                }
              });
              _listen("initialLayout", function() {
                self.currItem.initialLayout = _options.getThumbBoundsFn && _options.getThumbBoundsFn(_currentItemIndex);
              });
              _listen("mainScrollAnimComplete", _appendImagesPool);
              _listen("initialZoomInEnd", _appendImagesPool);
              _listen("destroy", function() {
                var item;
                for (var i = 0; i < _items.length; i++) {
                  item = _items[i];
                  if (item.container) {
                    item.container = null;
                  }
                  if (item.placeholder) {
                    item.placeholder = null;
                  }
                  if (item.img) {
                    item.img = null;
                  }
                  if (item.preloader) {
                    item.preloader = null;
                  }
                  if (item.loadError) {
                    item.loaded = item.loadError = false;
                  }
                }
                _imagesToAppendPool = null;
              });
            },
            getItemAt: function(index) {
              if (index >= 0) {
                return _items[index] !== void 0 ? _items[index] : false;
              }
              return false;
            },
            allowProgressiveImg: function() {
              return _options.forceProgressiveLoading || !_likelyTouchDevice || _options.mouseUsed || screen.width > 1200;
            },
            setContent: function(holder, index) {
              if (_options.loop) {
                index = _getLoopedId(index);
              }
              var prevItem = self.getItemAt(holder.index);
              if (prevItem) {
                prevItem.container = null;
              }
              var item = self.getItemAt(index), img;
              if (!item) {
                holder.el.innerHTML = "";
                return;
              }
              _shout("gettingData", index, item);
              holder.index = index;
              holder.item = item;
              var baseDiv = item.container = framework.createEl("pswp__zoom-wrap");
              if (!item.src && item.html) {
                if (item.html.tagName) {
                  baseDiv.appendChild(item.html);
                } else {
                  baseDiv.innerHTML = item.html;
                }
              }
              _checkForError(item);
              _calculateItemSize(item, _viewportSize);
              if (item.src && !item.loadError && !item.loaded) {
                item.loadComplete = function(item2) {
                  if (!_isOpen) {
                    return;
                  }
                  if (holder && holder.index === index) {
                    if (_checkForError(item2, true)) {
                      item2.loadComplete = item2.img = null;
                      _calculateItemSize(item2, _viewportSize);
                      _applyZoomPanToItem(item2);
                      if (holder.index === _currentItemIndex) {
                        self.updateCurrZoomItem();
                      }
                      return;
                    }
                    if (!item2.imageAppended) {
                      if (_features.transform && (_mainScrollAnimating || _initialZoomRunning)) {
                        _imagesToAppendPool.push({
                          item: item2,
                          baseDiv,
                          img: item2.img,
                          index,
                          holder,
                          clearPlaceholder: true
                        });
                      } else {
                        _appendImage(index, item2, baseDiv, item2.img, _mainScrollAnimating || _initialZoomRunning, true);
                      }
                    } else {
                      if (!_initialZoomRunning && item2.placeholder) {
                        item2.placeholder.style.display = "none";
                        item2.placeholder = null;
                      }
                    }
                  }
                  item2.loadComplete = null;
                  item2.img = null;
                  _shout("imageLoadComplete", index, item2);
                };
                if (framework.features.transform) {
                  var placeholderClassName = "pswp__img pswp__img--placeholder";
                  placeholderClassName += item.msrc ? "" : " pswp__img--placeholder--blank";
                  var placeholder = framework.createEl(placeholderClassName, item.msrc ? "img" : "");
                  if (item.msrc) {
                    placeholder.src = item.msrc;
                  }
                  _setImageSize(item, placeholder);
                  baseDiv.appendChild(placeholder);
                  item.placeholder = placeholder;
                }
                if (!item.loading) {
                  _preloadImage(item);
                }
                if (self.allowProgressiveImg()) {
                  if (!_initialContentSet && _features.transform) {
                    _imagesToAppendPool.push({
                      item,
                      baseDiv,
                      img: item.img,
                      index,
                      holder
                    });
                  } else {
                    _appendImage(index, item, baseDiv, item.img, true, true);
                  }
                }
              } else if (item.src && !item.loadError) {
                img = framework.createEl("pswp__img", "img");
                img.style.opacity = 1;
                img.src = item.src;
                _setImageSize(item, img);
                _appendImage(index, item, baseDiv, img, true);
              }
              if (!_initialContentSet && index === _currentItemIndex) {
                _currZoomElementStyle = baseDiv.style;
                _showOrHide(item, img || item.img);
              } else {
                _applyZoomPanToItem(item);
              }
              holder.el.innerHTML = "";
              holder.el.appendChild(baseDiv);
            },
            cleanSlide: function(item) {
              if (item.img) {
                item.img.onload = item.img.onerror = null;
              }
              item.loaded = item.loading = item.img = item.imageAppended = false;
            }
          }
        });
        var tapTimer, tapReleasePoint = {}, _dispatchTapEvent = function(origEvent, releasePoint, pointerType) {
          var e = document.createEvent("CustomEvent"), eDetail = {
            origEvent,
            target: origEvent.target,
            releasePoint,
            pointerType: pointerType || "touch"
          };
          e.initCustomEvent("pswpTap", true, true, eDetail);
          origEvent.target.dispatchEvent(e);
        };
        _registerModule("Tap", {
          publicMethods: {
            initTap: function() {
              _listen("firstTouchStart", self.onTapStart);
              _listen("touchRelease", self.onTapRelease);
              _listen("destroy", function() {
                tapReleasePoint = {};
                tapTimer = null;
              });
            },
            onTapStart: function(touchList) {
              if (touchList.length > 1) {
                clearTimeout(tapTimer);
                tapTimer = null;
              }
            },
            onTapRelease: function(e, releasePoint) {
              if (!releasePoint) {
                return;
              }
              if (!_moved && !_isMultitouch && !_numAnimations) {
                var p0 = releasePoint;
                if (tapTimer) {
                  clearTimeout(tapTimer);
                  tapTimer = null;
                  if (_isNearbyPoints(p0, tapReleasePoint)) {
                    _shout("doubleTap", p0);
                    return;
                  }
                }
                if (releasePoint.type === "mouse") {
                  _dispatchTapEvent(e, releasePoint, "mouse");
                  return;
                }
                var clickedTagName = e.target.tagName.toUpperCase();
                if (clickedTagName === "BUTTON" || framework.hasClass(e.target, "pswp__single-tap")) {
                  _dispatchTapEvent(e, releasePoint);
                  return;
                }
                _equalizePoints(tapReleasePoint, p0);
                tapTimer = setTimeout(function() {
                  _dispatchTapEvent(e, releasePoint);
                  tapTimer = null;
                }, 300);
              }
            }
          }
        });
        var _wheelDelta;
        _registerModule("DesktopZoom", {
          publicMethods: {
            initDesktopZoom: function() {
              if (_oldIE) {
                return;
              }
              if (_likelyTouchDevice) {
                _listen("mouseUsed", function() {
                  self.setupDesktopZoom();
                });
              } else {
                self.setupDesktopZoom(true);
              }
            },
            setupDesktopZoom: function(onInit) {
              _wheelDelta = {};
              var events = "wheel mousewheel DOMMouseScroll";
              _listen("bindEvents", function() {
                framework.bind(template, events, self.handleMouseWheel);
              });
              _listen("unbindEvents", function() {
                if (_wheelDelta) {
                  framework.unbind(template, events, self.handleMouseWheel);
                }
              });
              self.mouseZoomedIn = false;
              var hasDraggingClass, updateZoomable = function() {
                if (self.mouseZoomedIn) {
                  framework.removeClass(template, "pswp--zoomed-in");
                  self.mouseZoomedIn = false;
                }
                if (_currZoomLevel < 1) {
                  framework.addClass(template, "pswp--zoom-allowed");
                } else {
                  framework.removeClass(template, "pswp--zoom-allowed");
                }
                removeDraggingClass();
              }, removeDraggingClass = function() {
                if (hasDraggingClass) {
                  framework.removeClass(template, "pswp--dragging");
                  hasDraggingClass = false;
                }
              };
              _listen("resize", updateZoomable);
              _listen("afterChange", updateZoomable);
              _listen("pointerDown", function() {
                if (self.mouseZoomedIn) {
                  hasDraggingClass = true;
                  framework.addClass(template, "pswp--dragging");
                }
              });
              _listen("pointerUp", removeDraggingClass);
              if (!onInit) {
                updateZoomable();
              }
            },
            handleMouseWheel: function(e) {
              if (_currZoomLevel <= self.currItem.fitRatio) {
                if (_options.modal) {
                  if (!_options.closeOnScroll || _numAnimations || _isDragging) {
                    e.preventDefault();
                  } else if (_transformKey && Math.abs(e.deltaY) > 2) {
                    _closedByScroll = true;
                    self.close();
                  }
                }
                return true;
              }
              e.stopPropagation();
              _wheelDelta.x = 0;
              if ("deltaX" in e) {
                if (e.deltaMode === 1) {
                  _wheelDelta.x = e.deltaX * 18;
                  _wheelDelta.y = e.deltaY * 18;
                } else {
                  _wheelDelta.x = e.deltaX;
                  _wheelDelta.y = e.deltaY;
                }
              } else if ("wheelDelta" in e) {
                if (e.wheelDeltaX) {
                  _wheelDelta.x = -0.16 * e.wheelDeltaX;
                }
                if (e.wheelDeltaY) {
                  _wheelDelta.y = -0.16 * e.wheelDeltaY;
                } else {
                  _wheelDelta.y = -0.16 * e.wheelDelta;
                }
              } else if ("detail" in e) {
                _wheelDelta.y = e.detail;
              } else {
                return;
              }
              _calculatePanBounds(_currZoomLevel, true);
              var newPanX = _panOffset.x - _wheelDelta.x, newPanY = _panOffset.y - _wheelDelta.y;
              if (_options.modal || newPanX <= _currPanBounds.min.x && newPanX >= _currPanBounds.max.x && newPanY <= _currPanBounds.min.y && newPanY >= _currPanBounds.max.y) {
                e.preventDefault();
              }
              self.panTo(newPanX, newPanY);
            },
            toggleDesktopZoom: function(centerPoint) {
              centerPoint = centerPoint || { x: _viewportSize.x / 2 + _offset.x, y: _viewportSize.y / 2 + _offset.y };
              var doubleTapZoomLevel = _options.getDoubleTapZoom(true, self.currItem);
              var zoomOut = _currZoomLevel === doubleTapZoomLevel;
              self.mouseZoomedIn = !zoomOut;
              self.zoomTo(zoomOut ? self.currItem.initialZoomLevel : doubleTapZoomLevel, centerPoint, 333);
              framework[(!zoomOut ? "add" : "remove") + "Class"](template, "pswp--zoomed-in");
            }
          }
        });
        var _historyDefaultOptions = {
          history: true,
          galleryUID: 1
        };
        var _historyUpdateTimeout, _hashChangeTimeout, _hashAnimCheckTimeout, _hashChangedByScript, _hashChangedByHistory, _hashReseted, _initialHash, _historyChanged, _closedFromURL, _urlChangedOnce, _windowLoc, _supportsPushState, _getHash = function() {
          return _windowLoc.hash.substring(1);
        }, _cleanHistoryTimeouts = function() {
          if (_historyUpdateTimeout) {
            clearTimeout(_historyUpdateTimeout);
          }
          if (_hashAnimCheckTimeout) {
            clearTimeout(_hashAnimCheckTimeout);
          }
        }, _parseItemIndexFromURL = function() {
          var hash = _getHash(), params = {};
          if (hash.length < 5) {
            return params;
          }
          var i, vars = hash.split("&");
          for (i = 0; i < vars.length; i++) {
            if (!vars[i]) {
              continue;
            }
            var pair = vars[i].split("=");
            if (pair.length < 2) {
              continue;
            }
            params[pair[0]] = pair[1];
          }
          if (_options.galleryPIDs) {
            var searchfor = params.pid;
            params.pid = 0;
            for (i = 0; i < _items.length; i++) {
              if (_items[i].pid === searchfor) {
                params.pid = i;
                break;
              }
            }
          } else {
            params.pid = parseInt(params.pid, 10) - 1;
          }
          if (params.pid < 0) {
            params.pid = 0;
          }
          return params;
        }, _updateHash = function() {
          if (_hashAnimCheckTimeout) {
            clearTimeout(_hashAnimCheckTimeout);
          }
          if (_numAnimations || _isDragging) {
            _hashAnimCheckTimeout = setTimeout(_updateHash, 500);
            return;
          }
          if (_hashChangedByScript) {
            clearTimeout(_hashChangeTimeout);
          } else {
            _hashChangedByScript = true;
          }
          var pid = _currentItemIndex + 1;
          var item = _getItemAt(_currentItemIndex);
          if (item.hasOwnProperty("pid")) {
            pid = item.pid;
          }
          var newHash = _initialHash + "&gid=" + _options.galleryUID + "&pid=" + pid;
          if (!_historyChanged) {
            if (_windowLoc.hash.indexOf(newHash) === -1) {
              _urlChangedOnce = true;
            }
          }
          var newURL = _windowLoc.href.split("#")[0] + "#" + newHash;
          if (_supportsPushState) {
            if ("#" + newHash !== window.location.hash) {
              history[_historyChanged ? "replaceState" : "pushState"]("", document.title, newURL);
            }
          } else {
            if (_historyChanged) {
              _windowLoc.replace(newURL);
            } else {
              _windowLoc.hash = newHash;
            }
          }
          _historyChanged = true;
          _hashChangeTimeout = setTimeout(function() {
            _hashChangedByScript = false;
          }, 60);
        };
        _registerModule("History", {
          publicMethods: {
            initHistory: function() {
              framework.extend(_options, _historyDefaultOptions, true);
              if (!_options.history) {
                return;
              }
              _windowLoc = window.location;
              _urlChangedOnce = false;
              _closedFromURL = false;
              _historyChanged = false;
              _initialHash = _getHash();
              _supportsPushState = "pushState" in history;
              if (_initialHash.indexOf("gid=") > -1) {
                _initialHash = _initialHash.split("&gid=")[0];
                _initialHash = _initialHash.split("?gid=")[0];
              }
              _listen("afterChange", self.updateURL);
              _listen("unbindEvents", function() {
                framework.unbind(window, "hashchange", self.onHashChange);
              });
              var returnToOriginal = function() {
                _hashReseted = true;
                if (!_closedFromURL) {
                  if (_urlChangedOnce) {
                    history.back();
                  } else {
                    if (_initialHash) {
                      _windowLoc.hash = _initialHash;
                    } else {
                      if (_supportsPushState) {
                        history.pushState("", document.title, _windowLoc.pathname + _windowLoc.search);
                      } else {
                        _windowLoc.hash = "";
                      }
                    }
                  }
                }
                _cleanHistoryTimeouts();
              };
              _listen("unbindEvents", function() {
                if (_closedByScroll) {
                  returnToOriginal();
                }
              });
              _listen("destroy", function() {
                if (!_hashReseted) {
                  returnToOriginal();
                }
              });
              _listen("firstUpdate", function() {
                _currentItemIndex = _parseItemIndexFromURL().pid;
              });
              var index = _initialHash.indexOf("pid=");
              if (index > -1) {
                _initialHash = _initialHash.substring(0, index);
                if (_initialHash.slice(-1) === "&") {
                  _initialHash = _initialHash.slice(0, -1);
                }
              }
              setTimeout(function() {
                if (_isOpen) {
                  framework.bind(window, "hashchange", self.onHashChange);
                }
              }, 40);
            },
            onHashChange: function() {
              if (_getHash() === _initialHash) {
                _closedFromURL = true;
                self.close();
                return;
              }
              if (!_hashChangedByScript) {
                _hashChangedByHistory = true;
                self.goTo(_parseItemIndexFromURL().pid);
                _hashChangedByHistory = false;
              }
            },
            updateURL: function() {
              _cleanHistoryTimeouts();
              if (_hashChangedByHistory) {
                return;
              }
              if (!_historyChanged) {
                _updateHash();
              } else {
                _historyUpdateTimeout = setTimeout(_updateHash, 800);
              }
            }
          }
        });
        framework.extend(self, publicMethods);
      };
      return PhotoSwipe2;
    });
  }
});

// js/helper/Animation.js
var animationQueue = {};
var Animation = class {
  /**
   * Slide up aims to close an element. To do that, we take the height of the element, and set it to 0 to
   * force an animation
   */
  static slideUp(element, callback, propertyToAnimate = "height") {
    element.style[propertyToAnimate] = `${element.scrollHeight}px`;
    element.offsetHeight;
    element.style[propertyToAnimate] = 0;
    if (animationQueue[element.id]) {
      element.removeEventListener("transitionend", animationQueue[element.id]);
      delete animationQueue[element.id];
    }
    const transitionEnded = (event2) => {
      if (event2.propertyName === "height") {
        element.removeEventListener("transitionend", transitionEnded);
        (callback || (() => {
        }))();
      }
    };
    element.addEventListener("transitionend", transitionEnded);
  }
  /**
   * Slide down aims to open an element. To do that, you must make sure that the element you are trying to open
   * is set with height: 0; overflow: hidden in the CSS, and does not contain any padding nor margin.
   */
  static slideDown(element, callback, propertyToAnimate = "height") {
    element.style[propertyToAnimate] = `${element.scrollHeight}px`;
    const transitionEnded = (event2) => {
      if (event2.propertyName === propertyToAnimate) {
        let defaultValue = "auto";
        if (propertyToAnimate === "max-height") {
          defaultValue = "none";
        }
        element.style[propertyToAnimate] = defaultValue;
        element.removeEventListener("transitionend", transitionEnded);
        delete animationQueue[element.id];
        (callback || (() => {
        }))();
      }
    };
    element.addEventListener("transitionend", transitionEnded);
    animationQueue[element.id] = transitionEnded;
  }
};

// js/helper/Dom.js
var Dom = class _Dom {
  /**
   * Get all the previous and next siblings, optionally filtered by a selector
   */
  static getSiblings(element, filter, includeSelf = false) {
    let siblings = [];
    let currentElement = element;
    while (currentElement = currentElement.previousElementSibling) {
      if (!filter || currentElement.matches(filter)) {
        siblings.push(currentElement);
      }
    }
    if (includeSelf) {
      siblings.push(element);
    }
    currentElement = element;
    while (currentElement = currentElement.nextElementSibling) {
      if (!filter || currentElement.matches(filter)) {
        siblings.push(currentElement);
      }
    }
    return siblings;
  }
  static deepQuerySelector(root, selector) {
    let element = root.querySelector(selector);
    if (element) {
      return element;
    }
    for (const template of root.querySelectorAll("template")) {
      element = _Dom.deepQuerySelector(template.content, selector);
      if (element) {
        return element;
      }
    }
    return null;
  }
};

// node_modules/ftdomdelegate/main.js
function Delegate(root) {
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }
  this.handle = Delegate.prototype.handle.bind(this);
  this._removedListeners = [];
}
Delegate.prototype.root = function(root) {
  const listenerMap = this.listenerMap;
  let eventType;
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }
  this.rootElement = root;
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }
  return this;
};
Delegate.prototype.captureForType = function(eventType) {
  return ["blur", "error", "focus", "load", "resize", "scroll"].indexOf(eventType) !== -1;
};
Delegate.prototype.on = function(eventType, selector, handler, useCapture) {
  let root;
  let listenerMap;
  let matcher;
  let matcherParam;
  if (!eventType) {
    throw new TypeError("Invalid event type: " + eventType);
  }
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }
  if (useCapture === void 0) {
    useCapture = this.captureForType(eventType);
  }
  if (typeof handler !== "function") {
    throw new TypeError("Handler must be a type of Function");
  }
  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }
  if (!selector) {
    matcherParam = null;
    matcher = matchesRoot.bind(this);
  } else if (/^[a-z]+$/i.test(selector)) {
    matcherParam = selector;
    matcher = matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = matchesId;
  } else {
    matcherParam = selector;
    matcher = Element.prototype.matches;
  }
  listenerMap[eventType].push({
    selector,
    handler,
    matcher,
    matcherParam
  });
  return this;
};
Delegate.prototype.off = function(eventType, selector, handler, useCapture) {
  let i;
  let listener;
  let listenerMap;
  let listenerList;
  let singleEventType;
  if (typeof selector === "function") {
    useCapture = handler;
    handler = selector;
    selector = null;
  }
  if (useCapture === void 0) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }
  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }
    return this;
  }
  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];
    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      this._removedListeners.push(listener);
      listenerList.splice(i, 1);
    }
  }
  if (!listenerList.length) {
    delete listenerMap[eventType];
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }
  return this;
};
Delegate.prototype.handle = function(event2) {
  let i;
  let l;
  const type = event2.type;
  let root;
  let phase;
  let listener;
  let returned;
  let listenerList = [];
  let target;
  const eventIgnore = "ftLabsDelegateIgnore";
  if (event2[eventIgnore] === true) {
    return;
  }
  target = event2.target;
  if (target.nodeType === 3) {
    target = target.parentNode;
  }
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }
  root = this.rootElement;
  phase = event2.eventPhase || (event2.target !== event2.currentTarget ? 3 : 2);
  switch (phase) {
    case 1:
      listenerList = this.listenerMap[1][type];
      break;
    case 2:
      if (this.listenerMap[0] && this.listenerMap[0][type]) {
        listenerList = listenerList.concat(this.listenerMap[0][type]);
      }
      if (this.listenerMap[1] && this.listenerMap[1][type]) {
        listenerList = listenerList.concat(this.listenerMap[1][type]);
      }
      break;
    case 3:
      listenerList = this.listenerMap[0][type];
      break;
  }
  let toFire = [];
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];
      if (!listener) {
        break;
      }
      if (target.tagName && ["button", "input", "select", "textarea"].indexOf(target.tagName.toLowerCase()) > -1 && target.hasAttribute("disabled")) {
        toFire = [];
      } else if (listener.matcher.call(target, listener.matcherParam, target)) {
        toFire.push([event2, target, listener]);
      }
    }
    if (target === root) {
      break;
    }
    l = listenerList.length;
    target = target.parentElement || target.parentNode;
    if (target instanceof HTMLDocument) {
      break;
    }
  }
  let ret;
  for (i = 0; i < toFire.length; i++) {
    if (this._removedListeners.indexOf(toFire[i][2]) > -1) {
      continue;
    }
    returned = this.fire.apply(this, toFire[i]);
    if (returned === false) {
      toFire[i][0][eventIgnore] = true;
      toFire[i][0].preventDefault();
      ret = false;
      break;
    }
  }
  return ret;
};
Delegate.prototype.fire = function(event2, target, listener) {
  return listener.handler.call(target, event2, target);
};
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}
function matchesRoot(selector, element) {
  if (this.rootElement === window) {
    return (
      // Match the outer document (dispatched from document)
      element === document || // The <html> element (dispatched from document.body or document.documentElement)
      element === document.documentElement || // Or the window itself (dispatched from window)
      element === window
    );
  }
  return this.rootElement === element;
}
function matchesId(id, element) {
  return id === element.id;
}
Delegate.prototype.destroy = function() {
  this.off();
  this.root();
};
var main_default = Delegate;

// js/components/CollapsibleManager.js
var CollapsibleManager = class {
  constructor() {
    this.domDelegate = new main_default(document.body);
    this._attachListeners();
  }
  _attachListeners() {
    this.domDelegate.on("click", '[data-action="toggle-collapsible"]:not([disabled])', this._toggleCollapsible.bind(this));
    document.addEventListener("collapsible:toggle", this._toggleCollapsible.bind(this));
  }
  /**
   * Toggle a given collapsible
   */
  _toggleCollapsible(event2, target) {
    if (!target && event2.detail) {
      target = document.querySelector(`[aria-controls="${event2.detail.id}"]`);
    }
    const isOpen = target.getAttribute("aria-expanded") === "true", parentCollapsible = target.parentNode;
    if (isOpen) {
      this._close(parentCollapsible);
    } else {
      this._open(parentCollapsible);
    }
    if (target.getAttribute("data-close-siblings") !== "false") {
      Dom.getSiblings(parentCollapsible).forEach((collapsibleToClose) => this._close(collapsibleToClose));
    }
  }
  /**
   * Open a given collapsible
   */
  _open(collapsible) {
    let toggleButton = collapsible.querySelector("[aria-controls]");
    if (!toggleButton || toggleButton.getAttribute("aria-expanded") === "true") {
      return;
    }
    let collapsibleContent = collapsible.querySelector(`#${toggleButton.getAttribute("aria-controls")}`);
    toggleButton.setAttribute("aria-expanded", "true");
    if (collapsibleContent.hasAttribute("aria-hidden")) {
      collapsibleContent.setAttribute("aria-hidden", "false");
    }
    Animation.slideDown(collapsibleContent, () => {
      if (toggleButton.hasAttribute("data-collapsible-force-overflow")) {
        collapsibleContent.style.overflow = "visible";
      }
      let autofocusElement = collapsibleContent.querySelector("[autofocus]");
      if (autofocusElement) {
        autofocusElement.focus();
      }
    });
  }
  /**
   * Close a given collapsible
   */
  _close(collapsible) {
    let toggleButton = collapsible.querySelector("[aria-controls]");
    if (!toggleButton || toggleButton.getAttribute("aria-expanded") === "false") {
      return;
    }
    let collapsibleContent = collapsible.querySelector(`#${toggleButton.getAttribute("aria-controls")}`);
    if (toggleButton.hasAttribute("data-collapsible-force-overflow")) {
      collapsibleContent.style.overflow = "hidden";
    }
    if (collapsibleContent.hasAttribute("aria-hidden")) {
      collapsibleContent.setAttribute("aria-hidden", "true");
    }
    toggleButton.setAttribute("aria-expanded", "false");
    Animation.slideUp(collapsibleContent);
  }
};

// js/components/CountrySelector.js
var CountrySelector = class {
  constructor(countrySelect, provinceSelect) {
    this.countrySelect = countrySelect;
    this.provinceSelect = provinceSelect;
    if (this.countrySelect && this.provinceSelect) {
      this._attachListeners();
      this._initSelectors();
    }
  }
  destroy() {
    if (this.countrySelect) {
      this.countrySelect.removeEventListener("change", this._onCountryChangedListener);
    }
  }
  _initSelectors() {
    const defaultCountry = this.countrySelect.getAttribute("data-default");
    if (defaultCountry) {
      for (let i = 0; i !== this.countrySelect.options.length; ++i) {
        if (this.countrySelect.options[i].text === defaultCountry) {
          this.countrySelect.selectedIndex = i;
          break;
        }
      }
    } else {
      this.countrySelect.selectedIndex = 0;
    }
    let event2 = new Event("change", { bubbles: true });
    this.countrySelect.dispatchEvent(event2);
    const defaultProvince = this.provinceSelect.getAttribute("data-default");
    if (defaultProvince) {
      for (let i = 0; i !== this.provinceSelect.options.length; ++i) {
        if (this.provinceSelect.options[i].text === defaultProvince) {
          this.provinceSelect.selectedIndex = i;
          break;
        }
      }
    }
  }
  _attachListeners() {
    this._onCountryChangedListener = this._onCountryChanged.bind(this);
    this.countrySelect.addEventListener("change", this._onCountryChangedListener);
  }
  _onCountryChanged() {
    const selectedOption = this.countrySelect.options[this.countrySelect.selectedIndex];
    if (!selectedOption) {
      return;
    }
    let provinces = JSON.parse(selectedOption.getAttribute("data-provinces") || "[]");
    this.provinceSelect.innerHTML = "";
    if (provinces.length === 0) {
      this.provinceSelect.closest(".form__input-wrapper").style.display = "none";
      return;
    }
    provinces.forEach((data) => {
      this.provinceSelect.options.add(new Option(data[1], data[0]));
    });
    this.provinceSelect.closest(".form__input-wrapper").style.display = "block";
  }
};

// js/helper/Responsive.js
var Responsive = class {
  static matchesBreakpoint(breakpoint) {
    switch (breakpoint) {
      case "phone":
        return window.matchMedia("screen and (max-width: 640px)").matches;
      case "tablet":
        return window.matchMedia("screen and (min-width: 641px) and (max-width: 1023px)").matches;
      case "tablet-and-up":
        return window.matchMedia("screen and (min-width: 641px)").matches;
      case "pocket":
        return window.matchMedia("screen and (max-width: 1023px)").matches;
      case "lap":
        return window.matchMedia("screen and (min-width: 1024px) and (max-width: 1279px)").matches;
      case "lap-and-up":
        return window.matchMedia("screen and (min-width: 1024px)").matches;
      case "desk":
        return window.matchMedia("screen and (min-width: 1280px)").matches;
      case "widescreen":
        return window.matchMedia("screen and (min-width: 1440px)").matches;
      case "supports-hover":
        return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    }
  }
  static getCurrentBreakpoint() {
    if (window.matchMedia("screen and (max-width: 640px)").matches) {
      return "phone";
    }
    if (window.matchMedia("screen and (min-width: 641px) and (max-width: 1023px)").matches) {
      return "tablet";
    }
    if (window.matchMedia("screen and (min-width: 1024px) and (max-width: 1279px)").matches) {
      return "lap";
    }
    if (window.matchMedia("screen and (min-width: 1280px)").matches) {
      return "desk";
    }
  }
};

// js/components/DesktopNavigation.js
var DesktopNavigation = class {
  constructor(element, navigationLayout, openTrigger) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.delegateRoot = new main_default(document.documentElement);
    this.useInlineNavigation = navigationLayout === "inline";
    this.isNavigationVisible = this.useInlineNavigation;
    this.openTrigger = openTrigger;
    if (!Responsive.matchesBreakpoint("supports-hover")) {
      this.openTrigger = "click";
    }
    this.openItems = [];
    this.dropdownActivationTimeouts = {};
    this.dropdownDeactivationTimeouts = {};
    this.DROPDOWN_TIMEOUT = 100;
    this._attachListeners();
    if (this.useInlineNavigation) {
      this._setupInlineNavigation();
    }
  }
  destroy() {
    this.delegateElement.off();
    this.delegateRoot.off();
  }
  onBlockSelect(event2) {
    if (!this.useInlineNavigation) {
      this._openNavigation();
    }
    Dom.getSiblings(event2.target.parentNode, ".is-dropdown-open").forEach((openItem) => {
      this._deactivateDropdown(event2, openItem.querySelector('[data-type="menuitem"][aria-haspopup]'));
    });
    this._activateDropdown(event2, event2.target.previousElementSibling);
  }
  onBlockDeselect(event2) {
    if (!this.useInlineNavigation) {
      this._closeNavigation();
    }
    this._deactivateDropdown(event2, event2.target.parentNode);
  }
  _attachListeners() {
    this.delegateElement.on("focusout", this._onFocusOut.bind(this));
    this.delegateRoot.on("click", this._onClick.bind(this));
    this.delegateElement.on("click", '[data-action="toggle-menu"]', this._toggleNavigation.bind(this));
    if (this.openTrigger === "hover") {
      this.delegateElement.on("focusin", '[data-type="menuitem"][aria-haspopup]', this._activateDropdown.bind(this));
      this.delegateElement.on("mouseover", '[data-type="menuitem"][aria-haspopup]', this._activateDropdown.bind(this));
      this.delegateElement.on("mouseover", '[data-type="menu"][aria-hidden="false"]', this._blockDropdownDeactivation.bind(this));
      this.delegateElement.on("focusout", ".is-dropdown-open", this._deactivateDropdown.bind(this));
      this.delegateElement.on("mouseout", ".is-dropdown-open", this._deactivateDropdown.bind(this));
    } else {
      this.delegateElement.on("click", '[data-type="menuitem"][aria-haspopup]', this._toggleDropdown.bind(this));
    }
  }
  /**
   * When the whole menu looses focus, it's automatically closed (in the case of condensed menu)
   */
  _onFocusOut(event2) {
    if (event2.relatedTarget !== null && !this.element.contains(event2.relatedTarget)) {
      this._closeNavigation();
    }
  }
  /**
   * We need to catch click outside the element to automatically close menu
   */
  _onClick(event2) {
    if (!this.element.contains(event2.target)) {
      this._closeNavigation();
    }
  }
  /**
   * Open the navigation (really make sense for condensed menu-
   */
  _openNavigation() {
    if (this.useInlineNavigation) {
      return;
    }
    this.element.querySelector('[data-action="toggle-menu"]').setAttribute("aria-expanded", "true");
    this.element.querySelector('[data-type="menu"]').setAttribute("aria-hidden", "false");
    this.isNavigationVisible = true;
  }
  /**
   * Close the navigation (really make sense for condensed menu)
   */
  _closeNavigation() {
    if (!this.useInlineNavigation) {
      this.element.querySelector('[data-action="toggle-menu"]').setAttribute("aria-expanded", "false");
      this.element.querySelector('[data-type="menu"]').setAttribute("aria-hidden", "true");
    }
    this.isNavigationVisible = false;
    if (this.openTrigger === "click") {
      let cloneOpenItems = this.openItems.slice(0);
      cloneOpenItems.forEach((item) => {
        this._deactivateDropdown(event, item);
      });
    }
  }
  /**
   * Toggle navigation
   */
  _toggleNavigation(event2) {
    if (this.isNavigationVisible) {
      this._closeNavigation();
    } else {
      this._openNavigation();
    }
  }
  /**
   * Toggle a dropdown
   */
  _toggleDropdown(event2, target) {
    if (target.getAttribute("aria-expanded") === "false") {
      event2.preventDefault();
    }
    if (target.getAttribute("aria-expanded") === "true") {
      if (target.getAttribute("href") === "#") {
        event2.preventDefault();
        this._deactivateDropdown(event2, target.closest(".is-dropdown-open"));
      }
    } else {
      this._activateDropdown(event2, target);
    }
  }
  /**
   * Open a dropdown menu
   */
  _activateDropdown(event2, target) {
    if (this.openTrigger === "click") {
      let cloneOpenItems = this.openItems.slice(0);
      cloneOpenItems.forEach((item) => {
        if (!item.contains(target)) {
          this._deactivateDropdown(event2, item);
        }
      });
    }
    let menuToOpen = Dom.getSiblings(target, "[aria-hidden]")[0];
    let callback = () => {
      target.setAttribute("aria-expanded", "true");
      target.parentNode.classList.add("is-dropdown-open");
      menuToOpen.setAttribute("aria-hidden", "false");
      if (this.openTrigger === "hover" && this.dropdownDeactivationTimeouts[menuToOpen.id]) {
        clearTimeout(this.dropdownDeactivationTimeouts[menuToOpen.id]);
        delete this.dropdownDeactivationTimeouts[menuToOpen.id];
      }
      if (this.useInlineNavigation) {
        let windowWidth = window.innerWidth, shouldOpenLeft = false;
        menuToOpen.querySelectorAll(".nav-dropdown").forEach((subSubMenu) => {
          if (subSubMenu.getBoundingClientRect().right > windowWidth) {
            shouldOpenLeft = true;
          }
        });
        if (shouldOpenLeft) {
          menuToOpen.classList.add("nav-dropdown--inverse");
        }
      }
      target.closest('[data-type="menu"]').classList.add("nav-dropdown--glued");
      if (menuToOpen.classList.contains("mega-menu")) {
        this._setupMegaMenu(menuToOpen);
      }
      if (this.openTrigger === "click") {
        this.openItems.push(target.parentNode);
      }
    };
    if (this.openTrigger === "click") {
      callback();
    } else {
      for (let toDeactivate in this.dropdownActivationTimeouts) {
        if (this.dropdownActivationTimeouts.hasOwnProperty(toDeactivate)) {
          clearTimeout(this.dropdownActivationTimeouts[toDeactivate]);
          delete this.dropdownActivationTimeouts[toDeactivate];
        }
      }
      callback();
    }
  }
  /**
   * Close a dropdown menu
   */
  _deactivateDropdown(event2, target) {
    if (this.openTrigger === "hover" && target.contains(event2.relatedTarget)) {
      return;
    }
    let menuToClose = target.querySelector("[aria-hidden]");
    let callback = () => {
      target.classList.remove("is-dropdown-open");
      target.querySelector('[data-type="menuitem"]').setAttribute("aria-expanded", "false");
      let menuToClose2 = target.querySelector("[aria-hidden]");
      menuToClose2.setAttribute("aria-hidden", "true");
      target.closest('[data-type="menu"]').classList.remove("nav-dropdown--glued");
      if (this.openTrigger === "click") {
        target.querySelectorAll(".is-dropdown-open").forEach((item) => {
          this._deactivateDropdown(event2, item);
          let index2 = this.openItems.indexOf(item);
          if (index2 > -1) {
            this.openItems.splice(index2, 1);
          }
        });
        let index = this.openItems.indexOf(target);
        if (index > -1) {
          this.openItems.splice(index, 1);
        }
      }
    };
    if (this.openTrigger === "click") {
      callback();
    } else {
      this.dropdownDeactivationTimeouts[menuToClose.id] = setTimeout(() => {
        callback();
        delete this.dropdownDeactivationTimeouts[menuToClose.id];
      }, this.DROPDOWN_TIMEOUT);
    }
  }
  /**
   * This method allows to block the dropdown deactivation if the mouse is back on the element. This may happen for
   * instance when the customer does a kind of diagonal movement to the menu. While the mouse may leave the opening
   * item, we want the item to stay open
   */
  _blockDropdownDeactivation(event2, target) {
    if (this.dropdownDeactivationTimeouts[target.id] !== void 0) {
      clearTimeout(this.dropdownDeactivationTimeouts[target.id]);
      delete this.dropdownDeactivationTimeouts[target.id];
      for (let toDeactivate in this.dropdownActivationTimeouts) {
        if (this.dropdownActivationTimeouts.hasOwnProperty(toDeactivate)) {
          clearTimeout(this.dropdownActivationTimeouts[toDeactivate]);
          delete this.dropdownActivationTimeouts[toDeactivate];
        }
      }
    }
  }
  /**
   * Set the maximum width allowed for the given mega-menu. For the inline style, it is always full width so nothing to do
   */
  _setupMegaMenu(megaMenu) {
    if (!this.useInlineNavigation) {
      let navDropdownWidth = megaMenu.closest(".nav-dropdown").clientWidth;
      megaMenu.style.maxWidth = Math.min(1400 - navDropdownWidth, parseInt(window.innerWidth - navDropdownWidth - 80)) + "px";
    }
  }
  /**
   * Fix inline navigation
   */
  _setupInlineNavigation() {
    this.element.querySelectorAll(".mega-menu").forEach((megaMenu) => {
      megaMenu.closest(".nav-bar__item").classList.add("nav-bar__item--static");
    });
    if ("MutationObserver" in window) {
      this.dropdownMenuObserver = new MutationObserver((mutationList) => {
        mutationList.forEach((mutation) => {
          if (mutation.target.getAttribute("aria-hidden") === "false") {
            mutation.target.style.setProperty("--distance-to-top", `${mutation.target.getBoundingClientRect().top}px`);
          }
        });
      });
      this.element.querySelectorAll(".nav-dropdown .nav-dropdown").forEach((item) => {
        this.dropdownMenuObserver.observe(item, { attributes: true, attributeFilter: ["aria-hidden"] });
      });
    }
  }
};

// js/components/CollectionFilterDrawer.js
var CollectionFilterDrawer = class {
  constructor(options) {
    this.element = document.getElementById("mobile-collection-filters");
    this.delegateRoot = new main_default(document.documentElement);
    this.options = options;
    this.isOpen = false;
    if (this.element) {
      this._attachListeners();
    }
  }
  destroy() {
    this.delegateRoot.off();
  }
  _attachListeners() {
    this.delegateRoot.on("click", '[aria-controls="mobile-collection-filters"][data-action="open-drawer"]', this.open.bind(this));
    this.delegateRoot.on("click", `#mobile-collection-filters [data-action="close-drawer"]`, this.close.bind(this));
    document.addEventListener("collection-filter:close", this.close.bind(this));
    document.addEventListener("click", this._detectOutsideClick.bind(this));
    window.addEventListener("resize", this._computeDrawerHeight.bind(this));
  }
  open(event2) {
    if (event2) {
      event2.stopPropagation();
    }
    this._computeDrawerHeight();
    this.isOpen = true;
    document.querySelector('[aria-controls="mobile-collection-filters"]').setAttribute("aria-expanded", "true");
    document.getElementById("mobile-collection-filters").setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
  }
  close(event2) {
    if (event2) {
      event2.stopPropagation();
    }
    this.isOpen = false;
    document.querySelector('[aria-controls="mobile-collection-filters"]').setAttribute("aria-expanded", "false");
    document.getElementById("mobile-collection-filters").setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("is-locked");
  }
  _computeDrawerHeight() {
    document.getElementById("mobile-collection-filters").querySelector(".collection-drawer").style.maxHeight = `${window.innerHeight}px`;
  }
  _detectOutsideClick(event2) {
    if (this.isOpen && !event2.target.closest(".collection-drawer__inner")) {
      this.close();
    }
  }
};

// js/components/ExitPopup.js
var ExitPopup = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.rootDelegateElement = new main_default(document.body);
    this.options = JSON.parse(element.getAttribute("data-popup-settings"));
    this.hasOpenOnceInCurrentPage = false;
    try {
      if (window.location.hash === "#exit-popup" && window.theme.pageType !== "captcha") {
        this._openPopup();
      }
    } catch (error) {
    }
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off();
  }
  _attachListeners() {
    this._onKeyPressedListener = this._onKeyPressed.bind(this);
    if (!Responsive.matchesBreakpoint("supports-hover")) {
      return;
    }
    this.delegateElement.on("click", '[data-action="close-popup"]', this._closePopup.bind(this));
    document.body.addEventListener("mouseleave", () => {
      if (!this.hasOpenOnceInCurrentPage) {
        if (!this.options["showOnlyOnce"] || this.options["showOnlyOnce"] && localStorage.getItem("themeExitPopup") === null) {
          this._openPopup();
        }
      }
    });
    this._clickOutsideListener = this._checkClickOutside.bind(this);
  }
  _openPopup() {
    if (!window.theme.isNewsletterPopupOpen) {
      this.element.setAttribute("aria-hidden", "false");
      localStorage.setItem("themeExitPopup", "true");
      this.hasOpenOnceInCurrentPage = true;
      window.theme.isExitPopupOpen = true;
      this.delegateElement.on("click", this._clickOutsideListener);
      this.rootDelegateElement.on("keyup", this._onKeyPressedListener);
    }
  }
  _closePopup() {
    this.element.setAttribute("aria-hidden", "true");
    window.theme.isExitPopupOpen = false;
    this.delegateElement.off("click", this._clickOutsideListener);
    this.rootDelegateElement.off("keyup", this._onKeyPressedListener);
  }
  _checkClickOutside(event2) {
    if (!this.element.contains(event2.target) || this.element === event2.target) {
      this._closePopup();
    }
  }
  _onKeyPressed(event2) {
    if (event2.key === "Escape") {
      this._closePopup();
    }
  }
};

// js/components/LoadingBar.js
var LoadingBar = class {
  constructor() {
    this.element = document.querySelector(".loading-bar");
    if (this.element) {
      document.addEventListener("theme:loading:start", this._onLoadingStart.bind(this));
      document.addEventListener("theme:loading:end", this._onLoadingEnd.bind(this));
      this.element.addEventListener("transitionend", this._onTransitionEnd.bind(this));
    }
  }
  _onLoadingStart() {
    this.element.classList.add("is-visible");
    this.element.style.transform = "scaleX(0.4)";
  }
  _onLoadingEnd() {
    this.element.style.transform = "scaleX(1)";
    this.element.classList.add("is-finished");
  }
  _onTransitionEnd(event2) {
    if (event2.propertyName === "transform" && this.element.classList.contains("is-finished")) {
      this.element.classList.remove("is-visible");
      this.element.classList.remove("is-finished");
      this.element.style.transform = "scaleX(0)";
    }
  }
};

// js/helper/Accessibility.js
var Accessibility = class {
  /**
   * Traps the focus in a particular container
   */
  static trapFocus(container, namespace) {
    this.listeners = this.listeners || {};
    let elementToFocus = container.querySelector("[autofocus]") || container;
    container.setAttribute("tabindex", "-1");
    elementToFocus.focus();
    this.listeners[namespace] = (event2) => {
      if (container !== event2.target && !container.contains(event2.target)) {
        elementToFocus.focus();
      }
    };
    document.addEventListener("focusin", this.listeners[namespace]);
  }
  /**
   * Removes the trap of focus in a particular container
   */
  static removeTrapFocus(container, namespace) {
    if (container) {
      container.removeAttribute("tabindex");
    }
    document.removeEventListener("focusin", this.listeners[namespace]);
  }
  /**
   * Reset any previous trap focus
   */
  static clearTrapFocus() {
    for (let key in this.listeners) {
      if (this.listeners.hasOwnProperty(key)) {
        document.removeEventListener("focusin", this.listeners[key]);
      }
    }
    this.listeners = {};
  }
};

// js/components/Cart.js
var Cart = class {
  constructor(element, options) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.delegateRoot = new main_default(document.documentElement);
    this.options = options;
    if (!this.element) {
      return;
    }
    this.miniCartElement = this.element.querySelector(".mini-cart");
    this.isMiniCartOpen = false;
    if (window.theme.pageType !== "cart" && this.miniCartElement) {
      this.miniCartToggleElement = this.element.querySelector(`[aria-controls="${this.miniCartElement.id}"]`);
      this._checkMiniCartScrollability();
    }
    this.itemCount = window.theme.cartCount;
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off();
    this.delegateRoot.off();
    window.removeEventListener("resize", this._calculateMiniCartHeightListener);
  }
  _attachListeners() {
    this._calculateMiniCartHeightListener = this._calculateMiniCartHeight.bind(this);
    if (window.theme.pageType !== "cart" && window.theme.cartType !== "page") {
      this.delegateElement.on("click", '[data-action="toggle-mini-cart"]', this._toggleMiniCart.bind(this));
      this.delegateElement.on("keyup", this._checkMiniCartClose.bind(this));
      this.delegateRoot.on("click", this._onWindowClick.bind(this), true);
      window.addEventListener("resize", this._calculateMiniCartHeightListener);
    }
    this.delegateRoot.on("click", '[data-action="decrease-quantity"]', this._updateQuantity.bind(this));
    this.delegateRoot.on("click", '[data-action="increase-quantity"]', this._updateQuantity.bind(this));
    this.delegateRoot.on("change", ".quantity-selector:not(.quantity-selector--product) .quantity-selector__value", this._updateQuantity.bind(this));
    this.delegateRoot.on("keyup", ".quantity-selector:not(.quantity-selector--product) .quantity-selector__value", this._updateQuantitySize.bind(this));
    this.delegateRoot.on("keydown", ".quantity-selector__value", this._blockEnterKey.bind(this));
    this.delegateRoot.on("product:added", this._onProductAdded.bind(this));
    this.delegateRoot.on("cart:refresh", this._onCartRefresh.bind(this));
  }
  _toggleMiniCart(event2) {
    if (event2) {
      event2.preventDefault();
    }
    if (this.isMiniCartOpen) {
      this._closeMiniCart();
    } else {
      this._openMiniCart();
    }
  }
  _openMiniCart() {
    this.miniCartToggleElement.setAttribute("aria-expanded", "true");
    if (Responsive.getCurrentBreakpoint() === "phone") {
      this.miniCartToggleElement.querySelector(".header__cart-icon").setAttribute("aria-expanded", "true");
    }
    this.miniCartElement.setAttribute("aria-hidden", "false");
    this.isMiniCartOpen = true;
    this._calculateMiniCartHeight();
    Accessibility.trapFocus(this.miniCartElement, "mini-cart");
    document.documentElement.classList.add("is-locked");
  }
  _closeMiniCart() {
    this.miniCartToggleElement.setAttribute("aria-expanded", "false");
    if (Responsive.getCurrentBreakpoint() === "phone") {
      this.miniCartToggleElement.querySelector(".header__cart-icon").setAttribute("aria-expanded", "false");
      this.miniCartElement.style.maxHeight = "";
    }
    this.miniCartElement.setAttribute("aria-hidden", "true");
    this.isMiniCartOpen = false;
    document.documentElement.classList.remove("is-locked");
  }
  _checkMiniCartClose(event2) {
    if (!this.isMiniCartOpen) {
      return;
    }
    if (event2.key === "Escape") {
      this._closeMiniCart();
    }
  }
  _calculateMiniCartHeight() {
    if (Responsive.getCurrentBreakpoint() === "phone") {
      if (this.isMiniCartOpen) {
        let headerGroupHeight = 0;
        Array.from(document.querySelectorAll(".shopify-section-group-header-group")).forEach((item) => {
          if (item.classList.contains("shopify-section--announcement-bar") && window.scrollY > item.clientHeight) {
          } else {
            headerGroupHeight += item.clientHeight;
          }
        });
        let maxHeight = window.innerHeight - headerGroupHeight;
        this.miniCartElement.style.maxHeight = `${maxHeight}px`;
        let miniCartContentElement = this.miniCartElement.querySelector(".mini-cart__content"), miniCartRecapElement = this.miniCartElement.querySelector(".mini-cart__recap");
        if (miniCartRecapElement) {
          miniCartContentElement.style.maxHeight = `${maxHeight - miniCartRecapElement.clientHeight}px`;
        }
      } else {
        this.miniCartElement.style.maxHeight = "";
        this.miniCartElement.querySelector(".mini-cart__content").style.maxHeight = "";
      }
    } else {
      this.miniCartElement.style.maxHeight = "";
      this.miniCartElement.querySelector(".mini-cart__content").style.maxHeight = "";
    }
  }
  /**
   * Change the quantity of the cart
   */
  _updateQuantity(event2, target) {
    let parsedQuantity = 1;
    if (target.tagName === "INPUT") {
      parsedQuantity = parseInt(target.value);
    } else {
      parsedQuantity = parseInt(target.getAttribute("data-quantity"));
    }
    document.dispatchEvent(new CustomEvent("theme:loading:start"));
    fetch(`${window.routes.cartChangeUrl}.js`, {
      body: JSON.stringify({
        line: target.getAttribute("data-line"),
        quantity: parsedQuantity
      }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
        // This is needed as currently there is a bug in Shopify that assumes this header
      }
    }).then((response) => {
      if (response.ok) {
        if (theme.pageType === "cart") {
          window.location.reload();
        } else {
          response.json().then((content) => {
            this.itemCount = content["item_count"];
            this._rerender(false).then(() => {
              document.dispatchEvent(new CustomEvent("theme:loading:end"));
            });
          });
        }
      } else {
        response.json().then((content) => {
          let messageElement = document.createElement("div");
          messageElement.className = "cart__status-message cart__status-message--header";
          messageElement.innerHTML = `<div class="alert alert--error"><p class="container">${content["description"]}</p></div>`;
          document.querySelector(".header")?.append(messageElement);
          Animation.slideDown(messageElement);
          setTimeout(function() {
            Animation.slideUp(messageElement, () => {
              messageElement.remove();
            });
          }, 5500);
          this._rerender(false).then(() => {
            document.dispatchEvent(new CustomEvent("theme:loading:end"));
          });
        });
      }
    });
    event2.preventDefault();
  }
  _updateQuantitySize(event2, target) {
    target.style.setProperty("--quantity-input-characters-count", `${target.value.toString().length}ch`);
    target.setAttribute("size", Math.max(target.value.length, 2));
  }
  _blockEnterKey(event2) {
    if (event2.key === "Enter") {
      return false;
    }
  }
  /**
   * This method is called internally to rerender the cart, based on the content returned by Shopify Ajax API.
   * We could save some performance by updating directly in JavaScript instead of doing a GET call to get the HTML
   * from Shopify, but by experience, this allows for easier app integration as it allows the Liquid to re-run
   * all the time and hence having easier logic.
   */
  _rerender(scrollToTop = true) {
    let url = "";
    if (window.theme.pageType !== "cart") {
      url = `${window.routes.cartUrl}?section_id=mini-cart`;
    } else {
      const cartSection = document.querySelector('[data-section-type="cart"]');
      url = `${window.routes.cartUrl}?section_id=${cartSection.getAttribute("data-section-id")}`;
    }
    return fetch(url, {
      credentials: "same-origin",
      method: "GET",
      headers: {
        "Cache-Control": "no-cache"
      }
    }).then((content) => {
      content.text().then((html) => {
        let myDiv = document.createElement("div");
        myDiv.innerHTML = html;
        myDiv = myDiv.firstElementChild;
        if (myDiv.firstElementChild && myDiv.firstElementChild.hasAttribute("data-item-count")) {
          this.itemCount = parseInt(myDiv.firstElementChild.getAttribute("data-item-count"));
        }
        this.element.querySelector(".header__cart-count").textContent = this.itemCount;
        if (window.theme.cartType !== "page") {
          if (window.theme.pageType !== "cart") {
            let tempElement = document.createElement("div");
            tempElement.innerHTML = html;
            let miniCartItemListElement = this.miniCartElement.querySelector(".mini-cart__line-item-list"), scrollPosition = null;
            if (miniCartItemListElement) {
              scrollPosition = miniCartItemListElement.scrollTop;
            }
            this.miniCartElement.innerHTML = tempElement.querySelector(".mini-cart").innerHTML;
            let newMiniCartItemListElement = this.miniCartElement.querySelector(".mini-cart__line-item-list");
            if (newMiniCartItemListElement && scrollPosition !== null) {
              newMiniCartItemListElement.scrollTop = scrollPosition;
            }
            this._checkMiniCartScrollability();
            this._calculateMiniCartHeight();
            this.element.dispatchEvent(new CustomEvent("cart:rerendered"));
          } else {
            let tempElement = document.createElement("div");
            tempElement.innerHTML = html;
            let originalCart = document.querySelector('[data-section-type="cart"]');
            originalCart.innerHTML = tempElement.querySelector('[data-section-type="cart"]').innerHTML;
            if (scrollToTop) {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            this.element.dispatchEvent(new CustomEvent("cart:rerendered", { bubbles: true }));
          }
        }
      });
    });
  }
  /**
   * Check if the mini-cart is scrollable
   */
  _checkMiniCartScrollability() {
    let miniCartItemList = this.miniCartElement.querySelector(".mini-cart__line-item-list");
    if (miniCartItemList && miniCartItemList.scrollHeight > miniCartItemList.clientHeight) {
      miniCartItemList.classList.add("is-scrollable");
    }
  }
  /**
   * This callback is automatically called when a variant has been added, which allows us to open it and re-render
   */
  _onProductAdded(event2) {
    this.itemCount += event2.detail.quantity;
    this._onCartRefresh().then(() => {
      if (window.theme.pageType !== "cart" && event2.detail.productAdded) {
        if (window.theme.cartType === "drawer" && !this.options["useStickyHeader"]) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          window.addEventListener("scrollend", () => this._calculateMiniCartHeight());
        }
        if (window.theme.cartType === "message" && event2.detail.button) {
          const originalMessage = event2.detail.button.innerHTML;
          event2.detail.button.innerHTML = window.languages.productAddedShort;
          setTimeout(() => {
            event2.detail.button.innerHTML = originalMessage;
          }, 1500);
        }
        if (window.theme.pageType !== "cart" && window.theme.cartType === "drawer") {
          this._openMiniCart();
        }
      }
    });
  }
  /**
   * Allows to refresh the mini-cart
   */
  _onCartRefresh(event2) {
    let scrollToTop = true;
    if (event2 && event2.detail) {
      scrollToTop = event2.detail.scrollToTop;
    }
    return this._rerender(scrollToTop).then(() => {
      document.dispatchEvent(new CustomEvent("theme:loading:end"));
    });
  }
  /**
   * We need to catch click outside the element to automatically close mini-cart
   */
  _onWindowClick(event2) {
    if (this.miniCartElement && this.isMiniCartOpen && !this.element.contains(event2.target)) {
      this._closeMiniCart();
    }
  }
};

// js/components/MobileNavigation.js
var MobileNavigation = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.delegateRoot = new main_default(document.documentElement);
    this.mobileMenuElement = this.element.querySelector(".mobile-menu");
    this.mobileMenuToggleElement = this.element.querySelector(`[aria-controls="${this.mobileMenuElement.id}"]`);
    this.isOpen = false;
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off();
    this.delegateRoot.off();
    window.removeEventListener("resize", this._calculatMaxHeightListener);
  }
  _attachListeners() {
    this._calculatMaxHeightListener = this._calculateMaxHeight.bind(this);
    this.delegateElement.on("click", '[data-action="toggle-menu"]', this._toggleMenu.bind(this));
    this.delegateElement.on("click", '[data-action="open-panel"]', this._openPanel.bind(this));
    this.delegateElement.on("click", '[data-action="close-panel"]', this._closePanel.bind(this));
    this.delegateRoot.on("click", this._onWindowClick.bind(this));
    window.addEventListener("resize", this._calculatMaxHeightListener);
  }
  _toggleMenu() {
    this.isOpen = !this.isOpen;
    this.mobileMenuToggleElement.setAttribute("aria-expanded", this.isOpen ? "true" : "false");
    this.mobileMenuElement.setAttribute("aria-hidden", this.isOpen ? "false" : "true");
    if (!this.isOpen) {
      this.mobileMenuElement.style.maxHeight = "";
      this.element.querySelectorAll(".mobile-menu__panel.is-open").forEach((item) => {
        item.classList.remove("is-open");
      });
      document.documentElement.classList.remove("is-locked");
    } else {
      this._calculateMaxHeight();
      document.documentElement.classList.add("is-locked");
    }
  }
  _openPanel(event2, target) {
    target.setAttribute("aria-expanded", "true");
    this.element.querySelector(`#${target.getAttribute("aria-controls")}`).classList.add("is-open");
  }
  _closePanel(event2, target) {
    let panelToClose = target.closest(".mobile-menu__panel.is-open");
    panelToClose.classList.remove("is-open");
    this.element.querySelector(`[aria-controls="${panelToClose.id}"]`).setAttribute("aria-expanded", "false");
  }
  _calculateMaxHeight() {
    if (this.isOpen) {
      const headerBottom = document.querySelector(".header").getBoundingClientRect().bottom;
      const bottomNav = document.querySelector(".mobile-bottom-nav");
      const bottomNavHeight = bottomNav ? bottomNav.offsetHeight : 0;
      this.mobileMenuElement.style.maxHeight = `${window.innerHeight - headerBottom - bottomNavHeight}px`;
    }
  }
  _onWindowClick(event2) {
    if (this.isOpen && !this.element.contains(event2.target)) {
      this._toggleMenu();
    }
  }
};

// js/components/ModalManager.js
var ModalManager = class {
  constructor() {
    this.domDelegate = new main_default(document.body);
    this.activeModalsQueue = [];
    let activeModal = document.querySelector('.modal[aria-hidden="false"]');
    if (activeModal) {
      this.activeModalsQueue.push(activeModal);
    }
    this._attachListeners();
  }
  _attachListeners() {
    this._onKeyPressedListener = this._onKeyPressed.bind(this);
    this.domDelegate.on("click", '[data-action="open-modal"]', this._openModal.bind(this));
    this.domDelegate.on("click", '[data-action="close-modal"]', this._closeModal.bind(this));
    document.addEventListener("modal:close", this._closeModal.bind(this));
    this._clickOutsideListener = this._checkClickOutside.bind(this);
    if (this.activeModalsQueue.length > 0) {
      document.documentElement.classList.add("is-locked");
      this.domDelegate.on("click", this._clickOutsideListener);
    }
  }
  _openModal(event2, target) {
    let modal = document.querySelector(`#${target.getAttribute("aria-controls")}`);
    if (modal) {
      if (modal.tagName === "DIALOG") {
        modal.showModal();
        this.activeModalsQueue.push(modal);
        modal.setAttribute("aria-hidden", "false");
      } else {
        let onOpen = (event3) => {
          if (event3.propertyName === "visibility") {
            modal.removeEventListener("transitionend", onOpen);
            Accessibility.trapFocus(modal, "modal" + modal.id);
            this.activeModalsQueue.push(modal);
          }
        };
        modal.addEventListener("transitionend", onOpen);
        modal.setAttribute("aria-hidden", "false");
      }
      document.documentElement.classList.add("is-locked");
      this.domDelegate.on("click", this._clickOutsideListener);
      this.domDelegate.on("keyup", this._onKeyPressedListener);
      return false;
    }
  }
  _closeModal() {
    if (this.activeModalsQueue.length > 0) {
      let modalToClose = this.activeModalsQueue.pop();
      if (modalToClose.tagName === "DIALOG") {
        modalToClose.close();
        modalToClose.setAttribute("aria-hidden", "true");
      } else {
        let onClose = (event2) => {
          if (event2.propertyName === "visibility") {
            modalToClose.removeEventListener("transitionend", onClose);
            Accessibility.removeTrapFocus(modalToClose, "modal" + modalToClose.id);
            modalToClose.dispatchEvent(new CustomEvent("modal:closed"));
          }
        };
        modalToClose.addEventListener("transitionend", onClose);
        modalToClose.setAttribute("aria-hidden", "true");
      }
      document.documentElement.classList.remove("is-locked");
      this.domDelegate.off("click", this._clickOutsideListener);
      this.domDelegate.off("keyup", this._onKeyPressedListener);
    }
  }
  _checkClickOutside(event2) {
    if (this.activeModalsQueue.length === 0) {
      return;
    }
    let modalToClose = this.activeModalsQueue[this.activeModalsQueue.length - 1];
    if (modalToClose && (!modalToClose.contains(event2.target) || modalToClose === event2.target)) {
      this._closeModal();
    }
  }
  _onKeyPressed(event2) {
    if (event2.key === "Escape") {
      this._closeModal();
    }
  }
};

// js/components/NewsletterPopup.js
var NewsletterPopup = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.rootDelegateElement = new main_default(document.body);
    this.options = JSON.parse(element.getAttribute("data-popup-settings"));
    try {
      if (window.location.hash === "#newsletter-popup" && window.theme.pageType !== "captcha") {
        this._openPopup();
      } else if (!this.options["showOnlyOnce"] || this.options["showOnlyOnce"] && localStorage.getItem("themePopup") === null) {
        setTimeout(this._openPopup.bind(this), this.options["apparitionDelay"] * 1e3);
      }
    } catch (error) {
    }
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off();
  }
  _attachListeners() {
    this._onKeyPressedListener = this._onKeyPressed.bind(this);
    this.delegateElement.on("click", '[data-action="close-popup"]', this._closePopup.bind(this));
    this._clickOutsideListener = this._checkClickOutside.bind(this);
  }
  _openPopup() {
    if (!window.theme.isExitPopupOpen) {
      this.element.setAttribute("aria-hidden", "false");
      localStorage.setItem("themePopup", "true");
      window.theme.isNewsletterPopupOpen = true;
      this.delegateElement.on("click", this._clickOutsideListener);
      this.rootDelegateElement.on("keyup", this._onKeyPressedListener);
    }
  }
  _closePopup() {
    this.element.setAttribute("aria-hidden", "true");
    window.theme.isNewsletterPopupOpen = false;
    this.delegateElement.off("click");
    this.rootDelegateElement.off("keyup", this._onKeyPressedListener);
  }
  _checkClickOutside(event2) {
    if (!this.element.contains(event2.target) || this.element === event2.target) {
      this._closePopup();
    }
  }
  _onKeyPressed(event2) {
    if (event2.key === "Escape") {
      this._closePopup();
    }
  }
};

// js/components/OverflowScroller.js
var import_fastdom = __toESM(require_fastdom());
var OverflowScroller = class {
  constructor(element, options) {
    if (!element) {
      return;
    }
    this.element = element;
    this.options = options;
    this.lastKnownY = window.scrollY;
    this.currentTop = 0;
    this.initialTopOffset = options["offsetTop"] || parseInt(window.getComputedStyle(this.element).top);
    this._attachListeners();
  }
  destroy() {
    window.removeEventListener("scroll", this._checkPositionListener);
  }
  _attachListeners() {
    this._checkPositionListener = this._checkPosition.bind(this);
    window.addEventListener("scroll", this._checkPositionListener);
  }
  _checkPosition() {
    import_fastdom.default.measure(() => {
      let bounds = this.element.getBoundingClientRect(), maxTop = bounds.top + window.scrollY - this.element.offsetTop + this.initialTopOffset, minTop = this.element.clientHeight - window.innerHeight + (this.options["offsetBottom"] || 0);
      if (window.scrollY < this.lastKnownY) {
        this.currentTop -= window.scrollY - this.lastKnownY;
      } else {
        this.currentTop += this.lastKnownY - window.scrollY;
      }
      this.currentTop = Math.min(Math.max(this.currentTop, -minTop), maxTop, this.initialTopOffset);
      this.lastKnownY = window.scrollY;
    });
    import_fastdom.default.mutate(() => {
      this.element.style.top = `${this.currentTop}px`;
    });
  }
};

// js/components/PopoverManager.js
var PopoverManager = class {
  constructor() {
    this.delegateElement = new main_default(document.body);
    this.delegateRoot = new main_default(document.documentElement);
    this.activePopover = null;
    this._attachListeners();
  }
  _attachListeners() {
    this._onLooseFocusListener = this._onLooseFocus.bind(this);
    this.delegateElement.on("click", '[data-action="toggle-popover"]', this._togglePopover.bind(this));
    this.delegateElement.on("click", '[data-action="show-popover-panel"]', this._showPanel.bind(this));
    this.delegateRoot.on("click", this._onWindowClick.bind(this));
    document.addEventListener("popover:close", this._closeActivePopover.bind(this));
    window.addEventListener("resize", this._windowResized.bind(this));
  }
  _togglePopover(event2, target) {
    let hasActivePopover = this.activePopover !== null, previousActivePopoverId = this.activePopover ? this.activePopover.id : null;
    if (target.hasAttribute("data-follow-link") && Responsive.matchesBreakpoint(target.getAttribute("data-follow-link"))) {
      return;
    }
    if (hasActivePopover) {
      this._closeActivePopover();
    }
    if (!hasActivePopover || hasActivePopover && target.getAttribute("aria-controls") !== previousActivePopoverId) {
      this._openPopover(target);
    }
    event2.preventDefault();
  }
  _closeActivePopover() {
    this.activePopover.setAttribute("aria-hidden", "true");
    document.querySelector(`[aria-controls="${this.activePopover.id}"]`).setAttribute("aria-expanded", "false");
    this.activePopover.removeEventListener("focusout", this._onLooseFocusListener);
    this.activePopover = null;
  }
  _openPopover(target) {
    let element = document.getElementById(target.getAttribute("aria-controls"));
    target.setAttribute("aria-expanded", "true");
    element.setAttribute("aria-hidden", "false");
    if (Responsive.getCurrentBreakpoint() === "phone") {
      element.style.height = `${window.innerHeight - document.querySelector(".header").getBoundingClientRect().bottom}px`;
    } else {
      element.style.height = "";
      let panelList = element.querySelector(".popover__panel-list");
      if (panelList) {
        panelList.style.height = `${panelList.clientHeight}px`;
      }
    }
    this.activePopover = element;
    this.activePopover.addEventListener("focusout", this._onLooseFocusListener);
  }
  _showPanel(event2, target) {
    if (!this.activePopover) {
      return;
    }
    let panels = this.activePopover.querySelectorAll(".popover__panel");
    panels.forEach((panel) => {
      if (panel.id === target.getAttribute("aria-controls")) {
        panel.classList.add("is-selected");
        panel.closest(".popover__panel-list").style.height = `${panel.clientHeight}px`;
      } else {
        panel.classList.remove("is-selected");
      }
    });
  }
  _onWindowClick(event2) {
    if (event2.target.getAttribute("data-action") === "toggle-popover" || event2.target.closest('[data-action="toggle-popover"]')) {
      return;
    }
    if (this.activePopover && !this.activePopover.contains(event2.target)) {
      this._closeActivePopover();
    }
  }
  _onLooseFocus(event2) {
    if (this.activePopover && event2.relatedTarget !== null && !this.activePopover.contains(event2.relatedTarget)) {
      this._closeActivePopover();
    }
  }
  _windowResized() {
    if (Responsive.getCurrentBreakpoint() === "phone" && this.activePopover) {
      this.activePopover.style.height = `${window.innerHeight - document.querySelector(".header").getBoundingClientRect().bottom}px`;
    }
  }
};

// js/components/ProductItemColorSwatch.js
var import_fastdom2 = __toESM(require_fastdom());
var ProductItemColorSwatch = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this._attachListeners();
    this.recalculateSwatches();
  }
  destroy() {
    this.delegateElement.off();
    window.removeEventListener("resize", this._recalculateSwatchesListener);
  }
  recalculateSwatches() {
    import_fastdom2.default.measure(() => {
      this.element.querySelectorAll(".product-item__swatch-list").forEach((swatchList) => {
        const currentWidth = swatchList.clientWidth, maxAllowedWidth = parseInt(Math.min(currentWidth, 200));
        const maxFit = Math.floor(maxAllowedWidth / 30);
        import_fastdom2.default.mutate(() => {
          let colorSwatches = swatchList.querySelectorAll(".color-swatch");
          colorSwatches.forEach((colorSwatch, index) => {
            colorSwatch.classList.remove("color-swatch--view-more");
            if (maxFit === index + 1 && maxFit !== colorSwatches.length) {
              colorSwatch.classList.add("color-swatch--view-more");
            }
          });
        });
      });
    });
  }
  _attachListeners() {
    this._recalculateSwatchesListener = this.recalculateSwatches.bind(this);
    this.delegateElement.on("change", ".product-item__swatch-list .color-swatch__radio", this._colorChanged.bind(this));
    window.addEventListener("resize", this._recalculateSwatchesListener);
  }
  _colorChanged(event2, target) {
    const productItem = target.closest(".product-item"), variantUrl = target.getAttribute("data-variant-url");
    productItem.querySelector(".product-item__image-wrapper").setAttribute("href", variantUrl);
    productItem.querySelector(".product-item__title").setAttribute("href", variantUrl);
    let originalImageElement = productItem.querySelector(".product-item__primary-image");
    if (target.hasAttribute("data-image-url") && target.getAttribute("data-media-id") !== originalImageElement.getAttribute("data-media-id")) {
      let newImageElement = document.createElement("img");
      newImageElement.className = "product-item__primary-image";
      newImageElement.setAttribute("data-media-id", target.getAttribute("data-media-id"));
      newImageElement.setAttribute("src", target.getAttribute("data-image-url"));
      originalImageElement.parentNode.style.paddingBottom = `${100 / newImageElement.getAttribute("data-image-aspect-ratio")}%`;
      originalImageElement.parentNode.replaceChild(newImageElement, originalImageElement);
    }
  }
};

// js/components/VariantPicker.js
var CACHE_EVICTION_TIME = 1e3 * 60 * 5;
var _preloadedHtml, _delegate, _intersectionObserver, _form, _selectedVariant, _VariantPicker_instances, getActiveOptionValues_fn, getOptionValuesFromOption_fn, onOptionChanged_fn, onOptionPreload_fn, onIntersection_fn, renderForCombination_fn, createHashKeyForHtml_fn;
var _VariantPicker = class _VariantPicker extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _VariantPicker_instances);
    __privateAdd(this, _delegate, new main_default(document.body));
    __privateAdd(this, _intersectionObserver, new IntersectionObserver(__privateMethod(this, _VariantPicker_instances, onIntersection_fn).bind(this)));
    __privateAdd(this, _form);
    __privateAdd(this, _selectedVariant);
  }
  async connectedCallback() {
    __privateSet(this, _selectedVariant, JSON.parse(this.querySelector("script[data-variant]")?.textContent || "{}"));
    __privateSet(this, _form, document.forms[this.getAttribute("form-id")]);
    __privateGet(this, _delegate).on("change", `input[data-option-position][form="${this.getAttribute("form-id")}"], select[data-option-position][form="${this.getAttribute("form-id")}"]`, __privateMethod(this, _VariantPicker_instances, onOptionChanged_fn).bind(this));
    __privateGet(this, _delegate).on("pointerenter", `input[data-option-position][form="${this.getAttribute("form-id")}"]:not(:checked) + label`, __privateMethod(this, _VariantPicker_instances, onOptionPreload_fn).bind(this), true);
    __privateGet(this, _delegate).on("touchstart", `input[data-option-position][form="${this.getAttribute("form-id")}"]:not(:checked) + label`, __privateMethod(this, _VariantPicker_instances, onOptionPreload_fn).bind(this), true);
    __privateGet(this, _intersectionObserver).observe(this);
  }
  disconnectedCallback() {
    __privateGet(this, _delegate).off();
    __privateGet(this, _intersectionObserver).unobserve(this);
  }
  get selectedVariant() {
    return __privateGet(this, _selectedVariant);
  }
  get productHandle() {
    return this.getAttribute("handle");
  }
  get updateUrl() {
    return this.hasAttribute("update-url");
  }
  /**
   * Select a variant using a list of option values. The list of option values might lead to no variant (for instance)
   * in the case of a combination that does not exist
   */
  async selectCombination({ optionValues, productChange }) {
    const previousVariant = this.selectedVariant;
    const newContent = document.createRange().createContextualFragment(await __privateMethod(this, _VariantPicker_instances, renderForCombination_fn).call(this, optionValues));
    if (!productChange) {
      const newVariantPicker = Dom.deepQuerySelector(newContent, `${this.tagName}[form-id="${this.getAttribute("form-id")}"]`);
      const newVariant = JSON.parse(newVariantPicker.querySelector("script[data-variant]")?.textContent || "{}");
      __privateSet(this, _selectedVariant, newVariant);
      __privateGet(this, _form).id.value = __privateGet(this, _selectedVariant)?.id;
      __privateGet(this, _form).id.dispatchEvent(new Event("change", { bubbles: true }));
      if (this.updateUrl && __privateGet(this, _selectedVariant)?.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("variant", __privateGet(this, _selectedVariant).id);
        window.history.replaceState({ path: newUrl.toString() }, "", newUrl.toString());
      }
      __privateGet(this, _form).dispatchEvent(new CustomEvent("variant:change", {
        bubbles: true,
        detail: {
          formId: __privateGet(this, _form).id,
          variant: __privateGet(this, _selectedVariant),
          previousVariant
        }
      }));
      __privateGet(this, _form).dispatchEvent(new CustomEvent("variant:changed", {
        bubbles: true,
        detail: {
          formId: __privateGet(this, _form).id,
          variant: __privateGet(this, _selectedVariant),
          previousVariant
        }
      }));
    }
    __privateGet(this, _form).dispatchEvent(new CustomEvent("product:rerender", {
      detail: {
        htmlFragment: newContent,
        productChange
      }
    }));
    Shopify?.PaymentButton?.init();
  }
};
_preloadedHtml = new WeakMap();
_delegate = new WeakMap();
_intersectionObserver = new WeakMap();
_form = new WeakMap();
_selectedVariant = new WeakMap();
_VariantPicker_instances = new WeakSet();
/**
 * Get the option values for the active combination
 */
getActiveOptionValues_fn = function() {
  return Array.from(__privateGet(this, _form).elements).filter((item) => item.matches('input[data-option-position]:checked, input[data-option-position][type="hidden"], select[data-option-position]')).sort((a, b) => parseInt(a.getAttribute("data-option-position")) - parseInt(b.getAttribute("data-option-position"))).map((input) => input.value);
};
/**
 * Get the option values for a given input
 */
getOptionValuesFromOption_fn = function(input) {
  const optionValues = [input, ...Array.from(__privateGet(this, _form).elements).filter((item) => item.matches(`input[data-option-position]:not([name="${input.name}"]):checked, input[data-option-position]:not([name="${input.name}"])[type="hidden"], select[data-option-position]`))].sort((a, b) => parseInt(a.getAttribute("data-option-position")) - parseInt(b.getAttribute("data-option-position"))).map((input2) => input2.value);
  return optionValues;
};
onOptionChanged_fn = async function(event2) {
  if (!event2.target.name.includes("option")) {
    return;
  }
  if (event2.target.tagName === "SELECT" && event2.target.selectedOptions[0].hasAttribute("data-update-url")) {
    window.location.href = event2.target.selectedOptions[0].dataset.updateUrl;
  }
  this.selectCombination({
    optionValues: __privateMethod(this, _VariantPicker_instances, getActiveOptionValues_fn).call(this),
    productChange: event2.target.hasAttribute("data-product-url")
  });
};
/**
 * To improve the user experience, we preload a variant whenever the user hovers over a specific option
 */
onOptionPreload_fn = function(event2, target) {
  __privateMethod(this, _VariantPicker_instances, renderForCombination_fn).call(this, __privateMethod(this, _VariantPicker_instances, getOptionValuesFromOption_fn).call(this, target.control));
};
/**
 * When the variant picker is intersecting the viewport, we preload the options to improve the user experience
 * so that switching variants is nearly instant
 */
onIntersection_fn = function(entries) {
  const prerenderOptions = () => {
    Array.from(__privateGet(this, _form).elements).filter((item) => item.matches('input[data-option-position]:not(:checked), input[data-option-position][type="hidden"]')).forEach((input) => {
      __privateMethod(this, _VariantPicker_instances, renderForCombination_fn).call(this, __privateMethod(this, _VariantPicker_instances, getOptionValuesFromOption_fn).call(this, input));
    });
  };
  if (entries[0].isIntersecting) {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(prerenderOptions, { timeout: 2e3 });
    } else {
      prerenderOptions();
    }
  }
};
renderForCombination_fn = async function(optionValues) {
  const optionValuesAsString = optionValues.join(",");
  const hashKey = __privateMethod(this, _VariantPicker_instances, createHashKeyForHtml_fn).call(this, optionValuesAsString);
  let productUrl = `${Shopify.routes.root}products/${this.productHandle}`;
  for (const optionValue of optionValues) {
    const inputForOptionValue = Array.from(__privateGet(this, _form).elements).find((item) => item.matches(`input[value="${optionValue}"]`));
    if (inputForOptionValue?.dataset.productUrl) {
      productUrl = inputForOptionValue.dataset.productUrl;
      break;
    }
  }
  if (!__privateGet(_VariantPicker, _preloadedHtml).has(hashKey)) {
    const sectionQueryParam = this.getAttribute("context") === "quick_buy" ? "" : `&section_id=${this.getAttribute("section-id")}`;
    const promise = new Promise(async (resolve) => {
      resolve(await (await fetch(`${productUrl}?option_values=${optionValuesAsString}${sectionQueryParam}`)).text());
    });
    __privateGet(_VariantPicker, _preloadedHtml).set(hashKey, { htmlPromise: promise, timestamp: Date.now() });
    if (__privateGet(_VariantPicker, _preloadedHtml).size > 100) {
      __privateGet(_VariantPicker, _preloadedHtml).delete(Array.from(__privateGet(_VariantPicker, _preloadedHtml).keys())[0]);
    }
  }
  return __privateGet(_VariantPicker, _preloadedHtml).get(hashKey).htmlPromise;
};
createHashKeyForHtml_fn = function(optionValuesAsString) {
  return `${optionValuesAsString}-${this.getAttribute("section-id")}`;
};
__privateAdd(_VariantPicker, _preloadedHtml, /* @__PURE__ */ new Map());
var VariantPicker = _VariantPicker;
if (!window.customElements.get("variant-picker")) {
  window.customElements.define("variant-picker", VariantPicker);
}

// js/components/ProductModel.js
var ProductModel = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.delegateRoot = new main_default(document.documentElement);
    this._attachListeners();
    let stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css";
    document.head.appendChild(stylesheet);
    window.Shopify.loadFeatures([{
      name: "model-viewer-ui",
      version: "1.0",
      onLoad: this._setupModelViewerUI.bind(this)
    }, {
      name: "shopify-xr",
      version: "1.0"
    }]);
  }
  destroy() {
  }
  _attachListeners() {
    this.element.querySelector("model-viewer").addEventListener("shopify_model_viewer_ui_toggle_play", () => {
      this.element.dispatchEvent(new CustomEvent("model:played", { bubbles: true }));
    });
    this.element.querySelector("model-viewer").addEventListener("shopify_model_viewer_ui_toggle_pause", () => {
      this.element.dispatchEvent(new CustomEvent("model:paused", { bubbles: true }));
    });
  }
  hasBeenSelected(isInitialLoading) {
    if (Responsive.matchesBreakpoint("supports-hover") && !isInitialLoading) {
      this.modelUi.play();
    }
  }
  hasBeenDeselected() {
    this.modelUi.pause();
  }
  _setupModelViewerUI() {
    this.modelElement = this.element.querySelector("model-viewer");
    this.modelUi = new window.Shopify.ModelViewerUI(this.modelElement);
  }
};

// js/components/ProductVideo.js
var ProductVideo = class {
  constructor(element, enableVideoLooping) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.enableVideoLooping = enableVideoLooping;
    this.player = null;
    switch (this.element.getAttribute("data-media-type")) {
      case "video":
        let stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = "https://cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.css";
        document.head.appendChild(stylesheet);
        window.Shopify.loadFeatures([{
          name: "video-ui",
          version: "1.0",
          onLoad: this._setupHtml5Video.bind(this)
        }]);
        break;
      case "external_video":
        this._setupExternalVideo();
        break;
    }
  }
  destroy() {
    if (this.player) {
      this.player.destroy();
    }
  }
  hasBeenSelected(isInitialLoading) {
    if (Responsive.matchesBreakpoint("supports-hover") && !isInitialLoading) {
      this.play();
    }
  }
  hasBeenDeselected() {
    this.pause();
  }
  play() {
    switch (this.element.getAttribute("data-media-type")) {
      case "video":
        this.player.play();
        break;
      case "external_video":
        if (this.element.getAttribute("data-media-host") === "youtube") {
          this.player.playVideo();
        } else {
          this.player.player();
        }
        this.element.focus();
        break;
    }
  }
  pause() {
    switch (this.element.getAttribute("data-media-type")) {
      case "video":
        this.player.pause();
        break;
      case "external_video":
        if (this.element.getAttribute("data-media-host") === "youtube") {
          this.player.pauseVideo();
        } else {
          this.player.pause();
        }
        break;
    }
  }
  _setupHtml5Video() {
    this.player = new Shopify.Plyr(this.element.querySelector("video"), {
      controls: [
        "play",
        "progress",
        "mute",
        "volume",
        "play-large",
        "fullscreen"
      ],
      loop: { active: this.enableVideoLooping },
      hideControlsOnPause: true,
      clickToPlay: true,
      iconUrl: "//cdn.shopify.com/shopifycloud/shopify-plyr/v1.0/shopify-plyr.svg",
      tooltips: {
        controls: false,
        seek: true
      }
    });
    this.player.on("play", () => {
      this.element.dispatchEvent(new CustomEvent("video:played", { bubbles: true }));
    });
    this.player.on("pause", () => {
      this.element.dispatchEvent(new CustomEvent("video:paused", { bubbles: true }));
    });
  }
  _setupExternalVideo() {
    if (this.element.getAttribute("data-media-host") === "youtube") {
      this._loadYouTubeScript().then(this._setupYouTubePlayer.bind(this));
    } else if (this.element.getAttribute("data-media-host") === "vimeo") {
      this._loadVimeoScript().then(this._setupVimeoPlayer.bind(this));
    }
  }
  _setupYouTubePlayer() {
    let playerLoadingInterval = setInterval(() => {
      if (window.YT !== void 0 && window.YT.Player !== void 0) {
        this.player = new YT.Player(this.element.querySelector("iframe"), {
          videoId: this.element.getAttribute("data-video-id"),
          events: {
            onStateChange: (event2) => {
              if (event2.data === 0 && this.enableVideoLooping) {
                event2.target.seekTo(0);
              }
            }
          }
        });
        clearInterval(playerLoadingInterval);
      }
    }, 50);
  }
  _loadYouTubeScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = "//www.youtube.com/iframe_api";
    });
  }
  _setupVimeoPlayer() {
    let playerLoadingInterval = setInterval(() => {
      if (window.Vimeo !== void 0 && window.Vimeo.Player !== void 0) {
        this.player = new Vimeo.Player(this.element.querySelector("iframe"));
        clearInterval(playerLoadingInterval);
      }
    }, 50);
  }
  _loadVimeoScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = "//player.vimeo.com/api/player.js";
    });
  }
};

// js/components/ProductGallery.js
var import_flickity_fade = __toESM(require_flickity_fade());
var import_photoswipe = __toESM(require_photoswipe());

// node_modules/drift-zoom/es/util/dom.js
function _typeof(obj) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
    return typeof obj2;
  } : function(obj2) {
    return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
  }, _typeof(obj);
}
var HAS_DOM_2 = (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) === "object";
function isDOMElement(obj) {
  return HAS_DOM_2 ? obj instanceof HTMLElement : obj && _typeof(obj) === "object" && obj !== null && obj.nodeType === 1 && typeof obj.nodeName === "string";
}
function addClasses(el, classNames) {
  classNames.forEach(function(className) {
    el.classList.add(className);
  });
}
function removeClasses(el, classNames) {
  classNames.forEach(function(className) {
    el.classList.remove(className);
  });
}

// node_modules/drift-zoom/es/injectBaseStylesheet.js
var RULES = ".drift-bounding-box,.drift-zoom-pane{position:absolute;pointer-events:none}@keyframes noop{0%{zoom:1}}@-webkit-keyframes noop{0%{zoom:1}}.drift-zoom-pane.drift-open{display:block}.drift-zoom-pane.drift-closing,.drift-zoom-pane.drift-opening{animation:noop 1ms;-webkit-animation:noop 1ms}.drift-zoom-pane{overflow:hidden;width:100%;height:100%;top:0;left:0}.drift-zoom-pane-loader{display:none}.drift-zoom-pane img{position:absolute;display:block;max-width:none;max-height:none}";
function injectBaseStylesheet() {
  if (document.querySelector(".drift-base-styles")) {
    return;
  }
  var styleEl = document.createElement("style");
  styleEl.type = "text/css";
  styleEl.classList.add("drift-base-styles");
  styleEl.appendChild(document.createTextNode(RULES));
  var head = document.head;
  head.insertBefore(styleEl, head.firstChild);
}

// node_modules/drift-zoom/es/util/throwIfMissing.js
function throwIfMissing() {
  throw new Error("Missing parameter");
}

// node_modules/drift-zoom/es/BoundingBox.js
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
var BoundingBox = /* @__PURE__ */ function() {
  function BoundingBox2(options) {
    _classCallCheck(this, BoundingBox2);
    this.isShowing = false;
    var _options$namespace = options.namespace, namespace = _options$namespace === void 0 ? null : _options$namespace, _options$zoomFactor = options.zoomFactor, zoomFactor = _options$zoomFactor === void 0 ? throwIfMissing() : _options$zoomFactor, _options$containerEl = options.containerEl, containerEl = _options$containerEl === void 0 ? throwIfMissing() : _options$containerEl;
    this.settings = {
      namespace,
      zoomFactor,
      containerEl
    };
    this.openClasses = this._buildClasses("open");
    this._buildElement();
  }
  _createClass(BoundingBox2, [{
    key: "_buildClasses",
    value: function _buildClasses(suffix) {
      var classes = ["drift-".concat(suffix)];
      var ns = this.settings.namespace;
      if (ns) {
        classes.push("".concat(ns, "-").concat(suffix));
      }
      return classes;
    }
  }, {
    key: "_buildElement",
    value: function _buildElement() {
      this.el = document.createElement("div");
      addClasses(this.el, this._buildClasses("bounding-box"));
    }
  }, {
    key: "show",
    value: function show(zoomPaneWidth, zoomPaneHeight) {
      this.isShowing = true;
      this.settings.containerEl.appendChild(this.el);
      var style = this.el.style;
      style.width = "".concat(Math.round(zoomPaneWidth / this.settings.zoomFactor), "px");
      style.height = "".concat(Math.round(zoomPaneHeight / this.settings.zoomFactor), "px");
      addClasses(this.el, this.openClasses);
    }
  }, {
    key: "hide",
    value: function hide() {
      if (this.isShowing) {
        this.settings.containerEl.removeChild(this.el);
      }
      this.isShowing = false;
      removeClasses(this.el, this.openClasses);
    }
  }, {
    key: "setPosition",
    value: function setPosition(percentageOffsetX, percentageOffsetY, triggerRect) {
      var pageXOffset = window.pageXOffset;
      var pageYOffset = window.pageYOffset;
      var inlineLeft = triggerRect.left + percentageOffsetX * triggerRect.width - this.el.clientWidth / 2 + pageXOffset;
      var inlineTop = triggerRect.top + percentageOffsetY * triggerRect.height - this.el.clientHeight / 2 + pageYOffset;
      if (inlineLeft < triggerRect.left + pageXOffset) {
        inlineLeft = triggerRect.left + pageXOffset;
      } else if (inlineLeft + this.el.clientWidth > triggerRect.left + triggerRect.width + pageXOffset) {
        inlineLeft = triggerRect.left + triggerRect.width - this.el.clientWidth + pageXOffset;
      }
      if (inlineTop < triggerRect.top + pageYOffset) {
        inlineTop = triggerRect.top + pageYOffset;
      } else if (inlineTop + this.el.clientHeight > triggerRect.top + triggerRect.height + pageYOffset) {
        inlineTop = triggerRect.top + triggerRect.height - this.el.clientHeight + pageYOffset;
      }
      this.el.style.left = "".concat(inlineLeft, "px");
      this.el.style.top = "".concat(inlineTop, "px");
    }
  }]);
  return BoundingBox2;
}();

// node_modules/drift-zoom/es/Trigger.js
function _classCallCheck2(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties2(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass2(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties2(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties2(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
var Trigger = /* @__PURE__ */ function() {
  function Trigger2() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _classCallCheck2(this, Trigger2);
    this._show = this._show.bind(this);
    this._hide = this._hide.bind(this);
    this._handleEntry = this._handleEntry.bind(this);
    this._handleMovement = this._handleMovement.bind(this);
    var _options$el = options.el, el = _options$el === void 0 ? throwIfMissing() : _options$el, _options$zoomPane = options.zoomPane, zoomPane = _options$zoomPane === void 0 ? throwIfMissing() : _options$zoomPane, _options$sourceAttrib = options.sourceAttribute, sourceAttribute = _options$sourceAttrib === void 0 ? throwIfMissing() : _options$sourceAttrib, _options$handleTouch = options.handleTouch, handleTouch = _options$handleTouch === void 0 ? throwIfMissing() : _options$handleTouch, _options$onShow = options.onShow, onShow = _options$onShow === void 0 ? null : _options$onShow, _options$onHide = options.onHide, onHide = _options$onHide === void 0 ? null : _options$onHide, _options$hoverDelay = options.hoverDelay, hoverDelay = _options$hoverDelay === void 0 ? 0 : _options$hoverDelay, _options$touchDelay = options.touchDelay, touchDelay = _options$touchDelay === void 0 ? 0 : _options$touchDelay, _options$hoverBoundin = options.hoverBoundingBox, hoverBoundingBox = _options$hoverBoundin === void 0 ? throwIfMissing() : _options$hoverBoundin, _options$touchBoundin = options.touchBoundingBox, touchBoundingBox = _options$touchBoundin === void 0 ? throwIfMissing() : _options$touchBoundin, _options$namespace = options.namespace, namespace = _options$namespace === void 0 ? null : _options$namespace, _options$zoomFactor = options.zoomFactor, zoomFactor = _options$zoomFactor === void 0 ? throwIfMissing() : _options$zoomFactor, _options$boundingBoxC = options.boundingBoxContainer, boundingBoxContainer = _options$boundingBoxC === void 0 ? throwIfMissing() : _options$boundingBoxC, _options$passive = options.passive, passive = _options$passive === void 0 ? false : _options$passive;
    this.settings = {
      el,
      zoomPane,
      sourceAttribute,
      handleTouch,
      onShow,
      onHide,
      hoverDelay,
      touchDelay,
      hoverBoundingBox,
      touchBoundingBox,
      namespace,
      zoomFactor,
      boundingBoxContainer,
      passive
    };
    if (this.settings.hoverBoundingBox || this.settings.touchBoundingBox) {
      this.boundingBox = new BoundingBox({
        namespace: this.settings.namespace,
        zoomFactor: this.settings.zoomFactor,
        containerEl: this.settings.boundingBoxContainer
      });
    }
    this.enabled = true;
    this._bindEvents();
  }
  _createClass2(Trigger2, [{
    key: "_preventDefault",
    value: function _preventDefault(event2) {
      event2.preventDefault();
    }
  }, {
    key: "_preventDefaultAllowTouchScroll",
    value: function _preventDefaultAllowTouchScroll(event2) {
      if (!this.settings.touchDelay || !this._isTouchEvent(event2) || this.isShowing) {
        event2.preventDefault();
      }
    }
  }, {
    key: "_isTouchEvent",
    value: function _isTouchEvent(event2) {
      return !!event2.touches;
    }
  }, {
    key: "_bindEvents",
    value: function _bindEvents() {
      this.settings.el.addEventListener("mouseenter", this._handleEntry);
      this.settings.el.addEventListener("mouseleave", this._hide);
      this.settings.el.addEventListener("mousemove", this._handleMovement);
      var isPassive = {
        passive: this.settings.passive
      };
      if (this.settings.handleTouch) {
        this.settings.el.addEventListener("touchstart", this._handleEntry, isPassive);
        this.settings.el.addEventListener("touchend", this._hide);
        this.settings.el.addEventListener("touchmove", this._handleMovement, isPassive);
      } else {
        this.settings.el.addEventListener("touchstart", this._preventDefault, isPassive);
        this.settings.el.addEventListener("touchend", this._preventDefault);
        this.settings.el.addEventListener("touchmove", this._preventDefault, isPassive);
      }
    }
  }, {
    key: "_unbindEvents",
    value: function _unbindEvents() {
      this.settings.el.removeEventListener("mouseenter", this._handleEntry);
      this.settings.el.removeEventListener("mouseleave", this._hide);
      this.settings.el.removeEventListener("mousemove", this._handleMovement);
      if (this.settings.handleTouch) {
        this.settings.el.removeEventListener("touchstart", this._handleEntry);
        this.settings.el.removeEventListener("touchend", this._hide);
        this.settings.el.removeEventListener("touchmove", this._handleMovement);
      } else {
        this.settings.el.removeEventListener("touchstart", this._preventDefault);
        this.settings.el.removeEventListener("touchend", this._preventDefault);
        this.settings.el.removeEventListener("touchmove", this._preventDefault);
      }
    }
  }, {
    key: "_handleEntry",
    value: function _handleEntry(e) {
      this._preventDefaultAllowTouchScroll(e);
      this._lastMovement = e;
      if (e.type == "mouseenter" && this.settings.hoverDelay) {
        this.entryTimeout = setTimeout(this._show, this.settings.hoverDelay);
      } else if (this.settings.touchDelay) {
        this.entryTimeout = setTimeout(this._show, this.settings.touchDelay);
      } else {
        this._show();
      }
    }
  }, {
    key: "_show",
    value: function _show() {
      if (!this.enabled) {
        return;
      }
      var onShow = this.settings.onShow;
      if (onShow && typeof onShow === "function") {
        onShow();
      }
      this.settings.zoomPane.show(this.settings.el.getAttribute(this.settings.sourceAttribute), this.settings.el.clientWidth, this.settings.el.clientHeight);
      if (this._lastMovement) {
        var touchActivated = this._lastMovement.touches;
        if (touchActivated && this.settings.touchBoundingBox || !touchActivated && this.settings.hoverBoundingBox) {
          this.boundingBox.show(this.settings.zoomPane.el.clientWidth, this.settings.zoomPane.el.clientHeight);
        }
      }
      this._handleMovement();
    }
  }, {
    key: "_hide",
    value: function _hide(e) {
      if (e) {
        this._preventDefaultAllowTouchScroll(e);
      }
      this._lastMovement = null;
      if (this.entryTimeout) {
        clearTimeout(this.entryTimeout);
      }
      if (this.boundingBox) {
        this.boundingBox.hide();
      }
      var onHide = this.settings.onHide;
      if (onHide && typeof onHide === "function") {
        onHide();
      }
      this.settings.zoomPane.hide();
    }
  }, {
    key: "_handleMovement",
    value: function _handleMovement(e) {
      if (e) {
        this._preventDefaultAllowTouchScroll(e);
        this._lastMovement = e;
      } else if (this._lastMovement) {
        e = this._lastMovement;
      } else {
        return;
      }
      var movementX;
      var movementY;
      if (e.touches) {
        var firstTouch = e.touches[0];
        movementX = firstTouch.clientX;
        movementY = firstTouch.clientY;
      } else {
        movementX = e.clientX;
        movementY = e.clientY;
      }
      var el = this.settings.el;
      var rect = el.getBoundingClientRect();
      var offsetX = movementX - rect.left;
      var offsetY = movementY - rect.top;
      var percentageOffsetX = offsetX / this.settings.el.clientWidth;
      var percentageOffsetY = offsetY / this.settings.el.clientHeight;
      if (this.boundingBox) {
        this.boundingBox.setPosition(percentageOffsetX, percentageOffsetY, rect);
      }
      this.settings.zoomPane.setPosition(percentageOffsetX, percentageOffsetY, rect);
    }
  }, {
    key: "isShowing",
    get: function get3() {
      return this.settings.zoomPane.isShowing;
    }
  }]);
  return Trigger2;
}();

// node_modules/drift-zoom/es/ZoomPane.js
function _classCallCheck3(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties3(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass3(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties3(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties3(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
var ZoomPane = /* @__PURE__ */ function() {
  function ZoomPane2() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    _classCallCheck3(this, ZoomPane2);
    this.HAS_ANIMATION = false;
    if (typeof document !== "undefined") {
      var divStyle = document.createElement("div").style;
      this.HAS_ANIMATION = "animation" in divStyle || "webkitAnimation" in divStyle;
    }
    this._completeShow = this._completeShow.bind(this);
    this._completeHide = this._completeHide.bind(this);
    this._handleLoad = this._handleLoad.bind(this);
    this.isShowing = false;
    var _options$container = options.container, container = _options$container === void 0 ? null : _options$container, _options$zoomFactor = options.zoomFactor, zoomFactor = _options$zoomFactor === void 0 ? throwIfMissing() : _options$zoomFactor, _options$inline = options.inline, inline = _options$inline === void 0 ? throwIfMissing() : _options$inline, _options$namespace = options.namespace, namespace = _options$namespace === void 0 ? null : _options$namespace, _options$showWhitespa = options.showWhitespaceAtEdges, showWhitespaceAtEdges = _options$showWhitespa === void 0 ? throwIfMissing() : _options$showWhitespa, _options$containInlin = options.containInline, containInline = _options$containInlin === void 0 ? throwIfMissing() : _options$containInlin, _options$inlineOffset = options.inlineOffsetX, inlineOffsetX = _options$inlineOffset === void 0 ? 0 : _options$inlineOffset, _options$inlineOffset2 = options.inlineOffsetY, inlineOffsetY = _options$inlineOffset2 === void 0 ? 0 : _options$inlineOffset2, _options$inlineContai = options.inlineContainer, inlineContainer = _options$inlineContai === void 0 ? document.body : _options$inlineContai;
    this.settings = {
      container,
      zoomFactor,
      inline,
      namespace,
      showWhitespaceAtEdges,
      containInline,
      inlineOffsetX,
      inlineOffsetY,
      inlineContainer
    };
    this.openClasses = this._buildClasses("open");
    this.openingClasses = this._buildClasses("opening");
    this.closingClasses = this._buildClasses("closing");
    this.inlineClasses = this._buildClasses("inline");
    this.loadingClasses = this._buildClasses("loading");
    this._buildElement();
  }
  _createClass3(ZoomPane2, [{
    key: "_buildClasses",
    value: function _buildClasses(suffix) {
      var classes = ["drift-".concat(suffix)];
      var ns = this.settings.namespace;
      if (ns) {
        classes.push("".concat(ns, "-").concat(suffix));
      }
      return classes;
    }
  }, {
    key: "_buildElement",
    value: function _buildElement() {
      this.el = document.createElement("div");
      addClasses(this.el, this._buildClasses("zoom-pane"));
      var loaderEl = document.createElement("div");
      addClasses(loaderEl, this._buildClasses("zoom-pane-loader"));
      this.el.appendChild(loaderEl);
      this.imgEl = document.createElement("img");
      this.el.appendChild(this.imgEl);
    }
  }, {
    key: "_setImageURL",
    value: function _setImageURL(imageURL) {
      this.imgEl.setAttribute("src", imageURL);
    }
  }, {
    key: "_setImageSize",
    value: function _setImageSize(triggerWidth, triggerHeight) {
      this.imgEl.style.width = "".concat(triggerWidth * this.settings.zoomFactor, "px");
      this.imgEl.style.height = "".concat(triggerHeight * this.settings.zoomFactor, "px");
    }
    // `percentageOffsetX` and `percentageOffsetY` must be percentages
    // expressed as floats between `0' and `1`.
  }, {
    key: "setPosition",
    value: function setPosition(percentageOffsetX, percentageOffsetY, triggerRect) {
      var imgElWidth = this.imgEl.offsetWidth;
      var imgElHeight = this.imgEl.offsetHeight;
      var elWidth = this.el.offsetWidth;
      var elHeight = this.el.offsetHeight;
      var centreOfContainerX = elWidth / 2;
      var centreOfContainerY = elHeight / 2;
      var targetImgXToBeCentre = imgElWidth * percentageOffsetX;
      var targetImgYToBeCentre = imgElHeight * percentageOffsetY;
      var left = centreOfContainerX - targetImgXToBeCentre;
      var top = centreOfContainerY - targetImgYToBeCentre;
      var differenceBetweenContainerWidthAndImgWidth = elWidth - imgElWidth;
      var differenceBetweenContainerHeightAndImgHeight = elHeight - imgElHeight;
      var isContainerLargerThanImgX = differenceBetweenContainerWidthAndImgWidth > 0;
      var isContainerLargerThanImgY = differenceBetweenContainerHeightAndImgHeight > 0;
      var minLeft = isContainerLargerThanImgX ? differenceBetweenContainerWidthAndImgWidth / 2 : 0;
      var minTop = isContainerLargerThanImgY ? differenceBetweenContainerHeightAndImgHeight / 2 : 0;
      var maxLeft = isContainerLargerThanImgX ? differenceBetweenContainerWidthAndImgWidth / 2 : differenceBetweenContainerWidthAndImgWidth;
      var maxTop = isContainerLargerThanImgY ? differenceBetweenContainerHeightAndImgHeight / 2 : differenceBetweenContainerHeightAndImgHeight;
      if (this.el.parentElement === this.settings.inlineContainer) {
        var scrollX = window.pageXOffset;
        var scrollY = window.pageYOffset;
        var inlineLeft = triggerRect.left + percentageOffsetX * triggerRect.width - elWidth / 2 + this.settings.inlineOffsetX + scrollX;
        var inlineTop = triggerRect.top + percentageOffsetY * triggerRect.height - elHeight / 2 + this.settings.inlineOffsetY + scrollY;
        if (this.settings.containInline) {
          if (inlineLeft < triggerRect.left + scrollX) {
            inlineLeft = triggerRect.left + scrollX;
          } else if (inlineLeft + elWidth > triggerRect.left + triggerRect.width + scrollX) {
            inlineLeft = triggerRect.left + triggerRect.width - elWidth + scrollX;
          }
          if (inlineTop < triggerRect.top + scrollY) {
            inlineTop = triggerRect.top + scrollY;
          } else if (inlineTop + elHeight > triggerRect.top + triggerRect.height + scrollY) {
            inlineTop = triggerRect.top + triggerRect.height - elHeight + scrollY;
          }
        }
        this.el.style.left = "".concat(inlineLeft, "px");
        this.el.style.top = "".concat(inlineTop, "px");
      }
      if (!this.settings.showWhitespaceAtEdges) {
        if (left > minLeft) {
          left = minLeft;
        } else if (left < maxLeft) {
          left = maxLeft;
        }
        if (top > minTop) {
          top = minTop;
        } else if (top < maxTop) {
          top = maxTop;
        }
      }
      this.imgEl.style.transform = "translate(".concat(left, "px, ").concat(top, "px)");
      this.imgEl.style.webkitTransform = "translate(".concat(left, "px, ").concat(top, "px)");
    }
  }, {
    key: "_removeListenersAndResetClasses",
    value: function _removeListenersAndResetClasses() {
      this.el.removeEventListener("animationend", this._completeShow);
      this.el.removeEventListener("animationend", this._completeHide);
      this.el.removeEventListener("webkitAnimationEnd", this._completeShow);
      this.el.removeEventListener("webkitAnimationEnd", this._completeHide);
      removeClasses(this.el, this.openClasses);
      removeClasses(this.el, this.closingClasses);
    }
  }, {
    key: "show",
    value: function show(imageURL, triggerWidth, triggerHeight) {
      this._removeListenersAndResetClasses();
      this.isShowing = true;
      addClasses(this.el, this.openClasses);
      if (this.imgEl.getAttribute("src") != imageURL) {
        addClasses(this.el, this.loadingClasses);
        this.imgEl.addEventListener("load", this._handleLoad);
        this._setImageURL(imageURL);
      }
      this._setImageSize(triggerWidth, triggerHeight);
      if (this._isInline) {
        this._showInline();
      } else {
        this._showInContainer();
      }
      if (this.HAS_ANIMATION) {
        this.el.addEventListener("animationend", this._completeShow);
        this.el.addEventListener("webkitAnimationEnd", this._completeShow);
        addClasses(this.el, this.openingClasses);
      }
    }
  }, {
    key: "_showInline",
    value: function _showInline() {
      this.settings.inlineContainer.appendChild(this.el);
      addClasses(this.el, this.inlineClasses);
    }
  }, {
    key: "_showInContainer",
    value: function _showInContainer() {
      this.settings.container.appendChild(this.el);
    }
  }, {
    key: "hide",
    value: function hide() {
      this._removeListenersAndResetClasses();
      this.isShowing = false;
      if (this.HAS_ANIMATION) {
        this.el.addEventListener("animationend", this._completeHide);
        this.el.addEventListener("webkitAnimationEnd", this._completeHide);
        addClasses(this.el, this.closingClasses);
      } else {
        removeClasses(this.el, this.openClasses);
        removeClasses(this.el, this.inlineClasses);
      }
    }
  }, {
    key: "_completeShow",
    value: function _completeShow() {
      this.el.removeEventListener("animationend", this._completeShow);
      this.el.removeEventListener("webkitAnimationEnd", this._completeShow);
      removeClasses(this.el, this.openingClasses);
    }
  }, {
    key: "_completeHide",
    value: function _completeHide() {
      this.el.removeEventListener("animationend", this._completeHide);
      this.el.removeEventListener("webkitAnimationEnd", this._completeHide);
      removeClasses(this.el, this.openClasses);
      removeClasses(this.el, this.closingClasses);
      removeClasses(this.el, this.inlineClasses);
      this.el.style.left = "";
      this.el.style.top = "";
      if (this.el.parentElement === this.settings.container) {
        this.settings.container.removeChild(this.el);
      } else if (this.el.parentElement === this.settings.inlineContainer) {
        this.settings.inlineContainer.removeChild(this.el);
      }
    }
  }, {
    key: "_handleLoad",
    value: function _handleLoad() {
      this.imgEl.removeEventListener("load", this._handleLoad);
      removeClasses(this.el, this.loadingClasses);
    }
  }, {
    key: "_isInline",
    get: function get3() {
      var inline = this.settings.inline;
      return inline === true || typeof inline === "number" && window.innerWidth <= inline;
    }
  }]);
  return ZoomPane2;
}();

// node_modules/drift-zoom/es/Drift.js
function _classCallCheck4(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties4(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass4(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties4(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties4(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
var Drift = /* @__PURE__ */ function() {
  function Drift2(triggerEl) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    _classCallCheck4(this, Drift2);
    this.VERSION = "1.5.1";
    this.triggerEl = triggerEl;
    this.destroy = this.destroy.bind(this);
    if (!isDOMElement(this.triggerEl)) {
      throw new TypeError("`new Drift` requires a DOM element as its first argument.");
    }
    var namespace = options["namespace"] || null;
    var showWhitespaceAtEdges = options["showWhitespaceAtEdges"] || false;
    var containInline = options["containInline"] || false;
    var inlineOffsetX = options["inlineOffsetX"] || 0;
    var inlineOffsetY = options["inlineOffsetY"] || 0;
    var inlineContainer = options["inlineContainer"] || document.body;
    var sourceAttribute = options["sourceAttribute"] || "data-zoom";
    var zoomFactor = options["zoomFactor"] || 3;
    var paneContainer = options["paneContainer"] === void 0 ? document.body : options["paneContainer"];
    var inlinePane = options["inlinePane"] || 375;
    var handleTouch = "handleTouch" in options ? !!options["handleTouch"] : true;
    var onShow = options["onShow"] || null;
    var onHide = options["onHide"] || null;
    var injectBaseStyles = "injectBaseStyles" in options ? !!options["injectBaseStyles"] : true;
    var hoverDelay = options["hoverDelay"] || 0;
    var touchDelay = options["touchDelay"] || 0;
    var hoverBoundingBox = options["hoverBoundingBox"] || false;
    var touchBoundingBox = options["touchBoundingBox"] || false;
    var boundingBoxContainer = options["boundingBoxContainer"] || document.body;
    var passive = options["passive"] || false;
    if (inlinePane !== true && !isDOMElement(paneContainer)) {
      throw new TypeError("`paneContainer` must be a DOM element when `inlinePane !== true`");
    }
    if (!isDOMElement(inlineContainer)) {
      throw new TypeError("`inlineContainer` must be a DOM element");
    }
    this.settings = {
      namespace,
      showWhitespaceAtEdges,
      containInline,
      inlineOffsetX,
      inlineOffsetY,
      inlineContainer,
      sourceAttribute,
      zoomFactor,
      paneContainer,
      inlinePane,
      handleTouch,
      onShow,
      onHide,
      injectBaseStyles,
      hoverDelay,
      touchDelay,
      hoverBoundingBox,
      touchBoundingBox,
      boundingBoxContainer,
      passive
    };
    if (this.settings.injectBaseStyles) {
      injectBaseStylesheet();
    }
    this._buildZoomPane();
    this._buildTrigger();
  }
  _createClass4(Drift2, [{
    key: "_buildZoomPane",
    value: function _buildZoomPane() {
      this.zoomPane = new ZoomPane({
        container: this.settings.paneContainer,
        zoomFactor: this.settings.zoomFactor,
        showWhitespaceAtEdges: this.settings.showWhitespaceAtEdges,
        containInline: this.settings.containInline,
        inline: this.settings.inlinePane,
        namespace: this.settings.namespace,
        inlineOffsetX: this.settings.inlineOffsetX,
        inlineOffsetY: this.settings.inlineOffsetY,
        inlineContainer: this.settings.inlineContainer
      });
    }
  }, {
    key: "_buildTrigger",
    value: function _buildTrigger() {
      this.trigger = new Trigger({
        el: this.triggerEl,
        zoomPane: this.zoomPane,
        handleTouch: this.settings.handleTouch,
        onShow: this.settings.onShow,
        onHide: this.settings.onHide,
        sourceAttribute: this.settings.sourceAttribute,
        hoverDelay: this.settings.hoverDelay,
        touchDelay: this.settings.touchDelay,
        hoverBoundingBox: this.settings.hoverBoundingBox,
        touchBoundingBox: this.settings.touchBoundingBox,
        namespace: this.settings.namespace,
        zoomFactor: this.settings.zoomFactor,
        boundingBoxContainer: this.settings.boundingBoxContainer,
        passive: this.settings.passive
      });
    }
  }, {
    key: "setZoomImageURL",
    value: function setZoomImageURL(imageURL) {
      this.zoomPane._setImageURL(imageURL);
    }
  }, {
    key: "disable",
    value: function disable() {
      this.trigger.enabled = false;
    }
  }, {
    key: "enable",
    value: function enable() {
      this.trigger.enabled = true;
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.trigger._hide();
      this.trigger._unbindEvents();
    }
  }, {
    key: "isShowing",
    get: function get3() {
      return this.zoomPane.isShowing;
    }
  }, {
    key: "zoomFactor",
    get: function get3() {
      return this.settings.zoomFactor;
    },
    set: function set2(zf) {
      this.settings.zoomFactor = zf;
      this.zoomPane.settings.zoomFactor = zf;
      this.trigger.settings.zoomFactor = zf;
      this.boundingBox.settings.zoomFactor = zf;
    }
  }]);
  return Drift2;
}();
Object.defineProperty(Drift.prototype, "isShowing", {
  get: function get() {
    return this.isShowing;
  }
});
Object.defineProperty(Drift.prototype, "zoomFactor", {
  get: function get2() {
    return this.zoomFactor;
  },
  set: function set(value) {
    this.zoomFactor = value;
  }
});
Drift.prototype["setZoomImageURL"] = Drift.prototype.setZoomImageURL;
Drift.prototype["disable"] = Drift.prototype.disable;
Drift.prototype["enable"] = Drift.prototype.enable;
Drift.prototype["destroy"] = Drift.prototype.destroy;

// js/components/ProductGallery.js
var import_fastdom3 = __toESM(require_fastdom());
var ProductGallery = class {
  constructor(element, options) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.viewInSpaceElement = this.element.querySelector("[data-shopify-xr]");
    this.options = options;
    this.media = {};
    this.previouslySelectedMedia = null;
    this._createCarousel();
    this._createZoom();
    this._attachListeners();
  }
  destroy() {
    if (this.flickityInstance) {
      this.flickityInstance.destroy();
    }
    for (let mediaId in this.media) {
      if (this.media.hasOwnProperty(mediaId)) {
        this.media[mediaId].destroy();
      }
    }
  }
  _attachListeners() {
    this.delegateElement.on("model:played", this._disableDrag.bind(this));
    this.delegateElement.on("video:played", this._disableDrag.bind(this));
    this.delegateElement.on("model:paused", this._enableDrag.bind(this));
    this.delegateElement.on("video:paused", this._enableDrag.bind(this));
    if (this.options["enableImageZoom"]) {
      window.addEventListener("resize", this._handleZoomForMediaQuery.bind(this));
      this.delegateElement.on("click", ".product-gallery__image", this._openMobileZoom.bind(this));
      this.delegateElement.on("click", ".pswp__button", this._doPswpAction.bind(this));
    }
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastWidth && this.flickityInstance) {
        this.flickityInstance.resize();
        lastWidth = window.innerWidth;
      }
    });
  }
  /**
   * This method must be called whenever the variant is changed
   */
  variantHasChanged(newVariant) {
    let shouldReload = false;
    import_fastdom3.default.mutate(() => {
      this.productGalleryCellsElements.forEach((cell, imageIndex) => {
        if (cell.hasAttribute("data-group-name")) {
          let groupName = cell.getAttribute("data-group-name");
          this.options["productOptions"].forEach((option, optionIndex) => {
            if (option.toLowerCase() === groupName) {
              if (newVariant[`option${optionIndex + 1}`].toLowerCase() === cell.getAttribute("data-group-value") || newVariant["featured_media"] && newVariant["featured_media"]["id"] === parseInt(cell.getAttribute("data-media-id"))) {
                cell.classList.remove("is-filtered");
                this.productThumbnailsCellsElements[imageIndex].classList.remove("is-filtered");
              } else {
                cell.classList.add("is-filtered");
                this.productThumbnailsCellsElements[imageIndex].classList.add("is-filtered");
              }
            }
          });
          shouldReload = true;
        }
      });
      if (shouldReload) {
        this.flickityInstance.deactivate();
        this.flickityInstance.activate();
      }
      if (Responsive.matchesBreakpoint("lap-and-up")) {
        let slides = this.element.querySelectorAll(".product-gallery__carousel-item");
        slides.forEach((slide) => {
          slide.classList.remove("product-gallery__carousel-item--hidden");
        });
      }
      if (this.flickityInstance && newVariant && newVariant["featured_media"]) {
        this.flickityInstance.selectCell(`[data-media-id="${newVariant["featured_media"]["id"]}"]`);
      }
    });
  }
  _createCarousel() {
    this.productGalleryElement = this.element.querySelector(".product-gallery__carousel");
    this.productGalleryCellsElements = this.productGalleryElement ? this.productGalleryElement.querySelectorAll(".product-gallery__carousel-item") : [];
    if (this.productGalleryElement) {
      this.productGalleryCellsElements.forEach((item) => {
        switch (item.getAttribute("data-media-type")) {
          case "external_video":
          case "video":
            this.media[item.getAttribute("data-media-id")] = new ProductVideo(item, this.options["enableVideoLooping"]);
            break;
          case "model":
            this.media[item.getAttribute("data-media-id")] = new ProductModel(item);
            break;
        }
      });
      if (parseInt(this.productGalleryElement.getAttribute("data-media-count")) > 1) {
        let filteredCells = [].slice.call(this.productGalleryCellsElements).filter((item) => {
          return !item.classList.contains("is-filtered");
        });
        let initialIndex = 0;
        filteredCells.forEach((item, index) => {
          if (item.getAttribute("data-media-id") === this.productGalleryElement.getAttribute("data-initial-media-id")) {
            initialIndex = index;
          }
        });
        let firstSlide = filteredCells[initialIndex];
        firstSlide.classList.add("is-selected");
        this.productGalleryElement.style.height = `${firstSlide.clientHeight}px`;
        this.flickityInstance = new import_flickity_fade.default(this.productGalleryElement, {
          accessibility: false,
          prevNextButtons: false,
          pageDots: false,
          resize: false,
          adaptiveHeight: true,
          draggable: !Responsive.matchesBreakpoint("supports-hover"),
          fade: this.options["galleryTransitionEffect"] === "fade",
          cellSelector: ".product-gallery__carousel-item:not(.is-filtered)",
          initialIndex,
          on: {
            ready: () => {
              setTimeout(() => {
                this.productGalleryElement.style.height = null;
              }, 1e3);
            }
          }
        });
      }
    }
    this.productThumbnailsListElement = this.element.querySelector(".product-gallery__thumbnail-list");
    this.delegateElement.on("click", ".product-gallery__thumbnail", this._onThumbnailClicked.bind(this));
    if (this.productThumbnailsListElement && this.flickityInstance) {
      this.productThumbnailsCellsElements = this.productThumbnailsListElement.querySelectorAll(".product-gallery__thumbnail");
      this.flickityInstance.on("select", this._onGallerySlideChanged.bind(this));
      if (this.options["galleryTransitionEffect"] === "fade") {
        this.flickityInstance.on("select", this._onGallerySlideSettled.bind(this));
      } else {
        this.flickityInstance.on("settle", this._onGallerySlideSettled.bind(this));
      }
      this._onGallerySlideChanged(false);
      this._onGallerySlideSettled();
    }
  }
  _createZoom() {
    if (!this.options["enableImageZoom"]) {
      return;
    }
    if (Responsive.matchesBreakpoint("lap-and-up")) {
      this.driftObjects = [];
      let zoomWrapper = this.element.querySelector(".product__zoom-wrapper");
      this.element.querySelectorAll(".product-gallery__image").forEach((image) => {
        this.driftObjects.push(new Drift(image, {
          containInline: this.options["zoomEffect"] === "outside",
          inlinePane: window.innerWidth < 1024 ? true : this.options["zoomEffect"] !== "outside",
          hoverBoundingBox: this.options["zoomEffect"] === "outside",
          handleTouch: false,
          inlineOffsetY: window.innerWidth < 1024 ? -85 : 0,
          paneContainer: zoomWrapper
        }));
      });
    }
  }
  _openMobileZoom() {
    let pswpElement = this.element.querySelector(".pswp");
    if (!pswpElement || !Responsive.matchesBreakpoint("pocket")) {
      return;
    }
    let filteredItems = this.element.querySelectorAll('.product-gallery__carousel-item:not(.is-filtered)[data-media-type="image"]'), defaultIndex = 0, items = [];
    filteredItems.forEach((filteredItem, index) => {
      let image = filteredItem.querySelector(".product-gallery__image");
      items.push({
        src: image.getAttribute("data-zoom"),
        w: parseInt(image.getAttribute("data-zoom-width")),
        h: parseInt(image.getAttribute("data-zoom-width")) * (image.height / image.width),
        msrc: image.currentSrc
      });
      if (filteredItem.classList.contains("is-selected")) {
        defaultIndex = index;
      }
    });
    const prevNextElement = pswpElement.querySelector(".pswp__prev-next");
    prevNextElement.style.display = items.length > 1 ? "flex" : "none";
    this.photoSwipeInstance = new import_photoswipe.default(pswpElement, false, items, {
      index: defaultIndex,
      closeOnVerticalDrag: false,
      closeOnScroll: false,
      history: false,
      showHideOpacity: true,
      pinchToClose: false,
      maxSpreadZoom: 1,
      showAnimationDuration: false,
      allowPanToNext: false
    });
    let originalUpdateSize = this.photoSwipeInstance.updateSize, lastWidth = null;
    this.photoSwipeInstance.updateSize = function() {
      if (lastWidth === null || lastWidth !== window.innerWidth) {
        originalUpdateSize(this, arguments);
      }
      lastWidth = window.innerWidth;
    };
    this.photoSwipeInstance.listen("destroy", () => {
      this.photoSwipeInstance = null;
    });
    this.photoSwipeInstance.listen("beforeChange", () => {
      let currentItem = this.element.querySelector(".pswp__pagination-current"), paginationCount = this.element.querySelector(".pswp__pagination-count");
      currentItem.textContent = this.photoSwipeInstance.getCurrentIndex() + 1;
      paginationCount.textContent = this.photoSwipeInstance.options.getNumItemsFn();
    });
    this.photoSwipeInstance.init();
  }
  _doPswpAction(event2, element) {
    if (!this.photoSwipeInstance) {
      return;
    }
    if (element.classList.contains("pswp__button--close")) {
      this.photoSwipeInstance.close();
    } else if (element.classList.contains("pswp__button--arrow--left")) {
      this.photoSwipeInstance.prev();
    } else if (element.classList.contains("pswp__button--arrow--right")) {
      this.photoSwipeInstance.next();
    }
  }
  _handleZoomForMediaQuery() {
    if (Responsive.matchesBreakpoint("lap-and-up") && this.photoSwipeInstance) {
      this.photoSwipeInstance.close();
      this.photoSwipeInstance = null;
    }
  }
  _onGallerySlideChanged(animate = true) {
    let previousNavElement = null, newNavElement = null;
    this.productThumbnailsCellsElements.forEach((item) => {
      if (item.classList.contains("is-nav-selected")) {
        previousNavElement = item;
      }
      if (item.getAttribute("data-media-id") === this.flickityInstance.selectedElement.getAttribute("data-media-id")) {
        newNavElement = item;
      }
    });
    previousNavElement.classList.remove("is-nav-selected");
    newNavElement.classList.add("is-nav-selected");
    if (Responsive.matchesBreakpoint("pocket")) {
      let scrollX = newNavElement.offsetLeft - (this.productThumbnailsListElement.parentNode.clientWidth - newNavElement.clientWidth) / 2;
      this.productThumbnailsListElement.parentNode.scrollTo({ left: scrollX, behavior: animate ? "smooth" : "auto" });
    } else {
      let scrollY = newNavElement.offsetTop - (this.productThumbnailsListElement.clientHeight - newNavElement.clientHeight) / 2;
      this.productThumbnailsListElement.scrollTo({ top: scrollY, behavior: animate ? "smooth" : "auto" });
    }
  }
  /**
   * The difference with "change" is that this function is called after the item has transitioned
   */
  _onGallerySlideSettled() {
    this._handleMedia(this.flickityInstance.selectedElement);
    if (Responsive.matchesBreakpoint("lap-and-up")) {
      let slides = this.element.querySelectorAll(".product-gallery__carousel-item:not(.is-selected)");
      slides.forEach((slide) => {
        slide.classList.add("product-gallery__carousel-item--hidden");
      });
    }
  }
  _onThumbnailClicked(event2, target) {
    event2.preventDefault();
    if (this.flickityInstance) {
      this.flickityInstance.selectCell(`[data-media-id="${target.getAttribute("data-media-id")}"]`);
      if (Responsive.matchesBreakpoint("lap-and-up")) {
        let slides = this.element.querySelectorAll(".product-gallery__carousel-item");
        slides.forEach((slide) => {
          slide.classList.remove("product-gallery__carousel-item--hidden");
        });
      }
    }
  }
  _disableDrag() {
    this.flickityInstance.options.draggable = false;
    this.flickityInstance.updateDraggable();
  }
  _enableDrag() {
    this.flickityInstance.options.draggable = !Responsive.matchesBreakpoint("supports-hover");
    this.flickityInstance.updateDraggable();
  }
  /**
   * This method will handle the given media (for now model and video) to do the appropriate actions (such as launching
   * a video for instance)
   */
  _handleMedia(item) {
    let isInitialLoading = this.previouslySelectedMedia === null;
    if (this.previouslySelectedMedia && this.previouslySelectedMedia !== item) {
      switch (this.previouslySelectedMedia.getAttribute("data-media-type")) {
        case "video":
        case "external_video":
        case "model":
          this.media[this.previouslySelectedMedia.getAttribute("data-media-id")].hasBeenDeselected();
      }
      if (this.previouslySelectedMedia.getAttribute("data-media-type") === "model" && this.viewInSpaceElement) {
        this.viewInSpaceElement.setAttribute("data-shopify-model3d-id", this.viewInSpaceElement.getAttribute("data-shopify-model3d-default-id"));
      }
    }
    switch (item.getAttribute("data-media-type")) {
      case "video":
      case "external_video":
      case "model":
        this.media[item.getAttribute("data-media-id")].hasBeenSelected(isInitialLoading);
        this.element.querySelector(".product-gallery__carousel").classList.remove("product-gallery__carousel--zoomable");
        break;
      case "image":
        this.element.querySelector(".product-gallery__carousel").classList.add("product-gallery__carousel--zoomable");
        break;
    }
    if (item.getAttribute("data-media-type") === "model" && this.viewInSpaceElement) {
      this.viewInSpaceElement.setAttribute("data-shopify-model3d-id", item.getAttribute("data-media-id"));
    }
    this.previouslySelectedMedia = item;
  }
};

// js/components/QuantityPicker.js
var QuantityPicker = class extends HTMLElement {
  constructor() {
    super();
    this.inputElement = this.querySelector('[name="quantity"]');
    this.delegateElement = new main_default(this);
    this._attachListeners();
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="decrease-picker-quantity"]', this._onDecrease.bind(this));
    this.delegateElement.on("click", '[data-action="increase-picker-quantity"]', this._onIncrease.bind(this));
    this.delegateElement.on("change", this._onInputValueChanged.bind(this));
    this.delegateElement.on("focusout", this._onInputFocusOut.bind(this));
  }
  _onDecrease() {
    this.inputElement.stepDown();
    this.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
  }
  _onIncrease() {
    this.inputElement.stepUp();
    this.inputElement.dispatchEvent(new Event("change", { bubbles: true }));
  }
  _onInputValueChanged(event2) {
    let value = event2.target.value;
    if (value !== "" && isNaN(value)) {
      event2.target.value = this.inputElement.min || 1;
    }
    if (!this.inputElement.checkValidity()) {
      this.inputElement.stepDown();
    }
  }
  _onInputFocusOut(event2) {
    if (!this.inputElement.checkValidity()) {
      this.inputElement.stepDown();
    }
  }
};
if (!window.customElements.get("quantity-picker")) {
  window.customElements.define("quantity-picker", QuantityPicker);
}

// js/helper/Form.js
var Form = class _Form {
  static serialize(form) {
    function stringKey(key, value) {
      let beginBracket = key.lastIndexOf("[");
      if (beginBracket === -1) {
        let hash2 = {};
        hash2[key] = value;
        return hash2;
      }
      let newKey = key.substr(0, beginBracket);
      let newValue = {};
      newValue[key.substring(beginBracket + 1, key.length - 1)] = value;
      return stringKey(newKey, newValue);
    }
    let hash = {};
    for (let i = 0, len = form.elements.length; i < len; i++) {
      let formElement = form.elements[i];
      if (formElement.name === "" || formElement.disabled) {
        continue;
      }
      if (formElement.name && !formElement.disabled && (formElement.checked || /select|textarea/i.test(formElement.nodeName) || /hidden|text|search|tel|url|email|password|datetime|date|month|week|time|datetime-local|number|range|color/i.test(formElement.type))) {
        let stringKeys = stringKey(formElement.name, formElement.value);
        hash = _Form.extend(hash, stringKeys);
      }
    }
    return hash;
  }
  static extend() {
    let extended = {};
    let i = 0;
    let merge = function(obj) {
      for (let prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          if (Object.prototype.toString.call(obj[prop]) === "[object Object]") {
            extended[prop] = _Form.extend(extended[prop], obj[prop]);
          } else {
            extended[prop] = obj[prop];
          }
        }
      }
    };
    for (; i < arguments.length; i++) {
      merge(arguments[i]);
    }
    return extended;
  }
};

// js/components/ShippingEstimator.js
var ShippingEstimator = class {
  constructor(element, options) {
    if (!element) {
      return;
    }
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = options;
    this.countrySelector = new CountrySelector(this.element.querySelector('[name="country"]'), this.element.querySelector('[name="province"]'));
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off("click");
    this.countrySelector.destroy();
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="estimate-shipping"]', this._fetchRates.bind(this));
  }
  _fetchRates() {
    document.dispatchEvent(new CustomEvent("theme:loading:start"));
    if (this.options["singleProduct"]) {
      this._fetchRatesForProduct();
    } else {
      this._fetchRatesForCart();
    }
  }
  _fetchRatesForCart() {
    let country = this.element.querySelector('[name="country"]').value, province = this.element.querySelector('[name="province"]').value, zip = this.element.querySelector('[name="zip"]').value;
    fetch(`${window.routes.cartUrl}/shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      document.dispatchEvent(new CustomEvent("theme:loading:end"));
      response.json().then((result) => {
        this._formatResults(response.ok, result);
      });
    });
  }
  /**
   * Technique is coming from this website: https://freakdesign.com.au/blogs/news/get-shipping-estimates-on-a-product-page
   */
  _fetchRatesForProduct() {
    let cartCookie = this._getCookie("cart"), tempCookieValue = "temp-cart-cookie___" + Date.now() + parseInt(Math.random() * 1e3), fakeCookieValue = "fake-cart-cookie___" + Date.now() + parseInt(Math.random() * 1e3);
    if (!cartCookie) {
      this._updateCartCookie(tempCookieValue);
      cartCookie = this._getCookie("cart");
    }
    if (cartCookie.length < 32) {
      return;
    }
    this._updateCartCookie(fakeCookieValue);
    const formElement = document.querySelector('form[action*="/cart/add"]');
    fetch(`${window.routes.cartAddUrl}.js`, {
      body: JSON.stringify(Form.serialize(formElement)),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
        // This is needed as currently there is a bug in Shopify that assumes this header
      },
      method: "POST"
    }).then((response) => {
      response.json().then(() => {
        let country = this.element.querySelector('[name="country"]').value, province = this.element.querySelector('[name="province"]').value, zip = this.element.querySelector('[name="zip"]').value;
        fetch(`${window.routes.cartUrl}/shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`, {
          credentials: "same-origin",
          method: "GET"
        }).then((response2) => {
          document.dispatchEvent(new CustomEvent("theme:loading:end"));
          response2.json().then((result) => {
            this._formatResults(response2.ok, result);
          });
          this._updateCartCookie(cartCookie);
        }).catch(() => {
          this._updateCartCookie(cartCookie);
        });
      }).catch(() => {
        this._updateCartCookie(cartCookie);
        document.dispatchEvent(new CustomEvent("theme:loading:end"));
      });
    });
  }
  _formatResults(isOk, results) {
    let resultsElement = this.element.querySelector(".shipping-estimator__results");
    resultsElement.innerHTML = "";
    if (isOk) {
      let shippingRates = results["shipping_rates"];
      if (shippingRates.length === 0) {
        resultsElement.innerHTML = `<p>${window.languages.shippingEstimatorNoResults}</p>`;
      } else {
        if (shippingRates.length === 1) {
          resultsElement.innerHTML = `<p>${window.languages.shippingEstimatorOneResult}</p>`;
        } else {
          resultsElement.innerHTML = `<p>${window.languages.shippingEstimatorMultipleResults.replace("{{count}}", shippingRates.length)}</p>`;
        }
        let listRatesHtml = "";
        shippingRates.forEach((item) => {
          const formatter = new Intl.NumberFormat(Shopify.locale, { style: "currency", currency: item["currency"] });
          listRatesHtml += `<li>${item["name"]}: ${formatter.format(item["price"])}</li>`;
        });
        resultsElement.innerHTML += `<ul>${listRatesHtml}</ul>`;
      }
    } else {
      resultsElement.innerHTML = `<p>${window.languages.shippingEstimatorErrors}</p>`;
      let errorHtml = "";
      Object.keys(results).forEach(function(key) {
        errorHtml += `<li class="alert__list-item">${key} ${results[key]}</li>`;
      });
      resultsElement.innerHTML += `<ul>${errorHtml}</ul>`;
    }
    resultsElement.style.display = "block";
  }
  _getCookie(name) {
    let value = `; ${document.cookie}`, parts = value.split("; " + name + "=");
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
  }
  _updateCartCookie(value) {
    let date = /* @__PURE__ */ new Date();
    date.setTime(date.getTime() + 14 * 864e5);
    document.cookie = `cart=${value}; expires=${date.toUTCString()}; path=/`;
  }
};

// js/components/ValuePicker.js
var ValuePicker = class {
  constructor(id, options = {}) {
    this.id = id;
    this.delegateRoot = new main_default(document.documentElement);
    this.isOpen = false;
    this.togglerElement = document.querySelector(`[data-action="open-value-picker"][aria-controls="${this.id}"]`);
    this.onSelect = options["onValueSelect"] || (() => {
    });
    this._attachListeners();
  }
  destroy() {
    this.delegateRoot.off();
  }
  _attachListeners() {
    this.delegateRoot.on("click", `[data-action="open-value-picker"][aria-controls="${this.id}"]`, this._toggle.bind(this));
    this.delegateRoot.on("click", `[data-action="close-value-picker"][aria-controls="${this.id}"]`, this._toggle.bind(this));
    this.delegateRoot.on("click", `#${this.id} [data-action="select-value"]`, this._selectValue.bind(this));
    this.delegateRoot.on("click", this._detectOutsideClick.bind(this), true);
    this.delegateRoot.on("focusout", `#${this.id}`, this._onFocusOut.bind(this));
  }
  _toggle(event2) {
    if (this.isOpen) {
      this._close(event2);
    } else {
      this._open(event2);
    }
  }
  _open() {
    document.querySelector(`[data-action="open-value-picker"][aria-controls="${this.id}"]`).setAttribute("aria-expanded", "true");
    document.getElementById(this.id).setAttribute("aria-hidden", "false");
    if (Responsive.matchesBreakpoint("phone")) {
      let headerElement = document.querySelector(".section-header");
      headerElement.style.zIndex = "3";
    }
    this.isOpen = true;
    document.documentElement.classList.add("is-locked");
  }
  _close() {
    document.querySelector(`[data-action="open-value-picker"][aria-controls="${this.id}"]`).setAttribute("aria-expanded", "false");
    document.getElementById(this.id).setAttribute("aria-hidden", "true");
    let headerElement = document.querySelector(".section-header");
    headerElement.style.zIndex = "";
    this.isOpen = false;
    document.documentElement.classList.remove("is-locked");
  }
  _selectValue(event2, target) {
    this.onSelect(target.getAttribute("data-value"));
    this._close();
  }
  _onFocusOut(event2) {
    let container = document.getElementById(this.id);
    if (!container.contains(event2.relatedTarget)) {
      this._close();
    }
  }
  _detectOutsideClick(event2) {
    if (!this.isOpen || this.togglerElement === event2.target || this.togglerElement.contains(event2.target)) {
      return;
    }
    if (!event2.target.closest(".value-picker__inner") && this.isOpen) {
      this._close(event2);
    }
  }
};

// js/sections/AccountSection.js
var AccountSection = class {
  constructor(element) {
    this.element = element;
    this.domDelegate = new main_default(this.element);
    this.element.querySelectorAll('[action*="/account/addresses"]').forEach((addressForm) => {
      new CountrySelector(addressForm.querySelector('[name="address[country]"]'), addressForm.querySelector('[name="address[province]"]'));
    });
    this.pageSelector = new ValuePicker("account-selector");
  }
  _onUnload() {
    this.pageSelector.destroy();
  }
};

// js/sections/AnnouncementBarSection.js
var AnnouncementBarSection = class {
  constructor(element) {
    this.element = element;
    this.domDelegate = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.isOpen = false;
    if (this.options["showNewsletter"]) {
      document.documentElement.style.setProperty("--announcement-bar-button-width", this.element.querySelector(".announcement-bar__button").clientWidth + "px");
    } else {
      document.documentElement.style.removeProperty("--announcement-bar-button-width");
    }
    this._attachListeners();
  }
  onSelect() {
    if (this.options["showNewsletter"] && !this.isOpen) {
      this._toggleNewsletter();
    }
  }
  onDeselect() {
    if (this.options["showNewsletter"] && this.isOpen) {
      this._toggleNewsletter();
    }
  }
  onUnload() {
    this.domDelegate.off();
  }
  _attachListeners() {
    this.domDelegate.on("click", '[data-action="toggle-newsletter"]', this._toggleNewsletter.bind(this));
    this.domDelegate.on("keyup", this._handleKey.bind(this));
  }
  _toggleNewsletter() {
    let togglerElement = this.element.querySelector(".announcement-bar__button"), newsletterElement = this.element.querySelector(".announcement-bar__newsletter");
    if (togglerElement.getAttribute("aria-expanded") === "false") {
      togglerElement.setAttribute("aria-expanded", "true");
      newsletterElement.setAttribute("aria-hidden", "false");
      Animation.slideDown(newsletterElement, () => {
        Accessibility.trapFocus(newsletterElement, "announcement-bar");
      });
    } else {
      togglerElement.setAttribute("aria-expanded", "false");
      newsletterElement.setAttribute("aria-hidden", "true");
      Animation.slideUp(newsletterElement);
      Accessibility.removeTrapFocus(newsletterElement, "announcement-bar");
    }
    this.isOpen = !this.isOpen;
  }
  _handleKey(event2) {
    if (event2.key === "Escape" && this.isOpen) {
      this._toggleNewsletter();
    }
  }
};

// js/sections/BlogSection.js
var BlogSection = class {
  constructor(element) {
    this.element = element;
    this.blogTagSelector = new ValuePicker("blog-tag-selector");
    if (Shopify.designMode) {
      let elementToAdd = this.element.querySelector(".page__header");
      if (elementToAdd) {
        document.querySelector(".blog-container").previousElementSibling.remove();
        document.querySelector(".blog-container").insertAdjacentElement("beforebegin", elementToAdd);
      }
    }
  }
  onUnload() {
    this.blogTagSelector.destroy();
  }
};

// js/sections/BlogPostSection.js
var BlogPostSection = class {
  constructor(element) {
    this.element = element;
    if (Shopify.designMode) {
      let elementToAdd = this.element.querySelector(".page__header");
      if (elementToAdd) {
        document.querySelector(".blog-container").previousElementSibling.remove();
        document.querySelector(".blog-container").insertAdjacentElement("beforebegin", elementToAdd);
      }
    }
  }
};

// js/sections/BlogSidebarSection.js
var BlogSidebarSection = class {
  constructor(element) {
    this.element = element;
    if (window.theme.pageType === "blog") {
      this._fixItemsPerRow();
    }
  }
  /**
   * If sidebar is not visible, then we must do some adjustments to the grid of article (especially, we must change how many items per row are displayed).
   * Because Shopify sections are independent, I didn't find a better approach than changing it in JavaScript
   */
  _fixItemsPerRow() {
    let blocks = this.element.querySelectorAll(".blog-sidebar__item");
    if (blocks.length === 0) {
      document.querySelector(".blog-container").classList.add("blog-container--without-sidebar");
      document.querySelectorAll(".section-blog-posts .block-list__item").forEach(function(item) {
        if (item.classList.contains("1/2--lap-and-up")) {
          item.classList.remove("1/2--lap-and-up");
          item.classList.add("1/3--lap-and-up");
        }
      });
    } else {
      document.querySelector(".blog-container").classList.remove("blog-container--without-sidebar");
      document.querySelectorAll(".section-blog-posts .block-list__item").forEach(function(item) {
        if (item.classList.contains("1/3--lap-and-up")) {
          item.classList.remove("1/3--lap-and-up");
          item.classList.add("1/2--lap-and-up");
        }
      });
    }
  }
};

// js/sections/ProductSection.js
var ProductSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.productGallery = new ProductGallery(this.element, this.options);
    if (this.options["isQuickView"] && window.Shopify.PaymentButton) {
      Shopify.PaymentButton.init();
    }
    if (this.options["showShippingEstimator"]) {
      this.shippingEstimator = new ShippingEstimator(this.element.querySelector(".shipping-estimator"), { singleProduct: true });
    }
    let productInfoElement = this.element.querySelector(".product-block-list__item--info .card");
    if (productInfoElement) {
      this.element.querySelector(".product-block-list__wrapper").style.minHeight = `${productInfoElement.clientHeight}px`;
      if (window.ResizeObserver) {
        this.productInfoResizeObserver = new ResizeObserver((event2) => {
          if (event2[0].contentBoxSize) {
            this.element.querySelector(".product-block-list__wrapper").style.minHeight = `${event2[0].contentBoxSize[0].blockSize}px`;
          } else {
            this.element.querySelector(".product-block-list__wrapper").style.minHeight = `${event2[0].contentRect.height}px`;
          }
        });
        this.productInfoResizeObserver.observe(productInfoElement);
      }
      if (this.options["infoOverflowScroll"]) {
        this.infoOverflowScroller = new OverflowScroller(productInfoElement, {
          offsetTop: document.documentElement.style.getPropertyValue("--header-is-sticky") * parseInt(document.documentElement.style.getPropertyValue("--header-height") + 30),
          offsetBottom: 30
        });
      }
    }
    this._attachListeners();
  }
  onUnload() {
    this.productGallery.destroy();
    if (this.options["showShippingEstimator"]) {
      this.shippingEstimator.destroy();
    }
    if (this.options["infoOverflowScroll"]) {
      this.infoOverflowScroller.destroy();
    }
    if (window.ResizeObserver && this.productInfoResizeObserver) {
      this.productInfoResizeObserver.disconnect();
    }
    this.delegateElement.off();
    this.element.removeEventListener("variant:change", this._onVariantChangedListener);
  }
  _attachListeners() {
    this._onVariantChangedListener = this._onVariantChanged.bind(this);
    this.element.addEventListener("variant:change", this._onVariantChangedListener);
  }
  /**
   * This method is called when the variant is changed due to option
   */
  _onVariantChanged(event2) {
    this.productGallery.variantHasChanged(event2.detail.variant);
  }
};

// js/sections/CartSection.js
var CartSection = class {
  constructor(element) {
    this.element = element;
    this.domDelegate = new main_default(this.element);
    this.delegateRoot = new main_default(document.documentElement);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    if (this.options["showShippingEstimator"]) {
      this.shippingEstimator = new ShippingEstimator(this.element.querySelector(".shipping-estimator"), { singleProduct: false });
    }
    this._attachListeners();
    this._enforceMinimumHeight();
  }
  onUnload() {
    if (this.options["showShippingEstimator"]) {
      this.shippingEstimator.destroy();
    }
  }
  _attachListeners() {
    this.domDelegate.on("click", '[data-action="save-note"]', this._saveNote.bind(this));
    this.domDelegate.on("click", '[data-secondary-action="open-quick-view"]', this._openQuickView.bind(this));
    this.delegateRoot.on("cart:rerendered", this._onCartRerendered.bind(this));
  }
  _saveNote() {
    let noteValue = this.element.querySelector('[name="note"]').value;
    fetch(`${window.routes.cartUrl}/update.js`, {
      body: JSON.stringify({ note: noteValue }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
        // This is needed as currently there is a bug in Shopify that assumes this header
      }
    });
    this.element.querySelector(".cart-recap__note-edit").classList.toggle("is-visible", noteValue !== "");
    document.dispatchEvent(new CustomEvent("collapsible:toggle", {
      detail: {
        id: "order-note"
      }
    }));
  }
  _openQuickView(event2, target) {
    let modal = document.getElementById(target.getAttribute("aria-controls"));
    modal.classList.add("is-loading");
    fetch(`${target.getAttribute("data-product-url")}`, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        const fragment = document.createRange().createContextualFragment(content);
        const modalContent = Dom.deepQuerySelector(fragment, '[data-section-type="product-quick-view"]');
        modal.querySelector(".modal__inner").replaceChildren(modalContent);
        modal.classList.remove("is-loading");
        let modalProductSection = new ProductSection(modalContent);
        let doCleanUp = () => {
          modalProductSection.onUnload();
          modal.removeEventListener("modal:closed", doCleanUp);
        };
        modal.addEventListener("modal:closed", doCleanUp);
      });
    });
  }
  /**
   * On desktop we need to enforce a minimum height for the cart-wrapper
   */
  _enforceMinimumHeight() {
    let cartWrapperElement = this.element.querySelector(".cart-wrapper"), cartRecapScrollerElement = this.element.querySelector(".cart-recap__scroller");
    if (cartWrapperElement && cartRecapScrollerElement) {
      cartWrapperElement.style.minHeight = `${cartRecapScrollerElement.clientHeight}px`;
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (let entry of entries) {
            cartWrapperElement.style.minHeight = `${parseInt(entry.contentRect.height)}px`;
          }
        });
        resizeObserver.observe(cartRecapScrollerElement);
      }
    }
  }
  /* When the cart re-render, we have some operations to do */
  _onCartRerendered() {
    if (this.options["showShippingEstimator"]) {
      this.shippingEstimator.destroy();
      this.shippingEstimator = new ShippingEstimator(this.element.querySelector(".shipping-estimator"), { singleProduct: false });
    }
    this._enforceMinimumHeight();
  }
};

// js/sections/CollectionListSection.js
var import_flickity = __toESM(require_js());
var CollectionListSection = class {
  constructor(element) {
    this.element = element;
    const collectionListElement = this.element.querySelector(".collection-list");
    this.flickityInstance = new import_flickity.default(collectionListElement, {
      watchCSS: true,
      prevNextButtons: true,
      draggable: !window.matchMedia("(-moz-touch-enabled: 0), (hover: hover)").matches,
      pageDots: false,
      resize: false,
      cellAlign: collectionListElement.childElementCount < 6 ? "center" : "left",
      contain: true,
      groupCells: true
    });
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastWidth) {
        this.flickityInstance.resize();
        lastWidth = window.innerWidth;
      }
    });
  }
  onUnload() {
    this.flickityInstance.destroy();
  }
  onBlockSelect(event2) {
    if (this.flickityInstance.isActive) {
      this.flickityInstance.selectCell(parseInt(event2.target.getAttribute("data-collection-index")), null, event2.detail.load);
    }
  }
};

// js/sections/CollectionSection.js
var import_fastdom4 = __toESM(require_fastdom());
var CollectionSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.currentUrl = new URL(window.location.href);
    this.mobileFilterDrawer = new CollectionFilterDrawer(this.options);
    this.displayByValuePicker = new ValuePicker("display-by-selector", { onValueSelect: this._showingCountChanged.bind(this) });
    this.sortByValuePicker = new ValuePicker("sort-by-selector", { onValueSelect: this._sortByChanged.bind(this) });
    this.productItemColorSwatch = new ProductItemColorSwatch(this.element);
    if (window.theme.pageType === "search") {
      this._loadContentResults();
    }
    window.addEventListener("popstate", () => {
      this.currentUrl = new URL(window.location.href);
      this._reload(false);
    });
    this._attachListeners();
  }
  onUnload() {
    this.delegateElement.off();
    this.mobileFilterDrawer.destroy();
    this.displayByValuePicker.destroy();
    this.sortByValuePicker.destroy();
    this.productItemColorSwatch.destroy();
  }
  onSelect(event2) {
    if (Shopify.designMode && event2.detail.load) {
      this.element.querySelector(`.collection__layout-button[data-layout-mode="${this.options["defaultLayout"]}"]`).click();
      this._showingCountChanged(this.options["defaultProductsPerPage"]);
    }
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="change-layout"]', this._changeLayout.bind(this));
    this.delegateElement.on("change", "#mobile-sort-by, #desktop-sort-by", this._sortByChanged.bind(this));
    this.delegateElement.on("change", "#showing-count", this._showingCountChanged.bind(this));
    this.delegateElement.on("click", ".pagination [data-page]", this._paginationPageChanged.bind(this));
    this.delegateElement.on("click", '[data-secondary-action="open-quick-view"]', this._openQuickView.bind(this));
    this.delegateElement.on("change", '[name^="filter."]', this._onFilterChanged.bind(this));
    this.delegateElement.on("click", '[data-action="clear-filters"]', this._onFiltersCleared.bind(this));
  }
  _openQuickView(event2, target) {
    let productUrl = new URL(`${window.location.origin}${target.getAttribute("data-product-url")}`);
    if (Responsive.matchesBreakpoint("phone") || Responsive.matchesBreakpoint("tablet")) {
      window.location.href = productUrl.href;
      return false;
    }
    let modal = document.getElementById(target.getAttribute("aria-controls"));
    modal.classList.add("is-loading");
    fetch(productUrl.href, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        const fragment = document.createRange().createContextualFragment(content);
        const modalContent = Dom.deepQuerySelector(fragment, '[data-section-type="product-quick-view"]');
        modal.querySelector(".modal__inner").replaceChildren(modalContent);
        modal.classList.remove("is-loading");
        let modalProductSection = new ProductSection(modalContent);
        let doCleanUp = () => {
          modalProductSection.onUnload();
          modal.removeEventListener("modal:closed", doCleanUp);
        };
        modal.addEventListener("modal:closed", doCleanUp);
      });
    });
  }
  /**
   * Switch layout mode
   */
  _changeLayout(event2, target) {
    if (target.classList.contains("is-selected")) {
      return;
    }
    const newLayoutMode = target.getAttribute("data-layout-mode");
    fetch(`${window.routes.cartUrl}/update.js`, {
      body: JSON.stringify({
        attributes: {
          "collection_layout": newLayoutMode
        }
      }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
        // This is needed as currently there is a bug in Shopify that assumes this header
      }
    });
    import_fastdom4.default.mutate(() => {
      Dom.getSiblings(target, ".is-selected").forEach((button) => button.classList.remove("is-selected"));
      target.classList.add("is-selected");
      this.element.querySelectorAll(".product-item").forEach((item) => {
        if (newLayoutMode === "grid") {
          item.className = `product-item product-item--vertical ${this.options["gridClasses"]}`;
        } else {
          item.className = "product-item product-item--list";
        }
      });
      this.productItemColorSwatch.recalculateSwatches();
    });
  }
  /**
   * Update the URL and reload products
   */
  _sortByChanged(value) {
    this.currentUrl.searchParams.set("sort_by", value);
    this.currentUrl.searchParams.delete("page");
    this._reload(true);
  }
  /**
   * When the number of items has changed
   */
  _showingCountChanged(value) {
    this.currentUrl.searchParams.delete("page");
    fetch(`${window.routes.cartUrl}/update.js`, {
      body: JSON.stringify({ attributes: { "collection_products_per_page": value } }),
      credentials: "same-origin",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
        // This is needed as currently there is a bug in Shopify that assumes this header
      }
    }).then(() => {
      this._reload(true);
    });
  }
  /**
   * When the page has changed
   */
  _paginationPageChanged(event2, target) {
    event2.preventDefault();
    this.currentUrl.searchParams.set("page", parseInt(target.getAttribute("data-page")));
    this._reload(true);
  }
  _onFilterChanged(event2, target) {
    const formData = new FormData(target.closest("form"));
    const searchParamsAsString = new URLSearchParams(formData).toString();
    this.currentUrl = new URL(`${window.location.pathname}?${searchParamsAsString}`, window.location.origin);
    this._reload(true);
  }
  _onFiltersCleared(event2, target) {
    this.currentUrl = new URL(target.getAttribute("data-url"), window.location.origin);
    this._reload(true);
  }
  /**
   * Reload all products from the current URL
   *
   * @private
   */
  _reload(pushState) {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (pushState) {
      window.history.pushState({ path: this.currentUrl.toString() }, "", this.currentUrl.toString());
    }
    document.dispatchEvent(new CustomEvent("theme:loading:start"));
    const computedStyles = window.getComputedStyle(document.documentElement);
    let sectionUrl = "";
    if (this.currentUrl.search) {
      sectionUrl = `${this.currentUrl.pathname}/${this.currentUrl.search}&section_id=${this.element.getAttribute("data-section-id")}`;
    } else {
      sectionUrl = `${this.currentUrl.pathname}?section_id=${this.element.getAttribute("data-section-id")}`;
    }
    try {
      this.abortController = new AbortController();
      return fetch(sectionUrl, {
        credentials: "same-origin",
        method: "GET",
        signal: this.abortController.signal
      }).then((response) => {
        response.text().then((content) => {
          let tempElement = document.createElement("div");
          tempElement.innerHTML = content;
          this.element.querySelector(".collection__dynamic-part").innerHTML = tempElement.querySelector(".collection__dynamic-part").innerHTML;
          let desktopFilters = this.element.querySelector("#desktop-filters-form"), mobileFilters = this.element.querySelector("#mobile-collection-filters"), previousMobileScrollTop = 0;
          if (mobileFilters) {
            previousMobileScrollTop = mobileFilters.querySelector(".collection-drawer__inner").scrollTop;
          }
          if (desktopFilters) {
            Array.from(this.element.querySelectorAll(".collection__filter-group-name[aria-controls]")).forEach((groupName) => {
              let newGroup = tempElement.querySelector(`[aria-controls="${groupName.getAttribute("aria-controls")}"]`);
              if (newGroup) {
                if (groupName.getAttribute("aria-expanded") === "true") {
                  newGroup.setAttribute("aria-expanded", "true");
                  newGroup.nextElementSibling.setAttribute("aria-hidden", "false");
                  newGroup.nextElementSibling.style.height = "auto";
                  newGroup.nextElementSibling.style.overflow = "visible";
                } else {
                  newGroup.setAttribute("aria-expanded", "false");
                  newGroup.nextElementSibling.setAttribute("aria-hidden", "true");
                  newGroup.nextElementSibling.style = "";
                }
              }
            });
            desktopFilters.innerHTML = tempElement.querySelector("#desktop-filters-form").innerHTML;
            mobileFilters.innerHTML = tempElement.querySelector("#mobile-collection-filters").innerHTML;
            mobileFilters.querySelector(".collection-drawer__inner").scrollTop = previousMobileScrollTop;
            this.mobileFilterDrawer._computeDrawerHeight();
          }
          this.productItemColorSwatch.recalculateSwatches();
          const elementOffset = this.element.querySelector(".collection").getBoundingClientRect().top - 25 - parseInt(computedStyles.getPropertyValue("--header-is-sticky")) * parseInt(computedStyles.getPropertyValue("--header-height"));
          if (elementOffset < 0) {
            window.scrollBy({ top: elementOffset, behavior: "smooth" });
          }
          const countJson = JSON.parse(tempElement.querySelector("[data-collection-products-count]").innerHTML);
          let showingProductsCount = this.element.querySelector(".collection__products-count-showing");
          if (showingProductsCount) {
            showingProductsCount.innerHTML = countJson["showingCount"];
          }
          this.element.querySelector(".collection__products-count-total").innerHTML = countJson["productsCount"];
          document.dispatchEvent(new CustomEvent("theme:loading:end"));
        });
      });
    } catch (e) {
    }
  }
  /**
   * ---------------------------------------------------------------------------------------------------
   * SEARCH PAGE SPECIFIC METHOD
   * ---------------------------------------------------------------------------------------------------
   */
  _loadContentResults() {
    let currentUrl = new URL(window.location.href);
    fetch(`${window.routes.searchUrl}?section_id=search-content&q=${currentUrl.searchParams.get("q")}&type=article,page`, {
      credentials: "same-origin"
    }).then((response) => {
      response.text().then((content) => {
        let linkSearchResults = this.element.querySelector(".link-search-results"), fakeDiv = document.createElement("div");
        fakeDiv.innerHTML = content;
        if (linkSearchResults && content.trim() !== "") {
          linkSearchResults.innerHTML = fakeDiv.firstElementChild.innerHTML;
          linkSearchResults.style.display = "block";
        }
      });
    });
  }
};

// js/sections/FeaturedCollectionSection.js
var import_flickity2 = __toESM(require_js());
var FeaturedCollectionSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    if (!this.options["stackable"]) {
      this.flickityInstance = new import_flickity2.default(this.element.querySelector(".product-list"), {
        watchCSS: true,
        pageDots: false,
        prevNextButtons: true,
        contain: true,
        resize: false,
        groupCells: true,
        cellAlign: "left",
        draggable: !window.matchMedia("(-moz-touch-enabled: 0), (hover: hover)").matches
      });
      let lastWidth = window.innerWidth;
      window.addEventListener("resize", () => {
        if (window.innerWidth !== lastWidth) {
          this.flickityInstance.resize();
          lastWidth = window.innerWidth;
        }
      });
    }
    this.productItemColorSwatch = new ProductItemColorSwatch(this.element);
    this._fixSafari();
    this._attachListeners();
  }
  onUnload() {
    if (!this.options["stackable"]) {
      this.flickityInstance.destroy();
    }
    window.removeEventListener("resize", this._fixSafariListener);
    this.delegateElement.off("change");
    this.productItemColorSwatch.destroy();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  _attachListeners() {
    this._fixSafariListener = this._fixSafari.bind(this);
    window.addEventListener("resize", this._fixSafariListener);
    this.delegateElement.on("click", '[data-secondary-action="open-quick-view"]', this._openQuickView.bind(this));
    if (window.ResizeObserver && this.flickityInstance) {
      this.resizeObserver = new ResizeObserver(() => {
        this.flickityInstance.resize();
      });
      this.element.querySelectorAll(".product-item").forEach((item) => {
        this.resizeObserver.observe(item);
      });
    }
  }
  /**
   * On Safari 11.1 and lower, the browser incorrectly calculate the height of flex and grid items due to a bug
   * on how padding percentage is calculated (that we use for allocating image space). This is solved in Safari 11.1 and higher.
   *
   * For those browsers, we fix that in JavaScript by setting the height directly for each aspect ratio image
   *
   * @private
   */
  _fixSafari() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("safari") && (userAgent.includes("version/10.1") || userAgent.includes("version/10.3") || userAgent.includes("version/11.0"))) {
      const isPhone = Responsive.matchesBreakpoint("phone");
      this.element.querySelectorAll(".product-item__image-wrapper .aspect-ratio, .product-item__image-wrapper .placeholder-svg").forEach((image) => {
        if (isPhone) {
          image.parentNode.style.height = null;
        } else {
          image.parentNode.style.height = `${image.clientHeight}px`;
        }
      });
    }
  }
  _openQuickView(event2, target) {
    let productUrl = new URL(`${window.location.origin}${target.getAttribute("data-product-url")}`);
    if (Responsive.matchesBreakpoint("phone") || Responsive.matchesBreakpoint("tablet")) {
      window.location.href = productUrl.href;
      return false;
    }
    let modal = document.getElementById(target.getAttribute("aria-controls"));
    modal.classList.add("is-loading");
    fetch(productUrl.href, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        const fragment = document.createRange().createContextualFragment(content);
        const modalContent = Dom.deepQuerySelector(fragment, '[data-section-type="product-quick-view"]');
        modal.querySelector(".modal__inner").replaceChildren(modalContent);
        modal.classList.remove("is-loading");
        let modalProductSection = new ProductSection(modalContent);
        let doCleanUp = () => {
          modalProductSection.onUnload();
          modal.removeEventListener("modal:closed", doCleanUp);
        };
        modal.addEventListener("modal:closed", doCleanUp);
      });
    });
  }
};

// js/sections/GiftCardSection.js
var GiftCardSection = class {
  constructor(container) {
    this.element = container;
    this.delegateElement = new main_default(this.element);
    this._createQrCode();
    this._attachListeners();
  }
  onUnload() {
    this.delegateElement.off();
  }
  _createQrCode() {
    let qrCodeElements = document.querySelectorAll(".gift-card__qr");
    qrCodeElements.forEach((qrCodeElement) => {
      new QRCode(qrCodeElement, {
        text: qrCodeElement.getAttribute("data-identifier"),
        width: 200,
        height: 200
      });
    });
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="print"]', this._print.bind(this));
    this.delegateElement.on("click", '[data-action="select-code"]', this._selectCode.bind(this));
  }
  _print() {
    window.print();
  }
  _selectCode(event2, element) {
    element.select();
  }
};

// js/sections/FooterSection.js
var FooterSection = class {
  constructor(element) {
    this.element = element;
    this.localeValuePicker = new ValuePicker("footer-locale-picker");
    this.currencyValuePicker = new ValuePicker("footer-currency-picker");
    this._setupCollapsibles();
    this._attachListeners();
  }
  onUnload() {
    window.removeEventListener("resize", this._setupCollapsiblesListener);
    this.localeValuePicker.destroy();
    this.currencyValuePicker.destroy();
  }
  _attachListeners() {
    this._setupCollapsiblesListener = this._setupCollapsibles.bind(this);
    window.addEventListener("resize", this._setupCollapsiblesListener);
  }
  /**
   * On mobile, some block items are collapsed, so we must slightly edit their HTML
   */
  _setupCollapsibles() {
    let collapsibleToggles = this.element.querySelectorAll('[data-action="toggle-collapsible"]'), isPhone = Responsive.matchesBreakpoint("phone");
    collapsibleToggles.forEach((collapsibleToggle) => {
      if (isPhone) {
        collapsibleToggle.removeAttribute("disabled");
      } else {
        collapsibleToggle.setAttribute("disabled", "disabled");
        document.getElementById(collapsibleToggle.getAttribute("aria-controls")).style.height = "";
      }
    });
  }
};

// js/components/SearchBar.js
var SearchBar = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.headerElement = this.element.closest(".header");
    this.searchBarElement = this.element.querySelector(".search-bar");
    this.inputElement = this.element.querySelector('[name="q"]');
    this.searchMenuElement = this.element.querySelector(".search-bar__menu-wrapper");
    this.searchResultsElement = this.element.querySelector(".search-bar__results");
    this.closeButtonElement = this.element.querySelector(".search-bar__close-button");
    this.productTypeFilter = "";
    this.isSearchOpen = false;
    this._attachListeners();
  }
  destroy() {
    this.delegateElement.off();
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="clear-input"]', this._clearInput.bind(this));
    this.delegateElement.on("click", '[data-action="unfix-search"]', this._unfixMobileSearch.bind(this));
    this.delegateElement.on("focusin", '[name="q"]', this._onInputFocus.bind(this));
    document.addEventListener("click", this._onFocusOut.bind(this));
    this.delegateElement.on("keydown", '[name="q"]', this._handleTab.bind(this));
    this.delegateElement.on("input", '[name="q"]', this._debounce(this._doSearch.bind(this), 250));
    this.delegateElement.on("change", "#search-product-type", this._productTypeChanged.bind(this));
    this.delegateElement.on("submit", this._onFormSubmit.bind(this));
    window.addEventListener("pageshow", (event2) => {
      if (event2.persisted) {
        this._clearInput();
        if (this.isSearchOpen) {
          this.toggleMobileSearch();
        }
      }
    });
  }
  /**
   * Toggle the mobile search (only applicable if the show condensed search is shown)
   */
  toggleMobileSearch() {
    if (this.isSearchOpen) {
      this.headerElement.classList.remove("header--search-expanded");
      this.element.classList.remove("is-visible");
    } else {
      this.headerElement.classList.add("header--search-expanded");
      this.element.classList.add("is-visible");
    }
    this.isSearchOpen = !this.isSearchOpen;
  }
  _unfixMobileSearch() {
    this.element.classList.remove("is-fixed");
    this.closeButtonElement.style.width = "";
    this.searchBarElement.classList.remove("is-expanded");
    this.searchResultsElement.setAttribute("aria-hidden", "true");
    this.inputElement.classList.remove("is-filled");
    document.documentElement.classList.remove("is-locked");
    if (this.searchMenuElement) {
      this.searchMenuElement.setAttribute("aria-hidden", "true");
    }
  }
  /**
   * Only on mobile
   */
  _clearInput() {
    this.inputElement.value = "";
    this.inputElement.classList.remove("is-filled");
    this.searchResultsElement.setAttribute("aria-hidden", "true");
    if (this.searchMenuElement) {
      this.searchMenuElement.setAttribute("aria-hidden", "false");
    }
  }
  /**
   * When the input get focus, we display the quick links if they were specified by the merchant, or we open results if
   * results were previously loaded
   */
  _onInputFocus() {
    this.element.classList.add("is-fixed");
    this.closeButtonElement.style.width = `${this.closeButtonElement.firstElementChild.offsetWidth}px`;
    document.documentElement.classList.add("is-locked");
    if (this.inputElement.value === "") {
      if (this.searchMenuElement) {
        this.searchMenuElement.setAttribute("aria-hidden", "false");
      }
      this.searchResultsElement.setAttribute("aria-hidden", "true");
    } else {
      if (this.searchMenuElement) {
        this.searchMenuElement.setAttribute("aria-hidden", "true");
      }
      this.searchResultsElement.setAttribute("aria-hidden", "false");
      this.inputElement.classList.add("is-filled");
      this.searchBarElement.classList.add("is-expanded");
    }
    if (this.searchMenuElement) {
      this.searchBarElement.classList.add("is-expanded");
    }
  }
  /**
   * Whenever the focus leaves the search, we close everything (both search results and quick links)
   */
  _onFocusOut(event2) {
    if (Responsive.matchesBreakpoint("phone")) {
      return;
    }
    if (Responsive.matchesBreakpoint("phone") || event2.target.classList.contains("search-bar__input") || event2.target.closest(".search-bar__inner")) {
      return;
    }
    setTimeout(() => {
      this.element.classList.remove("is-fixed");
      document.documentElement.classList.remove("is-locked");
      if (!this.element.contains(event2.relatedTarget)) {
        if (this.searchMenuElement) {
          this.searchMenuElement.setAttribute("aria-hidden", "true");
        }
        this.searchResultsElement.setAttribute("aria-hidden", "true");
        this.searchBarElement.classList.remove("is-expanded");
      }
    }, 150);
  }
  /**
   * This allows to slightly improve the accessibility and user experience by directly focusing on the first search results (if any)
   */
  _handleTab(event2) {
    if (event2.key !== "Tab") {
      return;
    }
    let firstFocusableElement = this.searchResultsElement.querySelector("a");
    if (firstFocusableElement) {
      firstFocusableElement.focus();
      event2.preventDefault();
    }
  }
  /**
   * Fire the different Ajax requests
   */
  _doSearch() {
    let currentInput = this.inputElement.value;
    this.lastInputValue = currentInput;
    if (currentInput === "") {
      if (this.searchMenuElement) {
        this.searchMenuElement.setAttribute("aria-hidden", "false");
      } else {
        this.searchBarElement.classList.remove("is-expanded");
      }
      this.searchResultsElement.setAttribute("aria-hidden", "true");
    } else {
      if (this.searchMenuElement) {
        this.searchMenuElement.setAttribute("aria-hidden", "true");
      }
      this.searchResultsElement.setAttribute("aria-hidden", "false");
      this.searchBarElement.classList.add("is-expanded", "is-loading");
      let queryOptions = { method: "GET", credentials: "same-origin" }, url = `${window.Shopify.routes.root}search${this._supportsPredictiveApi() ? "/suggest" : ""}`, productQuery = `${this.productTypeFilter !== "" ? `product_type:${this.productTypeFilter} AND ` : ""}${encodeURIComponent(this.lastInputValue)}`, queries = [fetch(`${url}?section_id=predictive-search&q=${productQuery}&resources[limit]=3&resources[limit_scope]=each&resources[options][fields]=title,product_type,variants.title,variants.sku,vendor`, queryOptions)];
      Promise.all(queries).then((responses) => {
        if (this.lastInputValue !== currentInput) {
          return;
        }
        Promise.all(responses.map((response) => {
          return response.text().then((responseAsText) => {
            let div = document.createElement("div");
            div.innerHTML = responseAsText;
            return div.querySelector(".search-ajax").innerHTML;
          });
        })).then((contents) => {
          this.searchBarElement.classList.remove("is-loading");
          let searchContent = document.createElement("div");
          searchContent.innerHTML = contents.join("").trim();
          let viewAll = searchContent.querySelector(".search-bar__view-all");
          if (viewAll) {
            searchContent.insertAdjacentElement("beforeend", viewAll);
          }
          this.searchBarElement.querySelector(".search-bar__results-inner").innerHTML = searchContent.innerHTML;
        });
      });
    }
  }
  _supportsPredictiveApi() {
    return JSON.parse(document.getElementById("shopify-features").innerHTML)["predictiveSearch"];
  }
  
  _productTypeChanged(event2, target) {
    target.closest(".search-bar__filter").querySelector(".search-bar__filter-active").innerText = target.options[target.selectedIndex].innerText;
    this.productTypeFilter = target.value;
    if (this.inputElement.value !== "") {
      this._doSearch();
    }
  }
  /**
   * Called when the form is submitted using the Enter key. We have to capture it and transform the query to include the wildcard
   */
  _onFormSubmit(event2) {
    let cloneNode = this.inputElement.cloneNode();
    cloneNode.setAttribute("type", "hidden");
    cloneNode.value = "";
    if (this.productTypeFilter !== "") {
      cloneNode.value += `product_type:${this.productTypeFilter}`;
      if (this.inputElement.value !== "") {
        cloneNode.value += " AND ";
      }
    }
    cloneNode.value += this.inputElement.value;
    this.inputElement.removeAttribute("name");
    this.inputElement.insertAdjacentElement("afterend", cloneNode);
  }
  /**
   * Simple function that allows to debounce
   */
  _debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
};

// js/sections/HeaderSection.js
var HeaderSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.searchBar = new SearchBar(this.element.querySelector(".header__search-bar-wrapper"));
    this.cart = new Cart(this.element.querySelector(".header__action-item--cart"), { useStickyHeader: this.options["useStickyHeader"] });
    let desktopNavigationElement = this.element.querySelector(this.options["navigationLayout"] === "inline" ? ".nav-bar" : ".header__desktop-nav");
    if (desktopNavigationElement) {
      this.desktopNavigation = new DesktopNavigation(desktopNavigationElement, this.options["navigationLayout"], this.options["desktopOpenTrigger"]);
    }
    let mobileNavigationElement = this.element.querySelector(".header__mobile-nav");
    if (mobileNavigationElement) {
      this.mobileNavigation = new MobileNavigation(mobileNavigationElement);
    }
    this._setupCssVariables();
    this._attachListeners();
  }
  onUnload() {
    this.searchBar.destroy();
    this.cart.destroy();
    if (this.desktopNavigation) {
      this.desktopNavigation.destroy();
    }
    if (this.mobileNavigation) {
      this.mobileNavigation.destroy();
    }
    window.removeEventListener("resize", this._setupCssVariablesListener);
  }
  onBlockSelect(event2) {
    if (this.desktopNavigation) {
      this.desktopNavigation.onBlockSelect(event2);
    }
  }
  onBlockDeselect(event2) {
    if (this.desktopNavigation) {
      this.desktopNavigation.onBlockDeselect(event2);
    }
  }
  _attachListeners() {
    this._setupCssVariablesListener = this._setupCssVariables.bind(this);
    window.addEventListener("resize", this._setupCssVariablesListener);
    this.delegateElement.on("click", '[data-action="toggle-search"]', this._toggleMobileSearch.bind(this));
  }
  /**
   * We have some positioning that is based on the CSS variables, so we must make sure to update them whenever
   * the section is reloaded into the editor
   */
  _setupCssVariables() {
    document.documentElement.style.setProperty("--header-height", this.element.parentNode.clientHeight + "px");
  }
  /**
   * Toggle the mobile search
   */
  _toggleMobileSearch(event2) {
    this.searchBar.toggleMobileSearch();
    event2.preventDefault();
  }
};

// js/sections/LoginSection.js
var LoginSection = class {
  constructor(element) {
    this.element = element;
    this.domDelegate = new main_default(this.element);
    this.customerLoginForm = this.element.querySelector("#customer_login");
    this.recoverPasswordForm = this.element.querySelector("#recover_customer_password");
    this.domDelegate.on("click", '[data-action="toggle-login-form"]', this._showRecoverPassword.bind(this));
  }
  _showRecoverPassword() {
    let isLoginActive = this.customerLoginForm.style.display === "block";
    if (isLoginActive) {
      this.customerLoginForm.style.display = "none";
      this.recoverPasswordForm.style.display = "block";
    } else {
      this.customerLoginForm.style.display = "block";
      this.recoverPasswordForm.style.display = "none";
    }
  }
};

// js/sections/MapSection.js
var MapSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(element.getAttribute("data-section-settings"));
    this.mapPositions = [];
    this.desktopMarkers = [];
    this.desktopMapElement = null;
    this.mobileMarkers = [];
    this.mobileMapElements = [];
    if (this.options["apiKey"] && this.options["mapAddresses"].length > 0) {
      this._loadScript().then(this._initMaps.bind(this));
    }
    this._attachListeners();
  }
  onUnload() {
    this.delegateElement.off("click");
    if (this.options["apiKey"] && this.options["mapAddresses"].length > 0) {
      google.maps.event.clearInstanceListeners(window);
    }
  }
  onBlockSelect(event2) {
    this._showStore(event2.target);
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-action="toggle-store"]', (event2, target) => {
      this._showStore(target.closest(".map__store-item"));
    });
  }
  _showStore(storeItem) {
    let toggleButton = storeItem.querySelector('[data-action="toggle-store"]');
    if (Responsive.getCurrentBreakpoint() !== "phone" && toggleButton.getAttribute("aria-expanded") === "true") {
      return;
    }
    if (toggleButton.getAttribute("aria-expanded") === "true") {
      toggleButton.setAttribute("aria-expanded", "false");
      Animation.slideUp(storeItem.querySelector(".map__store-collapsible"));
    } else {
      toggleButton.setAttribute("aria-expanded", "true");
      Animation.slideDown(storeItem.querySelector(".map__store-collapsible"));
    }
    Dom.getSiblings(storeItem).forEach((storeItemToClose) => {
      storeItemToClose.querySelector('[data-action="toggle-store"]').setAttribute("aria-expanded", "false");
      Animation.slideUp(storeItemToClose.querySelector(".map__store-collapsible"));
    });
    let storeIndex = parseInt(storeItem.getAttribute("data-store-index"));
    this.desktopMapElement.panTo(this.mapPositions[storeIndex]);
    this.desktopMarkers.forEach((marker, index) => {
      marker.setMap(this.desktopMapElement);
      if (index === storeIndex) {
        marker.icon.fillColor = this.options["markerActiveColor"];
      } else {
        marker.icon.fillColor = this.options["markerColor"];
      }
    });
  }
  _loadScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.options["apiKey"]}`;
    });
  }
  _initMaps() {
    const mapOptions = {
      zoom: this.options["zoom"],
      draggable: this.options["draggableMap"],
      clickableIcons: false,
      scrollwheel: this.options["draggableMap"],
      disableDoubleClickZoom: true,
      disableDefaultUI: !this.options["showMapControls"],
      styles: JSON.parse(this.element.querySelector("[data-gmap-style]").innerHTML)
    };
    this.desktopMapElement = new google.maps.Map(this.element.querySelector(".map__map-container--desktop .map__gmap"), mapOptions);
    this.mobileMapElements = [];
    this.element.querySelectorAll(".map__map-container--mobile .map__gmap").forEach((item, index) => {
      this.mobileMapElements[index] = new google.maps.Map(item, mapOptions);
    });
    this._geocodeAddresses();
    google.maps.event.addDomListener(window, "resize", () => {
      const desktopCenter = this.desktopMapElement.getCenter();
      google.maps.event.trigger(this.desktopMapElement, "resize");
      this.desktopMapElement.setCenter(desktopCenter);
      this.mobileMapElements.forEach((mobileMap) => {
        const mobileCenter = mobileMap.getCenter();
        google.maps.event.trigger(mobileMap, "resize");
        mobileMap.setCenter(mobileCenter);
      });
    });
  }
  _onMarkerClicked(address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
  }
  _geocodeAddresses() {
    let geocoder = new google.maps.Geocoder();
    this.options["mapAddresses"].forEach((address, index) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK) {
          if (Shopify.designMode) {
          }
        } else {
          const position = results[0].geometry.location;
          this.mapPositions[index] = position;
          this.desktopMarkers[index] = new google.maps.Marker({
            map: index === 0 ? this.desktopMapElement : null,
            position,
            icon: {
              path: "M12.5,0 C6.388889,0 0,4.7304348 0,12.5217391 C0,19.8956522 11.111111,31.1652174 11.527778,31.5826087 C11.805556,31.8608696 12.083333,32 12.5,32 C12.916667,32 13.194444,31.8608696 13.472222,31.5826087 C13.888889,31.1652174 25,19.8956522 25,12.5217391 C25,4.7304348 18.611111,0 12.5,0 Z M12,16 C9.733333,16 8,14.2666667 8,12 C8,9.7333333 9.733333,8 12,8 C14.266667,8 16,9.7333333 16,12 C16,14.2666667 14.266667,16 12,16 Z",
              fillColor: index === 0 ? this.options["markerActiveColor"] : this.options["markerColor"],
              fillOpacity: 1,
              anchor: new google.maps.Point(12, 30),
              strokeWeight: 0
            }
          });
          this.mobileMarkers[index] = new google.maps.Marker({
            map: this.mobileMapElements[index],
            position,
            icon: {
              path: "M12.5,0 C6.388889,0 0,4.7304348 0,12.5217391 C0,19.8956522 11.111111,31.1652174 11.527778,31.5826087 C11.805556,31.8608696 12.083333,32 12.5,32 C12.916667,32 13.194444,31.8608696 13.472222,31.5826087 C13.888889,31.1652174 25,19.8956522 25,12.5217391 C25,4.7304348 18.611111,0 12.5,0 Z M12,16 C9.733333,16 8,14.2666667 8,12 C8,9.7333333 9.733333,8 12,8 C14.266667,8 16,9.7333333 16,12 C16,14.2666667 14.266667,16 12,16 Z",
              fillColor: this.options["markerActiveColor"],
              fillOpacity: 1,
              anchor: new google.maps.Point(12, 30),
              strokeWeight: 0
            }
          });
          this.desktopMarkers[index].addListener("click", this._onMarkerClicked.bind(this, address));
          this.mobileMarkers[index].addListener("click", this._onMarkerClicked.bind(this, address));
          if (index === 0) {
            this.desktopMapElement.setCenter(position);
          }
          this.mobileMapElements[index].setCenter(position);
        }
      });
    });
  }
};

// js/sections/MinimalHeaderSection.js
var MinimalHeaderSection = class {
  constructor(element) {
    this.element = element;
    this._setupCssVariables();
    this._attachListeners();
  }
  onUnload() {
    window.removeEventListener("resize", this._setupCssVariablesListener);
  }
  _attachListeners() {
    this._setupCssVariablesListener = this._setupCssVariables.bind(this);
    window.addEventListener("resize", this._setupCssVariablesListener);
  }
  /**
   * We have some positioning that is based on the CSS variables, so we must make sure to update them whenever
   * the section is reloaded into the editor
   */
  _setupCssVariables() {
    document.documentElement.style.setProperty("--header-height", this.element.parentNode.clientHeight + "px");
  }
};

// js/sections/QuickLinksSection.js
var QuickLinksSection = class {
  constructor(element) {
    this.element = element;
    if (Shopify.designMode) {
      this.element.classList.remove("hidden-lap-and-up");
    }
  }
};

// js/sections/PopupsSection.js
var PopupsSection = class {
  constructor(element) {
    element.querySelectorAll("[data-popup-type]").forEach((popup) => {
      if (popup.getAttribute("data-popup-type") === "exit") {
        this.exitPopup = new ExitPopup(popup);
      } else if (popup.getAttribute("data-popup-type") === "newsletter") {
        this.newsletterPopup = new NewsletterPopup(popup);
      }
    });
  }
  onUnload() {
    if (this.exitPopup) {
      this.exitPopup.destroy();
    }
    if (this.newsletterPopup) {
      this.newsletterPopup.destroy();
    }
  }
  onBlockSelect(event2) {
    if (event2.target.getAttribute("data-popup-type") === "exit" && this.exitPopup) {
      this.exitPopup._openPopup();
    } else if (event2.target.getAttribute("data-popup-type") === "newsletter" && this.newsletterPopup) {
      this.newsletterPopup._openPopup();
    }
  }
  onBlockDeselect() {
    if (this.exitPopup) {
      this.exitPopup._closePopup();
    }
    if (this.newsletterPopup) {
      this.newsletterPopup._closePopup();
    }
  }
};

// js/sections/ProductRecommendations.js
var import_flickity3 = __toESM(require_js());
var ProductRecommendationsSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    if (this.options["useRecommendations"]) {
      this._loadRecommendations().then(this._createSlideshow.bind(this));
    } else {
      this._createSlideshow();
    }
    this.productItemColorSwatch = new ProductItemColorSwatch(this.element);
    this._fixSafari();
    this._attachListeners();
  }
  onUnload() {
    if (!this.options["stackable"]) {
      this.flickityInstance.destroy();
    }
    window.removeEventListener("resize", this._fixSafariListener);
    this.delegateElement.off("change");
    this.productItemColorSwatch.destroy();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  _attachListeners() {
    this._fixSafariListener = this._fixSafari.bind(this);
    window.addEventListener("resize", this._fixSafariListener);
    this.delegateElement.on("click", '[data-secondary-action="open-quick-view"]', this._openQuickView.bind(this));
  }
  /**
   * On Safari 11.1 and lower, the browser incorrectly calculate the height of flex and grid items due to a bug
   * on how padding percentage is calculated (that we use for allocating image space). This is solved in Safari 11.1 and higher.
   *
   * For those browsers, we fix that in JavaScript by setting the height directly for each aspect ratio image
   *
   * @private
   */
  _fixSafari() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("safari") && (userAgent.includes("version/10.1") || userAgent.includes("version/10.3") || userAgent.includes("version/11.0"))) {
      const isPhone = Responsive.matchesBreakpoint("phone");
      this.element.querySelectorAll(".product-item__image-wrapper .aspect-ratio, .product-item__image-wrapper .placeholder-svg").forEach((image) => {
        if (isPhone) {
          image.parentNode.style.height = null;
        } else {
          image.parentNode.style.height = `${image.clientHeight}px`;
        }
      });
    }
  }
  /**
   * This section uses the native product recommendations feature of Shopify (https://help.shopify.com/en/themes/liquid/objects/recommendations)
   */
  _loadRecommendations() {
    const intentParam = this.options["intent"] ? `&intent=${this.options["intent"]}` : "&intent=related";
    const url = `${window.routes.productRecommendationsUrl}?section_id=${this.element.getAttribute("data-section-id")}&product_id=${this.options["productId"]}&limit=${this.options["recommendationsCount"]}${intentParam}`;
    return fetch(url).then((response) => {
      return response.text().then((content) => {
        let container = document.createElement("div");
        container.innerHTML = content;
        this.element.querySelector(".product-recommendations").innerHTML = container.querySelector(".product-recommendations").innerHTML;
        this.productItemColorSwatch.recalculateSwatches();
      });
    });
  }
  _createSlideshow() {
    if (!this.options["stackable"]) {
      this.flickityInstance = new import_flickity3.default(this.element.querySelector(".product-list"), {
        watchCSS: true,
        pageDots: false,
        prevNextButtons: true,
        contain: true,
        resize: false,
        groupCells: true,
        cellAlign: "left",
        draggable: !window.matchMedia("(-moz-touch-enabled: 0), (hover: hover)").matches
      });
      let lastWidth = window.innerWidth;
      window.addEventListener("resize", () => {
        if (window.innerWidth !== lastWidth) {
          this.flickityInstance.resize();
          lastWidth = window.innerWidth;
        }
      });
    }
    if (window.ResizeObserver && this.flickityInstance) {
      this.resizeObserver = new ResizeObserver(() => {
        this.flickityInstance.resize();
      });
      this.element.querySelectorAll(".product-item").forEach((item) => {
        this.resizeObserver.observe(item);
      });
    }
  }
  _openQuickView(event2, target) {
    let productUrl = new URL(`${window.location.origin}${target.getAttribute("data-product-url")}`);
    if (Responsive.matchesBreakpoint("phone") || Responsive.matchesBreakpoint("tablet")) {
      window.location.href = productUrl.href;
      return false;
    }
    let modal = document.getElementById(target.getAttribute("aria-controls"));
    modal.classList.add("is-loading");
    fetch(productUrl.href, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        const fragment = document.createRange().createContextualFragment(content);
        const modalContent = Dom.deepQuerySelector(fragment, '[data-section-type="product-quick-view"]');
        modal.querySelector(".modal__inner").replaceChildren(modalContent);
        modal.classList.remove("is-loading");
        let modalProductSection = new ProductSection(modalContent);
        let doCleanUp = () => {
          modalProductSection.onUnload();
          modal.removeEventListener("modal:closed", doCleanUp);
        };
        modal.addEventListener("modal:closed", doCleanUp);
      });
    });
  }
};

// js/sections/RecentlyViewedProductsSection.js
var import_flickity4 = __toESM(require_js());
var RecentlyViewedProductsSection = class {
  constructor(element) {
    this.element = element;
    this.delegateElement = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.productItemColorSwatch = new ProductItemColorSwatch(this.element);
    this._fetchProducts();
    this._attachListeners();
  }
  onUnload() {
    if (this.flickityInstance) {
      this.flickityInstance.destroy();
    }
    this.productItemColorSwatch.destroy();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  _attachListeners() {
    this.delegateElement.on("click", '[data-secondary-action="open-quick-view"]', this._openQuickView.bind(this));
  }
  /**
   * In order to get the products to display, we hit the search template with the given IDs.
   */
  _fetchProducts() {
    const queryString = this._getSearchQueryString();
    if (queryString === "") {
      return;
    }
    fetch(`${window.routes.searchUrl}?section_id=${this.element.getAttribute("data-section-id")}&type=product&q=${queryString}`, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        let tempElement = document.createElement("div");
        tempElement.innerHTML = content;
        this.element.querySelector(".recently-viewed-products-placeholder").innerHTML = tempElement.querySelector('[data-section-type="recently-viewed-products"] .recently-viewed-products-placeholder').innerHTML;
        this.element.parentNode.style.display = "block";
        this.productItemColorSwatch.recalculateSwatches();
        this.flickityInstance = new import_flickity4.default(this.element.querySelector(".product-list"), {
          watchCSS: true,
          pageDots: false,
          prevNextButtons: true,
          contain: true,
          resize: false,
          groupCells: true,
          cellAlign: "left",
          draggable: !window.matchMedia("(-moz-touch-enabled: 0), (hover: hover)").matches
        });
        let lastWidth = window.innerWidth;
        window.addEventListener("resize", () => {
          if (window.innerWidth !== lastWidth) {
            this.flickityInstance.resize();
            lastWidth = window.innerWidth;
          }
        });
        if (window.ResizeObserver && this.flickityInstance) {
          this.resizeObserver = new ResizeObserver(() => {
            this.flickityInstance.resize();
          });
          this.element.querySelectorAll(".product-item").forEach((item) => {
            this.resizeObserver.observe(item);
          });
        }
      });
    });
  }
  _getSearchQueryString() {
    let items = JSON.parse(localStorage.getItem("recentlyViewedProducts") || "[]");
    if (items.includes(this.options["currentProductId"])) {
      items.splice(items.indexOf(this.options["currentProductId"]), 1);
    }
    return items.map((item) => {
      return "id:" + item;
    }).join(" OR ");
  }
  _openQuickView(event2, target) {
    let productUrl = new URL(`${window.location.origin}${target.getAttribute("data-product-url")}`);
    if (Responsive.matchesBreakpoint("phone") || Responsive.matchesBreakpoint("tablet")) {
      window.location.href = productUrl.href;
      return false;
    }
    let modal = document.getElementById(target.getAttribute("aria-controls"));
    modal.classList.add("is-loading");
    fetch(productUrl.href, {
      credentials: "same-origin",
      method: "GET"
    }).then((response) => {
      response.text().then((content) => {
        const fragment = document.createRange().createContextualFragment(content);
        const modalContent = Dom.deepQuerySelector(fragment, '[data-section-type="product-quick-view"]');
        modal.querySelector(".modal__inner").replaceChildren(modalContent);
        modal.classList.remove("is-loading");
        let modalProductSection = new ProductSection(modalContent);
        let doCleanUp = () => {
          modalProductSection.onUnload();
          modal.removeEventListener("modal:closed", doCleanUp);
        };
        modal.addEventListener("modal:closed", doCleanUp);
      });
    });
  }
};

// js/sections/SectionContainer.js
var SectionContainer = class {
  constructor() {
    this.constructors = [];
    this.instances = [];
    this._attachListeners();
  }
  _attachListeners() {
    document.addEventListener("shopify:section:load", this._onSectionLoad.bind(this));
    document.addEventListener("shopify:section:unload", this._onSectionUnload.bind(this));
    document.addEventListener("shopify:section:select", this._onSelect.bind(this));
    document.addEventListener("shopify:section:deselect", this._onDeselect.bind(this));
    document.addEventListener("shopify:section:reorder", this._onReorder.bind(this));
    document.addEventListener("shopify:block:select", this._onBlockSelect.bind(this));
    document.addEventListener("shopify:block:deselect", this._onBlockDeselect.bind(this));
  }
  register(type, constructor) {
    this.constructors[type] = constructor;
    document.querySelectorAll(`[data-section-type=${type}]`).forEach((container) => {
      this._createInstance(container, constructor);
    });
  }
  /**
   * Return an object from an array of objects that matches the provided key and value
   */
  _findInstance(array, key, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
  }
  /**
   * Remove an object from an array of objects by matching the provided key and value
   */
  _removeInstance(array, key, value) {
    let i = array.length;
    while (i--) {
      if (array[i][key] === value) {
        array.splice(i, 1);
        break;
      }
    }
    return array;
  }
  _onSectionLoad(event2) {
    let container = event2.target.querySelector("[data-section-id]");
    if (container) {
      this._createInstance(container);
    }
  }
  _onSectionUnload(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (!instance) {
      return;
    }
    if (typeof instance.onUnload === "function") {
      instance.onUnload(event2);
    }
    this.instances = this._removeInstance(this.instances, "id", event2.detail.sectionId);
  }
  _onSelect(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (instance && typeof instance.onSelect === "function") {
      instance.onSelect(event2);
    }
  }
  _onDeselect(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (instance && typeof instance.onDeselect === "function") {
      instance.onDeselect(event2);
    }
  }
  _onReorder(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (instance && typeof instance.onReorder === "function") {
      instance.onReorder(event2);
    }
  }
  _onBlockSelect(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (instance && typeof instance.onBlockSelect === "function") {
      instance.onBlockSelect(event2);
    }
  }
  _onBlockDeselect(event2) {
    let instance = this._findInstance(this.instances, "id", event2.detail.sectionId);
    if (instance && typeof instance.onBlockDeselect === "function") {
      instance.onBlockDeselect(event2);
    }
  }
  _createInstance(container, constructor) {
    let id = container.getAttribute("data-section-id"), type = container.getAttribute("data-section-type");
    constructor = constructor || this.constructors[type];
    if (typeof constructor === "undefined") {
      return;
    }
    let instance = Object.assign(new constructor(container), {
      id,
      type,
      container
    });
    this.instances.push(instance);
  }
};

// js/sections/SlideshowSection.js
var import_flickity_fade2 = __toESM(require_flickity_fade());
var SlideshowSection = class {
  constructor(element) {
    this.element = element;
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this.flickityInstance = new import_flickity_fade2.default(element.querySelector(".slideshow"), {
      pageDots: this.options["pageDots"],
      prevNextButtons: this.options["prevNextButtons"],
      wrapAround: true,
      dragThreshold: 12,
      resize: false,
      draggable: ">1",
      fade: this.options["transitionEffect"] === "fade",
      setGallerySize: this.options["setGallerySize"],
      adaptiveHeight: this.options["adaptiveHeight"],
      autoPlay: this.options["autoPlay"] ? this.options["cycleSpeed"] : false
    });
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastWidth) {
        this.flickityInstance.resize();
        lastWidth = window.innerWidth;
      }
    });
  }
  onUnload() {
    this.flickityInstance.destroy();
  }
  onBlockSelect(event2) {
    if (this.flickityInstance.isActive) {
      this.flickityInstance.selectCell(parseInt(event2.target.getAttribute("data-block-index")), false, event2.detail.load);
      this.flickityInstance.pausePlayer();
    }
  }
  onBlockDeselect() {
    if (this.flickityInstance.isActive) {
      this.flickityInstance.unpausePlayer();
    }
  }
};

// js/sections/TextWithIconsSection.js
var import_flickity5 = __toESM(require_js());
var TextWithIconsSection = class {
  constructor(element) {
    this.flickityInstance = new import_flickity5.default(element.querySelector(".text-with-icons"), {
      pageDots: true,
      prevNextButtons: false,
      wrapAround: true,
      autoPlay: 5e3,
      resize: false,
      watchCSS: true
    });
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth !== lastWidth) {
        this.flickityInstance.resize();
        lastWidth = window.innerWidth;
      }
    });
  }
  onUnload() {
    this.flickityInstance.destroy();
  }
  onBlockSelect(event2) {
    if (this.flickityInstance.isActive) {
      this.flickityInstance.selectCell(parseInt(event2.target.getAttribute("data-block-index")), false, event2.detail.load);
      this.flickityInstance.pausePlayer();
    }
  }
  onBlockDeselect() {
    if (this.flickityInstance.isActive) {
      this.flickityInstance.unpausePlayer();
    }
  }
};

// js/sections/VideoSection.js
var VideoSection = class {
  constructor(element) {
    this.element = element;
    this.domDelegate = new main_default(this.element);
    this.options = JSON.parse(this.element.getAttribute("data-section-settings"));
    this._attachListeners();
  }
  onUnload() {
    this.domDelegate.off("click");
  }
  _attachListeners() {
    this.domDelegate.on("click", '[data-action="play-video"]', this._playVideo.bind(this));
  }
  _playVideo(event2, target) {
    let iframe = target.querySelector("iframe");
    iframe.src = iframe.getAttribute("data-src");
    target.classList.add("is-playing");
  }
};

// js/theme.js
var import_fastdom5 = __toESM(require_fastdom());
var import_flickity6 = __toESM(require_js());

// node_modules/instant.page/instantpage.js
var _chromiumMajorVersionInUserAgent = null;
var _allowQueryString;
var _allowExternalLinks;
var _useWhitelist;
var _delayOnHover = 65;
var _lastTouchTimestamp;
var _mouseoverTimer;
var _preloadedList = /* @__PURE__ */ new Set();
var DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION = 1111;
init();
function init() {
  const isSupported = document.createElement("link").relList.supports("prefetch");
  if (!isSupported) {
    return;
  }
  const handleVaryAcceptHeader = "instantVaryAccept" in document.body.dataset || "Shopify" in window;
  const chromiumUserAgentIndex = navigator.userAgent.indexOf("Chrome/");
  if (chromiumUserAgentIndex > -1) {
    _chromiumMajorVersionInUserAgent = parseInt(navigator.userAgent.substring(chromiumUserAgentIndex + "Chrome/".length));
  }
  if (handleVaryAcceptHeader && _chromiumMajorVersionInUserAgent && _chromiumMajorVersionInUserAgent < 110) {
    return;
  }
  const mousedownShortcut = "instantMousedownShortcut" in document.body.dataset;
  _allowQueryString = "instantAllowQueryString" in document.body.dataset;
  _allowExternalLinks = "instantAllowExternalLinks" in document.body.dataset;
  _useWhitelist = "instantWhitelist" in document.body.dataset;
  const eventListenersOptions = {
    capture: true,
    passive: true
  };
  let useMousedown = false;
  let useMousedownOnly = false;
  let useViewport = false;
  if ("instantIntensity" in document.body.dataset) {
    const intensity = document.body.dataset.instantIntensity;
    if (intensity.startsWith("mousedown")) {
      useMousedown = true;
      if (intensity == "mousedown-only") {
        useMousedownOnly = true;
      }
    } else if (intensity.startsWith("viewport")) {
      const isNavigatorConnectionSaveDataEnabled = navigator.connection && navigator.connection.saveData;
      const isNavigatorConnectionLike2g = navigator.connection && navigator.connection.effectiveType && navigator.connection.effectiveType.includes("2g");
      if (!isNavigatorConnectionSaveDataEnabled && !isNavigatorConnectionLike2g) {
        if (intensity == "viewport") {
          if (document.documentElement.clientWidth * document.documentElement.clientHeight < 45e4) {
            useViewport = true;
          }
        } else if (intensity == "viewport-all") {
          useViewport = true;
        }
      }
    } else {
      const milliseconds = parseInt(intensity);
      if (!isNaN(milliseconds)) {
        _delayOnHover = milliseconds;
      }
    }
  }
  if (!useMousedownOnly) {
    document.addEventListener("touchstart", touchstartListener, eventListenersOptions);
  }
  if (!useMousedown) {
    document.addEventListener("mouseover", mouseoverListener, eventListenersOptions);
  } else if (!mousedownShortcut) {
    document.addEventListener("mousedown", mousedownListener, eventListenersOptions);
  }
  if (mousedownShortcut) {
    document.addEventListener("mousedown", mousedownShortcutListener, eventListenersOptions);
  }
  if (useViewport) {
    let requestIdleCallbackOrFallback = window.requestIdleCallback;
    if (!requestIdleCallbackOrFallback) {
      requestIdleCallbackOrFallback = (callback) => {
        callback();
      };
    }
    requestIdleCallbackOrFallback(function observeIntersection() {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const anchorElement = entry.target;
            intersectionObserver.unobserve(anchorElement);
            preload(anchorElement.href);
          }
        });
      });
      document.querySelectorAll("a").forEach((anchorElement) => {
        if (isPreloadable(anchorElement)) {
          intersectionObserver.observe(anchorElement);
        }
      });
    }, {
      timeout: 1500
    });
  }
}
function touchstartListener(event2) {
  _lastTouchTimestamp = performance.now();
  const anchorElement = event2.target.closest("a");
  if (!isPreloadable(anchorElement)) {
    return;
  }
  preload(anchorElement.href, "high");
}
function mouseoverListener(event2) {
  if (performance.now() - _lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
    return;
  }
  if (!("closest" in event2.target)) {
    return;
  }
  const anchorElement = event2.target.closest("a");
  if (!isPreloadable(anchorElement)) {
    return;
  }
  anchorElement.addEventListener("mouseout", mouseoutListener, { passive: true });
  _mouseoverTimer = setTimeout(() => {
    preload(anchorElement.href, "high");
    _mouseoverTimer = void 0;
  }, _delayOnHover);
}
function mousedownListener(event2) {
  const anchorElement = event2.target.closest("a");
  if (!isPreloadable(anchorElement)) {
    return;
  }
  preload(anchorElement.href, "high");
}
function mouseoutListener(event2) {
  if (event2.relatedTarget && event2.target.closest("a") == event2.relatedTarget.closest("a")) {
    return;
  }
  if (_mouseoverTimer) {
    clearTimeout(_mouseoverTimer);
    _mouseoverTimer = void 0;
  }
}
function mousedownShortcutListener(event2) {
  if (performance.now() - _lastTouchTimestamp < DELAY_TO_NOT_BE_CONSIDERED_A_TOUCH_INITIATED_ACTION) {
    return;
  }
  const anchorElement = event2.target.closest("a");
  if (event2.which > 1 || event2.metaKey || event2.ctrlKey) {
    return;
  }
  if (!anchorElement) {
    return;
  }
  anchorElement.addEventListener("click", function(event3) {
    if (event3.detail == 1337) {
      return;
    }
    event3.preventDefault();
  }, { capture: true, passive: false, once: true });
  const customEvent = new MouseEvent("click", { view: window, bubbles: true, cancelable: false, detail: 1337 });
  anchorElement.dispatchEvent(customEvent);
}
function isPreloadable(anchorElement) {
  if (!anchorElement || !anchorElement.href) {
    return;
  }
  if (_useWhitelist && !("instant" in anchorElement.dataset)) {
    return;
  }
  if (anchorElement.origin != location.origin) {
    let allowed = _allowExternalLinks || "instant" in anchorElement.dataset;
    if (!allowed || !_chromiumMajorVersionInUserAgent) {
      return;
    }
  }
  if (!["http:", "https:"].includes(anchorElement.protocol)) {
    return;
  }
  if (anchorElement.protocol == "http:" && location.protocol == "https:") {
    return;
  }
  if (!_allowQueryString && anchorElement.search && !("instant" in anchorElement.dataset)) {
    return;
  }
  if (anchorElement.hash && anchorElement.pathname + anchorElement.search == location.pathname + location.search) {
    return;
  }
  if ("noInstant" in anchorElement.dataset) {
    return;
  }
  return true;
}
function preload(url, fetchPriority = "auto") {
  if (_preloadedList.has(url)) {
    return;
  }
  const linkElement = document.createElement("link");
  linkElement.rel = "prefetch";
  linkElement.href = url;
  linkElement.fetchPriority = fetchPriority;
  linkElement.as = "document";
  document.head.appendChild(linkElement);
  _preloadedList.add(url);
}

// js/custom-elements/price-range.js
var PriceRange = class extends HTMLElement {
  connectedCallback() {
    this.rangeLowerBound = this.querySelector(".price-range__range-group input:first-child");
    this.rangeHigherBound = this.querySelector(".price-range__range-group input:last-child");
    this.textInputLowerBound = this.querySelector(".price-range__input:first-child input");
    this.textInputHigherBound = this.querySelector(".price-range__input:last-child input");
    this.textInputLowerBound.addEventListener("focus", () => this.textInputLowerBound.select());
    this.textInputHigherBound.addEventListener("focus", () => this.textInputHigherBound.select());
    this.textInputLowerBound.addEventListener("change", (event2) => {
      event2.target.value = Math.max(Math.min(parseInt(event2.target.value), parseInt(this.textInputHigherBound.value || event2.target.max) - 1), event2.target.min);
      this.rangeLowerBound.value = event2.target.value;
      this.rangeLowerBound.parentElement.style.setProperty("--range-min", `${parseInt(this.rangeLowerBound.value) / parseInt(this.rangeLowerBound.max) * 100}%`);
    });
    this.textInputHigherBound.addEventListener("change", (event2) => {
      event2.target.value = Math.min(Math.max(parseInt(event2.target.value), parseInt(this.textInputLowerBound.value || event2.target.min) + 1), event2.target.max);
      this.rangeHigherBound.value = event2.target.value;
      this.rangeHigherBound.parentElement.style.setProperty("--range-max", `${parseInt(this.rangeHigherBound.value) / parseInt(this.rangeHigherBound.max) * 100}%`);
    });
    this.rangeLowerBound.addEventListener("change", (event2) => {
      this.textInputLowerBound.value = event2.target.value;
      this.textInputLowerBound.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.rangeHigherBound.addEventListener("change", (event2) => {
      this.textInputHigherBound.value = event2.target.value;
      this.textInputHigherBound.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.rangeLowerBound.addEventListener("input", (event2) => {
      this.dispatchEvent(new CustomEvent("collection:abort-loading", { bubbles: true }));
      event2.target.value = Math.min(parseInt(event2.target.value), parseInt(this.textInputHigherBound.value || event2.target.max) - 1);
      event2.target.parentElement.style.setProperty("--range-min", `${parseInt(event2.target.value) / parseInt(event2.target.max) * 100}%`);
      this.textInputLowerBound.value = event2.target.value;
    });
    this.rangeHigherBound.addEventListener("input", (event2) => {
      this.dispatchEvent(new CustomEvent("collection:abort-loading", { bubbles: true }));
      event2.target.value = Math.max(parseInt(event2.target.value), parseInt(this.textInputLowerBound.value || event2.target.min) + 1);
      event2.target.parentElement.style.setProperty("--range-max", `${parseInt(event2.target.value) / parseInt(event2.target.max) * 100}%`);
      this.textInputHigherBound.value = event2.target.value;
    });
  }
};
window.customElements.define("price-range", PriceRange);

// js/custom-elements/product-recommendations.js
var import_flickity_fade3 = __toESM(require_flickity_fade());
var ProductRecommendations = class extends HTMLElement {
  constructor() {
    super();
    this._isLoaded = false;
    this.delegateElement = new main_default(this);
  }
  connectedCallback() {
    this._loadRecommendations();
  }
  _loadRecommendations() {
    if (this._isLoaded) {
      return;
    }
    this._isLoaded = true;
    const section = this.closest(".shopify-section"), intent = this.getAttribute("intent") || "related", url = `${Shopify.routes.root}recommendations/products?product_id=${this.getAttribute("product")}&limit=${this.getAttribute("limit") || 4}&section_id=${this.getAttribute("section-id")}&intent=${intent}`;
    fetch(url).then((response) => {
      response.text().then((text) => {
        const tempDiv = new DOMParser().parseFromString(text, "text/html"), productRecommendationsElement = tempDiv.querySelector("product-recommendations");
        if (productRecommendationsElement.childElementCount > 0) {
          this.replaceChildren(...document.importNode(productRecommendationsElement, true).childNodes);
          this.flickityInstance = new import_flickity_fade3.default(this.querySelector(".complementary-product-list"), {
            pageDots: false,
            watchCSS: true,
            groupCells: 2,
            cellAlign: "left",
            prevNextButtons: true,
            wrapAround: true,
            dragThreshold: 12,
            percentPosition: true,
            resize: false,
            draggable: ">1"
          });
        } else {
          if (intent === "related") {
            section.remove();
          } else {
            this.remove();
          }
        }
      });
    });
  }
};
if (!window.customElements.get("product-recommendations")) {
  window.customElements.define("product-recommendations", ProductRecommendations);
}

// js/custom-elements/privacy-banner.js
var PrivacyBanner = class extends HTMLElement {
  constructor() {
    super();
    this.domDelegate = new main_default(this);
    window.Shopify.loadFeatures([{
      name: "consent-tracking-api",
      version: "0.1",
      onLoad: this._setupCookieBar.bind(this)
    }]);
    this.domDelegate.on("click", '[data-action="accept-terms"]', this._acceptCookieBarTerms.bind(this));
    this.domDelegate.on("click", '[data-action="decline-terms"]', this._declineCookieBarTerms.bind(this));
  }
  connectedCallback() {
    this.closest(".shopify-section").addEventListener("shopify:section:select", () => this.setAttribute("aria-hidden", "false"));
    this.closest(".shopify-section").addEventListener("shopify:section:deselect", () => this.setAttribute("aria-hidden", "true"));
  }
  _setupCookieBar() {
    try {
      if (window.Shopify.customerPrivacy.shouldShowGDPRBanner()) {
        this.setAttribute("aria-hidden", "false");
      }
    } catch (e) {
    }
  }
  _acceptCookieBarTerms() {
    window.Shopify.customerPrivacy.setTrackingConsent(true, () => this.setAttribute("aria-hidden", "true"));
  }
  _declineCookieBarTerms() {
    window.Shopify.customerPrivacy.setTrackingConsent(false, () => this.setAttribute("aria-hidden", "true"));
  }
};
if (!window.customElements.get("privacy-banner")) {
  window.customElements.define("privacy-banner", PrivacyBanner);
}

// js/custom-elements/gift-card-recipient.js
var GiftCardRecipient = class extends HTMLElement {
  connectedCallback() {
    const properties = Array.from(this.querySelectorAll('[name*="properties"]')), checkboxPropertyName = "properties[__shopify_send_gift_card_to_recipient]";
    this.recipientCheckbox = properties.find((input) => input.name === checkboxPropertyName);
    this.recipientOtherProperties = properties.filter((input) => input.name !== checkboxPropertyName);
    this.recipientFieldsContainer = this.querySelector(".gift-card-recipient__fields");
    this.recipientCheckbox?.addEventListener("change", this._synchronizeProperties.bind(this));
    this.offsetProperty = this.querySelector('[name="properties[__shopify_offset]"]');
    if (this.offsetProperty) {
      this.offsetProperty.value = (/* @__PURE__ */ new Date()).getTimezoneOffset().toString();
    }
    this.recipientSendOnProperty = this.querySelector('[name="properties[Send on]"]');
    const minDate = /* @__PURE__ */ new Date();
    const maxDate = /* @__PURE__ */ new Date();
    maxDate.setDate(minDate.getDate() + 90);
    this.recipientSendOnProperty?.setAttribute("min", this._formatDate(minDate));
    this.recipientSendOnProperty?.setAttribute("max", this._formatDate(maxDate));
    this._synchronizeProperties();
  }
  _synchronizeProperties() {
    this.recipientOtherProperties.forEach((property) => property.disabled = !this.recipientCheckbox.checked);
    this.recipientFieldsContainer.classList.toggle("js:hidden", !this.recipientCheckbox.checked);
  }
  _formatDate(date) {
    const offset = date.getTimezoneOffset();
    const offsetDate = new Date(date.getTime() - offset * 60 * 1e3);
    return offsetDate.toISOString().split("T")[0];
  }
};
if (!window.customElements.get("gift-card-recipient")) {
  window.customElements.define("gift-card-recipient", GiftCardRecipient);
}

// js/custom-elements/product-rerender.js
var _abortController, _ProductRerender_instances, onRerender_fn;
var ProductRerender = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _ProductRerender_instances);
    __privateAdd(this, _abortController);
  }
  connectedCallback() {
    __privateSet(this, _abortController, new AbortController());
    if (!this.id || !this.hasAttribute("observe-form")) {
      console.warn('The <product-rerender> requires an ID to identify the element to re-render, and an "observe-form" attribute referencing to the form to monitor.');
    }
    document.forms[this.getAttribute("observe-form")]?.addEventListener("product:rerender", __privateMethod(this, _ProductRerender_instances, onRerender_fn).bind(this), { signal: __privateGet(this, _abortController).signal });
  }
  disconnectedCallback() {
    __privateGet(this, _abortController).abort();
  }
};
_abortController = new WeakMap();
_ProductRerender_instances = new WeakSet();
onRerender_fn = function(event2) {
  const matchingElement = Dom.deepQuerySelector(event2.detail.htmlFragment, `#${this.id}`);
  if (!matchingElement) {
    return;
  }
  const focusedElement = document.activeElement;
  if (!this.hasAttribute("allow-partial-rerender") || event2.detail.productChange) {
    this.replaceWith(matchingElement);
  } else {
    const blockTypes = ["product-meta", "payment-terms", "variant-selector", "volume-pricing", "buy-buttons", "store-pickup", "liquid"];
    blockTypes.forEach((blockType) => {
      this.querySelectorAll(`[data-block-type="${blockType}"]`).forEach((element) => {
        const matchingBlock = matchingElement.querySelector(`[data-block-type="${blockType}"][data-block-id="${element.getAttribute("data-block-id")}"]`);
        if (matchingBlock) {
          if (blockType === "buy-buttons") {
            element.querySelector(".product-form__payment-container").replaceWith(matchingBlock.querySelector(".product-form__payment-container"));
          } else if (blockType === "variant-selector") {
            const previousQuantity = element.querySelector('[name="quantity"]')?.value;
            element.replaceWith(matchingBlock);
            if (previousQuantity) {
              const quantityInput = matchingBlock.querySelector('[name="quantity"]');
              quantityInput.value = previousQuantity;
              quantityInput.dispatchEvent(new Event("change", { bubbles: true }));
            }
          } else {
            element.replaceWith(matchingBlock);
          }
        }
      });
    });
  }
  if (focusedElement.id) {
    const element = document.getElementById(focusedElement.id);
    if (this.contains(element)) {
      element.focus();
    }
  }
};
if (!window.customElements.get("product-rerender")) {
  window.customElements.define("product-rerender", ProductRerender);
}

// js/custom-elements/progress-bar.js
var ProgressBar = class extends HTMLElement {
  connectedCallback() {
    new IntersectionObserver(this._onBecameVisible.bind(this)).observe(this);
  }
  _onBecameVisible(entries) {
    if (entries[0].isIntersecting) {
      const stockCountdownProgress = Math.min(Math.max(this.getAttribute("data-variant-inventory") / parseInt(this.getAttribute("data-stock-countdown-max")) * 100, 0), 100);
      this.firstElementChild.style.width = `${stockCountdownProgress}%`;
    }
  }
};
if (!window.customElements.get("progress-bar")) {
  window.customElements.define("progress-bar", ProgressBar);
}

// js/custom-elements/buy-button.js
var _onClickListener, _BuyButton_instances, addToCart_fn, showAlert_fn;
var BuyButton = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __privateAdd(this, _BuyButton_instances);
    __privateAdd(this, _onClickListener, __privateMethod(this, _BuyButton_instances, addToCart_fn).bind(this));
  }
  connectedCallback() {
    this.addEventListener("click", __privateGet(this, _onClickListener));
  }
  disconnectedCallback() {
    this.removeEventListener("click", __privateGet(this, _onClickListener));
  }
};
_onClickListener = new WeakMap();
_BuyButton_instances = new WeakSet();
addToCart_fn = function(event2) {
  event2.preventDefault();
  event2.stopPropagation();
  event2.target.setAttribute("disabled", "disabled");
  document.dispatchEvent(new CustomEvent("theme:loading:start"));
  const formElement = event2.target.closest('form[action*="/cart/add"]');
  fetch(`${window.routes.cartAddUrl}.js`, {
    body: JSON.stringify(Form.serialize(formElement)),
    credentials: "same-origin",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
      // This is needed as currently there is a bug in Shopify that assumes this header
    }
  }).then((response) => {
    event2.target.removeAttribute("disabled");
    let element = document.querySelector(".header");
    let sectionType = event2.target.closest("[data-section-type]")?.getAttribute("data-section-type");
    if (sectionType === "product" || sectionType === "product-quick-view") {
      element = event2.target.closest(".product-form");
    }
    if (!element) {
      element = document.body;
    }
    this.dispatchEvent(new CustomEvent("product:added", {
      bubbles: true,
      detail: {
        button: event2.target,
        variant: null,
        quantity: parseInt(formElement.querySelector('[name="quantity"]').value),
        productAdded: response.ok
      }
    }));
    if (response.ok) {
      if (theme.pageType === "cart" || window.theme.cartType === "page") {
        window.location.href = window.routes.cartUrl;
        return;
      }
      if (window.theme.cartType === "drawer") {
        document.dispatchEvent(new CustomEvent("modal:close"));
      }
      if (window.theme.cartType === "message") {
        __privateMethod(this, _BuyButton_instances, showAlert_fn).call(this, window.languages.productAdded, "success", element);
      }
    } else {
      response.json().then((content) => {
        __privateMethod(this, _BuyButton_instances, showAlert_fn).call(this, content["description"], "error", element);
      });
      document.dispatchEvent(new CustomEvent("theme:loading:end"));
    }
  });
  event2.preventDefault();
};
showAlert_fn = function(message, type, afterElement) {
  let cssModifier = afterElement.closest("[data-section-type]").getAttribute("data-section-type");
  let messageElement = document.createElement("div");
  messageElement.className = `cart__status-message cart__status-message--${cssModifier}`;
  messageElement.innerHTML = `<div class="alert ${type === "success" ? "alert--success" : "alert--error"}"><p ${cssModifier === "header" ? 'class="container"' : ""}>${message}</p></div>`;
  afterElement.append(messageElement);
  Animation.slideDown(messageElement);
  setTimeout(function() {
    Animation.slideUp(messageElement, () => {
      messageElement.remove();
    });
  }, 5500);
};
if (!window.customElements.get("buy-button")) {
  window.customElements.define("buy-button", BuyButton);
}

// js/theme.js
(function() {
  const bootTheme = () => {
    if (window.NodeList && !NodeList.prototype.forEach) {
      NodeList.prototype.forEach = function(callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
          callback.call(thisArg, this[i], i, this);
        }
      };
    }
    new CollapsibleManager();
    new LoadingBar();
    new ModalManager();
    new PopoverManager();
    let sections = new SectionContainer();
    sections.register("account", AccountSection);
    sections.register("announcement-bar", AnnouncementBarSection);
    sections.register("blog", BlogSection);
    sections.register("blog-sidebar", BlogSidebarSection);
    sections.register("blog-post", BlogPostSection);
    sections.register("cart", CartSection);
    sections.register("collection-list", CollectionListSection);
    sections.register("collection", CollectionSection);
    sections.register("featured-collection", FeaturedCollectionSection);
    sections.register("footer", FooterSection);
    sections.register("gift-card", GiftCardSection);
    sections.register("header", HeaderSection);
    sections.register("login", LoginSection);
    sections.register("map", MapSection);
    sections.register("minimal-header", MinimalHeaderSection);
    sections.register("popups", PopupsSection);
    sections.register("product-recommendations", ProductRecommendationsSection);
    sections.register("product", ProductSection);
    sections.register("quick-links", QuickLinksSection);
    sections.register("recently-viewed-products", RecentlyViewedProductsSection);
    sections.register("slideshow", SlideshowSection);
    sections.register("text-with-icons", TextWithIconsSection);
    sections.register("video", VideoSection);
    (function() {
      document.querySelectorAll(".rte table").forEach((table) => {
        table.outerHTML = '<div class="table-wrapper">' + table.outerHTML + "</div>";
      });
      document.querySelectorAll(".rte iframe").forEach((iframe) => {
        if (iframe.src.indexOf("youtube") !== -1 || iframe.src.indexOf("youtu.be") !== -1 || iframe.src.indexOf("vimeo") !== -1) {
          iframe.outerHTML = '<div class="video-wrapper">' + iframe.outerHTML + "</div>";
          iframe.src = iframe.src;
        }
      });
    })();
    (function() {
      let touchingCarousel = false, touchStartCoords;
      document.body.addEventListener("touchstart", function(e) {
        let flickitySliderElement = e.target.closest(".flickity-slider");
        if (flickitySliderElement) {
          let flickity = import_flickity6.default.data(flickitySliderElement.closest(".flickity-enabled"));
          if (flickity.isDraggable) {
            touchingCarousel = true;
          } else {
            touchingCarousel = false;
            return;
          }
        } else {
          touchingCarousel = false;
          return;
        }
        touchStartCoords = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        };
      });
      document.body.addEventListener("touchmove", function(e) {
        if (!(touchingCarousel && e.cancelable)) {
          return;
        }
        let moveVector = {
          x: e.touches[0].pageX - touchStartCoords.x,
          y: e.touches[0].pageY - touchStartCoords.y
        };
        if (Math.abs(moveVector.x) > 8)
          e.preventDefault();
      }, { passive: false });
    })();
    (function() {
      let documentDelegate = new main_default(document.body);
      documentDelegate.on("click", ".expandable-content__toggle", (item, expandableButton) => {
        let parentSection = expandableButton.closest(".expandable-content");
        if (parentSection.getAttribute("aria-expanded") === "true") {
          parentSection.setAttribute("aria-expanded", "false");
          parentSection.style["max-height"] = `${parentSection.offsetHeight}px`;
          parentSection.offsetHeight;
          parentSection.style["max-height"] = null;
          let expandableText = expandableButton.querySelector(".expandable-content__toggle-text");
          expandableText.innerHTML = expandableText.getAttribute("data-view-more");
          let parentCard = parentSection.closest(".card");
          if (parentCard) {
            let amountToScroll = parentCard.getBoundingClientRect().top - 15 - parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-height"));
            window.scrollBy({ top: amountToScroll, behavior: "smooth" });
          }
        } else {
          parentSection.setAttribute("aria-expanded", "true");
          if (expandableButton.previousElementSibling) {
            expandableButton.previousElementSibling.style["margin-bottom"] = `${parseInt(expandableButton.clientHeight)}px`;
          }
          Animation.slideDown(parentSection, null, "max-height");
          let expandableText = expandableButton.querySelector(".expandable-content__toggle-text");
          expandableText.innerHTML = expandableText.getAttribute("data-view-less");
        }
      });
      let processCollapsibles = () => {
        document.querySelectorAll(".expandable-content[aria-expanded]").forEach(function(item) {
          if (item.scrollHeight > item.clientHeight) {
            item.classList.add("expandable-content--expandable");
          } else {
            item.setAttribute("aria-expanded", "true");
          }
        });
      };
      document.addEventListener("shopify:section:load", function(event2) {
        processCollapsibles();
      });
      processCollapsibles();
    })();
    (function() {
      if (Responsive.getCurrentBreakpoint() === "phone") {
        let autoFocusedElements = document.querySelectorAll("input[autofocus]");
        for (let i = 0; i < autoFocusedElements.length; i++) {
          autoFocusedElements[i].blur();
          autoFocusedElements[i].removeAttribute("autofocus");
        }
      }
    })();
    (function() {
      let documentDelegate = new main_default(document.body);
      documentDelegate.on("click", '[href^="#"], [data-href]', (event2, target) => {
        const selector = target.hasAttribute("href") ? target.getAttribute("href") : target.getAttribute("data-href");
        if (selector === "#" || selector === "#main") {
          return;
        }
        let element = null;
        try {
          element = document.querySelector(selector);
        } catch (exception) {
          return;
        }
        let offset = parseInt(target.getAttribute("data-offset") || 0), toTop = 0;
        while (element.offsetParent.tagName !== "BODY") {
          toTop += element.offsetTop;
          element = element.offsetParent;
        }
        toTop += element.offsetTop;
        window.scrollTo({ behavior: "smooth", top: toTop - offset });
        event2.preventDefault();
      });
    })();
    (function() {
      function handleFirstTab(event2) {
        if (event2.key === "Tab") {
          document.body.classList.add("is-tabbing");
          window.removeEventListener("keydown", handleFirstTab);
        }
      }
      window.addEventListener("keydown", handleFirstTab);
    })();
    (function() {
      let documentDelegate = new main_default(document.body);
      documentDelegate.on("keyup", "input, textarea", (event2, target) => {
        target.classList.toggle("is-filled", target.value !== "");
      });
      documentDelegate.on("change", "select", (event2, target) => {
        target.parentNode.classList.toggle("is-filled", target.value !== "");
      });
    })();
    (function() {
      let links = document.links;
      import_fastdom5.default.mutate(() => {
        for (let i = 0, linksLength = links.length; i < linksLength; i++) {
          if (links[i].hostname !== window.location.hostname) {
            links[i].target = "_blank";
            links[i].relList.add("noopener");
            links[i].setAttribute("aria-describedby", "a11y-new-window-message");
          }
        }
      });
    })();
  };
  if ("fetch" in window && "assign" in Object) {
    bootTheme();
  } else {
    let scriptEl = document.createElement("script");
    scriptEl.src = "//cdn.polyfill.io/v3/polyfill.min.js?unknown=polyfill&features=fetch,Element.prototype.closest,Element.prototype.matches,Element.prototype.remove,Element.prototype.classList,Array.prototype.includes,String.prototype.includes,Object.assign,CustomEvent,URL,DOMTokenList";
    scriptEl.async = false;
    scriptEl.onload = () => {
      bootTheme();
    };
    document.head.appendChild(scriptEl);
  }
})();


