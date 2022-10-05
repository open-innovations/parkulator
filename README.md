# parkulator-static

A simple updated version of [Tom's Parkulator](https://www.imactivate.com/parkulator/) that uses Overpass Turbo to get __car parks__, __golf courses__, or __brownfield land areas__ from OpenStreetMap, display them on a map, and calculate how many homes/parks could be there instead.

Areas of interest can be drawn on the map using a [modified version](https://github.com/open-innovations/parkulator/blob/main/resources/leaflet.area-selection.js) of the [leaflet-area-selection plugin](https://github.com/bopen/leaflet-area-selection). Various UK administrative geographies - Local Authorities, wards, constituencies and MSOAs - can be loaded by using geojsonl files from the [Geography Bits](https://github.com/open-innovations/geography-bits) repo.


## Ideas for creating data layers rather than using Overpass

The GeoJSON of all parking polygons in GB is around 64 MB in size. That is too big to send to the browser never mind the situation where we want to support the whole planet. So we will want to make tiles of the polygons at a particular zoom level. GeoJSON can get quite big which encourages us to make fairly small tiles. However, if we can do a better job of compressing the polygons we could use larger tiles whilst keeping the bandwidth use down. One method of compressing coordinates is to use [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm?csw=1) ([more on EPA](https://pkuwwt.github.io/programming/2020-03-11-encoded-polyline-algorithm/)) and associated the [library from MapBox](https://github.com/mapbox/polyline). The following GeoJSON style line string:

```
[ -0.42987, 51.38274 ], [ -0.43, 51.38279 ], [ -0.42979, 51.38304 ], [ -0.42966, 51.383 ], [ -0.42987, 51.38274 ]
```

becomes

```
t}rAcurxHXIi@q@YFh@r@
```

which is much fewer bytes. For instance, a 64 MB GeoJSON file with all parking polygons in the UK can be reduced down to a 6 MB text file with each feature on a line and each polygon of a MultiPolygon separated by a space character. With some gzipping on the server the transferred size would be 4 MB. On a smaller scale, West Yorkshire's 1.9 MB of parking GeoJSON becomes 175 kB when encoded as EPA (123 kB when gzipped). For the bins project we had to create tiles at zoom level 12 to keep individual tiles from growing to large. But with EPA we can perhaps use zoom level 10 (roughly Leeds-sized) and still have reasonable file sizes. At zoom level `z` there are `2^z × 2^z` tiles so that would be 1048576 tiles at zoom level 10, 262144 tiles at zoom level 9, or 65536 tiles at zoom level 8. The few tiles the better (as long as each isn't too big in bytes) as we'll be able to reduce the number of requests made by the user interface.

### Creating tiles

To create tiles we first filter the planet file (.o5m format) to only keep `ways` with `amenity=parking`.

`osmfilter planet.o5m --keep=\"amenity=parking\" -v --drop-nodes --drop-relations -o=planet-parking.o5m`

Next we convert this to a PBF format which is faster.

`osmconvert planet-parking.o5m -o=planet-parking.osm.pbf`;

We want to generate tiles for the world so we should step through making them.

`osmconvert planet-parking.osm.pbf -b=10.5,49,11.5,50 --complete-ways -o=tiles/56/123.pbf`

The `complete-ways` option should make sure full polygons are kept in each tile. We'll want to rationalise them using the ID in the front-end.

We then generate a GeoJSON version of the tile that just uses the `multipolygons` layer.

`ogr2ogr -overwrite --config osmconf.ini -skipfailures -f GeoJSON tiles/56/123.geojson tiles/56/123.pbf multipolygons`

Then we want to convert that GeoJSON into EPA:

`perl convertToEncodedPolyline.pl tiles/56/123.geojson tiles/56/123.epa`
