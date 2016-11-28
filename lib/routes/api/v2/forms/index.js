/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {getForm,getForms,sendForms,updateForm,sendForm,canEditForm,createForm} from './controllers';

/**
 * Expose router
 */

const app = Router();
export default app;


app.get('/dashboards/:did/forms', cors(), isAuth, getForms, sendForms);
app.get('/collections/:cid/forms', cors(), isAuth, getForms, sendForms);
app.get('/forms/:fid', cors(), isAuth, getForm, sendForm);

// New forms
app.post('/forms', isAuth, canEditForm, createForm, sendForm);
//Edit form
app.put('/forms/:fid', isAuth, canEditForm, updateForm, sendForm);

// User forms
app.get('/forms', cors(), isAuth, getForms, sendForms);


