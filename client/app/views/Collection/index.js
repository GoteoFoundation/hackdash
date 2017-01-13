/**
 * VIEW: Collection Dashboards Layout
 *
 */

var template = require('./templates/index.hbs')
  , CollectionView = require('./Collection')
  , UsersView = require('../Dashboard/Users')
  , DashboardsView = require('../Dashboard/Collection');

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "page-ctn collection",
  template: template,

  regions: {
    "collection": ".coll-details",
    "admins": ".coll-admins",
    "dashboards": "#collection-dashboards"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  onRender: function(){
    var self = this;
    this.collection.show(new CollectionView({
      model: this.model
    }));

    this.model.get("admins").fetch().done(function(){
      self.admins.show(new UsersView({
        model: self.model,
        collection: self.model.get("admins")
      }));
    });

    this.dashboards.show(new DashboardsView({
      model: this.model,
      collection: this.model.get('dashboards')
    }));

  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
