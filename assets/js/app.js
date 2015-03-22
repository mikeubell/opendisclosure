OpenDisclosure.App = Backbone.Router.extend({
  routes: {
    '': 'home',
    'about': 'about',
    'election/:jurisdiction/:date': 'election',
    'race/:jurisdiction/:date/:race': 'race',
    'candidate/:jurisdiction/:date/:race/:name': 'candidate',
    'faq':'faq',
    'rules': 'rules',
    'iec': 'iec',
    'contributor/:id': 'contributor',
    'employer/:employer_name/:employer_id': 'employer',
    'search/:name': 'search',
    'searchCommittee/:name': 'searchCommittee'
  },

  initialize : function() {
    // Store all the data globally, as a convenience.
    //
    // We should try to minimize the amount of data we need to fetch here,
    // since each fetch makes an HTTP request.
    OpenDisclosure.Data = {
      elections: new OpenDisclosure.Elections(),
      employerContributions: new OpenDisclosure.EmployerContributions(),
      categoryContributions: new OpenDisclosure.CategoryContributions(),
      categoryPayments: new OpenDisclosure.CategoryPayments(),
      whales: new OpenDisclosure.Whales(),
      multiples: new OpenDisclosure.Multiples(),
      independentExpends: new OpenDisclosure.IECs(),
      zipContributions: $.getJSON("/api/contributions/zip"),
      dailyContributions: $.getJSON("/api/contributions/over_time")
    };

    // Call fetch on each Backbone.Collection
    for (var dataset in OpenDisclosure.Data) {
      if (typeof OpenDisclosure.Data[dataset].fetch === "function") {
        OpenDisclosure.Data[dataset].fetch();
      }
    }

    Backbone.history.start({ pushState: true });
  },

  home: function(){
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Dashboard({
      el: '.main',
      elections: OpenDisclosure.Data.elections
    });
  },

  election: function(jurisdiction, date) {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Election({
      el: '.main',
      jurisdiction: jurisdiction,
      date: date
    });
  },

  race: function(jurisdiction, date, race) {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Race({
      el: '.main',
      jurisdiction: jurisdiction,
      date: date,
      race: race
    });
  },

  about: function () {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.About({
      el: '.main'
    });
  },

  candidate: function(jurisdiction, date, race,name){
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Candidate({
      el: '.main',
      jurisdiction: jurisdiction,
      date: date,
      race: race,
      candidateName: name
    });
  },

  rules: function () {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Rules({
      el: '.main'
    });
  },

  iec: function () {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.IECView({
      el: '.main',
      collection: OpenDisclosure.Data.independentExpends
    });
  },

  contributor : function(id) {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Contributor({
      el: '.main',
      contributorId: id
    });
  },

  employer : function(employer_name, employer_id) {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Employees({
      el: '.main',
      employer_id: employer_id,
      headline: employer_name
    });
  },

  search : function(name) {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Contributor({
      el: '.main',
      search: name
    });
  },

  searchCommittee: function(name){
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Committee({
      el: '.main',
      committeeName: name
    });
  },

  faq : function() {
    $(window).scrollTop(0);
    new OpenDisclosure.Views.Faq({
      el: '.main'
    });
    // For some reason the FAQ page does not go to the hash.
    // This code makes it do it.
    var tmp = location.hash;
    location.hash = "";
    location.hash = tmp;
  },

  handleLinkClicked: function(e) {
    var $link = $(e.target).closest('a');

    if ($link.length) {
      var linkUrl = $link.attr('href'),
          externalUrl = linkUrl.indexOf('http') === 0,
          dontIntercept = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

      if (externalUrl || dontIntercept) {
        return;
      } else {
        e.preventDefault();
      }

      window.ga('send', 'pageview', linkUrl);

      this.navigate(linkUrl.replace(/^\//,''), { trigger: true });
    }
  }
});

$(function() {
  var app = new OpenDisclosure.App();
  window.appNavigate = app.navigate;
  $(document).click(app.handleLinkClicked.bind(app));
});
