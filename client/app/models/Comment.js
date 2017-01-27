/**
 * MODEL: Comment
 *
 */

module.exports = Backbone.Model.extend({

  url: function(){
    return hackdash.apiURL + "/comments";
  },

  idAttribute: "_id",

});

