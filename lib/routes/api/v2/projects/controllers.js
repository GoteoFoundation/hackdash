/*
 * RESTfull API: Project Resources
 *
 *
 */


import {Router} from 'express';
import {Dashboard, Project} from 'lib/models';
import multer from 'multer';
import bus from 'lib/bus';
import {maxQueryLimit,maxUploadSize} from 'config/config';
import statuses from 'config/statuses';
import _ from 'underscore';

const userPVT = '_id picture username name bio created_at';
const maxLimit = maxQueryLimit || 50;

const notify = (type, req) => {
  bus.emit('post', {
    type: type,
    project: req.project,
    user: req.user,
    domain: req.project.domain
  });
};


export const getProject = (req, res, next) => {
  Project.findById(req.params.pid)
    .select('-__v')
    .populate('leader', userPVT)
    .populate('contributors', userPVT)
    .populate('followers', userPVT)
    .exec(function(err, project) {
      if (err) return res.status(500).send();
      if (!project) return res.status(404).send();

      req.project = project;

      next();
  });
};

export const canChangeProject = (req, res, next) => {

  var isLeader = req.user._id.toString() === req.project.leader._id.toString();
  var isAdmin = (req.project.domain && req.user.admin_in.indexOf(req.project.domain) >= 0);

  if (!isLeader && !isAdmin) {
    return res.send(403, "Only Leader or Administrators can edit or remove this project.");
  }

  next();
};

// TODO: get dashboard from dashboards controllers
export const canCreateProject = (req, res, next) => {

  if (!req.body || (req.body && !req.body.domain)){
    return res.send(400, "Expected a domain property");
  }

  Dashboard.findOne({ domain: req.body.domain })
    .exec(function(err, dashboard) {
      if(err) return res.status(500).send();
      if(!dashboard) return res.status(404).send();

      if (!dashboard.open)
        return res.send(403, "Dashboard is closed for creating projects");

      next();
    });

};

export const projectInDomain = (project, done) => {
  if(!_.isFunction(done)) done = () => {};

  Dashboard
    .findOne({ domain: project.domain })
    .exec(function(err, dashboard) {
      if(err) return done(err.toString());

    // Check status active
      var inactive = dashboard.inactiveStatuses || [];
      if(inactive.indexOf(project.status) !== -1 ||
         _.find(statuses, function(s) {return !s.active;})) {
          return done('status_invalid');
      }
      return done();
    });
};


export const createProject = (req, res, next) => {

  if(req.body.link && req.body.link.indexOf('http') != 0) {
    req.body.link = 'http://' + req.body.link;
  }

  var tags = req.body.tags || [];
  if (!Array.isArray(tags)){
    tags = tags.toString().split(',');
  }

  var project = new Project({
      title: req.body.title
    , description: req.body.description
    , extra: req.body.extra
    , link: req.body.link
    , status: req.body.status
    , tags: tags
    , created_at: Date.now()
    , leader: req.user._id
    , followers: [req.user._id]
    , contributors: [req.user._id]
    , cover: req.body.cover
    , domain: req.body.domain
  });

  if (!project.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!project.description){
    return res.status(500).json({ error: "description_required" });
  }

  projectInDomain(project, function(err) {
    if(err) return res.status(500).json({ error: err });

    project.save(function(err, project){
      if(err) return res.status(500).send({error: err});
      req.project = project;

      notify('project_created', req);
      updateDashboard(req.project.domain, function(){
        next();
      });
    });

  });
};

export const uploadCover = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/')
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
      fileSize: maxUploadSize || 2097152
    }
  }).single('cover');

  upload(req, res, function(err) {
    if(err) {
      return res.status(400).send('File is too big, 500 Kb is the max');
    }
    next();
  })
};

export const sendCover = (req, res) => {
  if (!req.file || req.file.fieldname !== 'cover'){
    res.status(400).send('cover field expected');
    return;
  }

  var cover = req.file;

  if (!cover.mimetype || cover.mimetype.indexOf('image/') === -1){
    res.status(400).send({ error: 'image-mimetype-expected' });
    return;
  }

  res.send({ href: cover.path.replace('public/', '/') });
};

export const updateProject = (req, res, next) => {
  var project = req.project;

  function getValue(prop){
    return req.body.hasOwnProperty(prop) ? req.body[prop] : project[prop];
  }

  var link = getValue("link");
  if(link && link.indexOf('http') != 0) {
    link = 'http://' + link;
  }

  var tags = getValue("tags");
  if (!Array.isArray(tags)){
    tags = tags.toString().split(',');
  }

  var coverChanged = (project.cover !== getValue("cover"));

  project.title = getValue("title");
  project.description = getValue("description");
  project.extra = getValue("extra");
  project.link = link;
  project.status = getValue("status");
  project.cover = getValue("cover");
  project.tags = tags;

  //add trim

  if (!project.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!project.description){
    return res.status(500).json({ error: "description_required" });
  }

  projectInDomain(project, function(err) {
    if(err) return res.status(500).json({ error: err });

    project.save(function(err, project){
      if(err) return res.status(500).send('Error saving project: ' + err);
      req.project = project;

      notify('project_edited', req);

      if (coverChanged) {
        updateDashboard(req.project.domain, function(){
          next();
        });

        return;
      }

      next();
    });
  });
};

