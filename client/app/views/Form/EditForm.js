/**
 * VIEW: Modal view for edit Form title/description (Admin)
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
    'public' : 'input[name=public]',
    'fromTemplate': '.from-template'
  },

  events: {
    "click #save": "save",
    "click #delete": "delete",
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
      isNew: function() {
        return !this._id;
      },

      showTemplates: function() {
        return this.templates && this.templates.length;
      },
      getTemplates: function() {
        return _.map(this.templates, function(t) {
          return {
            id: t._id,
            desc: t.title + ' - From ' + (t.group ? 'Collection [' + t.group.title + ']' : 'Dashboard [' + t.domain + ']')
          };
        });
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
    this.ui.fromTemplate.select2({
      theme: 'bootstrap',
      dropdownParent: this.$el
    });
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      description: this.ui.description.val(),
      template: this.ui.template.is(':checked'),
      public: this.ui.public.is(':checked')
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
    var template = _.findWhere(this.model.get('templates'), {_id: this.ui.fromTemplate.val()});
    var sanitized = _.omit(template, ['_id', 'created_at', 'creator', 'domain', 'group']);
    sanitized.title = '[COPY] ' + sanitized.title;
    // console.log('Create from template', template, sanitized);

    $("#save", this.$el).button('loading');

    this.model.save(sanitized, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  delete: function() {
    var id = this.model.get('_id');
    if(!id) {
      return this.destroy();
    }
    if(window.confirm("Are you sure? Kittens may (and will) die!\nForms already responded cannot be deleted.")) {
      $("#delete", this.$el).button('loading');

      this.model
        .destroy({ silent: true })
        .success(this.destroyModal.bind(this))
        .error(this.showError.bind(this));
    }
  },

  destroyModal: function() {
    hackdash.app.modals.trigger('form_destroyed', this.model.get('id'));
    // TODO: update view
    this.destroy();
  },


  showError: function(err) {
    $("#save", this.$el).button('reset');
    $("#delete", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.destroyModal();
      return;
    }

    try {
      var error = JSON.parse(err.responseText).error;
      var ctrl = error.split("_")[0];
      this.ui[ctrl].parents('.form-group').addClass('has-error');
      this.ui[ctrl].after('<span class="help-block">' + this.errors[error] + '</span>');
    } catch(e) {
      window.alert(err.responseText);
    }

  },

  cleanErrors: function(){
    $(".has-error", this.$el).removeClass("has-error");
    $("span.help-block", this.$el).remove();
  },
});
