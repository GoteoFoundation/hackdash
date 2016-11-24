/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
  , Form = require('./../../models/Form')
  , EditQuestion = require('./EditQuestion')
  , QuestionList = require('./QuestionList');

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
  },

  events: {
    'click #new-question': 'editQuestion',
    'click .edit-question': 'editQuestion'
  },

  templateHelpers: {
    isLastItem: function() {
      // console.log('isLastItem',this);
      return this.index === this.total;
    }
  },

  initialize: function() {
    this.model.set({
        index: this.options.index,
        total: this.options.total,
        // _id: this.opt
      });
  },

  onRender: function(){
    var self = this;

    self.drawQuestionList();
  },

  drawQuestionList: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
      // model: form,
      collection: form.getQuestions()
    }));
  },

  editQuestion: function(e) {
    var questionIndex = $(e.target).is('[data-index]') ? $(e.target).data('index') : -1;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions'),
      questionIndex: questionIndex
    });

    // model.id = model.get('id');
    if(questionIndex > -1) {
      // console.log('edit-' + questionIndex, form);
      form.fetch().done(function(){
        hackdash.app.modals.show(new EditQuestion({
          model: form
        }));
      });
    } else {
      // console.log('new', form);
      hackdash.app.modals.show(new EditQuestion({
        model: form
      }));
    }
  }

});
