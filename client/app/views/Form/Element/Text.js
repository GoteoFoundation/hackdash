/**
 * VIEW: input:Text element in form
 *
 */

var
    template = require('./templates/input.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,

  templateHelpers: {
    type: function() {
      return 'text';
    },
    name: function() {
      return 'el_' + this._id;
    }
  },

  ui: {
    input: '.form-control:first'
  },

  events: {
    'change @ui.input': 'setValue'
  },

  initialize: function(options) {
    if(options.response) {
      this.model.set({'value': options.response.value});
    }
    this.form = options.form;
    this.entity = options.entity;
  },

  setValue: function() {
    console.log('setValue', this.ui.input.val());
    this.model.set({'value' : this.ui.input.val()});
  }
});
