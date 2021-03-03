/**
 * Expose router
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth} from 'lib/routes/api/v2/helpers';
import {setQuery,setProjects,sendProjects,canChangeProject,canDeleteProject,createProject,sendProject,uploadCover,sendCover,getProject,cleanProject,canCreateProject,validate,addFollower,removeFollower,addContributor,removeContributor,removeProject,updateProject} from './controllers';

const app = Router();
export default app;

var allowCrossDomain = function(req,res,next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', '*');
  next();
}
app.use(allowCrossDomain);
app.get('/:domain/projects', cors(), setQuery, setProjects, sendProjects);

app.get('/projects', cors(), setQuery, setProjects, sendProjects);

app.post('/projects', isAuth, canCreateProject, createProject, sendProject);
app.post('/projects/cover', isAuth, uploadCover, sendCover);

app.get('/projects/:pid', cors(), getProject, cleanProject, sendProject);

app.delete('/projects/:pid', isAuth, getProject, canDeleteProject, removeProject);
app.put('/projects/:pid', isAuth, getProject, canChangeProject, updateProject, sendProject);

app.post('/projects/:pid/followers', isAuth, getProject, validate, addFollower);
app.delete('/projects/:pid/followers', isAuth, getProject, validate, removeFollower);

app.post('/projects/:pid/contributors', isAuth, getProject, validate, addContributor);
app.delete('/projects/:pid/contributors', isAuth, getProject, validate, removeContributor);

