'use strict';

function getAttrs(str, start, options) {
  const allowedKeyChars = /[^\t\n\f />"'=]/;
  const pairSeparator = ' ';
  const keySeparator = '=';
  const classChar = '.';
  const idChar = '#';
  const attrs = [];
  let key = '';
  let value = '';
  let parsingKey = true;
  let valueInsideQuotes = false;

  for (let i = start + options.leftDelimiter.length; i < str.length; i++) {
    if (str.slice(i, i + options.rightDelimiter.length) === options.rightDelimiter) {
      if (key !== '') {
        attrs.push([key, value]);
      }

      break;
    }

    let char_ = str.charAt(i);

    if (char_ === keySeparator && parsingKey) {
      parsingKey = false;
      continue;
    }

    if (char_ === classChar && key === '') {
      if (str.charAt(i + 1) === classChar) {
        key = 'css-module';
        i += 1;
      } else {
        key = 'class';
      }

      parsingKey = false;
      continue;
    }

    if (char_ === idChar && key === '') {
      key = 'id';
      parsingKey = false;
      continue;
    }

    if (char_ === '"' && value === '') {
      valueInsideQuotes = true;
      continue;
    }

    if (char_ === '"' && valueInsideQuotes) {
      valueInsideQuotes = false;
      continue;
    }

    if (char_ === pairSeparator && !valueInsideQuotes) {
      if (key === '') {
        continue;
      }

      attrs.push([key, value]);
      key = '';
      value = '';
      parsingKey = true;
      continue;
    }

    if (parsingKey && char_.search(allowedKeyChars) === -1) {
      continue;
    }

    if (parsingKey) {
      key += char_;
      continue;
    }

    value += char_;
  }

  if (options.allowedAttributes && options.allowedAttributes.length) {
    let allowedAttributes = options.allowedAttributes;
    return attrs.filter(function (attrPair) {
      let attr = attrPair[0];

      function isAllowedAttribute(allowedAttribute) {
        return attr === allowedAttribute || allowedAttribute instanceof RegExp && allowedAttribute.test(attr);
      }

      return allowedAttributes.some(isAllowedAttribute);
    });
  }

  return attrs;
}

function addAttrs(attrs, token) {
  for (let j = 0, l = attrs.length; j < l; ++j) {
    let key = attrs[j][0];

    if (key === 'class') {
      token.attrJoin('class', attrs[j][1]);
    } else if (key === 'css-module') {
      token.attrJoin('css-module', attrs[j][1]);
    } else {
      token.attrPush(attrs[j]);
    }
  }

  return token;
}

function hasDelimiters(where, options) {
  if (!where) {
    throw new Error('Parameter `where` not passed. Should be "start", "middle", "end" or "only".');
  }

  return function (str) {
    let minCurlyLength = options.leftDelimiter.length + 1 + options.rightDelimiter.length;

    if (!str || typeof str !== 'string' || str.length < minCurlyLength) {
      return false;
    }

    function validCurlyLength(curly) {
      let isClass = curly.charAt(options.leftDelimiter.length) === '.';
      let isId = curly.charAt(options.leftDelimiter.length) === '#';
      return isClass || isId ? curly.length >= minCurlyLength + 1 : curly.length >= minCurlyLength;
    }

    let start, end, slice, nextChar;
    let rightDelimiterMinimumShift = minCurlyLength - options.rightDelimiter.length;

    switch (where) {
      case 'start':
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, rightDelimiterMinimumShift);
        nextChar = str.charAt(end + options.rightDelimiter.length);

        if (nextChar && options.rightDelimiter.indexOf(nextChar) !== -1) {
          end = -1;
        }

        break;

      case 'end':
        start = str.lastIndexOf(options.leftDelimiter);
        end = start === -1 ? -1 : str.indexOf(options.rightDelimiter, start + rightDelimiterMinimumShift);
        end = end === str.length - options.rightDelimiter.length ? end : -1;
        break;

      case 'only':
        slice = str.slice(0, options.leftDelimiter.length);
        start = slice === options.leftDelimiter ? 0 : -1;
        slice = str.slice(str.length - options.rightDelimiter.length);
        end = slice === options.rightDelimiter ? str.length - options.rightDelimiter.length : -1;
        break;
    }

    return start !== -1 && end !== -1 && validCurlyLength(str.substring(start, end + options.rightDelimiter.length));
  };
}

function removeDelimiter(str, options) {
  const start = escapeRegExp(options.leftDelimiter);
  const end = escapeRegExp(options.rightDelimiter);
  let curly = new RegExp('[ \\n]?' + start + '[^' + start + end + ']+' + end + '$');
  let pos = str.search(curly);
  return pos !== -1 ? str.slice(0, pos) : str;
}

function escapeRegExp(s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getMatchingOpeningToken(tokens, i) {
  if (tokens[i].type === 'softbreak') {
    return false;
  }

  if (tokens[i].nesting === 0) {
    return tokens[i];
  }

  let level = tokens[i].level;
  let type = tokens[i].type.replace('_close', '_open');

  for (; i >= 0; --i) {
    if (tokens[i].type === type && tokens[i].level === level) {
      return tokens[i];
    }
  }

  return false;
}

let HTML_ESCAPE_TEST_RE = /[&<>"]/;
let HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
let HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }

  return str;
}

exports.addAttrs = addAttrs;
exports.escapeHtml = escapeHtml;
exports.escapeRegExp = escapeRegExp;
exports.getAttrs = getAttrs;
exports.getMatchingOpeningToken = getMatchingOpeningToken;
exports.hasDelimiters = hasDelimiters;
exports.removeDelimiter = removeDelimiter;
