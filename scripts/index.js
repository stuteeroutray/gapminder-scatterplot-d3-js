var countryData;
var allData;
var gapminder;
var slider;

document.addEventListener('DOMContentLoaded', function() {
  Promise.all([d3.csv('data/countries_regions.csv'),
              d3.csv('data/life_expectancy_years.csv'),
              d3.csv('data/quality_income_per_person.csv'),
              d3.csv('data/crude_birth_rate_births_per_1000_population.csv'),
              d3.csv('data/gdp_per_capita_yearly_growth.csv'),
              d3.csv('data/co2_emissions_tonnes_per_person.csv')])
        .then(function(values){

    countryData = values[0];
    allData = d3.merge(values);
    gapminder = d3.select('#gapminder');
    var xtext =  document.getElementById("x-attribute-select").value;
    var ytext =  document.getElementById("y-attribute-select").value;
    var region =  document.getElementById("region-select").value;
    var dataAndAxis = processData(xtext,ytext,region);
    renderSlider(dataAndAxis);
    renderXAxis(dataAndAxis[3],xtext);
    renderYAxis(dataAndAxis[4],ytext);
    var inputYear = document.getElementById("year-input").value;
    updateData(inputYear,dataAndAxis);
    renderLabel(inputYear);
  })
});

function onClickUpdate(){
    var inputYear = document.getElementById("year-input").value;
    var xtext =  document.getElementById("x-attribute-select").value;
    var ytext =  document.getElementById("y-attribute-select").value;
    var region =  document.getElementById("region-select").value;
    var dataAndAxis = processData(xtext,ytext,region);
    updateData(inputYear,dataAndAxis);
    renderLabel(inputYear);
    slider.selectAll('*').remove();
    renderSlider(dataAndAxis);
}

function processData(xtext,ytext,region){
    //data processing
    var xdata = xtext.replaceAll(' ','_')+"Data";
    var xaxis = xtext.replaceAll(' ','_'); 
    var ydata = ytext.replaceAll(' ','_')+"Data";
    var yaxis = ytext.replaceAll(' ','_');
    var geos = (countryData.filter( d => d.region == region )).map(function (d){return [d.geo,d.name]}); //[geo,name]
    var data = [], i = 0;
    for(var key in geos){ //[name,region,geo,xaxis,yaxis]
      var obj = {
        name: geos[key][1],
        region: region,
        geo: geos[key][0]
      };
      var axisData = allData.filter( d => d.geo == obj.geo);
      
      /* condition to check if data not there for some country, 
      * every country must have 6 unique array 
      * (1 region and 5 for different attributes)
      */
      var arr = [];
      for(var key in axisData) {
          arr.push(Object.keys(axisData[key])[2]);
      }
      var set1 = [...new Set(arr)];
      if(set1.length<6)
        continue;
      /*-----------------------------------------------------*/

      var a = []; 
      for(var key in axisData) {
        if(Object.keys(axisData[key])[2] == xaxis)
            a.push(axisData[key]);
        else
          continue;
      }
      
      var b = []; 
      for(var key in axisData) {
        if(Object.keys(axisData[key])[2] == yaxis){
          b.push(axisData[key]);
        }
        else
          continue;
      }
      
      obj[xaxis] = a.map(function(d){return [d.time,d[xaxis]]});
      obj[yaxis] = b.map(function(d){return [d.time,d[yaxis]]});
      data[i++] = obj;
    }
    function getMaxForXaxis(data) {
      var max = Number.MIN_VALUE;
      var min = Number.MAX_VALUE;
      for(var i in data) {
        for(var j in data[i][xaxis]){
          let val = +data[i][xaxis][j][1];
          if(val > max)
            max = val;
          if(val < min)
            min = val;
        }
      }
      return [min,max];
    }
    function getMaxForYaxis(data) {
      var max = Number.MIN_VALUE;
      var min = Number.MAX_VALUE;
      for(var i in data) {
        for(var j in data[i][yaxis]){
          let val = +data[i][yaxis][j][1];
          if(val > max)
            max = val;
          if(val < min)
            min = val;
        }
      }
      return [min,max];
    }
    var xrange = getMaxForXaxis(data);
    var yrange = getMaxForYaxis(data);
    return [data,xaxis,yaxis,xrange,yrange];
}

