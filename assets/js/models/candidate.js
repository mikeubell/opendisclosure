OpenDisclosure.Candidate = Backbone.Model.extend({
  linkPath : function() {
    race = this.attributes.race;
    return '/candidate/' +
      race.election.jurisdiction + '/' + race.election.election_date + '/' + race.name + '/' +
      this.attributes.committee.short_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  },

  imagePath : function() {
    return this.attributes.image;
  },

  totalContributions : function() {
    return OpenDisclosure.friendlyMoney(this._totalContributionsRaw());
  },

  availableBalance : function() {
    return OpenDisclosure.friendlyMoney(this.attributes.committee.summary['ending_cash_balance'] -
                                        this.attributes.committee.summary['total_unpaid_bills']);
  },

  pctContributionsFromOakland : function() {
    return OpenDisclosure.friendlyPct(
      (this.attributes.received_contributions_from_oakland - this.attributes.self_contributions_total)/ (this._totalContributionsRaw() -
      (this.attributes.self_contributions_total + this.attributes.committee.summary['total_unitemized_contributions']))
    );
  },

  pctSmallContributions : function() {
    return OpenDisclosure.friendlyPct(
      (this.attributes.committee.summary['total_unitemized_contributions'] +
       this.attributes.small_contributions) / this._totalContributionsRaw());
  },

  pctPersonalContributions: function(){
    return OpenDisclosure.friendlyPct(this.attributes.committee.self_contributions_total / this.attributes.committee.summary.total_contributions_received);
  },

  avgContribution : function () {
    return OpenDisclosure.friendlyMoney(this._totalContributionsRaw() / this.attributes.received_contributions_count);
  },

  friendlySummaryNumber : function(which) {
    return OpenDisclosure.friendlyMoney(this.attributes.committee.summary[which]);
  },

  _totalContributionsRaw : function() {
    return this.attributes.committee.summary['total_contributions_received'] + this.attributes.committee.summary['total_misc_increases_to_cash'];
  },
});
