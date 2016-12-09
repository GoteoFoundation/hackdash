/**
 * MODEL: Dashboards
 *
 */

var BaseCollection = require('./BaseCollection');

var Dashboards = module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/dashboards";
  },

  idAttribute: "_id",


  getOpened: function(){
    return new Dashboards(
      this.filter(function(dash){
        return dash.get("open");
      })
    );
  },

});

