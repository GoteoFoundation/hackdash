/**
 * MODEL: Question (bind to a collection or dashboard)
 *
 */


// var Admins = require("./Admins");

module.exports = Backbone.Model.extend({

  defaults: {
    admins: null
  },

  urlRoot: function(){
    return hackdash.apiURL + '/questions';
  },

});