export const removeProject = (req, res) => {
  var domain = req.project.domain;

  req.project.remove(function (err){
    if (err) return res.status(500).send("An error ocurred when removing this project");
    updateDashboard(domain, function(){
      res.send(204); //all good, no content
    });
  });
};

// TODO: change this validations for external API access.
export const validate = (req, res, next) => {
  var user = req.user;
  var project = req.project;

  if (user._id === project.leader.id ){
    return res.send(406, "Leader of the project cannot leave or unfollow.");
  }

  next();
};

export var addFollower = function(req, res){
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $addToSet : { 'followers': userId }}, function(err){
    if(err) return res.status(500).send();

    notify('project_follow', req);
    res.send(200);
  });
};

export const removeFollower = (req, res) => {
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $pull : { 'followers': userId }}, function(err){
    if(err) return res.status(500).send();

    notify('project_unfollow', req);
    res.send(200);
  });
};

export const addContributor = (req, res) => {
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $addToSet : { 'contributors': userId }}, function(err){
    if(err) return res.status(500).send();

    notify('project_join', req);
    res.send(200);
  });

};

export const removeContributor = (req, res) => {
  var projectId = req.params.pid;
  var userId = req.user.id;

  Project.update({_id: projectId}, { $pull : { 'contributors': userId }}, function(err){
    if(err) return res.status(500).send();

    notify('project_leave', req);
    res.send(200);
  });

};

export const setQuery = (req, res, next) => {
  var query = req.query.q || "";
  req.limit = req.query.limit || maxLimit;

  if (req.limit > maxLimit){
    req.limit = maxLimit;
  }

  req.search_query = {};

  if (req.subdomains.length > 0) {
    req.search_query = { domain: req.subdomains[0] };
  }
  else if (req.params.domain) {
    req.search_query = { domain: req.params.domain };
  }

  if (query.length === 0) {

    if (!req.search_query.hasOwnProperty('domain')){
      // landing - no query: only ones with cover
      req.search_query.$and = [
        { cover: { $exists: true } }
      ];
    }

  } else {

    var regex = new RegExp(query, 'i');
    req.search_query.$or = [
      { title: regex },
      { description: regex },
      { tags: regex },
      { domain: regex }
    ];
  }

  // Don't projects on want private dashboards
  var admin_in = req.user ? req.user.admin_in : [];
  Dashboard.find({$and: [
      {private: true},
      {'domain': {$nin: admin_in}}
    ]})
    .select('domain')
    .exec(function(err, dashboards) {
      if(err) return res.status(500).send(err);
      var dashs = _.pluck(dashboards, 'domain');
      console.log('query1', req.search_query, dashs, admin_in);
      req.search_query = {
        $and: [
          req.search_query,
          {$or: [
            {domain: {$nin: dashs}},
            {leader: req.user ? req.user._id : null}
          ]}
        ]
      };
      console.log('query2', req.search_query);
      next();
    });
};

export const setProjects = (req, res, next) => {
  var limit = req.limit || maxLimit;

  if (req.search_query.hasOwnProperty('domain')){
    limit = 0;
  }

  Project.find(req.search_query || {})
    .select('-__v')
    .populate('leader', userPVT)
    .populate('contributors', userPVT)
    .populate('followers', userPVT)
    .limit(limit)
    .sort( { "created_at" : -1 } )
    .exec(function(err, projects) {
      if(err) return res.status(500).send();
      req.projects = projects;
      next();
    });
}

export const sendProject = (req, res) => {
  res.send(req.project);
};

export const sendProjects = (req, res) => {
  res.send(req.projects);
};

const updateDashboard = (domain, done) => {

  Dashboard
    .findOne({ domain: domain })
    .exec(function(err, _dashboard) {
      if(err) return console.log(err);
      if(!_dashboard) return;

      Project
        .find({ domain: _dashboard.domain })
        .exec(function(err, projects){

        _dashboard.projectsCount = projects.length;
        _dashboard.covers = [];

        projects.forEach(function(project){
          if (project.cover){
            _dashboard.covers.push(project.cover);
          }
        });

        _dashboard.save(function(err){
          done && done(err, _dashboard.covers.length);
        });

      });

    });
};
