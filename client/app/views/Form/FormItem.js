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
    opened: function() {
      console.log('opened',this.openedForm, this._id);
      if(this.openedForm) {
        return this.openedForm === this._id;
      }
      return this.index === this.total;
    }
  },

  initialize: function() {
    console.log('init',this.options.openedForm);
    this.model.set({
        index: this.options.index,
        total: this.options.total,
        openedForm: this.options.openedForm
      });
  },

  onRender: function(){
    var self = this;

    self.drawQuestionList();
  },

  drawQuestionList: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
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
