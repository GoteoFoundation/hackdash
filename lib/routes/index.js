
/**
 * Routes main router. This router will mount the different parts of the app
 */

/**
 * Module dependencies
 */

import {Router} from 'express';
import api from './api/v2';
import site from './site';
import admin from './admin';
import metrics from './metrics';
import passport from 'passport';
import qt from 'quickthumb';

/**
 * Create router
 */

const app = Router();
export default app;

/**
 * Mount app routers
 */
// Global auth by bearer in the API
app.use('/api/v2', passport.authenticate('bearer', { session: false }), api);
app.use('/', site);
app.use('/', admin);
app.use('/', metrics);

// Image resizer
app.use('/image', qt.static(__dirname + '/../../public', {
  cacheDir: __dirname + '/../../public/cache',
  quality: 1
}));
