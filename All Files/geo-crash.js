let svg1 = d3.select("svg")
.attr('transform', 'translate(50, 50)');


var margin = {
top: 0,
right: 5,
bottom: 50,
left: 60
},
width = 600 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;



const us_state_data = d3.csv("Crahbypopandvmt.csv");
const us_state_json = d3.json("us_states_data.json");

Promise.all([us_state_data, us_state_json])
.then(([usstatedata, usstatejson]) => {
    const crashesByState = {};

    usstatedata.forEach((record) => {
        const state = record.STATE;
        const statecode = padCountyCode(state);

        const state_name = record.NAME;
        const crashes2015 = parseInt(record.Crashes2015) || 0;
        const crashes2016 = parseInt(record.Crashes2016) || 0;
        const crashes2017 = parseInt(record.Crashes2017) || 0;
        const crashes2018 = parseInt(record.Crashes2018) || 0;
        const crashes2019 = parseInt(record.Crashes2019) || 0;
        const crashes2020 = parseInt(record.Crashes2020) || 0;
        const crashes2021 = parseInt(record.Crashes2021) || 0;
        const totalCrashes = crashes2015 + crashes2016 + crashes2017 + crashes2018 + crashes2019 + crashes2020 + crashes2021;
        crashesByState[statecode] = (crashesByState[statecode] || 0) + totalCrashes;
    });



    let projection = d3.geoEquirectangular();
    projection.fitSize([950, 950], usstatejson);

    let generator = d3.geoPath()
        .projection(projection);

    const maxCrashes = d3.max(Object.values(crashesByState));

    const color = d3.scaleSequential()
        .domain([0, maxCrashes])
        .interpolator(d3.interpolateGreens);


    let plot = svg1.append("g")
        .attr('transform', 'translate(0,0)');

    plot.selectAll('path')
        .data(usstatejson.features)
        .enter()
        .append('path')
        .attr('d', generator)
        .attr('stroke', 'red')
        .attr('opacity', 0.9)
        .style("fill", (d) => {
            const fillColor = color(crashesByState[d.properties.STATE]);
            // Store the original fill color
            d.originalFillColor = fillColor;
            return fillColor;
        })
        .attr('stroke-width', 2)
        .on("click", (event, d) => handleClick(d, usstatedata))
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);


    plot.selectAll('text')
        .data(usstatejson.features)
        .enter()
        .append('text')
        .attr('transform', (d) => `translate(${generator.centroid(d)})`)
        .text((d) => d.properties.NAME)
        .style('fill', 'black')
        .style('font-size', '10px');

})
.catch((error) => {
    console.error("There is an error while loading the data: ", error);
});

function handleClick(d, usstatedata) {
    document.getElementById("bar-1").classList.add("card","card-container")
    document.getElementById("bar-2").classList.add("card","card-container")
if (d && d.properties && d.properties.STATE) {

    usstatedata.forEach((element, index) => {

        let pop_state = padCountyCode(element.STATE);
        
        let json_state = d.properties.STATE;


        if (json_state == pop_state) {

            bar_pop_crash(element);
            bar_vmt_crash(element);

        }

    });

}
}
function bar_pop_crash(data) {

// Extract crash data from the provided data object
let crashData = [
    { year: 2015, crashes: +data.Crashbypop2015 },
    { year: 2016, crashes: +data.Crashbypop2016 },
    { year: 2017, crashes: +data.Crashbypop2017 },
    { year: 2018, crashes: +data.Crashbypop2018 },
    { year: 2019, crashes: +data.Crashbypop2019 },
    { year: 2020, crashes: +data.Crashbypop2020 },
    { year: 2021, crashes: +data.Crashbypop2021 }
];
d3.select("#svgArea1").select("g").remove();

var svg = d3.select("#svgArea1")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 40)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
var x = d3.scaleBand()
    .range([0, width])
    .domain(crashData.map(function (d) {
        return d.year;
    }))
    .padding(0.2);

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");


svg.append("text")
    .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 40) + ")")
    .style("text-anchor", "middle")
    .text("Year");

// Y axis
var y = d3.scaleLinear()
    .domain([0, d3.max(crashData, function (d) {
        return d.crashes;
    })])
    .range([height, 0]);
svg.append("g")
    .call(d3.axisLeft(y));


svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Crash rate");

// Bars
svg.selectAll("mybar")
    .data(crashData)
    .enter()
    .append("rect")
    .attr("x", function (d) {
        return x(d.year);
    })
    .attr("y", function (d) {
        return y(d.crashes);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
        return height - y(d.crashes);
    })
    .attr("fill", "#3C862D");

svg.append("text")
    .attr("x", width / 2) // Center the label horizontally
    .attr("y", margin.top - 80) // Position the label below the plot
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Crashes by population in "+ data.NAME);

}

function bar_vmt_crash(data) {


// Extract crash data from the provided data object
let crashData = [
    { year: 2015, crashes: +data.CrashbyMVMT2015 },
    { year: 2016, crashes: +data.CrashbyMVMT2016 },
    { year: 2017, crashes: +data.CrashbyMVMT2017 },
    { year: 2018, crashes: +data.CrashbyMVMT2018 },
    { year: 2019, crashes: +data.CrashbyMVMT2019 },
    { year: 2020, crashes: +data.CrashbyMVMT2020 },
    { year: 2021, crashes: +data.CrashbyMVMT2021 }
];

d3.select("#svgArea2").select("g").remove();


var svg = d3.select("#svgArea2")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 40)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
var x = d3.scaleBand()
    .range([0, width])
    .domain(crashData.map(function (d) {
        return d.year;
    }))
    .padding(0.2);

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 0)
    .attr("x", 9)
    .attr("dy", ".35em")
    .attr("transform", "rotate(90)")
    .style("text-anchor", "start");

svg.append("text")
    .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("Year");

// Y axis
var y = d3.scaleLinear()
    .domain([0, d3.max(crashData, function (d) {
        return d.crashes;
    })])
    .range([height, 0]);
svg.append("g")
    .call(d3.axisLeft(y));

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Crash rate in millions");

// Bars
svg.selectAll("mybar")
    .data(crashData)
    .enter()
    .append("rect")
    .attr("x", function (d) {
        return x(d.year);
    })
    .attr("y", function (d) {
        return y(d.crashes);
    })
    .attr("width", x.bandwidth())
    .attr("height", function (d) {
        return height - y(d.crashes);
    })
    .attr("fill", "#3C862D");


    svg.append("text")
    .attr("x", width / 2) // Center the label horizontally
    .attr("y", margin.top - 80) // Position the label below the plot
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "black")
    .text("Crashes by Vehicle mile transport in "+ data.NAME);
    
}

function handleMouseOver(d) {

d3.select(this)
    .attr('opacity', 0.9)
    .style("fill", "white")
    // Highlight the state on hover
    .style("cursor", "pointer");

}

function handleMouseOut(d) {
// Add your mouseout event handling logic here
d3.select(this)
    .attr('opacity', 0.9)
    .style("fill", (d) => d.originalFillColor)
    .style("cursor", "default");

}

function padCountyCode(code) {
code = String(code);

while (code.length < 2) {
    code = "0" + code;
}
return code;
}



function openNav() {
    document.getElementById("mySidebar").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
  }
  
  function closeNav() {
    document.getElementById("mySidebar").style.width = "0";
    document.getElementById("main").style.marginLeft= "0";
  }