function renderSlider(data){
    //draw slider
    var formatDateIntoYear = d3.timeFormat("%Y"); //to extract only year from year data
    var svg = d3.select('#slider-svg');
    var margin = { top: 5, right: 30, bottom: 10, left: 30 },
        width = +svg.style('width').replace('px','') - margin.left - margin.right,
        height = +svg.style('height').replace('px','')  - margin.top;

    var moving = false;
    var currentValue = 0;
    var targetValue = width;
    var timer = 0;
      
    var x = d3.scaleTime()
        .domain([new Date(1800, 0, 1), new Date(2021, 0, 1)])
        .range([0, targetValue])
        .clamp(true);

    slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height/2 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
      .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() {
              currentValue = d3.event.x;
              update(x.invert(currentValue)); 
            })
        );

    function update(h) {
      handle.attr("cx", x(h));
      document.getElementById("year-input").value = formatDateIntoYear(h);
      updateData(formatDateIntoYear(h),data);
      renderLabel(formatDateIntoYear(h));
    }

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 14 + ")")
      .selectAll("text")
        .data(x.ticks(6))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 8)
        .attr("opacity", 0.6)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDateIntoYear(d); });
        

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    
    //play pause button
    var playButton = d3.select("#playbutton");

    playButton
      .on("click", function() {
      var button = d3.select(this);
      if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        button.text("Play");
      } else {
        moving = true;
        timer = setInterval(step, 100);
        button.text("Pause");
      }
    })

    function step() {
      update(x.invert(currentValue));
      currentValue = currentValue + (targetValue/280); //decides how slow the slider will change values
      if (currentValue > targetValue) {
        moving = false;
        currentValue = 0;
        clearInterval(timer);
        playButton.text("Play");
      }
    }
}

function updateData(selectedYear,data){
  var bisect = d3.bisector(([year]) => year).left;
  function valueAt(values, year) {
    var i = bisect(values, year, 0, values.length - 1);
    var a = values[i];
    if (i > 0) {
      var b = values[i - 1];
      var t = (year - a[0]) / (b[0] - a[0]);
      return a[1] * (1 - t) + b[1] * t;
    }
    return a[1];
  }
  function dataAt(year,data) {
    return data[0].map(d => ({
      name: d.name,
      region: d.region,
      geo: d.geo,
      [data[1]]: valueAt(d[data[1]], year),
      [data[2]]: valueAt(d[data[2]], year)
    }));
  } 
  plotData(dataAt(selectedYear,data),data[1],data[2],data[3],data[4]); 
}

function renderLabel(year) {
   var margin = {top: 20, right: 50, bottom: 20, left: 50},
    width = 1100 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;
    
    gapminder.selectAll(".yearlabel")
              .data(year, d => d.year)
              .join(
                enter => {
                    const g = enter.append('text')
                                    .attr("class","yearlabel")
                                    .attr("text-anchor", "end")
                                    .style("font-size","150px")
                                    .style("fill","#778899")
                                    .attr("y", height - 225)
                                    .attr("x", (3*width)/4)
                                    .attr("opacity",0.2)
                                    .text(year);  
                     g.call(enter => enter.transition()
                                         .duration(500));
                },
                exit => {
                    exit.call(exit => exit.transition()
                                          .attr("opacity",0).remove());
                }
        );          
}

function renderXAxis(max,xtext) {
   var margin = {top: 20, right: 50, bottom: 20, left: 50},
    width = 1100 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;
  var x = d3.scaleLinear()
        .domain([0,max[1]])
        .range([0, width]);

  var updateX = [x,xtext];
  gapminder.selectAll("g.xaxis")
            .data(updateX, d => d)
            .join(
              enter => {
                  const g = enter.append("g")
                                  .attr("class", "xaxis")
                                  .attr("transform", "translate("+ margin.left*2 + "," + height + ")")
                                  .call(d3.axisBottom(updateX[0]).ticks(8))
                                  .call(g => g.selectAll(".tick line")
                                    .style("stroke","#A9A9A9"));

                  
                  g.append("text")
                    .attr("class", "xaxis")
                    .attr("transform", "translate(" + (width-10) + " ," + 35 + ")")
                    .style("text-anchor", "end")
                    .style("font-size","15px")
                    .style("fill","#778899")
                    .text(updateX[1]);
              },
              exit => {
                    exit.call(exit => exit.transition().remove());
              }
  );       
}

