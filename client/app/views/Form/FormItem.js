/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
  // , Question = require('./../../models/Question')
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
      return this.index === this.total;
    }
  },

  initialize: function() {
    this.model = this.model.set({
        index: this.options.index,
        total: this.options.total
      });
  },

  onRender: function(){
    var self = this;

    self.drawQuestionList();
    // // Listens 'edited' event fired in EditForm
    // // to reload the list if changes
    // hackdash.app.modals.on('question_edited', function(){
    //   self.drawQuestionList();
    // });

  },
  drawQuestionList: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions(), // All forms to admin
    }));
  },

  editQuestion: function(e) {
    var form = this.model;
    // var question = new Question({form:this.model._id});
    form.questionIndex = $(e.target).is('[data-index]') ? $(e.target).data('index') : -1;
    console.log(form.questionIndex > -1 ? ('edit ' + form.questionIndex) : 'new', e.target, form);

    hackdash.app.modals.show(new EditQuestion({
      model: form
    }));
  }

});
