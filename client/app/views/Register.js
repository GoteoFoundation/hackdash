/**
 * VIEW: Login Modal
 *
 */

var template = require('./templates/register.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "register",
  template: template,

  events: {
    "click .close": "destroy"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------
  initialize: function(options){
    this.flashError = (options && options.model && options.model.attributes && options.model.attributes.flashError) || '';
  },

  templateHelpers: function() {
    var flashError = this.flashError;
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

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});