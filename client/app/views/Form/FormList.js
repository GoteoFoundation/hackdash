/**
 * VIEW: Form List
 *
 */

var QuesionItem = require('./QuestionItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('No forms yet!')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: QuesionItem,

  emptyView: EmptyView

});
