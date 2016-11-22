/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/questionItem.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

	template: template
});
