/** Simple jQuery-like DOM query class **/
window.miniQuery = (function (document, undefined) {

  /**  Constructor **/
  function MiniQuery(selector, context) {
    return new QuerySelector(selector, context);
  }

  /** Find an element or elements that match the selector **/
  function QuerySelector(selector, context) {
    let i, m, match, result;

    if (context === undefined) {
      context = document;
    }

    // If context is a QuerySelector object
    if (context instanceof QuerySelector) {
      context = context[0];
    }

    // String selector
    if (typeof selector === 'string') {

      // Handle HTML strings
      if (/^(?:\s*(<[\w\W]+>)[^>]*)$/.test(selector)) {
        return createFragment.call(this, selector);

      // Try to handle simple selectors
      // Credit: code inspired by the Sizzle library which is part of jQuery.
      } else if ((match = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/.exec(selector))) {

        // ID selector
        if ((m = match[1])) {
          result = context.getElementById(m);

          if (result) {
            this[0] = result;
            this.el = this[0];
            this.length = 1;
          }

          return this;

        // Type selector
        } else if (match[2]) {
          result = context.getElementsByTagName(selector);
          return wrap.call(this, result);

        // Class selector
        } else if ((m = match[3])) {
          result = context.getElementsByClassName(m);
          return wrap.call(this, result);
        }
      }

      // Or let querySelectorAll handle the more complex selectors
      result = context.querySelectorAll(selector);
      return wrap.call(this, result);

    // DOMElement selector    
    }  else if (selector && selector.nodeType) {
      this[0] = selector;
      this.el = this[0];
      this.length = 1;
      return this;

    // Array of DOMElements
    } else if (Array.isArray(selector)) {
      return wrap.call(this, selector);
    }

    return wrap.call(this, [selector]);
  }

  /** Wrap elements in the MiniQuery object **/
  function wrap(result) {
    let i, length = result.length;

    for (i=0; i<length; i++) {
      this[i] = result[i];
    }

    this.el = this[0];
    this.length = length;

    return this;
  }

  /** Build html fragment from a string **/
  function buildFragment(html) {
    const template = document.createElement('template'); // No IE support  

    template.innerHTML = html.trim();

    return template.content;
  }

  /** Create html elements from a string **/
  function createFragment(html, noWrap) {
    const nodes = buildFragment(html).childNodes;
    const length = nodes.length;
    const result = [];

    for (let i=0; i < length; i++) {
      result.push(nodes[i]);
    }

    if (noWrap) {
      return result;
    } else {
      return wrap.call(this, result);
    }
  }

  function camelCase (value) {
      return value.replace(/-([a-z])/g, (all, letter) => letter.toUpperCase());
  }

  // Define the prototype
  QuerySelector.prototype = MiniQuery.prototype = {

    // First element
    el: null,

    // Default length
    length: 0,

    /** Add a class to each element in the set **/
    addClass: function (value) {
      const thisArg = this;

      if (value && value.length) {
        value.trim().split(' ').forEach(cls => {
          thisArg.each(element => {
            element.classList.add(cls);
          });
        });
      }

      return this;
    },

    /** Append one or more children to each element in the set **/
    append: function (node) {
      if (!node) {
        return this;
      }

      // Handle HTML strings
      if (typeof node === 'string') {
        node = createFragment(node, true);
      }

      // DOMElement
      if (node.nodeType) {
        this.each(element => {
          element.appendChild(node);
        });

      // QuerySelector objects
      } else {
        for (let i=0, len=node.length; i<len; i++) {
          this.each(element => {
            element.appendChild(node[i]);
          });
        }
      }

      return this;
    },

    /** Get an attribute from the first element or set one or more attribute for each element in the set **/
    attr: function (key, value) {
      if (typeof key === 'string' && value === undefined) {
        return this[0] ? this[0].getAttribute(key) : undefined;
      }

      this.each(element => {
        if (typeof key === 'object') {
          for (const item in key) {
            element.setAttribute(item, key[item]);
          }
        } else {
          element.setAttribute(key, value);
        }
      });

      return this;
    },

    /** Get the value of a style property of the first element or set its value for each element in the set **/
    css: function (key, value) {
      key = camelCase(key);

      if (value === undefined) {
        if (this[0]) {nowrap
          value = this[0].style[key];
          return (!isNaN(parseFloat(value)) && !isNaN(value - 0)) ? parseFloat(value) : value;
        }

        return undefined;
      }

      return this.each(element => {
        element.style[key] = value;
      });
    },

    /** Executes the callback function once for each element in the set **/
    each: function (callback, context) {
      let i, length = this.length;

      for (i=0; i<length; i++) {
        callback.call(context, this[i], i);
      }

      return this;
    },

    /** Return the first element in the set **/
    first: function () {
      return this.get(0);
    },

    /** Return the Nth element in the matched element set **/
    get: function (n) {
      return n < 0 ? this[n + this.length] : this[n];
    },

    /** Check if the first element in the set has the provided class **/
    hasClass: function (value) {
      return this[0] ? this[0].classList.contains(value) : false;
    },

    /** Get the content of the first element or set the content for each element in the set **/
    html: function (content) {
      if (content === undefined) {
        return this[0] ? this[0].innerHTML : undefined;
      }

      this.each(element => {
        element.innerHTML = content;
      });

      return this;
    },

    /** Return the last element in the set **/
    last: function () {
      return this.get(-1);
    },

    /** Add an event listener to each element in the set **/
    on: function (events, selector, func, useCapture) {
      let thisArg = this;

      // Normal event (no delegation)
      if (typeof selector === 'function') {
        useCapture = func;
        func = selector;
        selector = null;
      }

      useCapture = useCapture || false;

      events.trim().split(' ').forEach(event => {
        thisArg.each(element => {
          if (selector === null) {
            element.addEventListener(event, func, useCapture);
          } else {
            element.addEventListener(event, e => {
              if (matches.call(e.target, selector)) {
                func.call(e.target, e);
              }
            }, useCapture);
          }
        });
      });

      return this;
    },

    /** Return the parent of each element in the set **/
    parent: function (selector) {
      const result = [];

      this.each(element => {
        if (!selector || selector && matches.call(element.parentNode, selector)) {
          result.push(element.parentNode);
        }
      });

      return wrap.call(this, result);
    },

    /** Get a property from the first element or set a property for each element in the set **/
    prop: function (key, value) {
      if (typeof key === 'string' && value === undefined) {
        return this[0] ? this[0][key] : undefined;
      }

      this.each(element => {
        element[key] = value;
      });

      return this;
    },

    /** Remove an attribute from each element in the set **/
    removeAttr: function (key) {
      return this.each(element => {
        element.removeAttribute(key);
      });
    },

    /** Remove a class from each element in the set **/
    removeClass: function (value) {
      const thisArg = this;

      if (value && value.length) {
        value.trim().split(' ').forEach(cls => {
          thisArg.each(element => {
            element.classList.remove(cls);
          });
        });
      }

      return this;
    },

    /** Replace the HTML content for each element in the set **/
    replaceWith: function (content) {
      return this.each(element => {
        element.outerHTML = content;
      });
    },

    /** Toggle a class for each element in the set **/
    toggleClass: function (value) {
      const thisArg = this;

      if (value && value.length) {
        value.trim().split(' ').forEach(cls => {
          thisArg.each(element => {
            element.classList.toggle(cls);
          });
        });
      }

      return this;
    },

    /** Trigger a custom event on each element in the set **/
    trigger: function (type, detail) {
      const event = new CustomEvent(type, {
        bubbles: false,
        cancelable: false,
        detail: detail
      });

      this.each(element => {
        element.dispatchEvent(event);
      });

      return this;
    },

    /** Get the value of the first element or set the value of each element in the set **/
    val: function (value) {
      if (value === undefined) {
        return this[0] ? this[0].value : undefined;
      }

      return this.each(element => {
        element.value = value;
      });
    }
  };

  return MiniQuery;

})(document);