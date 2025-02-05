var StatesData = {};
var carCrashData = {};
var capitalsData = {};
var yearWiseDataObject = {};
var cyclePlotObject = {};
var timeOfDayObject = {};
var weatherObject = {};
var lightConditionObject = {};

let rurCountArray;
let intCountArray;
let weatherCountArray;

let svg1 = d3.select("#state-map").attr("transform", "translate(0, 60)");
let projection = d3.geoEquirectangular();
let generator = d3.geoPath().projection(projection);

function showLoading() {
  document.getElementById("spinner").style.display = "block";
  document.getElementById("main").style.display = "none";
}

function hideLoading() {
  document.getElementById("main").style.display = "block";
  document.getElementById("spinner").style.display = "none";
}

function getData() {
  showLoading();
  const readUSAStatesPromise = new Promise((resolve, reject) => {
    d3.json("./us_states_data.json")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readCarCrashDataPromise = new Promise((resolve, reject) => {
    d3.csv("./FARS_15after.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const readUSACapitalsData = new Promise((resolve, reject) => {
    d3.csv("./us_state_capitals.csv")
      .then((data) => resolve(data))
      .catch((error) => reject(error));
  });

  const fatal_data = d3.csv("FARS_15after.csv");
  const us_state_json = d3.json("us_states_data.json");

  Promise.all([
    readUSAStatesPromise,
    readCarCrashDataPromise,
    readUSACapitalsData,
    fatal_data,
    us_state_json
  ]).then((values) => {
    StatesData = values[0];
    carCrashData = values[1];
    capitalsData = values[2];
    const fataldata = values[3];
    const usstatejson = values[4];

    var selectElement = document.getElementById("stateSelect");
    console.log("usstatejson", usstatejson);
    usstatejson.features
      .sort((a, b) => {
        const stateA = a.properties.NAME.toLowerCase();
        const stateB = b.properties.NAME.toLowerCase();

        // Compare state names
        if (stateA < stateB) {
          return -1;
        }
        if (stateA > stateB) {
          return 1;
        }
        return 0;
      })
      .forEach(function (feature) {
        var option = document.createElement("option");
        option.value = feature.properties.NAME;
        option.text = feature.properties.NAME;
        selectElement.add(option);
      });
    yearWiseDataObject = getYearWiseDataObject(carCrashData);

    drawStateMap(fataldata, usstatejson);
    drawEnvFactorsCharts();
    hideLoading();
  });
}

getData();
function getYearWiseDataObject(carCrashData) {
  var dataObject = {};
  carCrashData.forEach((item, index) => {
    if (!dataObject[item["YEAR"]]) {
      dataObject[item["YEAR"]] = {};
    } else {
      if (!dataObject[item["YEAR"]][item["STATENAME"]]) {
        dataObject[item["YEAR"]][item["STATENAME"]] = [];
      } else {
        dataObject[item["YEAR"]][item["STATENAME"]].push(item);
      }
    }

    if (!cyclePlotObject[item["STATENAME"]]) {
      cyclePlotObject[item["STATENAME"]] = {};
    } else {
      if (!cyclePlotObject[item["STATENAME"]][item["YEAR"]]) {
        cyclePlotObject[item["STATENAME"]][item["YEAR"]] = {};
      } else {
        if (
          !cyclePlotObject[item["STATENAME"]][item["YEAR"]][item["MONTHNAME"]]
        ) {
          cyclePlotObject[item["STATENAME"]][item["YEAR"]][
            item["MONTHNAME"]
          ] = 0;
        }
        cyclePlotObject[item["STATENAME"]][item["YEAR"]][item["MONTHNAME"]] =
          cyclePlotObject[item["STATENAME"]][item["YEAR"]][item["MONTHNAME"]] +
          1;
      }
    }

    if (!timeOfDayObject[item["YEAR"]]) {
      timeOfDayObject[item["YEAR"]] = {};
    }

    if (!timeOfDayObject[item["YEAR"]][item["STATENAME"]]) {
      timeOfDayObject[item["YEAR"]][item["STATENAME"]] = {};
    }

    const hourName = item["HOURNAME"] || "Unknown"; // Use "Unknown" if HOURNAME is undefined
    if (!timeOfDayObject[item["YEAR"]][item["STATENAME"]][hourName]) {
      timeOfDayObject[item["YEAR"]][item["STATENAME"]][hourName] = 0;
    }

    // Increment the count
    timeOfDayObject[item["YEAR"]][item["STATENAME"]][hourName] += 1;

    if (!weatherObject[item["YEAR"]]) {
      weatherObject[item["YEAR"]] = {};
    }

    if (!weatherObject[item["YEAR"]][item["STATENAME"]]) {
      weatherObject[item["YEAR"]][item["STATENAME"]] = {};
    }

    if (!weatherObject[item["YEAR"]][item["STATENAME"]][item["WEATHERNAME"]]) {
      weatherObject[item["YEAR"]][item["STATENAME"]][item["WEATHERNAME"]] = 0;
    }

    // Increment the count
    weatherObject[item["YEAR"]][item["STATENAME"]][item["WEATHERNAME"]] += 1;

    if (!lightConditionObject[item["YEAR"]]) {
      lightConditionObject[item["YEAR"]] = {};
    }

    if (!lightConditionObject[item["YEAR"]][item["STATENAME"]]) {
      lightConditionObject[item["YEAR"]][item["STATENAME"]] = {};
    }

    if (
      !lightConditionObject[item["YEAR"]][item["STATENAME"]][
        item["LGT_CONDNAME"]
      ]
    ) {
      lightConditionObject[item["YEAR"]][item["STATENAME"]][
        item["LGT_CONDNAME"]
      ] = 0;
    }

    // Increment the count
    lightConditionObject[item["YEAR"]][item["STATENAME"]][
      item["LGT_CONDNAME"]
    ] += 1;
  });
  return dataObject;
}
// Demonstrates the d3 map infrastructure for plotting maps given
// in GeoJSON format
function drawEnvFactorsCharts() {
  const gElements = document.querySelectorAll("g");

  // Iterate over the NodeList of <g> elements
  gElements.forEach((gElement) => {
    gElement.remove();
  });
  const selectedYear = document.getElementById("yearSelect").value;
  const selectedState = document.getElementById("stateSelect").value;

  var weekDaysObj = {
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
    Sunday: 0,
  };
  var WeekDayEndObj = {
    WeekDay: 0,
    WeekEnd: 0,
  };
  yearWiseDataObject[selectedYear][selectedState].forEach((item) => {
    weekDaysObj[item["DAY_WEEKNAME"]] = weekDaysObj[item["DAY_WEEKNAME"]] + 1;
    if (["Saturday", "Sunday"].includes(item["DAY_WEEKNAME"])) {
      WeekDayEndObj["WeekEnd"] = WeekDayEndObj["WeekEnd"] + 1;
    } else {
      WeekDayEndObj["WeekDay"] = WeekDayEndObj["WeekDay"] + 1;
    }
  });

  drawWeekDaysBarGraph(weekDaysObj);
  drawLightConditionDoughnutChart(WeekDayEndObj);
  drawCyclePlot();
  drawTimeDayPlot();
  drawWeatherChart();
}

function drawWeekDaysBarGraph(weekDaysObj) {
  let svg = d3.select("#weekDay-Bar-Chart");

  // create a plot rectangle with a background color
  let plot = svg.append("g").attr("id", "plot");

  plot.append("g").attr("transform", "translate(45, 50)").attr("id", "left");

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(Object.values(weekDaysObj)) + 50])
    .range([400, 0]);
  let axisLeft = d3.axisLeft(yScale);

  d3.select("#left").call(axisLeft);

  plot.append("g").attr("transform", "translate(45, 455)").attr("id", "bottom");

  let xScale = d3.scaleBand().domain(Object.keys(weekDaysObj)).range([0, 600]);
  let axisBottom = d3.axisBottom(xScale);

  d3.select("#bottom").call(axisBottom);
  svg
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "y-axis-label")
    .attr("x", -250)
    .attr("y", 12)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Number of Crashes");

  svg
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "x-axis-label")
    .attr("x", 350)
    .attr("y", 500)
    .attr("text-anchor", "middle")
    .text("Days");

  plot
    .append("g")
    .attr("fill", "#3498db")
    .selectAll()
    .data(Object.entries(weekDaysObj))
    .join("rect")
    .attr("x", (d) => 70 + xScale(d[0]))
    .attr("y", (d) => yScale(d[1]) + 50)
    .attr("height", (d) => 400 - yScale(d[1]))
    .attr("width", 40)
    .on("mouseover", function (d) {
      d3.select(this).transition().duration("50").attr("opacity", ".85");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
    });

  Object.entries(weekDaysObj).forEach((item) => {
    plot
      .append("text")
      .attr("x", 85 + xScale(item[0]))
      .attr("y", yScale(item[1]) + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text(item[1]);
  });
}

