/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formRender.hbs')
  , doneTemplate = require('./templates/formSent.hbs')
  , QuestionList = require('./QuestionList')
  ;

var DoneView = Backbone.Marionette.ItemView.extend({
  template: doneTemplate
});

module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,
  className: 'form-render',

  regions: {
    questionsList: ".questions-list",
    formContent: ".form-content",
    doneRegion: ".done",
  },

  ui: {
    formContent: ".form-content",
  },

  events: {
    'click .send-form': 'sendForm'
  },

  templateHelpers: {
    showErrors: function() {
      return this.errors;
    },
    showMessages: function() {
      return this.messages;
    }
  },

  onRender: function() {
    var form = this.model;
    if(form && form.get('done')) {
      hackdash.app.project = null;
      hackdash.app.type = 'forms_list';
      return this.formContent.show(new DoneView({
        model: this.model.get('project')
      }));
    }
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions()
    }));
  },

  sendForm: function() {
    var values = this.questionsList.currentView.getValues();
    var self = this;
    var res = {
        form: self.model.get('_id'),
        responses: values
      };

    self.model.sendResponse(res, function(err) {
      if(err) {
        return self.model.set({'errors': err});
      }
      self.model.set({done:true, 'messages': 'Data successfully saved!'});
    });
  }
});
