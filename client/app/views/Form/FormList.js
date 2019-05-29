/**
 * VIEW: Form List
 *
 */

var FormItem = require('./FormItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger text-center">Sorry, no forms for you!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',

  childView: FormItem,

  emptyView: EmptyView,

});
