OpenDisclosure.DailyContributionsChartView = OpenDisclosure.ChartView.extend({
  draw: function(el){
    var chart = this;
    chart.data = this.collection;
    chart.candidates = _.pluck(OpenDisclosure.Data.candidates, "short_name");

    var margin = {top: 0, right: 0, bottom: 30, left: 100},
      svgWidth = chart.dimensions.width,
      svgHeight = chart.dimensions.height,
      chartWidth = svgWidth - margin.left - margin.right,
      chartHeight = svgHeight - margin.top - margin.bottom;

    chart.svg = d3.select(el).append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .attr("viewBox", "0 0 " + svgWidth + " " + svgHeight)
      .attr("preserveAspectRatio", "xMidYMid")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Color scale - takes a candidate name and returns a CSS class name.
    chart.color = d3.scale.ordinal()
      .domain(chart.candidates)
      .range(d3.range(chart.candidates.length).map(function(i) {
        return "q" + (i + 1) + "-12";
      }));

    var date_format = d3.time.format("%Y-%m-%d");
    var parse_date = date_format.parse;

    var x = d3.time.scale()
      .range([0, chartWidth]);

    var y = d3.scale.linear()
      .range([chartHeight, 0]);

    // For each candidate, add a starting point at $0
    // and an ending point for today.
    for (var candidate in chart.data) {
      var contributions = chart.data[candidate];
      contributions.unshift({
        amount: 0,
        date: contributions[0].date
      });
      contributions.push({
        amount: contributions[contributions.length - 1].amount,
        date: date_format(new Date())
      })
    }

    // Find the maximum contribution so we can set the range.
    var y_max = 4500 + _.reduce(chart.data, function(maximum, candidate) { //the 4500 is added to prevent clipping at the top of the graph.
      var candidate_max = candidate[candidate.length - 1].amount;
      return Math.max(maximum, candidate_max);
    }, 0);

    var today = new Date()
    var electionDate = parse_date( "2014-11-04" )
    var endDate = ( today < electionDate ? today : electionDate )
    var dateOfFirstContribution = parse_date("2013-04-09")

    x.domain([ dateOfFirstContribution, endDate ]);
    y.domain([0, y_max]);

    // Format x axis labels
    var date_tick_format = d3.time.format.multi([
        ["%b '%y", function(d) { return (d.getMonth() == 0 && d.getYear() != 113) } ],
        ["%b '%y", function(d) { return (d.getMonth() == 4 && d.getYear() == 113) } ],
        ["%b", function() { return true; } ]
      ]);

     var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .ticks(d3.time.months, 1)
      .tickFormat(date_tick_format);

     var yAxis = d3.svg.axis()
      .scale(y)
      .tickFormat(d3.format("$,d"))
      .orient("left");

    var line = d3.svg.line()
      .x(function(d) {
        return x(parse_date(d.date));
      })
      .y(function(d) {
        return y(d.amount);
      });

    // Plot each line.
    for (var candidate in chart.data){
      chart.svg.append("path")
        .datum(chart.data[candidate])
        .attr("class", "line")
        .attr("id", candidate)
        .attr("d", line)
        .attr("class", chart.color(candidate));
    }

    chart.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (chartHeight) + ")")
      .call(xAxis);

    chart.svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Total raised");

    chart.drawLegend();
    chart.drawTitle();

    var font_size = chart.dimensions.width / 62;
    chart.svg.selectAll('text')
      .attr("font-size", font_size);
  },

  drawLegend: function() {
    var candidates = _.keys(this.data);
    this.$el.append("<div class='legend'></div><div class='clearfix'></div>");
    for (var i = 0; i < candidates.length; i++){
      var candidate = candidates[i];
      this.$el.find('.legend').append("<div class='legend-item'>" +
                      "<div class='color " + this.color(candidate) + "'></div>" +
                      "<div class='name'>" + candidate + "</div>" +
                      "</div>");
    }
  },

  drawTitle: function() {
    this.$el.prepend("<h3>Cumulative itemized campaign contributions</h3>");
    this.$el.append("<h5>The numbers in this graph are calculated from a different data set than the contributions table above. For more details, please check the <a href='faq'>FAQ</a>.</h5>");
  }
})
