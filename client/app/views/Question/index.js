/**
 * VIEW: Question Layout
 *
 */

var
    template = require('./templates/questions.hbs')
  , EditQuestion = require('./EditQuestion')
  , QuestionList = require('./QuestionList')
  , Question = require("../../models/Question")
  , Questions = require("../../models/Questions")
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn profile",
  template: template,

  regions: {
    questionList: ".questions-list",
  },

  events: {
    'click #new-question': 'editQuestion',
    'click .edit-question': 'editQuestion'
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

    this.drawQuestionList();
    // Listens 'edited' event fired in EditQuestion
    // to reload the list if changes
    hackdash.app.modals.on('question_edited', function(){
      self.drawQuestionList();
    });

  },

  drawQuestionList: function() {
    var self = this;
    var questions = new Questions();

    questions.domain = this.model.get('domain'); //one of both will be empty
    questions.group = this.model.get('group');
    questions.fetch().done(function(){
      self.questionList.show(new QuestionList({
        model: questions,
        // collection: questions.getActives(),
        collection: questions, // All questions to admin
      }));
    });
  },

  editQuestion: function(e) {
    var id = $(e.target).data('id');
    var question = new Question({
        id: id,
        domain: this.model.get('domain'),
        group: this.model.get('group'),
      });
    // console.log(id ? 'edit' : 'new', id, question);
    if(id) {
      question.fetch().done(function(){
        hackdash.app.modals.show(new EditQuestion({
          model: question
        }));
      });
    } else {
      hackdash.app.modals.show(new EditQuestion({
        model: question
      }));
    }
  }
});