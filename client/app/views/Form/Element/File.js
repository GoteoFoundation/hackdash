/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/file.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: {
    name: function() {
      return 'el_' + this._id;
    }
  },

  ui: {
    errorFile: '.error-file',
    dragdrop: '.dropzone'
  },


  onRender: function() {
    this.text = 'Drop File here';
    this.invalidText = 'Only file type is not allowed';
    this.maxSize = 8;
    this.formId = this.form ? this.form.get('_id') : null;
    this.projectId = this.project ? this.project.get('_id') : null;
    this.uploadURL = hackdash.apiURL + '/forms/upload/' + this.formId + '/' + this.projectId + '/' + this.model.get('_id');
    this.imagesOnly = this.model.get('options') && this.model.get('options').images;
    if(this.imagesOnly) {
      this.text = 'Drop Image here';
      this.invalidText = 'Only jpg, png and gif are allowed';
    }
    this.initImageDrop();
  },

  acceptedFiles: function() {
    if(this.imagesOnly) {
      return ['image/jpeg', 'image/png', 'image/gif'];
    }
    return [];
  },

  initImageDrop: function() {
    var self = this;
    var $dragdrop = $('.dropzone', this.$el);

    var zone = new Dropzone(this.ui.dragdrop.get(0), {
      url: this.uploadURL,
      paramName: 'file',
      maxFiles: 1,
      maxFilesize: self.maxSize, // MB
      acceptedFiles: self.acceptedFiles().join(','),
      uploadMultiple: false,
      clickable: true,
      dictDefaultMessage: self.text,
      dictFileTooBig: 'File is too big, ' + self.maxSize + ' Mb is the max',
      dictInvalidFileType: self.invalidText
    });

    zone.on("error", function(file, message) {
      self.ui.errorFile.removeClass('hidden').text(message);
    });

    zone.on("complete", function(file) {
      if (!file.accepted){
        zone.removeFile(file);
        return;
      }

      self.ui.errorFile.addClass('hidden').text('');

      var url = JSON.parse(file.xhr.response).href;

      zone.removeFile(file);

      $dragdrop
        .css('background-image', 'url(' + url + ')');

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });

  }

});
