/**
 * VIEW: Projects of an Instance
 *
 */

var Project = require('./Card');
var EmptyView = Backbone.Marionette.ItemView.extend({
  template: _.template('<h3 class="text-center">' + __('No projects available yet') + '</h3>')
});

module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  emptyView: EmptyView,

  className: "entities",
  childView: Project,

  collectionEvents: {
    "remove": "render",
    "sort:date": "sortByDate",
    "sort:name": "sortByName",
    "sort:showcase": "sortByShowcase"
  },

  gutter: 5,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    this.showcaseMode = (options && options.showcaseMode) || false;
    this.showcaseSort = (options && options.showcaseSort) || false;
  },

  onRender: function(){
    _.defer(this.onEndRender.bind(this));
  },

  onEndRender: function(){
    this.updateGrid();
    this.refresh();
    this.trigger('ended:render');
  },

  //--------------------------------------
  //+ PUBLIC METHODS / GETTERS / SETTERS
  //--------------------------------------

  updateShowcaseOrder: function(){
    var showcase = [];

    $('.entity', this.$el).sort(function (a, b) {

      var av = ( isNaN(+a.dataset.showcase) ? +a.dataset.delay : +a.dataset.showcase +1);
      var bv = ( isNaN(+b.dataset.showcase) ? +b.dataset.delay : +b.dataset.showcase +1);

      return av - bv;
    }).each(function(i, e){
      showcase.push(e.dataset.id);
    });

    return showcase;
  },

  //--------------------------------------
  //+ EVENT HANDLERS
  //--------------------------------------

  sortByName: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = $(a).attr('data-name').toLowerCase()
        , bt = $(b).attr('data-name').toLowerCase();

      if(at < bt) { return -1; }
      if(at > bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();

  },

  sortByDate: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      var at = new Date($(a).attr('data-date'))
        , bt = new Date($(b).attr('data-date'));

      if(at > bt) { return -1; }
      if(at < bt) { return 1; }
      return 0;

    }).filter('*');

    this.fixSize();
  },

  sortByShowcase: function(){
    if (!this.wall){
      this.updateGrid();
    }

    this.wall.sortBy(function(a, b) {
      return $(a).attr('data-showcase') - $(b).attr('data-showcase');
    }).filter('.filter-active');

    this.fixSize();
  },

  //--------------------------------------
  //+ PRIVATE AND PROTECTED METHODS
  //--------------------------------------

  updateGrid: function(){
    var self = this;

    if (!this.wall){
      this.wall = new window.freewall(this.$el);
    }

    this.wall.reset({
      draggable: this.showcaseMode,
      animate: true,
      keepOrder: false,
      selector: '.entity',
      cellW: 200,
      cellH: 200,
      gutterY: this.gutter,
      gutterX: this.gutter,
      onResize: this.refresh.bind(this),
      onComplete: function() { },
      onBlockDrop: function() {

        var cols = self.$el.attr('data-total-col');
        var pos = $(this).attr('data-position');
        var ps = pos.split('-');

        var row = parseInt(ps[0],10);
        var showcase = ((row*cols) + parseInt(ps[1],10));

        $(this).attr('data-showcase', showcase+1);
        self.model.isDirty = true;
      }
    });

    if (this.showcaseMode){
      this.$el.addClass("showcase");
      this.sortByShowcase();
      return;
    }

    this.sortByDate();

  },

  refresh: function(){
    this.wall.fitWidth();
    this.wall.refresh();
    this.fixSize();
  },

  fixSize: function(){
    if(this.isEmpty()) {
      this.$el.height('auto');
    }else{
      this.$el.height(this.$el.height() + this.gutter*4);
    }
  },

});
