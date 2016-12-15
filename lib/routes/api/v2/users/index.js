/*
 * RESTfull API: Dashboard Resources
 *
 *
 */

var app = module.exports = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var config = require('config/config');
var cors = require('cors');
var helpers = require('lib/routes/api/v2/helpers');

var User = mongoose.model('User');
var Dashboard = mongoose.model('Dashboard');
var Project = mongoose.model('Project');
var Collection = mongoose.model('Collection');

var teamIds = config.team || [];
var maxLimit = config.maxQueryLimit || 50;
var userPVT = '_id picture username name bio created_at';

var getInstanceAdmins = function(req, res, next){
  var domain = req.params.domain;

  User
    .find({ "admin_in": domain })
    .select(userPVT)
    .exec(function(err, users) {
      if(err) return res.sendStatus(500);
      req.users = users || [];
      next();
    });
};

var setQuery = function(req, res, next){
  var query = req.query.q || "";

  req.limit = req.query.limit || maxLimit;

  if (req.limit > maxLimit){
    req.limit = maxLimit;
  }

  req.search_query = {};

  if (query.length === 0){
    // landing - only the ones with bio
    req.search_query.$and = [
      { bio: { $exists: true } },
      { $where: "this.bio.length>0" }
    ];
    req.isLanding = true;
    return next();
  }

  var regex = new RegExp(query, 'i');
  req.search_query.$or = [ { name: regex }, { username: regex }, { email: regex } ];

  next();
};

var getUser = function(req, res, next){
  User
    .findById(req.params.uid)
    // .select('-__v -provider_id ' + (req.isAuthenticated() ? '' : '-email') )
    .select(req.isAuthenticated() ? (req.user._id == req.params.uid ? '-__v -provider_id -password' : userPVT + ' email') : userPVT )
    .exec(function(err, user){
      if(err) return res.sendStatus(500);
      if(!user) return res.sendStatus(404);
      req.user_profile = user.toObject();
      next();
    });
};

var getUsers = function(req, res, next){
  var sort = "name username";
  if (req.isLanding){
    sort = "-created_at " + sort;
  }

  User
    .find(req.search_query || {})
    .select(userPVT)
    .limit(req.limit || maxLimit)
    .sort(sort)
    .exec(function(err, users) {
      if(err) return res.sendStatus(500);
      req.users = users;
      next();
    });
};

var canUpdate = function(req, res, next){
  var isLogedInUser = req.user.id === req.params.uid;

  if (!isLogedInUser) {
    return res.status(403).send("Only your own profile can be updated.");
  }

  next();
};

var addAdmin = function(req, res, next){
  var domain = req.params.domain;

  User.update({_id: req.user_profile._id }, { $addToSet : { 'admin_in': domain }}, function(err){
    if(err) return res.sendStatus(500);
    next();
  });

};

var updateUser = async function(req, res){
  var user = req.user;

  //add trim

  if (!req.body.name){
    return res.status(500).send({ error: "name_required" });
  }

  if (!req.body.email){
    return res.status(500).send({ error: "email_required" });
  }

  // Check email existing
  let exists = await User.findOne({email: req.body.email}).exec();
  if(exists && exists.email !== user.email) {
    return res.status(500).send({'error': "email_existing"});
  }

  user.name = req.body.name;
  user.email = req.body.email;
  user.bio = req.body.bio;
  if(req.body.birthdate) {
    user.birthdate = new Date(req.body.birthdate);
  }
  if(req.body.gender) {
    user.gender = req.body.gender;
  }
  if(req.body.location) {
    user.location = req.body.location;
  }
  if(req.body.social) {
    user.social = req.body.social;
  }

  user.save(function(err, user){
    if(err) {
      console.log("ERROR SAVING USER", err);
      if (err.errors && err.errors.hasOwnProperty('email')){
        return res.status(500).send({ error: "email_invalid" });
      }

      return res.status(500).send({error: err.message});
    }

    res.sendStatus(200);
  });
};

var setCollections = function(req, res, next){

  Collection
    .find({ "owner": req.user_profile._id })
    .select('-__v')
    .exec(function(err, collections) {
      if(err) return res.sendStatus(500);
      req.user_profile.collections = collections || [];
      next();
    });
};

var setDashboards = function(req, res, next){

  Dashboard
    .find({ "domain": { $in: req.user_profile.admin_in } })
    .select('-__v')
    .exec(function(err, dashboards) {
      if(err) return res.sendStatus(500);
      req.user_profile.dashboards = dashboards || [];
      next();
    });

};

var setProjects = function(req, res, next){

  Project
    .find({ "leader": req.user_profile._id })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.sendStatus(500);
      req.user_profile.projects = projects || [];
      next();
    });
};

var setContributions = function(req, res, next){
  var uid = req.user_profile._id;

  Project
    .find({ "leader": { $ne: uid } , "contributors": uid })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.sendStatus(500);
      req.user_profile.contributions = projects || [];
      next();
    });

};

var setLikes = function(req, res, next){
  var uid = req.user_profile._id;

  Project
    .find({ "leader": { $ne: uid }, "followers": uid })
    .select('-__v')
    .exec(function(err, projects) {
      if(err) return res.sendStatus(500);
      req.user_profile.likes = projects || [];
      next();
    });

};

var getTeam = function(req, res, next){
  req.users = [];

  if (teamIds.length > 0){

    User
      .find({ _id: { $in: teamIds } })
      .select("_id name picture bio provider username")
      .exec(function(err, users) {
        if(err)
          return res.status(500).send("could not retrieve team users");

        req.users = [];

        users.forEach(function(user){
          var idx = teamIds.indexOf(user._id.toString());
          req.users[idx] = user;
        });

        next();
      });

    return;
  }

  next();
};

var sendUser = function(req, res){
  res.send(req.user_profile);
};

var sendUsers = function(req, res){
  res.send(req.users);
};

app.get('/:domain/admins', cors(), getInstanceAdmins, sendUsers);
app.post('/:domain/admins/:uid', helpers.isAuth, helpers.isDashboardAdmin, getUser, addAdmin, sendUser);

app.get('/users', cors(), setQuery, getUsers, sendUsers);

app.get('/users/team', getTeam, sendUsers);
app.get('/users/:uid', cors(), getUser, sendUser);

app.get('/profiles/:uid', cors(), getUser, setCollections, setDashboards, setProjects, setContributions, setLikes, sendUser);
app.put('/profiles/:uid', helpers.isAuth, getUser, canUpdate, updateUser);
