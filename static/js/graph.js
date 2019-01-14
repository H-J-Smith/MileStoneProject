queue()
    .defer(d3.csv, "data/uk-rollercoasters.csv")
    .await(makeGraphs);

function makeGraphs(error, rollercoastersData) {
    var ndx = crossfilter(rollercoastersData);
    
    rides_per_park(ndx);
    ride_ratings(ndx);
    
    show_ride_rating_as_percentage(ndx, "Family", "#percentage-of-family-rides");
    show_ride_rating_as_percentage(ndx, "Thrill", "#percentage-of-thrill-rides");
    show_ride_rating_as_percentage(ndx, "Extreme", "#percentage-of-extreme-rides");
    
    show_year_build_with_rides_rating(ndx);
    ride_data_table(ndx);
    
    dc.renderAll();
}
        
function rides_per_park(ndx) {
    var dim = ndx.dimension(dc.pluck("park"));
    var group = dim.group();
    
    dc.barChart("#rides_per_park")
        .width(1100)
        .height(300)
        .margins({top: 10, right: 50, bottom: 50, left:50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Parks")
        .yAxis().ticks(10);
}

function ride_ratings(ndx) {
            
    var dim = ndx.dimension(dc.pluck("rating"));
    var group = dim.group();
            
    dc.pieChart('#ride_ratings')
        .height(400)
        .radius(120)
        .transitionDuration(500)
        .dimension(dim)
        .group(group);
    
}

function show_ride_rating_as_percentage(ndx, intensity, element) {
    var percentageOfRideRatings = ndx.groupAll().reduce(
            function (p, v) {
                if(v.ride === "rollercoaster") {
                    p.count++;
                    if (v.rating === intensity) {
                        p.ride_rates++;
                    }
                }
                return p;
            },
            function (p, v) {
                if(v.ride === "rollercoaster") {
                    p.count--;
                    if (v.rating === intensity) {
                        p.ride_rates--;
                    }
                }
                return p;   
            },
            function() {
                return {count:0, ride_rates: 0};
            }
        );
        
        dc.numberDisplay(element)
            .formatNumber(d3.format("%"))
            .valueAccessor(function (d) {
                if (d.count == 0) {
                    return 0;
                } else {
                    return (d.ride_rates / d.count);
                }
            })
            .group(percentageOfRideRatings);
}

function show_year_build_with_rides_rating(ndx) {
    
    function ratingsByYear(dimension, rating) {
        return dimension.group().reduce(
            function (p, v) {
                p.total++;
                if(v.rating == rating) {
                    p.match ++;
                }
                return p;
            },
            function (p, v) {
                p.total--;
                if(v.rating == rating) {
                    p.match --;
                }
                return p;
            }, 
            function (){
                return {total: 0, match: 0};
            }
        );
    }    
        
        var dim = ndx.dimension(dc.pluck("year.built"));
        var familyByYear = ratingsByYear(dim, "Family");
        var thrillByYear = ratingsByYear(dim, "Thrill");
        var extremeByYear = ratingsByYear(dim, "Extreme");
        
        dc.barChart("#ratings-by-year")
            .width(1250)
            .height(300)
            .dimension(dim)
            .group(familyByYear, "Family")
            .stack(thrillByYear, "Thrill")
            .stack(extremeByYear, "Extreme")
            .valueAccessor(function(d) {
                if(d.value.total > 0) {
                    return(d.value.match);
                } else {
                    return 0;
                }
            })
            .x(d3.scale.ordinal())
            .xUnits(dc.units.ordinal)
            .legend(dc.legend(). x(1160).y(20).itemHeight(15).gap(5))
            .margins({top: 10, right: 100, bottom: 30, left: 100});
}

function ride_data_table(ndx) {    
    var dim = ndx.groupAll();
    
    dc.dataTable('#data-table')
            .dimension(dim)
            .columns([
                function (d) { return d.name; },
                function (d) { return d.rating; },
                function (d) { return d.year.built; }
            ])
            .size(500) 
            .order(d3.descending)
            .renderlet(function (table) {
                table.selectAll('.dc-table-group').classed('info', true);
            });
}