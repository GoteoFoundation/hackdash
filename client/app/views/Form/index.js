/**
 * VIEW: User Forms views Layout
 *
 */

var
    template = require('./templates/forms.hbs')
  , FormRender = require('./FormRender')
  , FormList = require('./FormList')
  , FormItem = require('./FormItem')
  ;

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger text-center">Sorry, this form is not for you!</p>')
});

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn forms",
  template: template,

  regions: {
    formContent: ".forms-content",
  },

  events: {
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: function() {
    var flashError = this.flashError;
    var flashMessage = this.flashMessage;
    return {
      showErrors: function(){
        return flashError;
      },
      showMessages: function(){
        return flashMessage;
      },
      formTitle: function() {
        var title;
        switch(hackdash.app.type) {
          case 'dashboard_forms':
          case 'dashboard_forms_item':
            title = this.dashboard && this.dashboard.get('title') || hackdash.app.dashboard && hackdash.app.dashboard.get('title');
            return "Forms for <small>" + title + "</small>";
        }
        return 'Forms';
      },
      formDesc: function() {
        var title;
        switch(hackdash.app.type) {
          case 'dashboard_forms':
          case 'dashboard_forms_item':
            return "These surveys can be filled by anyone registered";
          case 'forms_project':
            title = this.project && this.project.get('title') || hackdash.app.project && hackdash.app.project.get('title');
            return 'Form for project <strong>' + title + '</strong>';
          case 'forms_item':
            return 'List of projects under this form';
          case 'forms_list':
        }
        return 'List of your forms';
      }
    };
  },

  initialize: function(options) {
    this.readOnly = options && options.readOnly;
    if(this.model) {
      this.model.set({'user': hackdash.user});
      if(hackdash.app.project) {
        this.model.set({'project': hackdash.app.project});
      }
    }
  },

  onRender: function(){
    var project = hackdash.app.project;
    var dashboard = hackdash.app.dashboard;
    if(this.collection) {
      // Render list
      console.log('Render form collection', this.collection);
      this.formContent.show(new FormList({
        collection: this.collection
      }));
    } else if(this.model && project) {
      // Render view
      console.log('Render form model for project', this.model, project, this.readOnly);
      this.formContent.show(new FormRender({
        model: this.model,
        readOnly: this.readOnly
      }));
    } else if(this.model && dashboard) {
      // Render view
      console.log('Render form model for dashboard', this.model, dashboard, this.readOnly);
      this.formContent.show(new FormRender({
        model: this.model,
        readOnly: this.readOnly,
        dashboard: dashboard
      }));
    } else if(this.model) {
      console.log('Render form model', this.model);
      this.formContent.show(new FormItem({
        model: this.model
      }));
    } else {
      this.formContent.show(new EmptyView());
    }
  },


});
