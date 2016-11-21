/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/addQuestion.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,

  ui: {
    'type' : '#newQuestionType'
  },

  onShow: function(){
    this.initSelect2();
  },

  initSelect2: function() {
    // if (this.model.get('type')){
    //   this.ui.type.val(this.model.get('type'));
    // }

    // this.ui.type.select2({
    //   placeholder: "Question type",
    //   // allowClear: true
    // });
  }

});
