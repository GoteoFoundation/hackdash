/**
 * VIEW: Question Layout
 *
 */

var
    template = require('./templates/questions.hbs')
  , AddQuestion = require('./AddQuestion')
  , QuestionList = require('./QuestionList')
  , Question = require("../../models/Question")
  , Questions = require("../../models/Questions")
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
    var self = this;
    var questions = new Questions();
    questions.domain = this.model.get('domain');

    questions.fetch().done(function(){
      self.questionList.show(new QuestionList({
        model: questions,
        // collection: questions.getActives(),
        collection: questions, // All questions to admin
      }));
    });

    this.newQuestion.show(new AddQuestion({
      model: new Question({
        domain: this.model.get('domain')
      })
    }));
  },

});