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

});
