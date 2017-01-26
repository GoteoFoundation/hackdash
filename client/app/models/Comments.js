/**
 * MODEL: Comments
 *
 */

var BaseCollection = require('./BaseCollection');

var Comments = module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/projects/" + this.project + "/comments";
  },

  idAttribute: "_id",

  getOpened: function(){
    return new Comments(
      this.filter(function(dash){
        return dash.get("open");
      })
    );
  },

});

