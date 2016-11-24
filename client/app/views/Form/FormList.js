/**
 * VIEW: Form List
 *
 */

var FormItem = require('./FormItem')
  , EditQuestion = require('./EditQuestion');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<p class="text-danger">No forms yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'panel-group',

  childView: FormItem,

  emptyView: EmptyView,

  events: {
    'click #new-question': 'editQuestion',
    'click .edit-question': 'editQuestion'
  },

  childViewOptions: function (model) {
    return {
      index: this.collection.indexOf(model) + 1,
      total: this.collection.length
    };
  },

  editQuestion: function(e) {
    var form = this.model;
    var id = $(e.target).data('id');
    // var form = new Form({
    //     id: id,
    //     domain: this.model.get('domain'),
    //     group: this.model.get('group'),
    //   });
    console.log(id ? 'edit' : 'new', id, form);
    if(id) {
      form.fetch().done(function(){
        hackdash.app.modals.show(new EditQuestion({
          model: form
        }));
      });
    } else {
      hackdash.app.modals.show(new EditQuestion({
        model: form
      }));
    }

  }

});
