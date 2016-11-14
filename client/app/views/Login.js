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

  ui: {
    "errorHolder": "#login-errors"
  },

  events: {
    "click .register": "register",
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || [];
    console.log(options, this.flashError);
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    console.log('flashError', flashError);
    return {
      showErrors: function(){
        return flashError;
      },
      redirectURL: function(){
        var url = hackdash.app.previousURL || '';
        return (url.length ? '?redirect=' + url : url);
      }
    };
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