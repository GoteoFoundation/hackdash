/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {getQuestion,getQuestions,sendQuestions,updateQuestion,sendQuestion,canEditQuestion,createQuestion} from './controllers';

/**
 * Expose router
 */

const app = Router();
export default app;


app.get('/dashboards/:qid/questions', cors(), isAuth, getQuestions, sendQuestions);
app.get('/collections/:qid/questions', cors(), isAuth, getQuestions, sendQuestions);
app.get('/questions/:qid', cors(), isAuth, getQuestion, sendQuestion);

// New questions
app.post('/questions', isAuth, canEditQuestion, createQuestion, sendQuestion);
//Edit question
app.put('/questions/:qid', isAuth, canEditQuestion, updateQuestion, sendQuestion);

//Not really used
app.get('/questions', cors(), isAuth, getQuestions, sendQuestions);


