/**
 * VIEW: Comment Item
 *
 */

var
    template = require('./templates/comment.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template
});