function renderYAxis(max,ytext) {
   var margin = {top: 20, right: 50, bottom: 20, left: 50},
    width = 1100 - margin.right - margin.left,
    height = 600 - margin.top - margin.bottom;   
  var y = d3.scaleLinear()
        .domain([0,max[1]])
        .range([height-15, 0]);

  var updateY = [y,ytext];
  gapminder.selectAll("g.yaxis")
            .data(updateY, d => d)
            .join(
              enter => {
                  const g = enter.append("g")
                                .attr("class", "yaxis")
                                .attr("transform", "translate(" + margin.left*2 + "," + 15 + ")")
                                .call(d3.axisLeft(updateY[0]).ticks(5))
                                .call(g => g.selectAll(".tick line")
                                  .style("stroke","#A9A9A9"));
                  
                  g.append("text")
                   .attr("class", "yaxis")
                   .attr("y", -35)
                   .attr("transform", "rotate(-90)")
                   .attr("dx", "-1em")
                   .style("text-anchor", "end")
                   .style("font-size","15px")
                   .style("fill","#778899")
                   .text(updateY[1]);
              },
              exit => {
                    exit.call(exit => exit.transition().remove());
              }
  );      
}

function plotData(data,xaxis,yaxis,xrange,yrange){
    var margin = {top: 20, right: 50, bottom: 20, left: 50},
        width = 1100 - margin.right - margin.left,
        height = 600 - margin.top - margin.bottom;
  
    var x = d3.scaleLinear()
          .domain([0,xrange[1]])
          .range([0, width]);
   
   var y = d3.scaleLinear()
          .domain([0,yrange[1]])
          .range([height-15, 0]);

    var color = d3.scaleOrdinal(['South Asia', 'Europe & Central Asia', 'Middle East & North Africa', 'Sub-Saharan Africa', 'Latin America & Caribbean', 'East Asia & Pacific', 'North America'],d3.schemePastel1);
    var tooltip = d3.select("body").append("div")
                    .attr("id","tooltip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("display", "none")
                    .style("background-color", "#E8E8E8")
                    .style("border", "solid")
                    .style("border-width", "1px")
                    .style("border-radius", "5px")
                    .style("padding", "8px");
  
    gapminder.selectAll(".glyph")
              .data(data, d => d)
              .join(
                enter => {
                    const g = enter.append('g')
                                  .attr("class","glyph")
                                  .attr("x", d => x(d[xaxis]))
                                  .attr("y", d => y(d[yaxis]))
                                  .attr("cursor","pointer")
                                  .attr("opacity",1)
                                  .on('mouseover', function(d,i) {
                                    d3.select('#tooltip')
                                      .style("display", "inline")
                                      .text(d.name)
                                      .style("opacity", .9);
                                  })
                                  .on('mousemove',function(d,i) {
                                    d3.select('#tooltip')
                                      .text(d.name)
                                      .style("left", (d3.event.pageX+20) + "px")
                                      .style("top", (d3.event.pageY-20) + "px")
                                      .style("opacity", .9);   
                                  })
                                  .on('mouseout', function(d,i) {
                                    d3.select('#tooltip')
                                    .style("display", "none");
                                  });
                    
                    g.append('circle')
                        .attr("class","glyph circle")
                        .attr("cx", d => x(d[xaxis]))
                        .attr("cy", d => y(d[yaxis]))
                        .attr("stroke", "black")
                        .attr("r", 20)
                        .attr("fill", d => color(d.region));
                    
                    g.append('text')
                        .attr("class","glyph text")
                        .style('alignment-baseline','middle')
                        .style('text-anchor','middle')
                        .style("fill","#686e73")
                        .attr("x", d => x(d[xaxis]))
                        .attr("y", d => y(d[yaxis])+6)
                        .text(d => d.geo);
    
                    g.call(enter => enter.transition());
                },
                update => {
                    update.call(update => update.transition()
                                                .duration(320)
                                                .call(g => g.selectAll(".glyph circle").attr("r",0))
                                                .call(g => g.selectAll(".glyph text").attr("opacity",0))
                                                .attr("cx", d => x(d[xaxis]))
                                                .attr("cy", d => y(d[yaxis])));
                },
                exit => {
                    exit.call(exit => exit.transition()
                                          .duration(320)
                                          .call(g => g.selectAll(".glyph circle").attr("r",0))
                                          .call(g => g.selectAll(".glyph text").attr("opacity",0))
                                          .remove()
                                          .delay(70));
                }
    );
              
}