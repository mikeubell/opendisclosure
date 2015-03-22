OpenDisclosure.CandidateTable = Backbone.View.extend({
  template: _.template($('#mayoral-table-template').html()),

  initialize : function(options) {
    this.options = options;
    if (this.collection.length > 0) {
      this.render();
    }
    this.listenTo(this.collection, 'sync', this.render);
  },

  render : function() {
    var candidates = _.partition(this.collection.models, function(m) {
      return m.attributes.committee.summary;
    });

    this.$el.html(this.template({
      candidatesWithData : candidates[0],
      candidatesWithoutData : candidates[1],
      header: this.options.header
    }));
  },
});
