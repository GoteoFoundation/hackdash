/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/addQuestion.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  template: template,

  ui: {
    'title' : 'input[name=title]',
    'type' : 'select[name=type]'
  },

  events: {
    "click #save": "save"
  },

  modelEvents: {
    "change": "render"
  },

  onShow: function(){
  },


  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
    };

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.redirect.bind(this))
      .error(this.showError.bind(this));
  },

  redirect: function(){
    var url = "/dashboards/" + this.model.get('domain') + '/questions';

    hackdash.app.router.navigate(url, { trigger: true, replace: true });
  },


  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.redirect();
      return;
    }

    console.log(err.responseText);
    var error = JSON.parse(err.responseText).error;

    var ctrl = error.split("_")[0];
    this.ui[ctrl].parents('.control-group').addClass('error');
    this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },
});
