/**
 * MODEL: Comments
 *
 */

var BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  url: function(){
    return hackdash.apiURL + "/projects/" + this.project + "/comments";
  },

  idAttribute: "_id",

});

