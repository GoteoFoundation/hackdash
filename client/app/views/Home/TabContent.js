/**
 * VIEW: HOME Tab Layout (Search header + collection)
 *
 */

var template = require("./templates/tabContent.hbs")
  , emptyTemplate = require('./templates/emptyView.hbs');

// Main Views
var
    Search = require("./Search")
  , EntityList = require("./EntityList")

// Item Views
  , ProjectItemView = require('../Project/Card')
  , DashboardItemView = require('../Dashboard/Card')
  , UserItemView = require('./User')
  , CollectionView = require('./Collection')

// List Views
  , ProjectList = EntityList.extend({ childView: ProjectItemView })
  , DashboardList = EntityList.extend({ childView: DashboardItemView })
  , UserList = EntityList.extend({ childView: UserItemView })
  , CollectionList = EntityList.extend({ childView: CollectionView })

// Collection models
  , Projects = require('../../models/Projects')
  , Dashboards = require('../../models/Dashboards')
  , Collections = require('../../models/Collections')
  , Users = require('../../models/Users');

var EmptyView = Backbone.Marionette.ItemView.extend({
  template: emptyTemplate,

  templateHelpers: function() {
    var self = this;
    return {
      text: function() {
        return self.text;
      }
    };
  },

  initialize: function(options) {
    this.text = options && options.text;
  }
});

module.exports = Backbone.Marionette.LayoutView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  template: template,

  ui: {
    "loading": '.loading'
  },

  regions: {
    "header": ".header",
    "content": ".content-place"
  },

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

  onRender: function(){

    if (!this.header.currentView){
      var self = this;
      var ListView, type;
      if(this.collection instanceof Projects){
        ListView = ProjectList;
        type = 'projects';
      }
      else if(this.collection instanceof Dashboards){
        ListView = DashboardList;
        type = 'dashboards';
      }
      else if(this.collection instanceof Collections){
        ListView = CollectionList;
        type = 'collections';
      }
      else if(this.collection instanceof Users){
        ListView = UserList;
        type = 'users';
      }

      // Fetching data from collection
      var search = new Search({
        collection: this.collection,
        type: type
      });

      this.header.show(search);

      var createResults = function() {
        return new ListView({
          collection: self.collection,
          search: search
        });
      };
      // this.content.show(createResults());

      // Event for fetch without a search
      search.on('collection:fetched:init', function(col, type, data) {
        console.log('initial fetched collection', 'COLLECTION', col, 'TYPE', type, 'DATA', data);
        if(col.length === 0) {
          console.log('initial empty collection');
          self.content.show(new EmptyView({
            text: __('No ' + type + ' available yet')
          }));
        } else {
          self.content.show(createResults());
        }
      });
      // Event for fetch by a search
      search.on('collection:fetched:search', function(col, type, data) {
        console.log('search fetched collection', 'COLLECTION', col, 'TYPE', type, 'DATA', data);
        if(col.length === 0) {
          console.log('Empty collection in search!');
          self.content.show(new EmptyView({
            text: __('No ' + type + ' found')
          }));
        } else {
          self.content.show(createResults());
        }
      });
    }

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
