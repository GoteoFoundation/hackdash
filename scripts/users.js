require('babel-core/register');
require("babel-polyfill");

var
    config = require('../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , program = require('commander')
  , uuid = require('uuid/v4')
  , gravatar = require("../lib/utils/gravatar");


require('../lib/models');


program
  .version('1.1.0')
  .usage('[options] -u MONGO_DB_USER_ID')
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
  User.findById(program.user).exec(async function(err, user){
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
    console.log('Username: ' + user.username);
    console.log('Name: ' + user.name);
    console.log('Email: ' + user.email);
    console.log("Picture: " + user.picture);
    console.log("Has gravatar: " + gravatar.isGravatar(user.picture));
    console.log("Valid gravatar: " + await gravatar.isValid(user.picture));
    console.log("Bio: " + user.bio);
    console.log('Role: ' + user.role);
    console.log("Tokens:")
    _.map(user.tokens, (t) => console.log(`\t[${t.name}]: ${t.token}`) );
    console.log('Admin in: ',_.toArray(user.admin_in));
    console.log('Collection admin in: ',_.toArray(user.group_admin_in));
    console.log("OAuth provider: " + user.provider);
    console.log("Created at: " + user.created_at);
    console.log("Social: ");
    _.mapObject(user.social, (v,k) => v && _.isString(v) && console.log(`\t${k}: ${v}`));
    console.log("Skills: " + user.skills);

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
