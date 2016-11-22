/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {getQuestions,sendQuestions,canCreateQuestion,createQuestion} from './controllers';

/**
 * Expose router
 */

const app = Router();
export default app;


app.get('/dashboards/:pid/questions', cors(), isAuth, getQuestions, sendQuestions);
app.get('/collections/:pid/questions', cors(), isAuth, getQuestions, sendQuestions);
//Not really used:
app.get('/questions', cors(), isAuth, getQuestions, sendQuestions);

app.post('/questions', isAuth, canCreateQuestion, createQuestion, sendQuestions);


