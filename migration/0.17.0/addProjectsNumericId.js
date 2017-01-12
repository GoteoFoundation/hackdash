
/*
 * Migration Script for version v0.17.0 (Jan 2017)
 * Script to add a numeric Id on some Models (users, projects)
 */

require('babel-core/register');

var
    config = require('../../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose')
  // Connection is done here:
  , models = require('../../lib/models');


var Project = models.Project;
var IdentityCounter = mongoose.model('IdentityCounter');

Project
  .find({ projectId: null })
  .exec(function(err, projects) {
    if(err) throw err;

    var calls = [];
    var count = 0;

    projects.forEach(function(project){

      calls.push((function(_project){

        return function(_done){
          Project.nextCount(function(err, nextNumber) {
            console.log('Project ' + _project.title + ' found without numeric Id, next nextNumber is ' + nextNumber);
            _project.projectId = nextNumber;
            _project.save({validateBeforeSave: false}, function(err) {
              if (!err) {
                IdentityCounter.findOneAndUpdate(
                  {model: 'Project', field: 'projectId'},
                  {count: nextNumber},
                  {new: true},
                  function(err) {
                      if (!err) count++;
                      _done(err);
                    }
                  );
              } else {
                _done(err);
              }
            });
          });
        };

      })(project));

    });

    async.series(calls, function(err){
      if (err){
        console.log('Error Ocurred > ');
        console.log(err);
      }

      console.log('Updated %s Projects', count);
      process.exit(0);
    });

  });
