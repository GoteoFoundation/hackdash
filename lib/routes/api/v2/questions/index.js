/*
 * RESTfull API: Project Resources
 *
 *
 */

import cors from 'cors';
import {Router} from 'express';
import {isAuth,isDashboardAdmin} from 'lib/routes/api/v2/helpers';
import passport from 'passport';
// import mongoose from 'mongoose';
import {Collection, Question, Dashboard} from 'lib/models';
import multer from 'multer';
import config from 'config';
import bus from 'lib/bus';

/**
 * Expose router
 */

const app = Router();
export default app;


var notify = function(type, req) {
  bus.emit('question', {
    type: type,
    domain: req.question.domain,
    collection: req.question.collection,
    user: req.user
  });
};

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

        // isCollectionAdmin(req, res, next);
      });
  }

};

export const createQuestion = (req, res, next) => {

  const question = new Question({
      title: req.body.title
    , type: req.body.type
    , created_at: Date.now()
    , creator: req.user._id
    , domain: req.body.domain
  });

  if (!question.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!question.type){
    return res.status(500).json({ error: "type_required" });
  }

  question.save(function(err, question){
    if(err) return res.status(500).send({error: err});
    req.question = question;

    notify('question_created', req);
    next();
  });

};

export const sendQuestion = (req, res, next) => {
  res.send({ok:true});
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


