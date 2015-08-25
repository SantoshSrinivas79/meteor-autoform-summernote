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

var getFileCollection = function(context) {
  if (typeof context.data.collection === 'string') {
    return FS._collections[context.data.imageCollection] || window[context.data.imageCollection];
  }
};

var defaultOptions = function(context) {
  var options = {
    height: 240,
    minHeight: 120
  };
  if (context.data.imageCollection) {
    var imageCollection = getFileCollection(context);
    options.onImageUpload = function(files, editor, $editable) {
      file = new FS.File(files[0]);
      file.createdBy = Meteor.userId();
      file.documentId = context.data._id;
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
  var element = context.find('div.summernote');
  if (!element) return;
  element = $(element);
  element.summernote('insertImage', url, 'image');
  context.uploadedImage.set(null);
}

Template.afSummernote.created = function() {
  this.value = new ReactiveVar(this.data.value);

  // Only if we're using an image collection
  if (this.data.imageCollection) {
    var imageCollection = getFileCollection(this);
    this.uploadedImage = new ReactiveVar();

    var self = this;

    // Subscribe to all file createdby this user, and part of this summernote doc
    this.autorun(function() {
      var _id = self.data._id;
      if (_id) {
        return Meteor.subscribe('summernoteImages', self.data.imageCollection, _id);
      }
    });

    // Wait for image to return valid url() then insert it into summernote
    this.autorun(function() {
      var newImage = imageCollection.findOne(self.uploadedImage.get());
      if (newImage) {
        var url;
        var bucket = self.data.s3Bucket || Summernote.s3Bucket;
        if (bucket) {
          var storeName = self.data.storeName || Summernote.s3Bucket || self.data.imageCollection;
          var folder = self.data.s3subFolder || Summernote.s3subFolder;
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
};

setValue = function(val, e, t) {
  t.value.set(val);
  t.data.value = val;
  $form = $(t.firstNode).closest('form')[0];
  $(t.find('input')).keyup();
  AutoForm.validateField($form.id, t.data.name, false);
}

Template.afSummernote.rendered = function() {
  var self = this;
  var options = this.data.atts.settings || defaultOptions(this);

  console.log('this.data.atts', this.data.atts);

  var $editor = $(this.firstNode);

  var onblur = options.onblur;

  options.onBlur = function(e) {
    $editor.change();
    if (typeof onblur === 'function') {
      onblur.apply(this, arguments);
    }
    var t = self;
    $form = $(t.firstNode).closest('form')[0];
    console.log('form', $form);
    $(t.find('input')).keyup();
    AutoForm.validateField($form.id, t.data.name, false);
  };

  options.onChange = function ($editable, sHtml) {
  };

  console.log('summernote options', options);

  $editor.summernote(options);

  this.autorun(function() {
    $editor.code(self.value.get());
  });

  $editor.closest('form').on('reset', function() {
    $editor.code('');
  });
};

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
