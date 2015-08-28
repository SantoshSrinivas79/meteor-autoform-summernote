getS3url = function(fileObj, bucketName, subFolder, storeName) {
  if (fileObj.isMounted() && fileObj.getFileRecord()) {
    if (fileObj.copies) {
      baseUrl = "https://" + bucketName + ".s3.amazonaws.com/";
      if (subFolder) {
        baseUrl = baseUrl + subFolder + "/";
      }
      store = fileObj.copies[storeName];
      return baseUrl + store.key;
    }
  }
  return null;
};

var getFileCollection = function(name) {
  if (typeof name === 'string') {
    return FS._collections[name] || window[name];
  }
};

var defaultOptions = function(context) {
  data = context.data.atts;
  options = data.settings || {
    height: 240,
    minHeight: 120
  };
  if (data.imageCollection) {
    var imageCollection = getFileCollection(data.imageCollection);
    options.onImageUpload = function(files, editor, $editable) {
      file = new FS.File(files[0]);
      file.createdBy = Meteor.userId();
      file.documentId = data.id;
      imageCollection.insert(file, function(err, fileObj) {
        if (!err) {
          context.uploadedImage.set(fileObj._id);
        }
      });
    }
  }
  return options;
}

var insertImage = function(context, url) {
  var element = $(context.firstNode);
  if (!element) throw 'no summernote element found for image insert';
  element.summernote('insertImage', url, 'image');
  context.uploadedImage.set(null);
}

Template.afSummernote.onCreated(function() {
  this.value = new ReactiveVar(this.data.value);
  // Only if we're using an image collection
  var imageOptions = this.data.atts;

  if (imageOptions.imageCollection) {
    var imageCollection = getFileCollection(imageOptions.imageCollection);
    var self = this;
    this.uploadedImage = new ReactiveVar();
    // Subscribe to all file createdby this user, and part of this summernote doc

    this.autorun(function() {
      var _id = imageOptions.id;
      if (_id) {
        return Meteor.subscribe('afSummernoteImages', imageOptions.imageCollection, _id);
      }
    });

    // Wait for image to return valid url() then insert it into summernote
    this.autorun(function() {
      var newImage = imageCollection.findOne(self.uploadedImage.get());
      if (newImage) {
        var url;
        var bucket = imageOptions.s3bucket;
        if (bucket) {
          var storeName = imageOptions.storeName || imageOptions.imageCollection;
          var folder = imageOptions.s3subfolder;
          s3url = getS3url(newImage, bucket, folder, storeName);
          if (s3url) {
            insertImage(self, s3url);
          }
        } else {
          url = newImage.url();
        }
        if (url) {
          insertImage(self, url);
        }
      }
    });
  }
});

Template.afSummernote.onRendered(function() {
  var self = this;
  var options = defaultOptions(this);
  var $editor = $(this.firstNode);
  var onblur = options.onblur;
  options.onBlur = function(e) {
    $editor.change();
    if (typeof onblur === 'function') {
      onblur.apply(this, arguments);
    }
    var t = self;
    $form = $(t.firstNode).closest('form')[0];
    $(t.find('input')).keyup();
    AutoForm.validateField($form.id, t.data.name, false);
  };
  options.onChange = function($editable, sHtml) {};
  $editor.summernote(options);
  this.autorun(function() {
    $editor.code(self.value.get());
  });
  $editor.closest('form').on('reset', function() {
    $editor.code('');
  });
});

Template.afSummernote.helpers({
  atts: function() {
    var self = this;

    /**
     * This is bit hacky but created and rendered callback sometimes
     * (or always?) get empty value. This helper gets called multiple
     * times so we intercept and save the value once it is not empty.
     */
    Tracker.nonreactive(function() {
      var t = Template.instance();
      if (t.value.get() !== self.value) {
        t.value.set(self.value);
      }
    });

    return _.omit(this.atts, 'settings');
  }
});
