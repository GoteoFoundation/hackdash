/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/forms.hbs')
  , FormRender = require('./FormRender')
  , FormList = require('./FormList')
  ;

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

  templateHelpers: {
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
  },

  initialize: function() {
    this.model.set({'project': hackdash.app.project});
  },

  onRender: function(){
    if(this.collection) {
      // Render list
      this.formContent.show(new FormList({
        collection: this.collection
      }));
    } else if(this.model) {
      // Render view
      this.formContent.show(new FormRender({
        model: this.model
      }));
    }
  },


});
