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
    'click .edit-question': 'editQuestion',
    "click .public-btn": 'onClickSwitcher'
  },

  templateHelpers: {
    opened: function() {
      // console.log('opened',this.openedForm, this._id);
      if(this.openedForm) {
        return this.openedForm === this._id;
      }
      return this.index === this.total;
    }
  },

  modelEvents: {
    "change": "render"
  },


  initialize: function() {
    // console.log('init',this.options.openedForm);
    this.model.set({
        index: this.options.index,
        total: this.options.total,
        openedForm: this.options.openedForm
      });
  },

  serializeData: function(){

    var msg = "This Form is open: click to close";

    if (!this.model.get("open")) {
      msg = "This Form is closed: click to reopen. A message will be sent to all project leaders involved (only if not previously sent)";
    }
    return _.extend({
      switcherMsg: msg
    }, this.model.toJSON());
  },

  onRender: function(){
    $('.tooltips', this.$el).tooltip({});
    this.drawQuestionList();
  },

  drawQuestionList: function() {
    var form = this.model;
    this.questionsList.show(new QuestionList({
      model: form,
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
  },

  onClickSwitcher: function(e) {
    var $e = $(e.target).is('[data-id]') ? $(e.target) : $(e.target).closest('.public-btn');
    var self = this;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group')
    });
    var open = true;

    if ($e.hasClass("form-open")){
      open = false;
    }

    form.fetch().done(function(){

      $('.tooltips', self.$el).tooltip('hide');

      form.set({ "open": open }, { patch:true, trigger: false });
      form.save({ wait: true });
      self.model = form;
      self.render();
    });
  }

});
