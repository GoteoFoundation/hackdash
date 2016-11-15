/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/forgot.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "forgot",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
    this.flashMessage = (options && options.model && options.model.attributes && options.model.attributes.flashMessage) || '';
    this.token = (options && options.model && options.model.attributes && options.model.attributes.token) || null;
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    var token = this.token;
    return {
      token: function(){
        return token;
      },
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
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

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});