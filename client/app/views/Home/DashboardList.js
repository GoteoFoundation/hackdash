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

});

module.exports = Backbone.Marionette.CollectionView.extend({

  tagName: 'ul',
  className: 'dropdown-menu open',
  childView: DasboardItem

});