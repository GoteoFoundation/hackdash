/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formRender.hbs')
  , QuestionList = require('./QuestionList');


module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
  },

  events: {
  },

  templateHelpers: {
  },

  modelEvents: {
    "change": "render"
  },

  onRender: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions()
    }));
  }
});
