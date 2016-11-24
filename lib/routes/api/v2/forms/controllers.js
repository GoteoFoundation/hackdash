/**
 * Forms controllers
 */


import {isDashboardAdmin} from 'lib/routes/api/v2/helpers';
import {Collection, Form, Dashboard} from 'lib/models';
import bus from 'lib/bus';
var userPVT = '-__v -email -provider_id -superadmin';

var notify = function(type, req) {
  bus.emit('form', {
    type: type,
    domain: req.form.domain,
    collection: req.form.group,
    user: req.user
  });
};

export const getForm = (req, res, next) => {
  Form.findById(req.params.qid)
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
  if(!req.params || !req.params.qid) {
    return res.status(400).send("Expected a domain or collection property");
  }
  const q = req.url.indexOf('/dashboards/') === 0 ? { domain:req.params.qid } : { group:req.params.qid };
  Form.find(q)
    .select('-__v')
    .populate('creator', userPVT)
    .exec(function(err, forms) {
      if (err) return res.status(500).send(err.toString());
      if (!forms) return res.status(404).send('No forms found');

      req.forms = forms;

      next();
  });
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

  if(req.params && req.params.qid) {
    Form.findById(req.params.qid)
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
    , type: req.body.type
    , created_at: Date.now()
    , creator: req.user._id
    , domain: req.body.domain
    , group: req.body.group
  });

  if (!form.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!form.type){
    return res.status(500).json({ error: "type_required" });
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

  form.title = getValue("title");
  form.type = getValue("type");

  console.log('QUESTIOn', form);

  if (!form.title){
    return res.status(500).json({ error: "title_required" });
  }

  if (!form.type){
    return res.status(500).json({ error: "type_required" });
  }

  form.save(function(err, form){
    if(err) return res.status(500).send(err.toString());
    req.form = form;

    notify('form_edited', req);

    next();
  });


};

export const sendForm = (req, res, next) => {
  res.send(req.form);
};

export const sendForms = (req, res, next) => {
  res.send(req.forms);
};
