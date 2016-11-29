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

  initialize: function(options) {
    if(options.response) {
      this.model.set({'value': options.response.value});
    }
  }
});
