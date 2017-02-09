/**
 * VIEW: A collection of Items for a Home Search
 *
 */

var Item = require('./Item');


module.exports = Backbone.Marionette.CollectionView.extend({

  //--------------------------------------
  //+ PUBLIC PROPERTIES / CONSTANTS
  //--------------------------------------

  className: 'entities',
  childView: Item,

  //--------------------------------------
  //+ INHERITED / OVERRIDES
  //--------------------------------------

  initialize: function(options){
    // option for fixed slides & not responsive (embeds)
    this.slides = options && options.slides;
    this.search = options && options.search;

  },

  onBeforeRender: function(){
    if (this.initialized && !this.$el.is(':empty')){
      this.destroySlick();
      this.$el.empty();
    }
  },

  onRender: function(){
    var self = this;
    _.defer(function(){
      self.updateGrid();
    });

    if(self.search) {
      // Event for fetch by offset
      self.search.on('collection:fetched:page', function(col, type, data) {
        console.log('page fetched collection', col, type, data, data.page);
        self.updateGrid();
        if(data.page > 0) {
          $('.slick-prev', this.$el).show();
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

  initialized: false,
  destroyed: false,

  destroySlick: function(){
    this.$el.slick('unslick');

    var slick = this.$el.slick('getSlick');
    slick.$list.remove();
    slick.destroy();

    this.destroyed = true;
  },

  updateGrid: function(){
    if (this.initialized && !this.destroyed){
      this.destroySlick();
    }

    if (this.$el.is(':empty')){
      this.initialized = false;
      return;
    }

    var cols = this.slides;
    var responsive = [];

    if (!this.slides) {
      // is home page

      cols = 5;

      responsive = [1450, 1200, 1024, 750, 430].map(function(value){
        var cmode = false;
        if (value <= 430 ){
          cmode = true;
        }

        return {
          breakpoint: value,
          settings: {
            centerMode: cmode,
            slidesToShow: cols,
            slidesToScroll: cols--
          }
        };
      });

      cols = 6;
    }
    // else is embeds

    this.$el.slick({
      centerMode: false,
      dots: false,
      autoplay: false,
      infinite: false,
      adaptiveHeight: true,
      speed: 300,
      slidesToShow: cols,
      slidesToScroll: cols,
      responsive: responsive
    });

    this.$el
      .off('setPosition')
      .on('setPosition', this.replaceIcons.bind(this));

    var self = this;
    // TODO: make this capable with arrow clicks
    this.$el
      .off('edge')
      .on('edge', function(event, slick, direction){
        console.log('edge was hit', direction);
        var total = self.$el.slick('getSlick') &&
                    self.$el.slick('getSlick').$slides &&
                    self.$el.slick('getSlick').$slides.length;
        if(direction === 'left' && total >= hackdash.maxQueryLimit) {
          self.search.trigger('collection:fetch:page', self.search.page + 1);
        } else if(self.search.page > 0) {
          self.search.trigger('collection:fetch:page', self.search.page - 1);
        }
      });

    this.replaceIcons();

    this.initialized = true;
    this.destroyed = false;
  },

  replaceIcons: function(){
    // console.log($('.slick-next', this.$el).is(':visible'), this.search);
    // if(!$('.slick-next', this.$el).is(':visible') && this.search) {
      // var total = this.$el.slick('getSlick') && this.$el.slick('getSlick').$slides && this.$el.slick('getSlick').$slides.length;
      // var offset = parseInt(this.search.offset, 10) + total;
      // console.log('total', total, offset);
      // this.search.trigger('collection:fetch:offset', total);
    // }
    $('.slick-prev', this.$el).html('<i class="fa fa-chevron-left"></i>');
    $('.slick-next', this.$el).html('<i class="fa fa-chevron-right"></i>');
  }

});
