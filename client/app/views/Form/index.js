/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/forms.hbs')
  , FormRender = require('./FormRender')
  , FormList = require('./FormList')
  , FormItem = require('./FormItem')
  ;

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger">Sorry, this form is not for you!</p>')
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
      formDesc: function() {
        switch(hackdash.app.type) {
          case 'forms_project':
            return 'Form for project <strong>' + this.project.get('title') + '</strong>';
          case 'forms_item':
            return 'List of projects under this form';
          case 'forms_list':
        }
        return 'List of your forms';
      }
    };
  },

  initialize: function() {
    if(this.model && hackdash.app.project) {
      this.model.set({'project': hackdash.app.project});
    }
  },

  onRender: function(){
    var project = hackdash.app.project;
    if(this.collection) {
      // Render list
      console.log('Render form collection', this.collection);
      this.formContent.show(new FormList({
        collection: this.collection
      }));
    } else if(this.model && project) {
      // Render view
      console.log('Render form model for project', this.model, project);
      this.formContent.show(new FormRender({
        model: this.model
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
