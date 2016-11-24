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
    title: function(){
      return this.questions[this.questionIndex] ? this.questions[this.questionIndex].title : '';
    },
    type: function(){
      return this.questions[this.questionIndex] ? this.questions[this.questionIndex].type : '';
    }
  },

  errors: {
    "title_required": "Title is required",
    "type_required": "Type is required"
  },

  initialize: function(){
    // console.log('init',this.model.questionIndex,this.model.get('questionIndex'));
    this.model.set({questionIndex: this.model.questionIndex});
  },

  save: function(){
    var q = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
    };
    var toSave = {questions: this.model.questions || []};
    toSave.questions.push(q);
    console.log(toSave, this.model);

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  destroyModal: function(){
    hackdash.app.modals.trigger('question_edited');
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
        self.ui[ctrl].after('<span class="help-inline">' + self.errors[o.path + '_' + o.kind] ? self.errors[o.path + '_' + o.kind] : o.message + '</span>');
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
