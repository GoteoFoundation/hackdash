/**
 * VIEW: Question Layout
 *
 */

var
    template = require('./templates/questions.hbs')
  , AddQuestion = require('./AddQuestion')
  , QuestionList = require('./QuestionList')
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn profile",
  template: template,

  regions: {
    questionList: ".questions-list",
    newQuestion: ".add-question"
  },

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
  },

  onRender: function(){
    this.questionList.show(new QuestionList());
    this.newQuestion.show(new AddQuestion());
  },

});