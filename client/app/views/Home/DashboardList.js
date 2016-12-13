/**
 * VIEW: simple list of dashboards to create project on it
 *
 */

var DasboardItem = Backbone.Marionette.LayoutView.extend({
  tagName: 'li',
  template: require('./templates/dashboardItemSimple.hbs'),

  ui: {
    "domain": ".domain",
  },

  events: {
    "click @ui.domain": "gotoDomain",
  },

  gotoDomain: function(){

    window.location = "/dashboards/" + this.model.get("domain")  + '/create';
  },

  onRender: function(){
    this.$el.animate({height: '48px'});
  }

});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'ul',
  className: 'dropdown-menu open',
  childView: DasboardItem,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(){
    var self = this;

    function showLoading(){
      self.ui.loading.removeClass('hidden');
    }

    this.collection.on('fetch', showLoading);

    this.collection.on('reset', function(){
      self.ui.loading.addClass('hidden');
      self.collection.off('fetch', showLoading);
    });
  },

});
