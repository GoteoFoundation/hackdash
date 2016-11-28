/**
 * VIEW: Form Layout
 *
 */

var
    template = require('./templates/editForms.hbs')
  , EditForm = require('./EditForm')
  , FormList = require('./EditFormList')
  , Form = require("../../models/Form")
  , Forms = require("../../models/Forms")
  ;

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn forms",
  template: template,

  regions: {
    formList: ".forms-list",
  },

  events: {
    'click #new-form': 'editForm',
    'click .edit-form': 'editForm'
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    itemTitle: function() {
      return this.title || this.domain;
    },
    isDashboard: function() {
      return hackdash.app.type === 'dashboard_form';
    }
  },

  onRender: function(){
    var self = this;

    this.drawFormList();
    // Listens 'edited' event fired in EditForm
    // to reload the list if changes
    hackdash.app.modals.on('form_edited', function(id){
      // console.log('redraw form', id);
      self.drawFormList(id);
    });

  },

  drawFormList: function(id) {
    var self = this;
    var forms = new Forms();

    forms.domain = this.model.get('domain'); //one of both will be empty
    forms.group = this.model.get('group');
    forms.fetch().done(function(){
      self.formList.show(new FormList({
        // collection: forms.getActives(),
        collection: forms, // All forms to admin
        openedForm: id
      }));
    });
  },

  editForm: function(e) {
    var id = $(e.target).data('id');
    var form = new Form({
        id: id,
        domain: this.model.get('domain'),
        group: this.model.get('group'),
      });
    // console.log(id ? 'edit' : 'new', id, form);
    if(id) {
      form.fetch().done(function(){
        hackdash.app.modals.show(new EditForm({
          model: form
        }));
      });
    } else {
      hackdash.app.modals.show(new EditForm({
        model: form
      }));
    }
  },

});
