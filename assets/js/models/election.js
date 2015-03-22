OpenDisclosure.Election = Backbone.Model.extend({
  linkPath : function() {
    return '/election/' + this.attributes.jurisdiction + '/' + this.attributes.election_date;
  }
});
