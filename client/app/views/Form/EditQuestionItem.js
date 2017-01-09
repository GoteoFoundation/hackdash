/**
 * VIEW: Question List for form Editor, shows icons and title
 *
 */

var
    template = require('./templates/editQuestionItem.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  className: 'list-group-item edit-question',
  tagName: 'a',
	template: template,

	templateHelpers: {
		fa: function(type) {
			switch(type) {
				case 'text':
					return 'pencil';
				case 'textarea':
					return 'align-left';
        case 'boolean':
          return 'check-square-o';
        case 'select':
          return 'list';
        case 'range':
          return 'sliders';
        case 'geocoder':
          return 'globe';
				case 'file':
					return 'file-o';
				default:
					return 'edit';
			}
		}
	},

  onRender: function() {
    this.$el.attr('id', this.model && this.model.get('_id'));
  }

});
