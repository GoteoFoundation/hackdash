/**
 * VIEW: Question Layout
 *
 */

var
    template = require('./templates/question.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,

  modelEvents: {
    "change": "render"
  },
  templateHelpers: {
    type: function() {
      return hackdash.app.type;
    }
  }
});