function drawLightConditionDoughnutChart(WeekDayEndObj) {
  let svg = d3.select("#weekDay-doughnut-chart");

  // create a plot rectangle with a background color
  let plot = svg.append("g").attr("id", "plot");

  const radius = 150;

  const arc = d3
    .arc()
    .innerRadius(radius * 0.67)
    .outerRadius(radius - 1);

  const pie = d3
    .pie()
    .padAngle(1 / radius)
    .sort(null)
    .value((d) => d[1]);

  const colors = {
    "Dark - Lighted": "#001F3F",
    "Dark - Not Lighted": "#8B0000",
    "Dark - Unknown Lighting": "#696969",
    Dawn: "#FFA500",
    Daylight: "#ADD8E6",
    Dusk: "#800080",
    Unknown: "#D3D3D3",
  };

  var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip-donut")
    .style("opacity", 0);

  const selectedState = document.getElementById("stateSelect").value;
  const selectedYear = document.getElementById("yearSelect").value;
  plot
    .selectAll()
    .data(
      pie(Object.entries(lightConditionObject[selectedYear][selectedState]))
    )
    .join("path")
    .attr("fill", (d, i) => colors[d.data[0]])
    .attr("transform", "translate(180, 230)")
    .attr("d", arc)
    .on("mouseover", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", ".85");
      div.transition().duration(50).style("opacity", 1);
      let num =
        (((i.endAngle - i.startAngle) / (2 * Math.PI)) * 100)
          .toFixed(1)
          .toString() + "%";
      div
        .html(
          "light Condition: " +
            i.data[0] +
            "<br/> No. of Crashes: " +
            i.data[1] +
            "<br/> Percentage: " +
            num
        )
        .style("left", d.pageX + 10 + "px")
        .style("top", d.pageY - 15 + "px");

      div.style("display", "inline-block");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
      div.transition().duration("50").style("opacity", 0);
    });

  const legend = svg
    .append("g")
    .attr("transform", "translate(365, 50)")
    .selectAll("legend")
    .data(
      pie(Object.entries(lightConditionObject[selectedYear][selectedState]))
    )
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  legend
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d) => colors[d.data[0]]);

  // Add legend text
  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(
      (d) =>
        `${d.data[0]} (${(
          ((d.endAngle - d.startAngle) / (2 * Math.PI)) *
          100
        ).toFixed(1)}%)`
    );
}

