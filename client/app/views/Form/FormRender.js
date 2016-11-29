/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/formRender.hbs')
  , QuestionList = require('./QuestionList');


module.exports = Backbone.Marionette.LayoutView.extend({

  template: template,

  regions: {
    questionsList: ".questions-list",
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

  modelEvents: {
    "change": "render"
  },

  onRender: function() {
    var form = this.model;
    console.log(form);
    this.questionsList.show(new QuestionList({
      model: form,
      collection: form.getQuestions()
    }));
  },

  sendForm: function() {
    var model = this.model;
    var res = {
        form: model.get('_id'),
        responses: []
      };
    _.each(model.get('questions'), function(q){
        var $el = $('[name=el_' + q._id + ']', this.$el);
        var val = $el.val();
        if($el.is('input[type=checkbox]')) {
          val = $el.is(':checked');
        }
        res.responses.push({
          question: q._id,
          value: val
        });
      });
    model.sendResponse(res, function(err) {
      if(err) {
        return model.set('errors', err);
      }
      window.hackdash.flashMessage = 'Data successfully saved!';
      window.location = '/forms';
    });
  }
});
