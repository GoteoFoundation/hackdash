/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/editQuestion.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  className: "page-ctn form edition",
  template: template,

  ui: {
    'title' : 'input[name=title]',
    'type' : 'select[name=type]'
  },

  events: {
    "click #save": "save"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    title: function() {
      return this.questions[this.questionIndex] ? this.questions[this.questionIndex].title : '';
    },
    type: function() {
      return this.questions[this.questionIndex] ? this.questions[this.questionIndex].type : null;
    },
    typeSelected: function(type) {
      var comp = this.questions[this.questionIndex] && this.questions[this.questionIndex].type;
      if(!comp) {
        comp = '';
      }
      if(!type) {
        type = '';
      }
      return comp === type ? ' selected' : '';
    }
  },

  errors: {
    "title_required": "Title is required",
    "type_required": "Type is required"
  },

  save: function(){
    var q = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
    };
    var model = this.model;
    var toSave = {questions: model.get('questions') || []};
    var index = model.get('questionIndex');
    if(index > -1) {
      toSave.questions[index] = q;
    } else {
      toSave.questions.push(q);
      model.set({questionIndex: toSave.questions.length -1 });
    }
    // console.log(toSave, model, model.isNew());

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  destroyModal: function(){
    hackdash.app.modals.trigger('form_edited');
    // TODO: update view
    this.destroy();
  },


  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.destroyModal();
      return;
    }
    try {
      var error = JSON.parse(err.responseText).error;
      var self = this;
      _.each(error.errors, function(o, k) {
        var ctrl = k.substr(k.lastIndexOf('.') + 1);
        self.ui[ctrl].parents('.control-group').addClass('error');
        var m = self.errors[o.path + '_' + o.kind] ? self.errors[o.path + '_' + o.kind] : o.message;
        self.ui[ctrl].after('<span class="help-inline">' + m + '</span>');
      });
    } catch(e) {
      window.alert(e + "\n" + err.responseText);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },
});
