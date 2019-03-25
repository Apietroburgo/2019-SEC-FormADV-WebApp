var mapboxAccessToken = 'pk.eyJ1IjoibWpib3ZlZSIsImEiOiJjanMyZmEwd2cwMDB1NDRsN29wczE4MWJnIn0.z_32ibKt2idp3gdsLE4QDg'

var map = L.map('map').setView([39, -105.547222], 7)

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=' + mapboxAccessToken, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.light'
}).addTo(map)

var svg = d3.select(map.getPanes().overlayPane).append('svg')
var g = svg.append('g').attr('class', 'leaflet-zoom-hide')

var color = d3.scaleLinear()
    .domain([15000, 100000])
    .range(['#d3c5ff', '#58508d'])

queue()
    .defer(d3.json, '../colorado-data/tracts.json')
    .defer(d3.csv, '../colorado-data/incomeData.csv')
    .await(ready)

function ready(error, tracts, income) {
    if (error) return console.log(error)

    var incomeByTractId = {}

    income.forEach(function(d) {
        incomeByTractId[d.GEOID] =+ d.HC03_EST_VC02
    })

    tracts.features.forEach(function(d) {
        console.log(d.properties)
        d.income = incomeByTractId[d.properties.GEOID]
    })

    // make d3 and leaflet play together
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }

    var transform = d3.geoTransform({
        point: projectPoint
    })

    var path = d3.geoPath().projection(transform)

    var tractFeature = g.selectAll('path')
        .data(tracts.features)
        .enter().append('path')

    map.on('viewreset', reset)

    reset()

    function reset() {
        bounds = path.bounds(tracts)
        var topLeft = bounds[0]
        var bottomRight = bounds[1]
    
        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px")

        g.attr("transform", "translate(" + -topLeft[0] + ","  + -topLeft[1] + ")")

        tractFeature.attr('d', path)
            .style('fill-opacity', 0.75)
            .attr('fill', function(d) {
                return d.income ? color(d.income) : 'none'
            })
        
    }

    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x))
        this.stream.point(point.x, point.y)
    }
    
}