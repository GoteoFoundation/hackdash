/**
 * Collection: Questions
 *
 */
var
  Question = require('./Question'),
  BaseCollection = require('./BaseCollection');

module.exports = BaseCollection.extend({

  model: Question,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    created_at: function(a){ return -a.get('created_at'); },
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/' + this.domain + '/questions';
    }
    else if (this.collection){
      return hackdash.apiURL + '/' + this.collection + '/questions';
    }
    return hackdash.apiURL + '/questions';
  },

});

