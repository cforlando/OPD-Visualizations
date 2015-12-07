//Colors associated with the five dispatch categories
var fillColors = {
	'violent': '#e96262',
	'nonviolent': '#4e8ad9',
	'transport': '#e2dd13',
	'oncall': '#aa78bf',
	'other': '#f6a926'
};

//Show/hide all info in the header except for the title and dispatch details
function toggleDetails() {
	var button = document.getElementById('detail-toggle');
	console.log(button.textContent.indexOf('Hide'));
	if (button.textContent.indexOf('Hide') == 0) {
		document.getElementById('additional-details').style.display = 'none';
		button.textContent = 'Show additional info';
	} else {
		document.getElementById('additional-details').style.display = 'block';
		button.textContent = 'Hide additional info';
	}
}

//Draw the GMap and overlay for a given month's data
function draw(data) {
	
	//Convert data strings into JS types
	var format = d3.time.format('%Y-%m-%d %H:%M:%S')
	for (var i=0;i<data.length;i++) {
		data[i].lat = +data[i].lat;
		data[i].lon = +data[i].lon;
		data[i].datetime = format.parse(data[i].datetime);
	}
	
	//Group the data by date
	var nested = d3.nest()
		.key(function(d) {
			return d.datetime.toISOString().substring(0 , 10);
		})
		.entries(data);
		
	function key_func(d) {
			return d['key'];
	}
	
	//Create the map centered near downtown Orlando
	var map = new google.maps.Map(d3.select('#map').node(), {
		zoom: 12,
		center: new google.maps.LatLng(28.5086413 , -81.3601829),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	
	//Init empty overlay
	var overlay = new google.maps.OverlayView();
	
	//Populates a new map overlay layer with points associated with a particular day
	//New map overlay replaces the old one
	function show_day(year , month , day) {
		
		//If year or month has changed, reload the page with the new dataset
		if ((year != load.year) || (month != load.month)) {
			window.location.href = 'mapping.html?year='+year+'&month='+month+'&day='+day;
		}
		
		//Filter the nested data to pick out data that matches the requested date
		var dString = year + '-' + pad2(month) + '-' + pad2(day);
		var filtered = nested.filter(function(d) { return d.key == dString; })[0];
		
		//Only plot new overlay if date returns valid filtered data
		if(typeof filtered !== 'undefined'){
			
			filtered = filtered.values;
					
			//Init the new overlay
			var newOverlay = new google.maps.OverlayView();
			
			//Event handler to populate points when added to the map
			newOverlay.onAdd = function() {
				
				//Append a new div that interacts with mouse events
				var layer = d3.select(this.getPanes().overlayMouseTarget).append('div')
					.attr('class', 'stations');
				
				//Draw/redraw points on the overlay when map is not moving
				newOverlay.draw = function() {
					
					//Get projection for coord to xy
					var projection = newOverlay.getProjection(),
							padding = 10;
					
					//Set a point's xy and color
					function transform(d) {
						var color = fillColors[d.value.category];
						d = new google.maps.LatLng(d.value.lat, d.value.lon);
						d = projection.fromLatLngToDivPixel(d);
						return d3.select(this)
								.style('left', (d.x - padding) + 'px')
								.style('top', (d.y - padding) + 'px')
								.style('fill' , color);
					}
					
					//Capitalizes the first char of a string
					function caps(string) {
						return string.charAt(0).toUpperCase() + string.slice(1);
					}
					
					//Set the text in the header of a point's details
					function showDetails(d) {
						d3.select('#det-reason').text(caps(d.value.reason));
						d3.select('#det-category').text(caps(d.value.category));
						d3.select('#det-time').text(d.value.datetime.toLocaleTimeString());
						d3.select('#det-coords').text(d.value.lat + ', ' + d.value.lon);
					}
					
					//Create new svg:circle elements with the appropriate handlers
					var marker = layer.selectAll('svg')
							.data(d3.entries(filtered))
							.each(transform) // update existing markers
						.enter().append('svg:svg')
							.each(transform);
					marker.append('svg:circle')
							.attr('r', '7')
							.attr('cx', padding)
							.attr('cy', padding)
							.on('mouseover' , showDetails)
							.on('click' , showDetails);
				}
			}
			
			//Event handler to remove points prior to removing the overlay
			newOverlay.onRemove = function() {
				d3.select('.stations').remove();
			};
			
			//Set the date options to the date being shown
			document.getElementById('opt-year-field').value = year;
			document.getElementById('opt-month-field').value = month;
			document.getElementById('opt-day-field').value = day;
			
			//Display the number of points on the map for each category in the legend
			for (var category in fillColors) {
				var catFilter = filtered.filter(function(d) { return d.category == category; });
				d3.select('#legend-'+category+' span')[0][0].textContent = catFilter.length;
			}
			
			//Replace the old overlay with the new one
			overlay.setMap(null);
			newOverlay.setMap(map);
			overlay = newOverlay;
			
			//Change map points to display for a given date
			d3.select('#show-day').on('click', function() {
				var yearVal = parseInt(document.getElementById('opt-year-field').value);
				var monthVal = parseInt(document.getElementById('opt-month-field').value);
				var dayVal = parseInt(document.getElementById('opt-day-field').value);
				show_day(yearVal , monthVal , dayVal);
			});
		} else {
			//Remove old overlay
			overlay.setMap(null);
			
			//Set legend to display zeros
			for (var category in fillColors) {
				d3.select('#legend-'+category+' span')[0][0].textContent = 0;
			}
		}
	}
	
	//Populate the map with the date given at page load
	show_day(load.year , load.month , load.day);
	
	//Set fill for svg:circle in the legend
	for (var category in fillColors) {
		d3.select('#legend-'+category+' svg')
			.style('fill' , fillColors[category]);
	}
}

//Get value for a url param
function urlParam(name){
	var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results !== null) {
		return results[1] || 0;
	} else {
		return null;
	}
}

//Return padded nuumber string
function pad2(num) {
	if (num < 10) { return '0' + num }
	return num;
}

//Default date on load
var load = {
	day: 1,
	month: 7,
	year: 2015
};

//Replace default date if url params present
if (urlParam('year') !== null) {
	load.year= urlParam('year');
}
if (urlParam('month') !== null) {
	load.month = urlParam('month');
}
if (urlParam('day') !== null) {
	load.day = urlParam('day');
}

//Show back button if coming from another view, ie params are in url
if (window.location.href.includes('?')) {
	document.getElementById('back-button').style.display = 'inline';
}

//Verify that date is within range of the data files
if (load.year <= 2009){
	load.year = 2009;
	if (load.month < 5) {
		load.month = 5;
	}
} else if (load.year >= 2015) {
	load.year = 2015;
	if (load.month > 8) {
		load.month = 8;
	}
}

//Load the requested JSON data file and call draw
var jsonfile = '../data/opddata-' + load.year + '-' + pad2(load.month) + '.json';
d3.json(jsonfile , draw);