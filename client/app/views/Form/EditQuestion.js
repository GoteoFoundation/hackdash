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
    'type' : 'select[name=type]',
    'help' : 'input[name=help]'
  },

  events: {
    "click #save": "save",
    "click #delete": "delete"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    title: function() {
      return this.current ? this.current.title : '';
    },
    type: function() {
      return this.current ? this.current.type : null;
    },
    help: function() {
      return this.current ? this.current.help : null;
    },
    typeSelected: function(type) {
      var comp = this.current && this.current.type;
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

  initialize: function () {
    var id = this.model.get('questionId');
    if(id) {
      this.model.set({current: _.findWhere(this.model.get('questions'), {_id: id})});
    }
  },

  /**
   * Saves the question into model.questions and maintants the sub-ObjectID
   */
  save: function(){
    var model = this.model;
    var toSave = {questions: model.get('questions') || []};
    var id = model.get('questionId');
    var query = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
      help: this.ui.help.val(),
    };
    if(id) {
      toSave.questions = _.map(toSave.questions, function(q){
          if(q._id === id) {
            return _.extend(q, query);
          }
          return q;
        });
    } else {
      toSave.questions.push(query);
    }
    // console.log(toSave, model, model.isNew());

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  delete: function() {
    var id = this.model.get('questionId');
    if(!id) {
      return this.destroy();
    }
    if(window.confirm('Are you sure? Kittens may die!')) {
      var toSave = {questions: this.model.get('questions') || []};
      toSave.questions = _.reject(toSave.questions, function(q){
          return q._id === id;
        });
      $("#delete", this.$el).button('loading');

      this.model
        .save(toSave, { patch: true, silent: true })
        .success(this.destroyModal.bind(this))
        .error(this.showError.bind(this));
    }
  },

  destroyModal: function(){
    hackdash.app.modals.trigger('form_edited', this.model.get('id'));
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
