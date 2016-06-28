OpenDisclosure.Views.Election = Backbone.View.extend({

  initialize: function(options) {
    _.bindAll(this, 'render', 'renderRace');

    this.options = options;
    var match = function(e) {
      return e.attributes.jurisdiction == this.options.jurisdiction &&
       e.attributes.election_date == this.options.date;
    }.bind(this);

    this.election = OpenDisclosure.Data.elections.find(match);
    this.collection = new OpenDisclosure.Races([], { jurisdiction: this.options.jurisdiction, date: this.options.date } );
    this.collection.fetch({ success: this.render });

  },
  template: _.template('\
    <div class="col-xs-12">\
      <span class="col-xs-6">Election</span>\
      <span class="col-xs-6">Description</span>\
    </div>'),


  raceTemplate: _.template('\
    <a href="<%= r.linkPath() %>">\
      <div class="col-xs-12">\
       <span class="col-xs-6"><%= r.get("name") %></span>\
       <span class="col-xs-6"><%= r.get("description") %></span>\
      </div>\
    </a>'),

  render : function() {
    election = this.collection.models[0].attributes;
    this.election = election;
    $('.name').html(election.jurisdiction);
    $('.catch').html(election.catchphrase);
    this.$el.html(this.template({ }));
    this.$el.append(election.races.map(this.renderRace).join(' '));
  },

  renderRace: function(r) {
    var race = new OpenDisclosure.Race(r);
    race.election = this.election
    return this.raceTemplate({
      r: race
    });
  }
});