/**
 * VIEW: input:Text element in form
 *
 */

var
    Text = require('./Text')
  , template = require('./templates/file.hbs');

module.exports = Text.extend({

  template: template,

  templateHelpers: function() {
    var self = this;
    return {
      name: function() {
        return 'el_' + self._id;
      },
      // background: function() {
      //   if(self.file.type.indexOf('image') === 0) {
      //     return self.file.url;
      //   }
      //   return null;
      // }
    };
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
    if(this.imagesOnly) {
      this.text = 'Drop Image here';
      this.invalidText = 'Only jpg, png and gif are allowed';
    }
    if(this.model) {
      this.imagesOnly = this.model.get('options') && this.model.get('options').images;
      this.file = this.model.get('value');
      this.uploadURL = hackdash.apiURL + '/forms/upload/' + this.formId + '/' + this.projectId + '/' + this.model.get('_id');
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
      thumbnailWidth: 200,
      maxFilesize: self.maxSize, // MB
      acceptedFiles: self.acceptedFiles().join(','),
      uploadMultiple: false,
      clickable: true,
      addRemoveLinks: true,
      dictDefaultMessage: self.text,
      dictFileTooBig: 'File is too big, ' + self.maxSize + ' Mb is the max',
      dictInvalidFileType: self.invalidText
    });

    // Create the mock file:
    if(self.file) {
      var mockFile = { name: self.file.name, size: self.file.size, accepted: true };
      // Call the default addedfile event handler
      zone.files.push(mockFile);
      zone.emit("addedfile", mockFile);
      // And optionally show the thumbnail of the file:
      if(self.file.type.indexOf('image') === 0) {
        zone.createThumbnailFromUrl(mockFile, self.file.path);
      }
      // zone.emit("maxfilesreached", mockFile);
      zone.emit("complete", mockFile);
    }


    zone.on("error", function(file, message) {
      self.ui.errorFile.removeClass('hidden').text(message);
    });

    zone.on("complete", function(file) {
      if (!file.accepted){
        zone.removeFile(file);
        return;
      }

      self.ui.errorFile.addClass('hidden').text('');

      // var url = JSON.parse(file.xhr.response).href;

      // if(self.file.type.indexOf('image') === 0) {
      //   zone.removeFile(file);
      //   $dragdrop
      //     .css('background-image', 'url(' + url + ')');
      // }

      $('.dz-message span', $dragdrop).css('opacity', '0.6');

    });

    zone.on("removedfile", function(file) {
      console.log('del', file, self.file);
      $.ajax({
        url: self.uploadURL,
        type: 'DELETE',
        data: JSON.stringify({file:self.file}),
        contentType: 'application/json; charset=utf-8',
        context: self
      })
      .fail(function(jqXHR) {
        self.ui.errorFile.removeClass('hidden').text(jqXHR.responseText);
      });
    });
  }

});
