let md = require('markdown-it')();
//let markdownItAttrs = require('markdown-it-attrs');
let markdownItAttrs = require('../');

md.use(markdownItAttrs);

let src = '# header {.style-me}\n';
src += 'paragraph {data-toggle=modal}';

md.render(src);