function drawCyclePlot() {
  let svg = d3.select("#cycle-plot-chart");

  // create a plot rectangle with a background color
  let plot = svg.append("g").attr("id", "plot");
  const selectedState = document.getElementById("stateSelect").value;
  plot
    .append("g")
    .attr("transform", "translate(40,20)")
    .attr("id", "left-cycle");
  let maxValueObj = [];
  Object.keys(cyclePlotObject[selectedState]).forEach((month) => {
    Object.keys(cyclePlotObject[selectedState][month]).forEach((i) =>
      maxValueObj.push(cyclePlotObject[selectedState][month][i])
    );
  });

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(maxValueObj) + 50])
    .range([400, 0]);
  let axisLeft = d3.axisLeft(yScale);
  d3.select("#left-cycle").call(axisLeft);

  plot
    .append("g")
    .attr("transform", "translate(40, 425)")
    .attr("id", "bottom-cycle");

  let xScale = d3
    .scaleBand()
    .domain(Object.keys(cyclePlotObject[selectedState]))
    .range([0, 850])
    .padding(0.3);
  let axisBottom = d3.axisBottom(xScale);

  d3.select("#bottom-cycle").call(axisBottom);

  plot
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "y-axis-label")
    .attr("x", -250)
    .attr("y", 12)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Number of Crashes");

  plot
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "x-axis-label")
    .attr("x", 450)
    .attr("y", 490)
    .attr("text-anchor", "middle")
    .text("Years");

  plot
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "x-axis-label")
    .attr("x", 450)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Crashes: 2015 -2021");

  plot
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "x-axis-label")
    .attr("x", 850)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text(`State: ${selectedState}`);
  var drawLineGraph = d3
    .line()
    .x((d) => xScale(d[0]) + d[1] * 8 + 40)
    .y((d) => yScale(d[2]));

  plot
    .selectAll(".vertical-line")
    .data(Object.keys(cyclePlotObject[selectedState]))
    .enter()
    .append("line")
    .attr("class", "vertical-line")
    .attr("x1", (d) => xScale(d) + 140) // Adjust for the left axis translation
    .attr("x2", (d) => xScale(d) + 140) // Adjust for the left axis translation
    .attr("y1", 40)
    .attr("y2", 420)
    .attr("stroke", "black")
    .attr("stroke-dasharray", "4");

  var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip-donut")
    .style("opacity", 0);
  Object.keys(cyclePlotObject[selectedState]).forEach((month) => {
    let monthData = [];

    Object.keys(cyclePlotObject[selectedState][month]).forEach(
      (year, index) => {
        plot
          .append("circle")
          .attr("cx", xScale(month) + index * 8 + 40)
          .attr("cy", yScale(cyclePlotObject[selectedState][month][year]))
          .attr("r", 3)
          .attr("fill", "red")
          .attr("stroke", "black")
          .on("mouseover", function (d) {
            div.transition().duration(50).style("opacity", 1);
            div
              .html(
                "Month: " +
                  year +
                  "<br/> No. of Crashes: " +
                  cyclePlotObject[selectedState][month][year]
              )
              .style("left", d.pageX + 10 + "px")
              .style("top", d.pageY - 15 + "px");

            div.style("display", "inline-block");
          })
          .on("mouseout", function (d, i) {
            d3.select(this).transition().duration("50").attr("opacity", "1");
            div.transition().duration("50").style("opacity", 0);
          });
        // .on("click", (event) => displayPlotValues(event, key, value));
        monthData.push([
          month,
          index,
          cyclePlotObject[selectedState][month][year],
        ]);
      }
    );

    let monthAverage = d3.mean(monthData, (d) => d[2]);

    plot
      .append("path")
      .attr("d", drawLineGraph(monthData))
      .attr("fill", "none")
      .attr("stroke", "green");

    plot
      .append("line")
      .attr("class", "average-line")
      .attr("x1", xScale(month) + 40)
      .attr("y1", yScale(monthAverage))
      .attr("x2", xScale(month) + 40 + monthData.length * 8)
      .attr("y2", yScale(monthAverage))
      .attr("stroke", "black");
    // .attr("stroke-dasharray", "4");
  });
}

