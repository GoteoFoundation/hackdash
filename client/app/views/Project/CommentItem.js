/**
 * VIEW: Comment Item
 *
 */

var
    template = require('./templates/comment.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
  template: template,
  tagName: 'li',
  className: 'media',

  modelEvents: {
    "change": "render"
  },

  templateHelpers: {
    getType: function() {
      if(this.type) {
        return __('comment-type-' + this.type);
      }
      return '';
    },
    getComment: function() {
      var md = this.comment.trim();
      if(md) {
        return markdown.toHTML(md).trim();
      }
      return '';
    }
  }

});
