/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/editForm.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  className: "page-ctn form edition",
  template: template,

  ui: {
    'title' : 'input[name=title]',
    'description' : 'textarea[name=description]',
  },

  events: {
    "click #save": "save"
  },

  modelEvents: {
    "change": "render"
  },

  errors: {
    "title_required": "Title is required"
  },

  onShow: function() {
    this.simplemde = new window.SimpleMDE({
      element: this.ui.description.get(0),
      forceSync: true,
      spellChecker: false
    });
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val()
    };


    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
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
      var ctrl = error.split("_")[0];
      this.ui[ctrl].parents('.control-group').addClass('error');
      this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
    } catch(e) {
      window.alert(e + "\n" + err.responseText);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },
});
