/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
;

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  events: {
  },

  templateHelpers: {
  },

  modelEvents: {
    "change": "render"
  },

  initialize: function() {
    if(this.model && this.hasOwnProperty('getMyProjects')) {
      this.model.set({projects: this.model.getMyProjects()});
    }
  }
});
