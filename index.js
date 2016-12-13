/**
 * Module dependencies.
 */

require("babel-core/register");
require("babel-polyfill");

var app = require('lib/server').default;
var debug = require('debug')('hackdash:server');
var http = require('http');
var config = require('./config/config.json');
var live = require('lib/live');
//Listener for mail sending on events
require('lib/notifications/listener.js');


/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(app.get('port'));
server.on('error', onError);
server.on('listening', onListening);

/*
 * Live dashboard. It uses socketIO to provide cool `realtime` features
 * it's an opt-in from the config file.
 */

if(config.live) {
	live(app, server);
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
