/**
 * VIEW: Admin modal for the Dashboard
 *
 */

var template = require('./templates/adminModal.hbs');

module.exports = Backbone.Marionette.LayoutView.extend({
  template: template,

  // modelEvents: {
  //   "change": "render"
  // },

  ui: {
    'open': '[name="open"]',
    'private': '[name="private"]',
    'activeStatuses': 'select.active-statuses',
    'gotoForms': '.goto-forms',
    'save': '.save-changes'
  },

  events: {
    'click @ui.gotoForms': 'gotoForms',
    'click @ui.save': 'saveChanges'
  },

  templateHelpers: function() {
    var self = this;
    return {
      statuses: function() {
        if(self.model && self.model.getStatuses) {
          return self.model.getStatuses();
        }
        return hackdash.statuses;
      }
    };
  },

  onRender: function() {
    console.log(this.model.get('inactiveStatuses'), this.model.getStatuses());
    this.ui.activeStatuses.select2({
      placeholder: __("Non active statuses! Allow at least one!"),
      // theme: "bootstrap",
      minimumResultsForSearch: 10
    });
    // Fix for select2
    $('.select2-container', this.$el).css({width: '100%'});
  },

  gotoForms: function() {
    this.destroy();
  },

  saveChanges: function() {
    console.log('save');
    var activeStatuses = this.ui.activeStatuses.val() || [];
    var inactiveStatuses = _.filter(hackdash.statuses, function(s) {
        return activeStatuses.indexOf(s.status) === -1;
      });
    var toSave = {
      open: this.ui.open.is(':checked'),
      private: this.ui.private.is(':checked'),
      inactiveStatuses: _.pluck(inactiveStatuses, 'status')
    };

    console.log('activeStatuses', activeStatuses);
    console.log(toSave);
    this.model.set(toSave);
    this.model.save({ wait: true });
    this.destroy();
  }
});
