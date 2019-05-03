/*
 * RESTfull API: Dashboard Resources
 *
 *
 */

import {Router} from 'express';
import _ from 'underscore';
import config from 'config/config';
import cors from 'cors';
import {isDashboardAdmin,isAuth,isCollectionAdmin} from 'lib/routes/api/v2/helpers';
import bus from 'lib/bus';
import multer from 'multer';
import {User,Project,Collection,Dashboard} from 'lib/models';
import {cleanProject} from '../projects/controllers';
import {userHasPermission} from '../helpers';
import {validateUser} from 'lib/validations';

const teamIds = config.team || [];
const maxLimit = config.maxQueryLimit || 50;
const userPVT = '_id picture userId username role social skills name bio created_at';

const app = Router();
export default app;


var getInstanceAdmins = function(req, res, next){
  var domain = req.params.domain;
  var group = req.params.group;
  var q = {"admin_in": domain };
  if(group) q = {"group_admin_in": group };
  User
    .find(q)
    .select(userPVT)
    .exec(function(err, users) {
      if(err) return res.status(500).send(err);
      req.users = users || [];
      next();
    });
};

var setQuery = function(req, res, next){
  var query = req.query.q || "";

  req.limit = parseInt(req.query.limit || maxLimit, 10);

  if (req.limit > maxLimit){
    req.limit = maxLimit;
  }

  req.search_query = {};

  if(req.query.hasOwnProperty('role')) {
    if(req.query.role && req.query.role !== 'ALL') {
      req.search_query = {
        role: req.query.role
      };
    }
    return next();
  }
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
    // .select('-__v -provider_id -tokens ' + (req.isAuthenticated() ? '' : '-email') )
    .select(req.isAuthenticated() ? (req.user._id == req.params.uid ? '-__v -provider_id -password -tokens' : userPVT + ' email') : userPVT )
    .exec(function(err, user){
      if(err) return res.status(500).send(err);
      if(!user) return res.status(404).send('User not found');
      req.user_profile = user;
      next();
    });
};

var getUsers = async function (req, res, next){
  var limit = req.limit || maxLimit;
  var offset = limit * (parseInt(req.query.page,10) || 0);
  var order = config.homeTabOrder;
  var sort = "name username";
  if (req.isLanding){
    if(order === 'random') {
      var total = await User.count(req.search_query || {});
      if(total > limit)
        offset = Math.floor(Math.random() * (total - limit));
    }
    else if(order === 'first_created')
      sort = "created_at " + sort;
    else if(order === 'last_created')
      sort = "-created_at " + sort;
  }
  // console.log('LIMIT',req.limit, maxLimit, 'offset', offset,'search_query',req.search_query);

  User
    .find(req.search_query || {})
    .select(userPVT)
    .skip(offset)
    .limit(limit)
    .sort(sort)
    .exec(function(err, users) {
      if(err) return res.status(500).send(err);
      // console.log('FOUND ',users.length, 'USERS');
      if(req.isLanding && order === 'random') {
        req.users = _.shuffle(users);
      } else {
        req.users = users;
      }
      next();
    });
};

var canUpdate = function(req, res, next){
  var isMyself = req.user.id === req.params.uid;

  if (!isMyself && !userHasPermission(req.user, 'user_update')) {
    return res.status(403).send("Only your own profile can be updated.");
  }

  next();
};

var addAdmin = function(req, res, next){
  var domain = req.params.domain;
  var group = req.params.group;
  var set = { 'admin_in': domain };
  if(group) set = { 'group_admin_in': group };

  User.update({_id: req.user_profile._id }, { $addToSet : set}, function(err){
    if(err) return res.status(500).send(err);
    next();
  });

};

