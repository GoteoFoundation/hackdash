/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formItem.hbs')
  , QuestionList = require('./QuestionList');

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
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
    var self = this;
    // var forms = new Questions();

    // forms.domain = this.model.get('domain'); //one of both will be empty
    // forms.group = this.model.get('group');
    // forms.fetch().done(function(){
      self.questionsList.show(new QuestionList({
        // model: forms,
        // collection: forms.getActives(),
        // collection: forms, // All forms to admin
      }));
    // });
  },

});
