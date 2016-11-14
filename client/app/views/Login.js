/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/login.hbs');
var Register = require("./Register");

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "login",
  template: template,

  events: {
    "click .register": "register",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  templateHelpers: {
    redirectURL: function(){
      var url = hackdash.app.previousURL || '';
      return (url.length ? '?redirect=' + url : url);
    }
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  register: function(){
    hackdash.app.modals.show(new Register({
        model: this.model
      }));
    this.destroy();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});