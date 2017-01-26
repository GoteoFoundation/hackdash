/**
 * VIEW: An Embed Project
 *
 */

var CommentItem = require('./CommentItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p>No comments yet, be the first!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  childView: CommentItem,

  emptyView: EmptyView,

});
