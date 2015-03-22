OpenDisclosure.Race = Backbone.Model.extend({
  linkPath : function() {
    return '/race/' + this.attributes.election.jurisdiction + '/' +
      this.attributes.election.election_date + '/' + this.attributes.name;
  }
});
