
/*
 * Migration Script for version v0.17.0 (Jan 2017)
 * Script to add a numeric Id on some Models (users, projects)
 */

require('babel-core/register');

var
    config = require(__dirname + '/../../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose')
  // Connection is done here:
  , models = require(__dirname + '/../../lib/models');


var User = models.User;
var IdentityCounter = mongoose.model('IdentityCounter');

console.log('Updating user IDs ... ');

User
  .find({ userId: null })
  .exec(function(err, users) {
    if(err) throw err;

    var calls = [];
    var count = 0;

    users.forEach(function(user){

      calls.push((function(_user){

        return function(_done){
          User.nextCount(function(err, nextNumber) {
            console.log('User ' + _user.name + ' found without numeric Id, next nextNumber is ' + nextNumber);
            _user.userId = nextNumber;
            _user.save({validateBeforeSave: false}, function(err) {
              if (!err) {
                IdentityCounter.findOneAndUpdate(
                  {model: 'User', field: 'userId'},
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

      })(user));

    });

    async.series(calls, function(err){
      if (err){
        console.log('Error Ocurred > ');
        console.log(err);
      }

      console.log('Updated %s Users', count);
      process.exit(0);
    });

  });
