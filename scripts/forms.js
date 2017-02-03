require('babel-core/register');
var
    config = require('../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , fs = require('fs-extra')
  , slug = require('slug')
  , temp = require('temp')
  , zipFolder = require('zip-folder')
  , colors = require('colors');

require('../lib/models');

var program = require('commander');

program
  .version('0.0.1')
  .description('Exports form data in ZIP files')
  .option('-l, --list', 'List available forms')
  .option('-f, --form <form>', 'Export form')
  .option('-d, --dashboard <dashboard>', 'Export all forms belonging to a dashboard')
  .option('-c, --collection <collection>', 'Export all forms belonging to a collection')
  .parse(process.argv);

var Form = mongoose.model('Form');
var Project = mongoose.model('Project');
// temp.track();

function processForm (form, callback) {
  if(typeof callback != 'function') {
    callback = function(){};
  }
  console.log('Exporting form ' + colors.yellow(form.title)+' (' + (form.group ? colors.cyan('Collection: ' + form.group.title) : colors.green('Dashboard: ' + form.domain)) + ')');

  temp.mkdir('form', function(err, dirPath) {
    if (err) callback(err);
    console.log(dirPath);
    Project.find({'forms.form':form._id})
      .populate('leader')
      .exec(function(err, projects){
        if (err) throw err;
        console.log('Found ' + projects.length +' responding projects');
        console.log(colors.yellow('Creating temporary files'));
        _.each(projects, function(project){
          var id = project.projectId || project._id;
          console.log(colors.red(id) +' ' + project.title);
          var responses = _.find(project.forms, function(f){return f.form == form._id.toString();}) || {responses:[]};
          _.each(responses.responses, function(r){
            var question = _.find(form.questions, function(q){return q._id.toString() == r.question.toString();});
            // console.log(question.type,r.value);
            var original = r.value && r.value.path && __dirname + '/../public' + r.value.path;
            if(question && question.type == 'file' && original && fs.existsSync(original)) {
              var dir = dirPath + '/' + slug(id+' ' +project.title);
              // Export to a file
              if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
              }
              dir = dir + '/' + slug(question.title);
              if(!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
              }
              // Copy files
              fs.copySync(original, dir + '/' + slug(r.value.name || r.value.path));
              console.log('copied', original);
            }
          });
        });
        console.log(colors.yellow('Creating ZIP file'));
        var name = '/uploads/export/' + slug(form._id + ' ' + form.title) + '.zip';
        zipFolder(dirPath, __dirname + '/../public' + name, function(err){
          console.log('done '+name,err);
          if(err) {
            callback(err);
          }
          callback(null, name);
        });
      });
  });
}

if(program.list) {
  Form.find()
    .populate('group')
    .exec(function(err, forms){
    console.log('ID                       TITLE (SCOPE)');
    for(var u in forms) {
      var scope = forms[u].group ? colors.cyan('Collection: ' + forms[u].group._id + ' - ' + forms[u].group.title) : colors.green('Dashboard: ' + forms[u].domain);
      console.log(forms[u]._id + ' ' + colors.yellow(forms[u].title) + ' ('+ scope +')');
    }
    process.exit(0);
  });
} else if(program.dashboard || program.collection) {
  console.log(program.dashboard);
  Form.find({$or:[
    {domain:program.dashboard},
    {group:program.collection}
    ]})
  .populate('group')
  .exec(function(err, forms){
    if(err) {
      console.error(err);
      process.exit(2);
    }
    if(!forms || !forms.length) {
      console.error('Not forms found');
      process.exit(0);
    }
    console.log('Processing ' + forms.length + ' forms for ' + (forms[0].group ? colors.cyan('Collection: ' + forms[0].group.title) : colors.green('Dashboard: ' + forms[0].domain)));
    var processed = [];
    var checkProcessed = function(err, name) {
      if(err) {
        console.error(err);
        process.exit(2);
      }
      processed.push(name);
      console.log(colors.green('Done!') + ' Check it out in ' + colors.yellow(name));
      if(processed.length == forms.length) {
        console.log(colors.green('All tasks Done!') + colors.yellow(' Total ' + processed.length));
        console.log(processed.join("\n"));
        process.exit(0);
      }
      processForm(forms[processed.length], checkProcessed);
    };
    processForm(forms[processed.length], checkProcessed);
  });
} else if(program.form) {
  Form.findById(program.form)
    .populate('group')
    .exec(function(err, form){
      if(err) {
        console.error(err);
        process.exit(2);
      }
      processForm(form, function(err, name){
        if(err) {
          console.error(err);
          process.exit(2);
        }
        console.log(colors.green('Done!') + ' Check it out in ' + colors.yellow(name));
        process.exit(0);
      });
    });
} else {
  process.exit(0);
}

