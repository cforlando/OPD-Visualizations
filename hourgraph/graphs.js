//Set the graph size
var margin = 75,
width = 1400 - margin,
height = 600 - margin;

//Global var for main body of data
var graphData;

//Tracks the current animation group index
var curGroup = 0;

//Sets the order that categories will be stacked on each bar
var stackOrder = {
	'violent': 1,
	'nonviolent': 2,
	'transport': 3,
	'oncall': 4,
	'other': 5
};

//Colors associated with the five dispatch categories
var fillColors = {
	'violent': '#e96262',
	'nonviolent': '#4e8ad9',
	'transport': '#e2dd13',
	'oncall': '#aa78bf',
	'other': '#f6a926'
};

//
var animationSteps = [
	'dull',       //all categories with no color
	'violent',    //only violent counts
	'nonviolent', //only nonviolent counts
	'transport',  //only transport counts
	'oncall',     //only oncall counts
	'other',      //only other counts
	'color'       //all categories with color
];

//
var descriptionText = [
	"Police dispatch activity tends to follow the activity curve of people during the day with the lowest point at 5AM and the highest in the evening.",
	'However, the hours of 5PM and 6PM buck this trend.',
	'We see a sudden drop at 5PM followed by an equally sudden increase at 6PM.',
	"If we were to average these two hours, they'd fit into the curve we'd expect to see.",
	'This anomaly appears in the totals and most of the categories...',
	'...except Other which more closely aligns to the public school day.',
	"Here's my theory. The time associated with a police report is not when the incident actually happened; it’s when the officer arrives at that location. The heaviest rush hour traffic starts around 5 PM when most people leave work. I believe that many of the 6 PM dispatches happened in the 5 PM block, but the traffic kept enough officers from getting to the site promptly."
];

//Set fill for svg:circle in the legend
for (var category in fillColors) {
d3.select('#legend-'+category+' svg')
	.style('fill' , fillColors[category]);
}

//Return padded nuumber string
function pad2(num) {
	if (num < 10) { return '0' + num }
	return num;
}

//Converts the bin data into values that dimple can easily use
function formatGraphData(data) {
	var retData = [];
	for (var key in data) {
		for (var cat in data[key].total) {
			retData.push({
				'Hour': key,
				'Category': cat,
				'Dispatches': data[key].total[cat],
				'Order': stackOrder[cat]
			});
		}
	}
	return retData
}

//Capitalizes the first char of a string
function caps(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function animation(group) {
	//Filter data
	var subdata = [];
	if (group in stackOrder) {
		for (var i in graphData) {
			if (graphData[i].Category == group) {
				subdata.push(graphData[i]);
			}
		}
	} else {
		subdata = graphData;
	}
	
	//Remove previous chart
	d3.select('#graph').selectAll('*').remove();
	
	//Create and place the svg object
	var svg = dimple.newSvg('#graph', width + margin, height + margin);
	
	//Build new chart
	var myChart = new dimple.chart(svg, subdata);
	//Add axis data
	var x = myChart.addTimeAxis('x', 'Hour', '%H', '%I');
	myChart.addMeasureAxis('y', 'Dispatches');
	//Add ordered stacked bars
	var s = myChart.addSeries(['Order', 'Category'], dimple.plot.bar);
	s.addOrderRule('Order');
	s.categoryFields = ['Category'];
	
	//Assign category colors
	for (var cat in fillColors) {
		if (group == 'dull') {
			myChart.assignColor(cat, '#999999', '#999999', 1)
		} else {
			myChart.assignColor(cat, fillColors[cat]);
		}
	}
	
	//Update chart title and description text
	if (group == 'dull' || group == 'color') {
		d3.select('#graph-title h2').text('Dispatches by Hour');
	} else {
		d3.select('#graph-title h2').text(caps(group) + ' Dispatches by Hour');
	}
	d3.select('#description').text(descriptionText[curGroup]);
	
	//Update bar width and x-axis range
	x.floatingBarWidth = (window.innerWidth - margin * 2) / 44;
	var d = new Date('1900-01-01T00:00:00');
	x.overrideMin = d3.time.hour.offset(d, -1);
	x.overrideMax = d3.time.day.offset(d, 1);
	x.title = 'Hour';
	
	//Show/hide forward and back buttons
	d3.select('#go-back').style('visibility', 'visible');
	d3.select('#go-forward').style('visibility', 'visible');
	if (curGroup == 0) {
		d3.select('#go-back').style('visibility', 'hidden');
	} else if (curGroup == animationSteps.length-1) {
		d3.select('#go-forward').style('visibility', 'hidden');
	}
	
	//Draw chart
	myChart.draw(1000);
}

//Button handler updates curGroup and triggers animation
function move(dir) {
	var direction = {'f':1,'b':-1};
	curGroup += direction[dir];
	animation(animationSteps[curGroup]);
}

//Play animation then interactive graph
d3.json('../data/opdhours.json', function(data) {
	graphData = formatGraphData(data)
	animation(animationSteps[curGroup]);
});