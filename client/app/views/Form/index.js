/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/forms.hbs')
  , FormList = require('./FormList')
  // , Forms = require('./../../models/Forms')
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
          return 'Form for project ...';
        case 'forms_item':
          return 'List of projects under this form';
        case 'forms_list':
      }
      return 'List of your forms';
    }
  },

  onRender: function(){
    console.log('form render');
    if(this.collection) {
      // Render list
      console.log('collection',this.collection);
      this.formContent.show(new FormList({
        collection: this.collection
      }));
    } else if(this.model) {
      // Render view
      console.log('model',this.model);
    }
  },


});
