Summernote for AutoForm
=======================

Add WYSIWYG editor to your Meteor app.

## Usage

1) Install `meteor add chroma:autoform-summernote`

2) Install dependencies:

you can use any version of bootstrap, or summernote you like here are some examples:

`meteor add twbs:bootstrap`
`meteor add fortawesome:fontawesome`
`meteor add chroma:summernote`

3) Create schema

```
var BookSchema = new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 200
  },
  content: {
    type: String,
    label: "Yet another poem",
    autoform: {
      afFieldInput: {
        type: 'summernote',
        class: 'editor', // optional
        settings: // summernote options goes here (minHeight: and height: are useful)
        // if you want to use cfs instead of base64 inlining your images
        imageCollection='attachedImages'
        // if using s3 provide at least a bucket, and maybe a subfolder
        s3Bucket='bucket name'
        s3subFolder='offering'
      }
    }
  }
});
```

4) Attach schema to your collection `Books.attachSchema(BookSchema)`

5) Generate the form with `{{> quickform}}` or `{{#autoform}}`

```
{{> quickForm collection="Books" type="insert"}}
```

6) Remember to [sanitize the HTML on the server](https://atmospherejs.com/?q=sanitize)! Summernote doesn't do that, and even if it did, the client could always send HTML containing `<script>` tags.

## Summernote options

See all available summernote options [here](http://summernote.org/#/deep-dive#api).

## Summernote callbacks

See all available summernote calbacks [here](http://summernote.org/#/deep-dive#callbacks).
