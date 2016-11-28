/**
 * Forms controllers
 */


import {isDashboardAdmin} from 'lib/routes/api/v2/helpers';
import {Collection, Form, Dashboard, Project} from 'lib/models';
import bus from 'lib/bus';
import _ from 'underscore';

var userPVT = '-__v -email -provider_id -superadmin';

var notify = function(type, req) {
  bus.emit('form', {
    type: type,
    form: req.form,
    user: req.user
  });
};

export const getForm = (req, res, next) => {
  Form.findById(req.params.fid)
    .select('-__v')
    .populate('creator', userPVT)
    .exec(function(err, form) {
      if (err) return res.status(500).send(err.toString());
      if (!form) return res.status(404).send('No form found');

      req.form = form;

      next();
  });
};

export const getForms = (req, res, next) => {
  // if(!req.params || (!req.params.did && !req.params.cid)) {
  //   return res.status(400).send("Expected a domain or collection property");
  // }
  function getForms(q, prjs) {
    Form.find(q)
      .select('-__v')
      .populate('creator', userPVT)
      .exec(function(err, forms) {
        if (err) return res.status(500).send(err.toString());
        if (!forms) return res.status(404).send('No forms found');

        if(prjs) {
          _.each(forms, function(f,i){
            f.projects = [];
            _.each(prjs, function(p){
              if(p.group === f.group) {
                f.projects.push(p);
              }
              if(p.domain === f.domain) {
                f.projects.push(p);
              }
            });
            forms[i] = f;
          });
        }
        req.forms = forms;
        next();
    });
  }

  var q = {};
  if(req.params.did) {
    getForms({ domain: req.params.did }); // dashboard
  } else if(req.params.cid) {
    getForms({ group: req.params.cid }); // collection
  } else {
    // User forms
    // Find all user projects
    //  - check for forms in its dashboard/collection
    Project.find({leader: req.user._id})
      .select('-__v')
      .populate('leader', userPVT)
      .populate('contributors', userPVT)
      .populate('followers', userPVT)
      .exec(function(err, projects) {
        if (err) return res.status(500).send(err.toString());
        if (!projects) return res.status(404).send('No projects found');
        // Get dashboards
        var domains = _.uniq(_.pluck(projects, 'domain'));
        Dashboard.find({domain: {$in: domains}})
          .select('_id domain')
          .exec(function(err, dashboards){
            if (err) return res.status(500).send(err.toString());
            if (!dashboards) return res.status(404).send('No dashboards found');
            // Find collections in this domains
            domains = _.object(_.pluck(dashboards,'_id'), _.pluck(dashboards,'domain'));
            Collection.find({dashboards: {$in: _.pluck(dashboards, '_id')}})
              .select('-__v')
              .exec(function(err, collections){
              if (err) return res.status(500).send(err.toString());
              if(collections) {
                _.each(projects, function(p){
                  _.each(collections, function(c){
                    _.each(c.dashboards, function(d){
                      d = domains[d];
                      if(d && p.domain === d) {
                        p.group = c._id;
                      }
                    });
                  });
                });
              }
              getForms({ $or: [
                { domain: {$in: _.pluck(dashboards, 'domain')}},
                { group: {$in: collections ? _.pluck(collections, '_id') : []}}
                ]}, projects);
            });
          });
    });
  }
};

const checkPermisionForm = (req, res, next) => {
  const domain = req.form ? req.form.domain : req.body.domain;
  const group = req.form ? req.form.group : req.body.group;
  if(domain) {
    Dashboard.findOne({ domain: domain })
      .exec(function(err, dashboard) {
        if(err) return res.status(500).send(err.toString());
        if(!dashboard) return res.status(404).send('No dashboard found');

        if (!dashboard.open)
          return res.status(403).send("Dashboard is closed for creating projects (or forms)");

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
          res.status(403).send("Only the collection's owner can create forms");
        }
      });
  }
};

export const canEditForm = (req, res, next) => {

  if(req.params && req.params.fid) {
    Form.findById(req.params.fid)
      .exec(function(err, form){
        if(err) return res.status(400).send(err.toString());
        if(!form) return res.status(404).send('Form not found');
        req.form = form;
        req.domain = form.domain;
        checkPermisionForm(req, res, next);
      });
  } else if(req.body) {
    if(req.body.domain || req.body.group) {
      checkPermisionForm( req, res, next);
    } else {
      return res.status(400).send("Expected a domain or collection property");
    }
  }
};


export const createForm = (req, res, next) => {

  const form = new Form({
      title: req.body.title
    , description: req.body.description
    , questions: req.body.questions || []
    , created_at: Date.now()
    , creator: req.user._id
    , domain: req.body.domain
    , group: req.body.group
  });

  if (!form.title){
    return res.status(500).json({ error: "title_required" });
  }

  form.save(function(err, form){
    if(err) return res.status(500).send({error: err});
    req.form = form;

    notify('form_created', req);
    next();
  });

};

export const updateForm = (req, res, next) => {
  var form = req.form;

  const getValue = (prop) => {
    return req.body.hasOwnProperty(prop) ? req.body[prop] : form[prop];
  }

  var prev_open = form.open;
  form.title = getValue("title");
  form.description = getValue("description");
  form.questions = getValue("questions") || [];
  form.open = !!getValue("open");

  // console.log('QUESTION UPDATE', form);

  if (!form.title){
    return res.status(500).json({ error: "title_required" });
  }

  form.save(function(err, form){
    if(err) return res.status(500).send({error: err});
    req.form = form;

  if(req.body.hasOwnProperty('open') && req.body.open != prev_open) {
    if(req.body.open) {
      notify('form_opened', req);
    } else {
      notify('form_closed', req);
    }
  } else {
    notify('form_edited', req);
  }


    next();
  });


};

export const sendForm = (req, res, next) => {
  res.send(req.form);
};

export const sendForms = (req, res, next) => {
  res.send(req.forms);
};
