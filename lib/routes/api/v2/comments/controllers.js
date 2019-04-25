/*
 * RESTfull API: Comment Resources
 *
 *
 */


import {Router} from 'express';
import {Comment,Project,User} from 'lib/models';
import bus from 'lib/bus';
import {maxQueryLimit} from 'config/config';
import {userHasPermission} from '../helpers';
import __ from 'lib/utils/locale';
const userPVT = '_id picture username name role bio commentsCount created_at';
const projectPVT = '_id projectId title leader domain cover commentsCount';
const maxLimit = maxQueryLimit || 50;

const notify = (type, req) => {
  bus.emit('comment_notification', {
    type: type,
    comment: req.comment,
    user: req.user,
    project: req.comment.project
  });
};


export const getComments = (req, res, next) => {
  Comment.find({project: req.params.pid})
    .select('-__v')
    // .limit(req.limit || MAX_LIMIT)
    .sort( { 'created_at' : 1 } )
    .populate('user', userPVT)
    .populate('project', projectPVT)
    .exec(function(err, comments){
      if(err) return res.status(500).send();
      req.comments = comments;
      next();
    });
};

// TODO: permissions on this
export const canCreateComment = (req, res, next) => {
  if (!req.body || (req.body && !req.body.comment)){
    return res.status(400).send(__("Comments can't be blank"));
  }

  if(!req.body.comment.trim()) {
    return res.status(400).send(__("Comments can't be blank"));
  }

  if(!userHasPermission(req.user, 'comment_project')) {
    return res.status(403).send("User has no permissions to comment projects");
  }

  next();
};

export const createComment = (req, res, next) => {
  var comment = new Comment({
      comment: req.body.comment.trim()
    , type: req.body.type
    , project: req.body.project
    , user: req.user._id
  });
  comment.save(function(err, comment){
    if(err) return res.status(500).send({error: err});
    req.comment = comment;

    updateProject(req.comment.project, function(err, _project){
      req.comment.project = _project;
      notify('new_comment', req);

      updateUser(req.comment.user, function(err, _user) {
        req.comment.user = _user;
        next();
      });
    });
  });
};

const updateProject = (pid, done) => {

  Project
    .findById(pid)
    .select(projectPVT)
    .exec(function(err, _project) {
      if(!_project) return done && done('Error project');

      Comment
        .find({ project: _project._id })
        .exec(function(err, comments){

        _project.commentsCount = comments.length;

        _project.save(function(err){
          done && done(err, _project);
        });

      });

    });
};

const updateUser = (uid, done) => {

  User
    .findById(uid)
    .select(userPVT)
    .exec(function(err, _user) {
      if(!_user) return done && done('Error user');
      console.log('Update user', _user.toJSON());

      Comment
        .find({ user: _user._id })
        .exec(function(err, comments){

        _user.commentsCount = comments.length;

        _user.save(function(err){
          done && done(err, _user);
        });

      });

    });
};

export const sendComment = (req, res) => {
  res.send(req.comment);
};

export const sendComments = (req, res) => {
  res.send(req.comments);
};
