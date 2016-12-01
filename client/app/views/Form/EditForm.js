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
    'template' : 'input[name=template]',
    'fromTemplate': '.from-template'
  },

  events: {
    "click #save": "save",
    "change @ui.fromTemplate": 'createFromTemplate'
  },

  modelEvents: {
    "change": "render"
  },

  errors: {
    "title_required": "Title is required"
  },

  templateHelpers: function() {

    return {
      showTemplates: function() {
        console.log('templates', this.templates);
        return this.templates && this.templates.length;
      },
      getTemplates: function() {
        return this.templates;
      }
    };
  },

  initialize: function() {
    var self = this;
    if(!self.model.get('_id')) {
      // fetch templates
      self.model.fetchTemplates(function(err, templates) {
        if(err) {
          return window.alert('Templates cannot be fetched! '+ err);
        }
        self.model.set({'templates': templates});
      });
    }
  },

  onRender: function() {
    this.simplemde = new window.SimpleMDE({
      element: this.ui.description.get(0),
      forceSync: true,
      spellChecker: false
    });
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      template: this.ui.template.is(':checked')
    };

    // console.log(toSave, this.model, this.model.isNew());

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  createFromTemplate: function() {
    console.log('Create from template');
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
