/**
 * VIEW: ProfileCard
 *
 */

var template = require('./templates/card.hbs')
  , roles = require('../../../../config/roles.json');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  events: {
    "click .login": "showLogin"
  },

  modelEvents:{
    "change": "render"
  },

  templateHelpers: {
    getRole: function() {
      if(roles) {
        var r = _.findWhere(roles, {role: this.role});
        if(r) {
          return r.name;
        }
        return this.role;
      }
      return null;
    }
  },
  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  showLogin: function(){
    hackdash.app.showLogin();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
