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
      if(_.isEmpty(response.value)) {
        return new Handlebars.SafeString('<span class="label label-danger">--EMPTY--</span>');
      }
      var value = Handlebars.Utils.escapeExpression(response.value);
      if(type === 'file') {
        var path = response.value && response.value.path;
        var name = response.value && response.value.name;
        value = '<a href="' + path + '" target="_blank" data-bypass><img style="max-height:100px" src="/image' + path + '?dim=0x200" alt="' + name + '"></a>';
      }
      else if(type === 'textarea') {
        value = value.replace(/(?:\r\n|\r|\n)/g, '<br>');
      }
      return new Handlebars.SafeString(value);
    }
  },

});
