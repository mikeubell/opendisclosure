OpenDisclosure.Elections = Backbone.Collection.extend({
  url: function() {
    return '/api/elections';
  },
  model: OpenDisclosure.Election
});

OpenDisclosure.Races = Backbone.Collection.extend({
  model: OpenDisclosure.Race,
  url: function() {
    return '/api/races/' + this.options.jurisdiction + '/' + this.options.date;
  },

  initialize: function(models, options) {
    this.options = options;
  }
});
