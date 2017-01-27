/**
 * RESTfull API: Comments Resources
 */

/**
 * Module dependencies
 */

import {Router} from 'express';
import cors from 'cors';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {getComments, sendComments, canCreateComment, createComment, sendComment} from './controllers';

/**
 * Expose router
 */

const app = Router();
export default app;

/**
 * Create routes
 */

// app.get('/comments/:pid', cors(), getComment, sendComment);
app.post('/comments',  isAuth, canCreateComment, createComment, sendComment);
app.get('/projects/:pid/comments', cors(), getComments, sendComments);
