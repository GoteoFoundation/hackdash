
require('babel/register');
var
    config = require('../config')
  , async = require('async')
  , mongoose = require('mongoose');


require('../lib/models');

var program = require('commander');

program
  .version('1.0.0')
  .usage('[options] -t "My Collection" -d dash1,dash2,dash3 -o MONGO_DB_USER_ID')
  .option('-t, --title <title>', 'Title of collection')
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
  abort('At least one dashboard is required, use -d dash1,dash2', true);
} else if (!program.owner){
  abort('An User Id as owner is required, use -o XXXYYYZZZ');
} else {
  execute();
}


function execute() {

  var collection = {
    title: program.title || '',
    dashboards: (program.dashboards).split(','),
    owner: program.owner
  }

  async.waterfall([

    function (done){ // confirm collection
      console.log(">>> About to create this collection: ");
      console.dir(collection);

      program.confirm('Continue? ', function(ok){
        if (ok) return done(null, collection);
        done('canceled');
      });
    },

    function (collection, done){ // check User Owner Existance
      //console.log(">>> Creating collection ... ");
      console.log(">>> Validating User Owner ... ");

      User.findById(collection.owner).exec(function(err, user){
        if (err) return done(err);
        if (!user) return done(new Error("User with ID "+collection.owner+" was not found"));
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
      Collection.create(collection, function(err, collection){
        if(err) return done(err);
        done(null, collection);
      });
    }

  ], function(err, collection){
    if (err === 'canceled'){
      console.log('canceled!');
      process.exit(0);
    }
    else if (err){
      throw err;
    }

    console.log('collection created! Visit ' + config.host + '/collections/' + collection._id);
    process.exit(0);
  });
}


function exit(msg) {
  console.log(msg);
  process.exit(1);
}

function abort(msg, list_collections) {
  var users = []
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
      console.log('');
      Collection.find({}, function(err, col) {
        if(err) return exit(err);
        console.log('Available collections are:');
        for(d in col) {
          console.log(col[d].title, 'BY',  users[col[d].owner].name, 'USER_ID', col[d].owner);
        }
        done();
      });
    },
    function(done) {
      console.log('');
      Dashboard.find({}, function(err, dash) {
        if(err) return exit(err);
        console.log('Available dashboards are:');
        for(d in dash) {
          console.log(dash[d].domain, 'BY',  users[dash[d].owner].name, 'USER_ID', dash[d].owner);
        }
        done();
      });
    },

    function() {
      process.exit(1);
    }
  ]);
}

