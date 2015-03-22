OpenDisclosure.Views.Candidate = Backbone.View.extend({

  template: HandlebarsTemplates['candidate'],

  initialize: function(options) {
    this.candidateName = options.candidateName;

    if (OpenDisclosure.Data.candidates.length > 0) {
      this.findCandidateAndRender();
    }

    this.listenTo(OpenDisclosure.Data.candidates, 'sync', this.findCandidateAndRender);
  },

  findCandidateAndRender: function() {
    var shortNameMatches = function(c) {
      return c.linkPath().indexOf(this.candidateName) >= 0;
    }.bind(this);

    var candidate = OpenDisclosure.Data.candidates.find(shortNameMatches);

    if (candidate) {
      this.model = candidate;
      this.contributions = new OpenDisclosure.Contributions([], { candidateId: candidate.attributes.id });
      this.contributions.fetch();
      this.payments = new OpenDisclosure.Payments([], { candidateId: candidate.attributes.id });
      this.payments.fetch();
      this.render();
    } else {
      location.assign(location.href.replace("candidate/", "searchCommittee/"));
    }
  },

  render: function(){
    this.$el.html(this.template(this.templateContext()));

    if (this.model.get('committee') !== null){
      //Render Subviews
      if (OpenDisclosure.Data.categoryContributions.length > 0) {
        this.renderCategoryChart();
      }
      if (OpenDisclosure.Data.categoryPayments.length > 0) {
        this.renderPaymentCategoryChart();
      }

      if (OpenDisclosure.Data.employerContributions.length > 0) {
        this.renderTopContributors();
      }

      if (this.contributions.length > 0) {
        this.renderAllContributions();
      }
    } else {
      $('#category').hide();
      $('#payment').hide();
      $('#topContributors').hide();
      $('#contributors').hide();
    }


    //Listen for new data
    this.listenTo(OpenDisclosure.Data.categoryContributions, 'sync', this.renderCategoryChart);
    this.listenTo(OpenDisclosure.Data.categoryPayments, 'sync', this.renderPaymentCategoryChart);
    this.listenTo(OpenDisclosure.Data.employerContributions, 'sync', this.renderTopContributors);
    this.listenTo(this.contributions, 'sync', this.renderAllContributions);
  },

  renderCategoryChart: function() {
    var candidateId = this.model.attributes.id;
    this.categories = _.filter(OpenDisclosure.Data.categoryContributions.models, function(c) {
      return c.attributes.recipient_id == candidateId;
    });

    new OpenDisclosure.CategoryView({
      el: '#category',
      collection: this.categories,
      attributes: this.model.attributes
    });
  },

  renderPaymentCategoryChart: function() {
    var candidateId = this.model.attributes.id;
    this.categories = _.filter(OpenDisclosure.Data.categoryPayments.models, function(c) {
      return c.attributes.payer_id == candidateId;
    });

    new OpenDisclosure.Views.PaymentCategory({
      el: '#payment',
      list: '#paymentList',
      collection: this.categories,
      payments: this.payments,
      attributes: this.model.attributes
    });
  },

  renderTopContributors: function(){
    // Filter contributors based on cadidateId
    var count = 0;
    var candidateId = this.model.attributes.id;

    this.topContributions = _.filter(OpenDisclosure.Data.employerContributions.models, function(c) {
      return c.attributes.recipient_id == candidateId;
    }).sort(function(a, b){return b.attributes.amount - a.attributes.amount});

    // Create a new subview
    new OpenDisclosure.TopContributorsView({
      el: "#topContributors",
      collection: this.topContributions.slice(0, 10),
      candidate: this.model.get('short_name')
    });
  },

  renderAllContributions: function(){
    var candidateId = this.model.attributes.id;

    new OpenDisclosure.ContributorsView({
      el: "#contributors",
      collection: this.contributions,
      headline: 'All Contributions to ' + this.model.get('short_name'),
      showDate: true
    });
  },

  templateContext: function() {
    var context = _.clone(this.model.attributes);

    context.imagePath = this.model.imagePath();
    context.lastUpdatedDate = this.model.get('last_updated_date');

    if (this.model.get('committee') !== null) {
      context.committee.summary.totalContributions = this.model.totalContributions();
      context.committee.summary.availableBalance = this.model.availableBalance();
      context.committee.summary.totalExpenditures = this.model.friendlySummaryNumber('total_expenditures_made');
      context.committee.summary.pctPersonalContributions = this.model.pctPersonalContributions();
      context.committee.summary.pctSmallContributions = this.model.pctSmallContributions();
    }

    return context;
  }
});
