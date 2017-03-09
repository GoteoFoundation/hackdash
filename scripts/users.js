
require('babel-core/register');
var
    config = require('../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose');


require('../lib/models');

var program = require('commander');
var _ = require('underscore');
var uuid = require('uuid/v4');

program
  .version('1.0.0')
  .usage('[options] -u MONGO_DB_USER_ID -s 1|0')
  .option('-l, --list', 'List user ids')
  .option('-u, --user <userid>', 'The user id to manipulate')
  .option('-r, --role <string>', 'Sets the user role')
  .option('-t, --token <string>', 'Adds a token for bearer authentication in a user, token is generated automatically (name for the token must be specified)')
  .option('-d, --delete', 'Combined with -t|--token removes the token if found')
  .parse(process.argv);

var User = mongoose.model('User');

if(program.list) {
  User.find().select('_id name email role').exec(function(err, users){
    console.log('ID                       ROLE     NAME');
    for(var u in users) {
      console.log(users[u]._id + ' ' + users[u].role + '       ' + users[u].name + ' <' + users[u].email +'>');
    }
    process.exit(0);
  });
} else if (program.user){
  User.findById(program.user).exec(function(err, user){
    if(err) {
      console.log('User not found!');
      // throw err;
      process.exit(1);
    }
    var save = false;
    if(program.role) {
      console.log('Changing user role to ' + program.role);
      user.role = program.role;
      save = true;
    }

    if(program.token) {
      user.tokens = user.tokens || [];
      if(program.delete) {
        console.log('Removing token [' + program.token +']');
        user.tokens = _.reject(user.tokens, function(t){
            return t.name === program.token;
          });
      } else {
        var token = uuid();
        console.log('Adding token [' + program.token +']: ' + token);
        user.tokens.push({name: program.token, token: token});
      }
      save = true;
    }

    console.log('User info:');
    console.log('Id: ' + user._id);
    console.log('Name: ' + user.name);
    console.log('Email: ' + user.email);
    console.log('Role: ' + user.role);
    console.log('Admin in: ',user.admin_in);
    console.log('Collection admin in: ',user.group_admin_in);
    console.log("Tokens:\n", _.map(user.tokens, function(t){ return "\t["  +t.name + ']: ' + t.token}).join("\n"));

    if(save) {
      user.save(function(err) {
        if(err) {
          console.log('ERROR saving object!');
          process.exit(1);
        }
        console.log('Done!');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }


  });
} else {
  console.log('An User Id is required, use -u XXXYYYZZZ or use -l to list all the users');
  process.exit(1);
}
