/**
 * VIEW: Question List
 *
 */

var
    template = require('./templates/questionItem.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

	template: template,

	templateHelpers: {
		fa: function(type) {
			switch(type) {
				case 'text':
					return 'pencil';
				case 'textarea':
					return 'file-text-o';
				case 'boolean':
					return 'check-square-o';
				default:
					return 'edit';
			}
		}
	}
});
