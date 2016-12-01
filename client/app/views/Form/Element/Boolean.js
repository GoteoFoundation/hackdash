/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/bool.hbs');

module.exports = Text.extend({

  template: template,

  ui: {
    input: 'input[type=checkbox]'
  },

  templateHelpers: {
    name: function() {
      return 'el_' + this._id;
    }
  },


  onRender: function() {
    this.model.set({'value' : !!this.model.get('value')});
  },

  setValue: function () {
    this.model.set({'value' : this.ui.input.is(':checked')});
  }

});
