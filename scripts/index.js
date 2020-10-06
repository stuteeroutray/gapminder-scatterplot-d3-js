document.addEventListener('DOMContentLoaded', function() {
    drawSlider();
  });

function drawSlider() {
  //draw slider
  var formatDateIntoYear = d3.timeFormat("%Y"); //to extract only year
  var svg = d3.select('#slider-svg');
  var margin = { top: 5, right: 30, bottom: 10, left: 30 },
      width = +svg.style('width').replace('px','') - margin.left - margin.right,
      height = +svg.style('height').replace('px','')  - margin.top;

  var moving = false;
  var currentValue = 0;
  var targetValue = width;
  var timer = 0;
    
  var x = d3.scaleTime()
      .domain([new Date(1880, 0, 1), new Date(2021, 0, 1)])
      .range([0, targetValue])
      .clamp(true);

  var slider = svg.append("g")
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
    console.log("year: " + formatDateIntoYear(h));
  }

  slider.insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
      .data(x.ticks(5))
      .enter()
      .append("text")
      .attr("x", x)
      .attr("y", 10)
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
    console.log("Slider moving: " + moving);
  })

  function step() {
    update(x.invert(currentValue));
    currentValue = currentValue + (targetValue/200); //target/200 decides how slow the slider will change values
    if (currentValue > targetValue) {
      moving = false;
      currentValue = 0;
      clearInterval(timer);
      playButton.text("Play");
      console.log("Slider moving: " + moving);
    }
  }
}
        
function drawGapMinder() {
}
    