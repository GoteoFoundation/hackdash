/**
 * VIEW: An Embed Project
 *
 */

var CommentItem = require('./CommentItem');

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'ul',
  className: 'media-list',

  modelEvents: {
    "change": "render"
  },


  childView: CommentItem


});
