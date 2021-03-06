/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text');

module.exports = Text.extend({

    templateHelpers: {
      type: function() {
        return 'email';
      },
      name: function() {
        return 'el_' + this._id;
      },
      placeholder: function() {
        return 'email@example.com';
      }
    }

});
