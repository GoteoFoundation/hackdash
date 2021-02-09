/**
 * VIEW: Embeded Login Modal
 *
 */

var template = require('./templates/embedLogin.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "login embed",
  template: template,

  ui: {
    "errorHolder": "#login-errors"
  },

  events: {
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
    this.flashMessage = (options && options.model && options.model.attributes && options.model.attributes.flashMessage) || '';
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    return {
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
      },
      redirectURL: function(){
        var url = hackdash.app.previousURL || '';
        return (url.length ? '?redirect=' + url : url);
      },
      logged: function() {
        return !!hackdash.user;
      }
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------
  onRender: function() {
    // send the bearer to embeding iframe if detected
    if(hackdash.user && window.parent !== window ) {
      console.log('sending bearer token');
      var token = _.findWhere(hackdash.user.tokens, {name: "LoginAuto"});
      window.parent.postMessage(token && token.token);
    }
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
