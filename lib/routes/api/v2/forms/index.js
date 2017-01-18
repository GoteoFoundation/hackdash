/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {getForm,getForms,sendForms,updateForm,sendForm,canEditForm,setForm,canRespondForm,createForm,saveResponse,sendResponse,uploadFile,sendFile,deleteFile,getTemplates,deleteForm,getResponses,sendResponses} from './controllers';
import {getProject,canChangeProject} from '../projects/controllers';

/**
 * Expose router
 */

const app = Router();
export default app;


app.get('/dashboards/:did/forms', cors(), isAuth, getForms, sendForms);
app.get('/collections/:cid/forms', cors(), isAuth, getForms, sendForms);
//Templates
app.get('/forms/templates', cors(), isAuth, getTemplates, sendForms);
// get a form
app.get('/forms/:fid', cors(), isAuth, getForm, sendForm);

// get a form responses
app.get('/forms/:fid/responses', cors(), isAuth, getForm, getResponses, sendResponses);


// New forms
app.post('/forms', isAuth, canEditForm, createForm, sendForm);
// Edit form
app.put('/forms/:fid', isAuth, canEditForm, updateForm, sendForm);
// Delete a form
app.delete('/forms/:fid', isAuth, canEditForm, deleteForm);

// Process form response
app.put('/forms/:fid/:pid', isAuth, getProject, canChangeProject, setForm, canRespondForm, saveResponse, sendResponse);
app.post('/forms/upload/:fid/:pid/:qid', isAuth, getProject, canChangeProject, setForm, canRespondForm, uploadFile, sendFile);
app.delete('/forms/upload/:fid/:pid/:qid', isAuth, getProject, canChangeProject, setForm, canRespondForm, deleteFile);

// User forms
app.get('/forms', cors(), isAuth, getForms, sendForms);



