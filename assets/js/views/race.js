OpenDisclosure.Views.Race = Backbone.View.extend({
  initialize : function(options) {
    _.bindAll(this, 'render');
    this.options = options;
    this.collection = new OpenDisclosure.Candidates([],
	{jurisdiction: this.options.jurisdiction, date: this.options.date, race: this.options.race });
    this.collection.fetch({ success: this.render });
  },

  render : function() {
    OpenDisclosure.Data.candidates = this.collection;
    this.$el.html('<section id="candidateTable"></section>');

    new OpenDisclosure.CandidateTable({
      el : '#candidateTable',
      collection : this.collection,
      header: this.options.date + ' ' + this.options.race + ' race'
    });
  }
});
