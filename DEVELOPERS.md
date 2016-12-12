Wotify/Hackdash Dev guide
=========================

This document intends to be a guide for hackdash. Mostly for myself because it can be complicated sometimes...

Structure:
---------

Main application folders:

```
config/         -> Config files
public/         -> Images, css and other public resources
views/          -> Basic templates for node. Using Jade template language
lib/            -> Classes, models and application packages
client/         -> Frontend files, using the Marionette framework
themes/         -> Hackdash can be customized by placing hbs files here
```

Submodules and standalone helpers:

```
scripts/        -> Useful console scripts for generating admins or collections
metrics/        -> Submodule for generating metrics & stats
embed/          -> ?
prerender/      -> Prerender for SEO?
sitemap/        -> Sitemap for SEO?
test/           -> Test files.
migration/      -> Migration scripts (from older versions of hackdash)
```

Main Application:
----------------

### Backend:

Backend uses [Jade](http://naltatis.github.io/jade-syntax-docs/) template language and the [Express](http://expressjs.com/)  framework.

The `view/` contains the Jade templates used as base for the client (frontend) application.

### Frontend:

Frontend uses [Handlebars](http://handlebarsjs.com/) template language and the [Marionette (Backbone)](http://marionettejs.com/) framework

Frontend has is own node package inside `client/` folder. Has to be compiled using [Grunt](http://gruntjs.com/). It's recommended to leave a terminal open with the "watch" task running:

```
cd client
grunt watch
```

This will compile all the files anytime files are modified. Compiled files are copied to the `public/` folder.
