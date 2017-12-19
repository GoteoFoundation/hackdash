/**
 * VIEW: Locale language chooser for HOME
 *
 */

var template = require('Home/templates/locale.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  templateHelpers: {
    language: function(){
      var l = window.hackdash.language;
      var ls = window.hackdash.languages;
      return ls ? (ls[l] ? ls[l] : l) : l;
    },
    languages: function(){
      return window.hackdash.languages;
    },
    isActive: function(key) {
      var l = window.hackdash.language;
      return key === l ? 'active' : '';
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

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
