/**
 * VIEW: Question List for form Editor, shows icons and title
 *
 */

var
    template = require('./templates/responseItem.hbs');

var Handlebars = require("hbsfy/runtime");

module.exports = Backbone.Marionette.ItemView.extend({

  className: 'panel panel-default',
  tagName: 'div',
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
    },

    format: function(response) {
      var type = response.question.type;
      var value = Handlebars.Utils.escapeExpression(response.value);
      console.log(response);
      if(type === 'file') {
        value = '<a href="' + response.value.path + '" target="_blank" data-bypass><img style="max-height:100px" src="' + response.value.path + '" alt="' + response.value.name + '"></a>';
      }
      else if(type === 'textarea') {
        value = value.replace(/(?:\r\n|\r|\n)/g, '<br>');
      }
      return new Handlebars.SafeString(value);
    }
  },

});
