OpenDisclosure.Race = Backbone.Model.extend({
  linkPath : function() {
    return '/race/' + this.election.jurisdiction + '/' +
      this.election.election_date + '/' + this.attributes.name;
  }
});
