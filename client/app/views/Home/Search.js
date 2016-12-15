
var
  template = require('./templates/search.hbs');

module.exports = Backbone.Marionette.ItemView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: "landing-search",
  template: template,

  ui: {
    searchbox: "#search"
  },

  events: {
    "keyup @ui.searchbox": "search",
    "click @ui.searchbox": "moveScroll"
  },

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  lastSearch: null,

  initialize: function(options) {
    this.type = options && options.type;
  },

  onRender: function(){
    var query = hackdash.getQueryVariable("q");
    if (query && query.length > 0){
      this.ui.searchbox.val(query);
      //this.lastSearch = query;
    }

    this.search();
  },

  serializeData: function(){
    return {
      showSort: this.showSort,
      placeholder: this.placeholder
    };
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  search: function(){
    var self = this;
    window.clearTimeout(this.timer);

    this.timer = window.setTimeout(function(){
      var keyword = self.ui.searchbox.val();
      var currentSearch = decodeURI(Backbone.history.location.search);
      var fragment = Backbone.history.fragment.replace(currentSearch, "");

      if (keyword !== self.lastSearch) {
        self.lastSearch = keyword;
        var data;
        if (keyword.length > 0) {
          fragment = (!fragment.length ? "dashboards" : fragment);
          hackdash.app.router.navigate(fragment + "?q=" + keyword, { trigger: true });
          data = { q: keyword };
          self.collection.fetch({
            reset: true,
            data: $.param(data)
          }).done(function() {
            self.trigger('collection:fetched:search', self.collection, self.type, data);
          });

          window._gaq.push(['_trackEvent', 'HomeSearch', fragment, keyword]);
        }
        else {
          hackdash.app.router.navigate(fragment, { trigger: true, replace: true });
          data = { minProjects: 2 };
          self.collection.fetch({
            reset: true,
            data: $.param(data)
          }).done(function() {
            self.trigger('collection:fetched:init', self.collection, self.type, data);
          });
        }
      }

    }, 300);
  },

  moveScroll: function(){
    var tabs = $('.nav-tabs.landing');
    var mobileMenu = $('.mobile-menu');

    var isMobile = mobileMenu.is(':visible');

    var top = tabs.offset().top + 60;
    var offset = tabs.height();

    if (isMobile){
      top = this.ui.tabContent.offset().top;
      offset = 0;
    }

    var pos = (top - offset >= 0 ? top - offset : 0);

    $(window).scrollTop(pos);
  }

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

});
