// require('babel-core/register');
var
    config = require('../config/config.json')
  , async = require('async')
  , util = require('util')
  // , mongoose = require('mongoose')
  , mongoose = require('mongoose')
  , colors = require('colors');


// require('../lib/models');

var program = require('commander');


program
  .version('0.0.1')
  .option('-c, --check <db>', 'Database to check against')
  .option('-d, --database <db>', 'Database to write')
  .parse(process.argv);

console.log(program.check, program.database);

if (!program.check || !program.database) {
  console.error("-c and -d arguments needed");
  process.exit(1);
}

var db1="mongodb://localhost/"+program.database;
var db2="mongodb://localhost/"+program.check;
var con1 = mongoose.createConnection(db1);
var con2 = mongoose.createConnection(db2);

var ProjectSchema = new mongoose.Schema({projectId:Number,title:String,forms:[]});
var Project1 = con1.model('Project', ProjectSchema);
var Project2 = con2.model('Project', ProjectSchema);

var projects = [];
var processed = 0;
var update = [];

function processPrj(p1, p2) {
  console.log('Project ' + colors.blue(p1.title) + ' present in '+db2);
  var db1_responses = false;
  var db2_responses = false;
  if(p1.forms && p1.forms.length) {
    p1.forms.forEach(function(f){
      if(f.responses && f.responses.length) {
        db1_responses=true;
      }
    });
  }
  if(p2.forms && p2.forms.length) {
    p2.forms.forEach(function(f){
      if(f.responses && f.responses.length) {
        db2_responses=true;
      }
    });
  }
  if(db1_responses) {
    console.log(colors.green('DB1 has responses'));
  } else {
    console.log(colors.red('DB1 has not responses'));
  }
  if(db2_responses) {
    console.log(colors.green('DB2 has responses'));
  } else {
    console.log(colors.red('DB2 has not responses'));
  }
  if(db2_responses && !db1_responses) {
    console.log(colors.cyan("copying DB2 responses over DB1"));
    p1.forms = p2.forms;
    update.push(p1);

  }
  if(db2_responses && db1_responses) {
    console.log('DIFF');
    console.log(colors.cyan("DB1"),util.inspect(p1.forms))
    console.log(colors.cyan("DB2"), util.inspect(p2.forms))
  }
}

async.waterfall([

  function(done) {
    Project1.find().exec(function(err, prjs1){
      // console.log(prjs.toString());
      projects = prjs1;
      console.log("TOTAL", prjs1.length);
      prjs1.forEach(function(p){
        // console.log("Database:",p._id,p.projectId,p.title);
        Project2.findById(p.id).exec(function(err, p2){
          if(err) {
            console.log('Not found', err.toString());
            process.exit(1);
          }
          processed++;
          if(p2) {
            processPrj(p, p2)
          } else {
            console.log('Project ' + colors.red(p.title) + ' not present in '+db2);
          }
          if(processed == projects.length) {
            console.log('All processed');
            done();
          }
        });
      })
    });
  },
  function(done) {
    processed = 0;
    if(update && update.length) {
      update.forEach(function(p){
        console.log('Updating project ' + colors.blue(p.title));
        p.save(function(err){
          if(err) {
            console.log('Error saving', err);
            process.exit(2);
          }
          processed++;
          if(processed == update.length) {
            done();
          }
        });
      });
    } else {
      done();
    }
  },
  function() {
    console.log('DONE');
    process.exit(0);
  }
  ]);
