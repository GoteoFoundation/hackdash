
/**
 * Main HTTP server
 * -  Create the http server configuring the base middlewares
 * -  Mount the models module in charge of the database management
 */

/**
 * Module dependencies.
 */

import express from 'express';
import passport from 'passport';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import http from 'http';
import {join} from 'path';
import favicon from 'serve-favicon';
import morgan from 'morgan';
import compression from 'compression';
import {json, urlencoded} from 'body-parser';
import methodOverride from 'method-override';
import less from 'less-middleware';
import logger from 'debug';

import config from 'config/config.json';
import models from 'lib/models';
import auth from 'lib/auth';
import routes from 'lib/routes';
import seo from 'lib/seo';
import flash from 'connect-flash';


const debug = logger('hackdash:server');

/**
 * Module scope constants
 */

const sessionMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const staticsMaxAge = 365 * 24 * 60 * 60 * 1000; // 1 Year in ms

/**
 * Create the main express app
 */

const app = express();
app.set('json spaces', 4);

/**
 * Express app settings, mostly from the config file
 */

app.set('view engine', 'pug');
app.set('views', [__dirname + '/../../themes/' + config.theme + '/server', __dirname + '/../../views']);
app.set('subdomain offset', (config.host.match(/./g) || []).length + 1);
// app.disable('view cache');

/**
 * App base middlewares
 */

app.use(less(__dirname + '/../../public', {debug:true}));
app.use(less(__dirname + '/../../themes/' + config.theme, {
  dest: __dirname + '/../../public',
  debug: true}));
try {
  app.use(favicon(__dirname + '/../../themes/' + config.theme + '/favicon.ico'));
} catch(e) {
  app.use(favicon(__dirname + '/../../public/favicon.ico'));
}
app.use(morgan('combined'));
app.use(compression());
app.use(urlencoded({ extended: false }));
app.use(json());
app.use(methodOverride());

if (config.prerender && config.prerender.enabled) {
  app.use(seo(app));
}

/**
 * User session management via mongodb and express session
 */

const MongoStore = connectMongo(session);
app.use(session({
  secret: config.session,
  store: new MongoStore({db: config.db.name, url: config.db.url}),
  cookie: { maxAge: sessionMaxAge, path: '/', domain: '.' + config.host },
  resave: false,
  saveUninitialized: false
}));

// Provides flash messages
app.use(flash());

/**
 * PassportJS initialization
 */

app.use(passport.initialize());
app.use(passport.session());

/**
 * Static files handling
 */

app.use(express.static(__dirname + '/../../themes/' + config.theme, { maxAge: staticsMaxAge }));
app.use(express.static(__dirname + '/../../public', { maxAge: staticsMaxAge }));

/**
 * Global title for all templates
 */

app.locals.title = config.title;

/*
 * Authentication related routes
 */

app.use('/', auth);

/*
 * Route handlers. Each `section` of the hackdash provide their own router
 * The main app is in charge only of mounting the routers.
 */

app.use('/', routes);

/**
 * Error handling
 */

app.use((req, res) => {
  res.status(404);
  res.render('404');
});

app.use((error, req, res, next) => {
  // TODO: Improve logging (use syslog)
  console.log('error', error);
  res.status(500);
  res.render('500');
});

/**
 * Handle uncaught exceptions on production
 * TODO: Improve the logging
 */

if(process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', err => console.log(err));
}

/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

export default app;