function drawTimeDayPlot() {
  let svg = d3.select("#time-horizontal-chart");

  // create a plot rectangle with a background color
  let plot = svg.append("g").attr("id", "plot");

  const selectedState = document.getElementById("stateSelect").value;
  const selectedYear = document.getElementById("yearSelect").value;

  plot
    .append("g")
    .attr("transform", "translate(100,80)")
    .attr("id", "top-timeDay-scale");
  const xScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(Object.values(timeOfDayObject[selectedYear][selectedState])),
    ])
    .range([0, 600]);
  let axisTop = d3.axisTop(xScale);
  d3.select("#top-timeDay-scale").call(axisTop);

  plot
    .append("g")
    .attr("transform", "translate(100, 80)")
    .attr("id", "left-timeDay-scale");

  let yScale = d3
    .scaleBand()
    .domain(
      Object.keys(timeOfDayObject[selectedYear][selectedState]).sort(
        sortTimeRanges
      )
    )
    .range([0, 450])
    .padding(0.5);
  let axisLeft = d3.axisLeft(yScale);

  d3.select("#left-timeDay-scale").call(axisLeft);

  plot
    .append("g")
    .attr("fill", "#994d00")
    .selectAll()
    .data(Object.entries(timeOfDayObject[selectedYear][selectedState]))
    .join("rect")
    .attr("x", 110)
    .attr("y", (d) => 77 + yScale(d[0]))
    .attr("width", (d) => xScale(d[1]))
    .attr("height", 15)
    .on("mouseover", function (d) {
      d3.select(this).transition().duration("50").attr("opacity", ".85");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
    });

  plot
    .append("g")
    .selectAll()
    .data(Object.entries(timeOfDayObject[selectedYear][selectedState]))
    .join("text")
    .attr("x", (d) => 124 + xScale(d[1]))
    .attr("y", (d) => 80 + yScale(d[0]) + 10)
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text((d) => d[1]);

  svg
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "y-axis-label")
    .attr("x", -300)
    .attr("y", 10)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Time of the Day");

  svg
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("class", "x-axis-label")
    .attr("x", 430)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .text("Number of Crashes");
}