var updateUser = async function(req, res){
  var user = req.user_profile;

  var sendWelcome = false;
  if(!user.email && req.body.email) {
    sendWelcome = true;
  }

  if(userHasPermission(req.user, 'user_change_role')) {
    if(req.body.role) {
      user.role = req.body.role;
    }
    // console.log('ROLE',req.body.role,user.role);
  }
  user.name = req.body.name;
  user.email = req.body.email;
  user.bio = req.body.bio;
  user.skills = req.body.skills || [];
  // Manually picture
  if(req.body.picture) {
    user.picture = req.body.picture;
    if(user.picture.indexOf('/') === 0 && user.picture.indexOf('//') === false) {
      user.picture = config.publicHost + '/image' + user.picture + '?dim=240x240';
    }
  }
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

  // send validation event
  try {
    await validateUser(user, req);
  } catch(e) {
    console.error('Failed user validation', e);
    return res.status(500).send({ error: e.message });
  }

  // console.log('USER SAVE', user.toString());
  user.save(function(err, user){
    if(err) {
      console.error("ERROR SAVING USER", err);
      if (err.errors && err.errors.hasOwnProperty('email')){
        return res.status(500).send({ error: "email_invalid" });
      }

      return res.status(500).send({error: err.message});
    }
    // Send welcome image if has a new email
    if(sendWelcome) {
      bus.emit('user', {
        type: 'welcome',
        user: user
      });
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
      req.user_profile.projects = [];
      if(!projects || !projects.length) return next();
      _.each(projects, function(prj){

        req.project = prj;
        // console.log('P1',req.project, 'L1',projects.length,'L2', req.user_profile.projects.length);
        cleanProject(req, res, function(){
          // console.log('P2',req.project, 'L1',projects.length,'L2', req.user_profile.projects.length);
          req.user_profile.projects.push(req.project);
          if(projects.length == req.user_profile.projects.length) {
            next();
          }
        });
      });
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
      .select("_id name picture bio provider social username")
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

// TODO: check if this allows admins change picture
export const uploadPicture = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/profile/')
    },
    filename: function (req, file, cb) {
        var originalname = file.originalname;
        var mime = file.mimetype.split("/");
        var ext = mime[mime.length-1];
        var extension = originalname.split(".");
        if(extension.length) {
          ext = extension[extension.length-1];
        }
        var filename = req.user._id + '-' +  Date.now() + '.' + ext;
        cb(null, filename);
      }
  });

  const upload = multer({ // enables multipart/form
    storage : storage,
    limits: {
      fields: 1,
      files: 1,
      fileSize: config.maxUploadSize || 2097152
    }
  }).single('picture');

  upload(req, res, function(err) {
    if(err) {
      return res.status(400).send(err.message);
    }
    next();
  })
};

export const sendPicture = (req, res) => {
  if (!req.file || req.file.fieldname !== 'picture'){
    res.status(400).send('picture field expected');
    return;
  }

  var picture = req.file;

  if (!picture.mimetype || picture.mimetype.indexOf('image/') === -1){
    res.status(400).send({ error: 'image-mimetype-expected' });
    return;
  }

  res.send({ href: picture.path.replace('public/', config.publicHost + '/image/') + '?dim=250x250' });
};

export const userToJSON = (req, res, next) => {
  req.user_profile = req.user_profile.toJSON();
  next();
}
app.get('/admins/dashboard/:domain', cors(), getInstanceAdmins, sendUsers);
app.get('/admins/collection/:group', cors(), getInstanceAdmins, sendUsers);
app.post('/admins/dashboard/:domain/:uid', isAuth, isDashboardAdmin, getUser, addAdmin, sendUser);
app.post('/admins/collection/:group/:uid', isAuth, isCollectionAdmin, getUser, addAdmin, sendUser);

app.get('/users', cors(), setQuery, getUsers, sendUsers);

app.get('/users/team', getTeam, sendUsers);
app.get('/users/:uid', cors(), getUser, sendUser);

app.get('/profiles/:uid', cors(), getUser, userToJSON, setCollections, setDashboards, setProjects, setContributions, setLikes, sendUser);
app.put('/profiles/:uid', isAuth, getUser, canUpdate, updateUser);
app.post('/profiles/picture', isAuth, uploadPicture, sendPicture);

