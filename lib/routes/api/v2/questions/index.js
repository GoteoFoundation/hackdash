/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth,isDashboardAdmin} from 'lib/routes/api/v2/helpers';
import passport from 'passport';
import mongoose from 'mongoose';
import multer from 'multer';
import config from 'config';
import bus from 'lib/bus';

/**
 * Expose router
 */

const app = Router();
export default app;

const Collection = mongoose.model('Collection')
    , Dashboard = mongoose.model('Dashboard');

export const canCreateQuestion = (req, res, next) => {

  if (!req.body || (req.body && !req.body.domain && !req.body.collection)){
    return res.send(400, "Expected a domain or collection property");
  }

  if(req.body.domain) {
    Dashboard.findOne({ domain: req.body.domain })
      .exec(function(err, dashboard) {
        if(err) return res.send(500);
        if(!dashboard) return res.send(404);

        if(!dashboard.domain)
        if (!dashboard.open)
          return res.send(403, "Dashboard is closed for creating projects (or questions)");

        isDashboardAdmin(req, res, next);
      });
  }
  else if(req.body.collection) {
    Collection.findOne({ _id: req.body.collection })
      .exec(function(err, collection) {
        if(err) return res.send(500);
        if(!collection) return res.send(404);

        next();
      });
  }

};

export const createQuestion = (req, res, next) => {
  next();
};
export const sendQuestion = (req, res, next) => {
  res.send({});
};
export const setQuery = (req, res, next) => {
  next();
};
export const sendQuestions = (req, res, next) => {
  res.send([{}]);
};

// app.get('/:domain/questions', cors(), setQuery, sendQuestions);

app.get('/questions', cors(), setQuery, sendQuestions);

app.post('/questions', isAuth, canCreateQuestion, createQuestion, sendQuestion);


