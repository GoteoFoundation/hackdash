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
    itemTitle: function() {
      return this.title || this.domain;
    },
    isDashboard: function() {
      return hackdash.app.type === 'dashboard_question';
    }
  }
});