/**
 * VIEW: Question List
 *
 */

var ResponseItem = require('./ResponseItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No responses on this form!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'panel-group',

  emptyView: EmptyView,

  childView: ResponseItem,

});
