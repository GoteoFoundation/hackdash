/**
 * Questions controllers
 */


import {isDashboardAdmin} from 'lib/routes/api/v2/helpers';
import {Collection, Question, Dashboard} from 'lib/models';
import bus from 'lib/bus';
var userPVT = '-__v -email -provider_id -superadmin';

var notify = function(type, req) {
  bus.emit('question', {
    type: type,
    domain: req.question.domain,
    collection: req.question.group,
    user: req.user
  });
};

export const getQuestion = (req, res, next) => {
  Question.findById(req.params.qid)
    .select('-__v')
    .populate('creator', userPVT)
    .exec(function(err, question) {
      if (err) return res.status(500).send(err.toString());
      if (!question) return res.status(404).send('No question found');

      req.question = question;

      next();
  });
};

export const getQuestions = (req, res, next) => {
  if(!req.params || !req.params.qid) {
    return res.status(400).send("Expected a domain or collection property");
  }
  const q = req.url.indexOf('/dashboards/') === 0 ? { domain:req.params.qid } : { group:req.params.qid };
  Question.find(q)
    .select('-__v')
    .populate('creator', userPVT)
    .exec(function(err, questions) {
      if (err) return res.status(500).send(err.toString());
      if (!questions) return res.status(404).send('No questions found');

      req.questions = questions;

      next();
  });
};

const checkPermisionQuestion = (req, res, next) => {
  const domain = req.question ? req.question.domain : req.body.domain;
  const group = req.question ? req.question.group : req.body.group;
  if(domain) {
    Dashboard.findOne({ domain: domain })
      .exec(function(err, dashboard) {
        if(err) return res.status(500).send(err.toString());
        if(!dashboard) return res.status(404).send('No dashboard found');

        if (!dashboard.open)
          return res.status(403).send("Dashboard is closed for creating projects (or questions)");

        isDashboardAdmin(req, res, next);
      });
  }
  else if(group) {
    Collection.findOne({ _id: group })
      .exec(function(err, collection) {
        if(err) return res.status(500).send(err.toString());
        if(!collection) return res.status(404).send('No collection found');

        if(req.user._id.toString() === collection.owner.toString()) {
          next();
        } else {
          res.status(403).send("Only the collection's owner can create questions");
        }
      });
  }
};

export const canEditQuestion = (req, res, next) => {

  if(req.params && req.params.qid) {
    Question.findById(req.params.qid)
      .exec(function(err, question){
        if(err) return res.status(400).send(err.toString());
        if(!question) return res.status(404).send('Question not found');
        req.question = question;
        req.domain = question.domain;
        checkPermisionQuestion(req, res, next);
      });
  } else if(req.body) {
    if(req.body.domain || req.body.group) {
      checkPermisionQuestion( req, res, next);
    } else {
      return res.status(400).send("Expected a domain or collection property");
    }
  }
};


export const createQuestion = (req, res, next) => {

  const question = new Question({
      title: req.body.title
    , type: req.body.type
    , created_at: Date.now()
    , creator: req.user._id
    , domain: req.body.domain
    , group: req.body.group
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

export const updateQuestion = (req, res, next) => {
  var question = req.question;

  const getValue = (prop) => {
    return req.body.hasOwnProperty(prop) ? req.body[prop] : question[prop];
  }

  question.title = getValue("title");
  question.type = getValue("type");

  console.log('QUESTIOn', question);

  if (!question.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!question.type){
    return res.status(500).json({ error: "type_required" });
  }

  question.save(function(err, question){
    if(err) return res.status(500).send(err.toString());
    req.question = question;

    notify('question_edited', req);

    next();
  });


};

export const sendQuestion = (req, res, next) => {
  res.send(req.question);
};

export const sendQuestions = (req, res, next) => {
  res.send(req.questions);
};
