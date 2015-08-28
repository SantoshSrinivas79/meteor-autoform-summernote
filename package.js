Package.describe({
  name: 'chroma:autoform-summernote',
  summary: 'use chroma:summernote with aldeed:autoform',
  version: '5.0.3',
  git: 'https://github.com/structuresound/meteor-autoform-summernote.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use([
    'templating',
    'underscore',
    'reactive-var',
    'aldeed:autoform@5.1.2'
  ], 'client');

  api.addFiles([
    'lib/client/templates.html',
    'lib/client/templates.js',
    'lib/client/autoform-summernote.js'
  ], 'client');

  api.addFiles([
    'lib/server/publish.js'
  ], 'server');

});
