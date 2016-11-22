/**
 * VIEW: addQuestion
 *
 */

var
    template = require('./templates/addQuestion.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  className: "page-ctn question edition",
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

  errors: {
    "title_required": "Title is required",
    "type_required": "Type is required"
  },

  save: function(){

    var toSave = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
    };

    console.log('toSave',toSave);

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    this.model
      .save(toSave, { patch: true, silent: true })
      .success(this.redirect.bind(this))
      .error(this.showError.bind(this));
  },

  redirect: function(){
    // var url = "/dashboards/" + this.model.get('domain') + '/questions';
    console.log('REDIRECT');
    var url = "/dashboards/" + this.model.get('domain');
    console.log('URL', url);
    hackdash.app.router.navigate(url, { trigger: true, replace: true });
  },


  showError: function(err){
    console.log('ERROR', err);
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.redirect();
      return;
    }

    try {
      var error = JSON.parse(err.responseText).error;
      var ctrl = error.split("_")[0];
      this.ui[ctrl].parents('.control-group').addClass('error');
      this.ui[ctrl].after('<span class="help-inline">' + this.errors[error] + '</span>');
    } catch(e) {
      window.alert(e + "\n" + err.responseText);
    }

  },

  cleanErrors: function(){
    $(".error", this.$el).removeClass("error");
    $("span.help-inline", this.$el).remove();
  },
});
