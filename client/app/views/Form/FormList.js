/**
 * VIEW: Form List
 *
 */

var FormItem = require('./FormItem');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger">No forms yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'panel-group',

  childView: FormItem,

  emptyView: EmptyView,

  childViewOptions: function (model) {
    console.log('child', model, model.isNew());
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length
    };
  },


});
