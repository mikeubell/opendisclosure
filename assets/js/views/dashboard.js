OpenDisclosure.Views.Dashboard = Backbone.View.extend({
  template: _.template('\
    <div class="col-xs-12">\
      <span class="col-xs-6">Location</span>\
      <span class="col-xs-6">Election Date</span>\
    </div>'),


  electionTemplate: _.template('\
    <a href="<%= e.linkPath() %>">\
      <div class="col-xs-12">\
	<span class="col-xs-6"><%= e.get("jurisdiction") %></span>\
	<span class="col-xs-6"><%= e.get("election_date") %></span>\
      </div>\
    </a>'),

  initialize : function(options) {
    this.elections = options.elections;
    $('.name').html('');
    $('.catch').html('');

    _.bindAll(this, 'renderElection');

    if (OpenDisclosure.Data.elections.length > 0) {
      this.render();
    }

    this.listenTo(OpenDisclosure.Data.elections, 'sync', this.render);
  },

  render : function() {
    this.$el.html(this.template({
      elections: this.elections
    }));
    this.$el.append(this.elections.map(this.renderElection).join(' '));
	
  },

  renderElection: function(e) {
    var election = new OpenDisclosure.Election(e.attributes);
    return this.electionTemplate({
      e: election
    });
  }
});
