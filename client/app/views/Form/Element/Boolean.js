/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/bool.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: {
    name: function() {
      return 'el_' + this._id;
    }
  },

});
