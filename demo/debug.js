/* eslint-env es6 */
const md = require('@gerhobbelt/markdown-it')();
const markdownItAttrs = require('../');
const assert = require('assert');

md.use(markdownItAttrs, {
  leftDelimiter: '{{',
  rightDelimiter: '}}'
}).use(require('@gerhobbelt/markdown-it-implicit-figures'));

let src = 'asdf *asd*{{.c}} khg';

let res = md.render(src);

console.log(res);  // eslint-disable-line

assert.strictEqual(res, '<p>asdf <em class="c">asd</em> khg</p>\n');
