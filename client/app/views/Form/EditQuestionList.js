/**
 * VIEW: Question List
 *
 */

var QuestionItem = require('./EditQuestionItem')
  , Form = require('../../models/Form');

var EmptyView = Backbone.Marionette.ItemView.extend({
	template: _.template('<p class="text-danger">No questions yet!</p>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'div',
  className: 'list-group',

  childView: QuestionItem,

  emptyView: EmptyView,

  onRender: function() {
    this.$el.sortable({
      onEnd: this.endSortable.bind(this)
    });
  },

  endSortable: function(evt) {
    if(evt.oldIndex === evt.newIndex) {
      return;
    }
    var questions = this.model.get('questions'),
        questions2 = [];
    // var tmp = questions[evt.oldIndex];
    _.each(questions, function(v, i) {
      if(i === evt.newIndex) {
        if(evt.oldIndex < evt.newIndex) {
          questions2.push(v);
        }
        questions2.push(questions[evt.oldIndex]);
        if(evt.oldIndex > evt.newIndex) {
          questions2.push(v);
        }
      } else if(i !== evt.oldIndex) {
        questions2.push(v);
      }
    });
    var self = this;
    var form = new Form({
      id: this.model.get('_id'),
      domain: this.model.get('domain'),
      group: this.model.get('group')
    });
    this.$el.sortable('destroy');
    this.$el.css({'opacity': 0.4});
    form.fetch().done(function(){
      form.set({ "questions": questions2 }, { patch:true, trigger: false });
      form.save({ wait: true });
      self.model = form;
      self.$el.css({'opacity': 1});
      self.$el.sortable({
        onEnd: self.endSortable.bind(self)
      });
    });
  }
});
