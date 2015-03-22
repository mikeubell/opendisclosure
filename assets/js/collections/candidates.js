OpenDisclosure.Candidates = Backbone.Collection.extend({
  model: OpenDisclosure.Candidate,
  url: function() {
    return '/api/candidates/' +
      this.options.jurisdiction + '/' + this.options.date + '/' + this.options.race;
  },
  initialize: function(models, options) {
    this.options = options;
  }
});
