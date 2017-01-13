
require('babel-core/register');
var
    config = require('../config/config.json')
  , async = require('async')
  , mongoose = require('mongoose')
  , colors = require('colors');

require('../lib/models');

var program = require('commander');

program
  .version('1.0.0')
  .usage('[options] -t "My Collection" -d dash1,dash2,dash3 -o MONGO_DB_USER_ID')
  .option('-t, --title <title>', 'Title of collection')
  .option('-c, --collection <collection>', 'The collection id to modify (if no owner specified)')
  .option('-o, --owner <userid>', 'The user id Owner of the collection')
  .option('-d, --dashboards <items>', 'Dashboards domains separated by an space')
  .parse(process.argv);

var Dashboard = mongoose.model('Dashboard');
var User = mongoose.model('User');
var Collection = mongoose.model('Collection');

function dashboards(val) {
  return val.split(',');
}

if (!program.dashboards || program.dashboards.length === 0){
  if(program.collection) {
    // Show dashboards in collection
    abort('Shown dashboard in collection [' + colors.green(program.collection) + ']', program.collection);
  } else {
    abort('At least one dashboard is required, use -d dash1,dash2', true);
  }
} else if (!program.owner && !program.collection){
  abort('An User Id as owner or a Collection Id is required, use -o XXXYYYZZZ or -c XXXYYYZZZ');
} else {
  execute();
}


function execute() {

  var collection = {
    title: program.title || '',
    dashboards: (program.dashboards).split(','),
    owner: program.owner,
    collection: program.collection
  }

  var owner = null;

  async.waterfall([

    function (done){ // confirm collection
      if(program.collection) {
        Collection.findById(program.collection).exec(function(err, col){
          if(err) return done(err);
          if(!col) return done('Collection not found');
          console.log(">>> About to modify this collection: ");
          console.log(colors.blue(col.title), 'WITH THIS DASHBOARDS:', colors.blue(col.dashboards));
          program.confirm('Continue? ', function(ok){
            collection.col = col;
            collection.title = col.title;
            collection.owner = col.owner;
            if (ok) return done(null, collection);
            done('canceled');
          });
        });
      } else {
        console.log(">>> About to create this collection: ");
        console.dir(collection);

        program.confirm('Continue? ', function(ok){
          if (ok) return done(null, collection);
          done('canceled');
        });
      }
    },

    function (collection, done){ // check User Owner Existance
      //console.log(">>> Creating collection ... ");
      console.log(">>> Validating User Owner ... ");

      User.findById(collection.owner).exec(function(err, user){
        if (err) return done(err);
        if (!user) return done(new Error("User with ID "+colors.green(collection.owner)+" was not found"));
        owner = user;
        done(null, collection);
      });
    },

    function (collection, done){ // validate dashboards
      console.log(">>> Validating Dashboards ... ");

      Dashboard
        .find({ domain: { $in: collection.dashboards }})
        .select('_id domain').exec(function(err, dashboards){

        if (err) return done(err);
        if (!dashboards || dashboards.length === 0) return done(new Error("No dashboards where found"));

        var dashIds = dashboards.map(function(d) { return d._id; });
        var dashboards = dashboards.map(function(d) { return d.domain; });

        var notFounds = collection.dashboards.filter(function(dash){
          return (dashboards.indexOf(dash) === -1 ? true : false );
        });

        if (notFounds.length > 0){
          return done(new Error("Dashboards "+notFounds.join(',')+" where not found"));
        }

        collection.dashboards = dashIds;

        done(null, collection);
      });
    },

    function (collection, done){ // last chance
      console.log(">>> Creating collection: ");
      console.dir(collection);

      program.confirm('Is it ok? ', function(ok){
        if (ok) return done(null, collection);
        done('canceled');
      });
    },

    function (collection, done){ // create the collection
      if(collection.col) {
        collection.col.dashboards = collection.dashboards;
        collection.col.save(function(err){
          if(err) return exit(err);
          collection._id = collection.col._id;
          done(null, collection);
        });
      } else {
        Collection.create(collection, function(err, collection){
          if(err) return exit(err);
          done(null, collection);
        });
      }
    }

  ], function(err, collection){
    if (err === 'canceled'){
      console.log('canceled!');
      process.exit(0);
    }
    else if (err){
      throw err;
    }
    // Update user admin
    owner.group_admin_in = owner.group_admin_in || [collection._id];
    if(owner.group_admin_in.indexOf(collection._id) == -1) {
      owner.group_admin_in.push(collection._id);
    }
    owner.save(function(err){
      if(err) return exit(err);
      if(collection.col) {
        console.log('Collection modified! Visit ' + colors.green(config.host + '/collections/' + collection._id));
      } else {
        console.log('Collection created! Visit ' + colors.green(config.host + '/collections/' + collection._id));
      }
      process.exit(0);
    });
  });
}


function exit(msg) {
  console.log(msg);
  process.exit(1);
}

function abort(msg, list_collections) {
  var users = []
  var dashboards = [];
;  async.waterfall([
    function(done) {
      console.error(msg);
      if(!list_collections) {
        process.exit();
      }
      done();
    },
    function(done) {
      User.find({}, function(err, all_users) {
        if(err) return exit(err);
        for(var i in all_users) {
          users[all_users[i]._id] = all_users[i];
        }
        done();
      });
    },
    function(done) {
      var q = {};
      if(typeof list_collections == 'string') {
        Collection.findById(list_collections).exec(function(err, col) {
          if(err) return exit(err);
          if(col) dashboards = col.dashboards;
          done();
        });
      } else {
        console.log('');
        console.log('Available collections are:');
        Collection.find(q, function(err, col) {
          if(err) return exit(err);
          for(d in col) {
            console.log('[' + colors.blue(col[d].title)+']', 'COLLECTION_ID', colors.green(col[d]._id), 'BY',  '['+colors.cyan(users[col[d].owner].name)+']', 'USER_ID', colors.cyan(col[d].owner));
          }
          done();
        });
      }
    },
    function(done) {
      console.log('');
      var q = {};
      if(typeof list_collections == 'string') {
        q._id = { $in: dashboards }
      }

      Dashboard.find(q, function(err, dash) {
        if(err) return exit(err);
        console.log('Available dashboards are:');
        for(d in dash) {
          var dashboard = dash[d].domain;
          var owner = dash[d].owner;
          var user = users[owner] && users[owner].name;
          console.log('['+colors.green(dashboard)+']', 'BY',  '['+colors.cyan(user)+']', 'USER_ID', colors.cyan(owner));
        }
        done();
      });
    },

    function() {
      process.exit(1);
    }
  ]);
}