const sortTimeRanges = (a, b) => {
  // Function to extract start times from the time range strings
  const extractTime = (timeRange) => {
    if (timeRange.toLowerCase() === "unknown hours") {
      return Infinity; // Treat "Unknown" as the largest value
    }

    const startTime = timeRange.match(/\d+:\d+/)[0];
    const [hours, minutes] = startTime.split(":").map(Number);
    const isPM = timeRange.toLowerCase().includes("pm");

    return isPM ? hours + 12 : hours;
  };

  // Compare start times for sorting
  const timeA = extractTime(a);
  const timeB = extractTime(b);

  return timeA - timeB;
};

function getStateCode(usstatejson, StateName) {
  var stateCode;
  usstatejson.features.forEach((i) => {
    if (i.properties.NAME == StateName) {
      stateCode = i.properties.STATE;
    }
  });
  return stateCode;
}

function drawStateMap(fataldata, usstatejson) {
  const stateDropdown = d3.select("#stateSelect");
  const yearDropdown = d3.select("#yearSelect");
  usstatejson.features.sort((a, b) =>
    d3.ascending(a.properties.NAME, b.properties.NAME)
  );
  const selectedYear = document.getElementById("yearSelect").value;
  stateDropdown.on("change", function () {
    const selectedStateCode = getStateCode(usstatejson, this.value);

    clearTables(); // Clear tables before updating
    draw_state(fataldata, usstatejson, selectedStateCode);
    draw_circles(fataldata, selectedStateCode, selectedYear);
    countFactors(fataldata, selectedStateCode, selectedYear).then(() => {
      // Moved the displayTable calls here
      displayTable(rurCountArray, "Rural-urban Table");
      displayTable(intCountArray, "Intersection-name Table");
      // displayTable(weatherCountArray, 'weather  name  Table');
    });
  });

  yearDropdown.on("change", function () {
    selectedYear = this.value; // Assign the selected year to the global variable
    const selectedStateCode = stateDropdown.node().value;

    clearTables(); // Clear tables before updating
    draw_circles(fataldata, selectedStateCode, selectedYear);
    countFactors(fataldata, selectedStateCode, selectedYear).then(() => {
      // Moved the displayTable calls here
      displayTable(rurCountArray, "Rural-urban Table");
      displayTable(intCountArray, "Intersection-name Table");
      // displayTable(weatherCountArray, 'weather name  Table');
    });
  });

  draw_state(fataldata, usstatejson, "01");
  draw_circles(fataldata, "01", selectedYear);
  countFactors(fataldata, "01", selectedYear).then(() => {
    // Moved the displayTable calls here
    displayTable(rurCountArray, "Rural-urban Table");
    displayTable(intCountArray, "Intersection-name Table");
    // displayTable(weatherCountArray, 'weather name  Table');
  });
}
function drawWeatherChart() {
  let svg = d3.select("#weather-pie-chart");

  // create a plot rectangle with a background color
  let plot = svg.append("g").attr("id", "plot");
  const selectedState = document.getElementById("stateSelect").value;
  const selectedYear = document.getElementById("yearSelect").value;

  const radius = 150;

  const arc = d3
    .arc()
    .innerRadius(0)
    .outerRadius(radius - 1);

  const labelRadius = arc.outerRadius()() * 0.8;

  // A separate arc generator for labels.
  const arcLabel = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);

  const pie = d3
    .pie()
    .sort(null)
    .value((d) => d[1]);

  const arcs = pie(weatherObject[selectedYear][selectedState]);
  var colors = d3
    .scaleOrdinal()
    .domain(Object.keys(weatherObject[selectedYear][selectedState]))
    .range(
      d3
        .quantize(
          (t) => d3.interpolateSpectral(t * 0.8 + 0.1),
          Object.keys(weatherObject[selectedYear][selectedState]).length
        )
        .reverse()
    );

  var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip-donut")
    .style("opacity", 0);
  plot
    .selectAll()
    .data(pie(Object.entries(weatherObject[selectedYear][selectedState])))
    .join("path")
    .attr("fill", (d, i) => colors(d.data[0]))
    .attr("transform", "translate(160, 200)")
    .attr("d", arc)
    .on("mouseover", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", ".85");
      div.transition().duration(50).style("opacity", 1);
      let num =
        (((i.endAngle - i.startAngle) / (2 * Math.PI)) * 100)
          .toFixed(1)
          .toString() + "%";
      div
        .html(
          "Weather: " +
            i.data[0] +
            "<br/> No. of Crashes: " +
            i.data[1] +
            "<br/> Percentage: " +
            num
        )
        .style("left", d.pageX + 10 + "px")
        .style("top", d.pageY - 15 + "px");

      div.style("display", "inline-block");
    })
    .on("mouseout", function (d, i) {
      d3.select(this).transition().duration("50").attr("opacity", "1");
      div.transition().duration("50").style("opacity", 0);
    })
    .append("title");

  const legend = svg
    .append("g")
    .attr("transform", "translate(330, 50)")
    .selectAll("legend")
    .data(pie(Object.entries(weatherObject[selectedYear][selectedState])))
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  // Add legend colored rectangles
  legend
    .append("rect")
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", (d) => colors(d.data[0]));

  // Add legend text
  legend
    .append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(
      (d) =>
        `${d.data[0]} (${(
          ((d.endAngle - d.startAngle) / (2 * Math.PI)) *
          100
        ).toFixed(1)}%)`
    );
}

