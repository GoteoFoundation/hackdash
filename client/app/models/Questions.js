/**
 * Collection: Questions
 *
 */
var
  Question = require('./Question'),
  BaseCollection = require('./BaseCollection');

var Questions = module.exports = BaseCollection.extend({

  model: Question,

  idAttribute: "_id",

  comparators: {
    title: function(a){ return a.get('title'); },
    type: function(a){ return a.get('type'); },
    created_at: function(a){ return -a.get('created_at'); },
  },

  url: function(){
    if (this.domain){
      return hackdash.apiURL + '/dashboards/' + this.domain + '/questions';
    }
    else if (this.group){
      return hackdash.apiURL + '/collections/' + this.group + '/questions';
    }
    return hackdash.apiURL + '/questions'; // Not really used
  },

  getActives: function(){
    return new Questions(
      this.filter(function(questions){
        return questions.get("active");
      })
    );
  },

});

