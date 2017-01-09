/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/editFormItem.hbs')
  , Form = require('./../../models/Form')
  , EditQuestion = require('./EditQuestion')
  , QuestionList = require('./EditQuestionList')
  , FormRender = require('./FormRender')
  , FormResponses = require('./FormResponses');

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
  },

  events: {
    'click .new-question': 'editQuestion',
    'click .preview-form': 'previewForm',
    'click .view-responses': 'viewResponses',
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

  previewForm: function() {
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions')
    });
    // Make a bigger modal
    form.fetch().done(function(){
      $('.modal .modal-dialog').addClass('modal-lg');
      hackdash.app.modals.show(new FormRender({
        model: form,
        dummy: true
      }));
      $('.modal').one('hide.bs.modal', function() {
        $('.modal .modal-dialog').removeClass('modal-lg');
      });
    });
  },

  viewResponses: function() {
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions')
    });
    // Make a bigger modal
    form.fetch().done(function(){
      $('.modal .modal-dialog').addClass('modal-lg');
      hackdash.app.modals.show(new FormResponses({
        model: form
      }));
      $('.modal').one('hide.bs.modal', function() {
        $('.modal .modal-dialog').removeClass('modal-lg');
      });
    });
  },

  editQuestion: function(e) {
    console.log(e);
    var id = $(e.target).is('[id]') ? $(e.target).attr('id') : null;

    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group'),
      questions: this.model.get('questions'),
      questionId: id
    });

    if(id) {
      // console.log('edit-' + id, form);
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
    var open = true;

    if ($e.hasClass("form-open")){
      open = false;
    }
    if(open && !window.confirm(__('Are you sure to publish this form?'))) {
      return;
    }

    var self = this;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group')
    });

    form.fetch().done(function(){

      $('.tooltips', self.$el).tooltip('hide');

      form.set({ "open": open }, { patch:true, trigger: false });
      form.save({ wait: true });
      self.model = form;
      self.render();
    });
  }

});
