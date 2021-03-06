/**
 * VIEW: Edit question modals for form editor (Admin)
 *
 */

var
    template = require('./templates/editQuestion.hbs')
  , OptSelect = require('./EditSelectOptions')
  , OptCheckbox = require('./EditCheckboxOptions')
  , OptGeocoder = require('./EditGeocoderOptions')
  , OptFile = require('./EditFileOptions')
  , OptRange = require('./EditRangeOptions');

module.exports = Backbone.Marionette.LayoutView.extend({

  className: "page-ctn form edition",
  template: template,

  ui: {
    'title' : 'input[name=title]',
    'type' : 'select[name=type]',
    'help' : 'input[name=help]'
  },

  regions: {
    optionsRegion: '.question-options'
  },

  events: {
    "click #save": "save",
    "click #delete": "delete",
    "change @ui.type": "changeType"
  },

  modelEvents: {
    "change": "render"
  },

  templateHelpers: function() {
    var self = this;
    return {
      title: function() {
        return this.current ? this.current.title : '';
      },
      type: function() {
        return this.current ? this.current.type : null;
      },
      help: function() {
        return this.current ? this.current.help : null;
      },
      typeSelected: function(type) {
        return self.isType.call(this, type) ? ' selected' : '';
      }
    };
  },

  errors: {
    "title_required": "Title is required",
    "type_required": "Type is required"
  },

  initialize: function () {
    var id = this.model.get('questionId');
    if(id) {
      this.model.set({current: _.findWhere(this.model.get('questions'), {_id: id})});
    }
  },

  onRender: function() {
    this.setOptions();
  },

  setOptions: function() {
    var c = this.model.get('current') ? this.model.get('current') : {};
    this.optionsRegion.reset();
    this.subOptions = null;
    var region = null;
    if(c.type === 'select') {
      region = new OptSelect({ model: new Backbone.Model(c) });
    }
    if(c.type === 'checkbox') {
      region = new OptCheckbox({ model: new Backbone.Model(c) });
    }
    if(c.type === 'range') {
      region = new OptRange({ model: new Backbone.Model(c) });
    }
    if(c.type === 'geocoder') {
      region = new OptGeocoder({ model: new Backbone.Model(c) });
    }
    if(c.type === 'file') {
      region = new OptFile({ model: new Backbone.Model(c) });
    }
    if(region) {
      this.optionsRegion.show(region);
      this.subOptions = region;
    }
  },

  changeType: function() {
    var c = this.model.get('current') ? this.model.get('current') : {};
    c.type = this.ui.type.val();
    c.title = this.ui.title.val();
    c.help = this.ui.help.val();
    this.model.set({current: c});
    this.setOptions();
  },

  /**
   * Saves the question into model.questions and maintants the sub-ObjectID
   */
  save: function(){
    var model = this.model;
    var toSave = {questions: model.get('questions') || []};
    var id = model.get('questionId');
    var query = {
      title: this.ui.title.val(),
      type: this.ui.type.val(),
      help: this.ui.help.val(),
    };
    query.options = this.subOptions && this.subOptions.getOptions() || null;
    if(id) {
      toSave.questions = _.map(toSave.questions, function(q){
          if(q._id === id) {
            return _.extend(q, query);
          }
          return q;
        });
    } else {
      toSave.questions.push(query);
      // var last = _.last(toSave.questions);
      // if(last && last._id) {
      // } else {
      //   toSave.questions[toSave.questions.length - 1] = query;
      // }
    }
    console.log('Question', 'Query', query, 'toSave',toSave, 'Model', model, 'Id', id);

    this.cleanErrors();

    $("#save", this.$el).button('loading');

    model
      .save(toSave, { patch: true, silent: true })
      .success(this.destroyModal.bind(this))
      .error(this.showError.bind(this));
  },

  delete: function() {
    var id = this.model.get('questionId');
    if(!id) {
      return this.destroy();
    }
    if(window.confirm('Are you sure? Kittens may die!')) {
      var toSave = {questions: this.model.get('questions') || []};
      toSave.questions = _.reject(toSave.questions, function(q){
          return q._id === id;
        });
      $("#delete", this.$el).button('loading');

      this.model
        .save(toSave, { patch: true, silent: true })
        .success(this.destroyModal.bind(this))
        .error(this.showError.bind(this));
    }
  },

  destroyModal: function(){
    hackdash.app.modals.trigger('form_edited', this.model.get('id'));
    // TODO: update view
    this.destroy();
  },


  showError: function(err){
    $("#save", this.$el).button('reset');

    if (err.responseText === "OK"){
      this.destroyModal();
      return;
    }
    try {
      var error = JSON.parse(err.responseText).error;
      var self = this;
      _.each(error.errors, function(o, k) {
        var ctrl = k.substr(k.lastIndexOf('.') + 1);
        self.ui[ctrl].parents('.form-group').addClass('has-error');
        var m = self.errors[o.path + '_' + o.kind] ? self.errors[o.path + '_' + o.kind] : o.message;
        self.ui[ctrl].after('<span class="help-block">' + m + '</span>');
      });
    } catch(e) {
      window.alert(e + "\n" + err.responseText);
    }

  },

  cleanErrors: function(){
    $(".has-error", this.$el).removeClass("has-error");
    $("span.help-block", this.$el).remove();
  },

  isType: function(type) {
    var comp = this.current && this.current.type;
    if(!comp) {
      comp = '';
    }
    if(!type) {
      type = '';
    }
    return comp === type;
  },

});
