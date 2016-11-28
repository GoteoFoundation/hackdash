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
      return 'el_' + this.index;
    }
  },

  initialize: function() {
    // console.log('init',this.options.openedForm);
    this.model.set({
        index: this.options.index,
        total: this.options.total
      });
  },
});
