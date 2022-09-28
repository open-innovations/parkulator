# parkulator-static

A simple version of the Parkulator that uses Overpass Turbo



# Creating tiles for a particular layer


The GeoJSON of all parking polygons in GB is around 64 MB in size. That is too big to send to the browser never mind the situation where we want to support the whole planet. So we will want to make tiles of the polygons at a particular zoom level. GeoJSON can get quite big which encourages us to make fairly small tiles. However, if we can do a better job of compressing the polygons we could use larger tiles whilst keeping the bandwidth use down. One method of compressing coordinates is to use [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm?csw=1) ([more on EPA](https://pkuwwt.github.io/programming/2020-03-11-encoded-polyline-algorithm/)) and associated the [library from MapBox](https://github.com/mapbox/polyline). The following GeoJSON style line string:

```
[ -0.42987, 51.38274 ], [ -0.43, 51.38279 ], [ -0.42979, 51.38304 ], [ -0.42966, 51.383 ], [ -0.42987, 51.38274 ]
```

becomes

```
t}rAcurxHXIi@q@YFh@r@
```

which is much fewer bytes. For instance, a 64 MB GeoJSON file with all parking polygons in the UK can be reduced down to a 6 MB text file with each feature on a line and each polygon of a MultiPolygon separated by a space character. With some gzipping on the server the transferred size would be 4 MB. On a smaller scale, West Yorkshire's 1.9 MB of parking GeoJSON becomes 175 kB when encoded as EPA (123 kB when gzipped). For the bins project we had to create tiles at zoom level 12 to keep individual tiles from growing to large. But with EPA we can perhaps use zoom level 10 (roughly Leeds-sized) and still have reasonable file sizes. At zoom level `z` there are `2^z × 2^z` tiles so that would be 1048576 tiles at zoom level 10, 262144 tiles at zoom level 9, or 65536 tiles at zoom level 8. The few tiles the better (as long as each isn't too big in bytes) as we'll be able to reduce the number of requests made by the user interface.


