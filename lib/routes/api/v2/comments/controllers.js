/*
 * RESTfull API: Comment Resources
 *
 *
 */


import {Router} from 'express';
import {Comment} from 'lib/models';
import bus from 'lib/bus';
import {maxQueryLimit} from 'config/config';
//import {userHasPermission,userAdminAndPermission} from '../helpers';

const userPVT = '_id picture username name bio created_at';
const projectPVT = '_id projectId title leader domain cover';
const maxLimit = maxQueryLimit || 50;

const notify = (type, req) => {
  bus.emit('comment', {
    type: type,
    project: req.project,
    user: req.user,
    domain: req.project.domain
  });
};


export const getComments = (req, res, next) => {
  Comment.find({project: req.params.pid})
    .select('-__v')
    .populate('user', userPVT)
    .populate('project', projectPVT)
    .exec(function(err, comments){
      if(err) return res.status(500).send();
      req.comments = comments;
      next();
    });
};

export const sendComments = (req, res) => {
  res.send(req.comments);
};