function openNav() {
  document.getElementById("mySidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "350px";
}

function closeNav() {
  document.getElementById("mySidebar").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

function draw_state(fataldata, usstatejson, stateName) {
  let state = usstatejson.features.find(
    (feature) => feature.properties.STATE === stateName
  );

  if (state) {
    document.getElementById("stateMap-name").innerHTML = state.properties.NAME;

    projection.fitSize([450, 450], state);

    svg1.selectAll("path").remove();
    svg1.selectAll("text").remove();

    svg1
      .append("path")
      .data([state])
      .attr("d", generator)
      .attr("stroke", "#303030")
      .attr("opacity", 0.9)
      .style("fill", "#B0B0B0")
      .attr("stroke-width", 2);
  } else {
    console.error("State not found with code:", stateName);
  }
}

function draw_circles(fataldata, stateCode, selectedYear) {
  const latLongPairs = getLatLongPairsForState(fataldata, stateCode);

  svg1.selectAll("circle").remove();
  var div = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip-donut")
    .style("opacity", 0);

  if (latLongPairs[selectedYear]) {
    latLongPairs[selectedYear].forEach(({ lat, long }) => {
      const [x, y] = projection([long, lat]);
      svg1
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", "#ff0000")
        .attr("opacity", 0.7);
    });
  }
}

function countFactors(fataldata, stateCode, selectedYear) {
  return new Promise((resolve) => {
    const factorsCount_rur = {};
    const factorsCount_intname = {};
    const factorcount_weather = {};

    fataldata.forEach((record) => {
      const recordStateCode = record.STATE;
      const state_code = padCountyCode(recordStateCode);
      const year = record.YEAR;

      if (state_code === stateCode && year === selectedYear) {
        const factor = record.RUR_URBNAME;
        factorsCount_rur[factor] = (factorsCount_rur[factor] || 0) + 1;
      }

      if (state_code === stateCode && year === selectedYear) {
        const factor2 = record.TYP_INTNAME;
        factorsCount_intname[factor2] =
          (factorsCount_intname[factor2] || 0) + 1;
      }
      if (state_code === stateCode && year === selectedYear) {
        const factor3 = record.WEATHERNAME;
        factorcount_weather[factor3] = (factorcount_weather[factor3] || 0) + 1;
      }
    });

    rurCountArray = Object.entries(factorsCount_rur).map(([rur, count]) => ({
      rur,
      count,
    }));
    intCountArray = Object.entries(factorsCount_intname).map(
      ([rur, count]) => ({ rur, count })
    );
    weatherCountArray = Object.entries(factorcount_weather).map(
      ([rur, count]) => ({ rur, count })
    );
    resolve(); // Resolve the Promise when the arrays are populated
  });
}

function displayTable(array, label) {
  const factorCountsTableContainer =
    document.getElementById("factorCountsTable");

  // Create a new div for the table
  const tableDiv = document.createElement("div");

  // Create the table element
  const table = document.createElement("table");
  table.classList.add("table", "table-hover", "m-4");
  // Create the table header
  const thead = document.createElement("thead");
  thead.classList.add("table-light");
  const headerRow = document.createElement("tr");

  // Create header cells
  array.forEach(({ rur }) => {
    const th = document.createElement("th");
    th.textContent = rur;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create the table body
  const tbody = document.createElement("tbody");

  // Create a row for counts
  const row = document.createElement("tr");

  // Create cells
  array.forEach(({ count }) => {
    const td = document.createElement("td");
    td.textContent = count;
    row.appendChild(td);
  });

  tbody.appendChild(row);

  table.appendChild(tbody);

  // Add a label to the table
  const labelElement = document.createElement("h4");
  labelElement.textContent = label;

  // Append the label and table to the container
  tableDiv.appendChild(labelElement);
  tableDiv.appendChild(table);
  factorCountsTableContainer.appendChild(tableDiv);
}

function getLatLongPairsForState(fataldata, stateCode) {
  const latLongPairs = {};

  fataldata.forEach((record) => {
    const recordStateCode = record.STATE;
    const state_code = padCountyCode(recordStateCode);
    const year = record.YEAR;
    const lat = parseFloat(record.LATITUDE);
    const long = parseFloat(record.LONGITUD);

    if (state_code === stateCode) {
      if (!latLongPairs[year]) {
        latLongPairs[year] = [];
      }

      latLongPairs[year].push({ lat, long });
    }
  });

  return latLongPairs;
}

function clearTables() {
  const factorCountsTableContainer =
    document.getElementById("factorCountsTable");
  factorCountsTableContainer.innerHTML = ""; // Clear the container's content
}

function padCountyCode(code) {
  code = String(code);

  while (code.length < 2) {
    code = "0" + code;
  }
  return code;
}

