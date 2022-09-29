/*
	This is a modified version of https://github.com/bopen/leaflet-area-selection version 0.6.1 
	Modified by Stuart Lowe (Open Innovations) 2022-09-29
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet'], factory) :
	(global = global || self, factory(global.leafletAreaSelection = {}, global.L));
}(this, (function (exports, leaflet) {
	var styles = {"leafletMapOverlayPane":"leaflet-area-selection","areaSelectMarker":"leaflet-area-selector","areaSelectGhostMarker":"leaflet-area-selector"};

	function toCamelCase(name) {
		return name.split('-').map(function (s, index) {
			return index === 0 ? s : "" + s[0].toUpperCase() + s.substring(1);
		}).join('');
	}
	function cls(name, additionalClasses) {

		if (additionalClasses === void 0) {
			additionalClasses = '';
		}

		var clsName = toCamelCase(name);

		if (styles[clsName]) {
			return additionalClasses ? styles[clsName] + " " + name + " " + additionalClasses : styles[clsName] + " " + name;
		}

		return additionalClasses ? name + " " + additionalClasses : name;
	}
	function insertAfter(newNode, referenceNode) {
		referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
	}
	function setPosition(el, point, offset) {
		if (offset === void 0) {
			offset = null;
		}

		var nextPoint = offset ? point.add(offset) : point;
		el._leaflet_pos = nextPoint;

		if (leaflet.Browser.any3d) {
			leaflet.DomUtil.setTransform(el, nextPoint);
		} else {
			el.style.left = nextPoint.x + 'px';
			el.style.top = nextPoint.y + 'px';
		}
	}
	var CLICK_EVT = leaflet.Browser.mobile ? 'touchend' : 'click';
	function isTrustedEvent(event) {
		return event.isTrusted || window.Cypress;
	}

	var PANE_NAME = 'area-draw-selection';

	function drawingPaneContainer(options) {
		var active = options.active,
				fadeOnActivation = options.fadeOnActivation;
		var drawPane = leaflet.DomUtil.create('div', cls('leaflet-map-overlay-pane', "leaflet-pane" + (active ? '' : ' inactive') + (fadeOnActivation ? ' fading-enabled' : '')));
		return drawPane;
	}

	function createPane(map, options) {
		var standardPanesContainer = map.getContainer().querySelector('.leaflet-map-pane');
		var overlayPanesContainer = drawingPaneContainer(options);
		insertAfter(overlayPanesContainer, standardPanesContainer);
		var pane = map.createPane(PANE_NAME, overlayPanesContainer);

		var handler = function handler(event) {
			if (!isTrustedEvent(event)) {
				return;
			}

			event.stopPropagation();
			map.fire('as:point-add', event);
		};

		pane.addEventListener(CLICK_EVT, handler);
		return pane;
	}
	function addEndClickArea(control, _ref) {
		var x = _ref[0],
				y = _ref[1];
		var map = control.getMap();
		var pane = map.getPane(PANE_NAME);
		var marker = leaflet.DomUtil.create('div', cls('end-selection-area'), pane);
		var bbox = marker.getBoundingClientRect();
		marker.setAttribute('role', 'button');

		var handler = function handler(event) {
			if (!isTrustedEvent(event)) {
				return;
			}

			event.stopPropagation();
			map.fire('as:creation-end');
		};

		marker.addEventListener(CLICK_EVT, handler, {
			once: true
		});
		marker.addEventListener('mouseenter', control.hoverClosePoint.bind(control));
		marker.addEventListener('mouseleave', control.outClosePoint.bind(control));
		setPosition(marker, new leaflet.Point(x, y), new leaflet.Point(-bbox.width / 2, -bbox.height / 2));
	}
	function removeEndClickArea(control) {
		var map = control.getMap();
		var pane = map.getPane(PANE_NAME);
		var marker = pane.querySelector('.end-selection-area');

		if (marker) {
			marker.remove();
		}
	}

	function _extends() {
		_extends = Object.assign || function (target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];

				for (var key in source) {
					if (Object.prototype.hasOwnProperty.call(source, key)) {
						target[key] = source[key];
					}
				}
			}

			return target;
		};

		return _extends.apply(this, arguments);
	}

	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;

		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}

		return target;
	}

	function doNothingHandler(event) {
		event.originalEvent.preventDefault();
		event.originalEvent.stopPropagation();
	}

	function onAddPoint(event) {
		var _this = this;

		if (this.mapMoving) {
			return;
		}

		var map = this.getMap();
		var clientX = event.clientX,
				clientY = event.clientY;

		if (clientX === undefined && clientY === undefined) {
			var touch = event.changedTouches[0];
			clientX = touch.clientX;
			clientY = touch.clientY;
		}

		if (this.rectDrawing) {
			map.fire('as:dragging-rect-end');
			return;
		}

		var _event$index = event.index,
				index = _event$index === void 0 ? null : _event$index;
		var container = map.getContainer();
		var bbox = container.getBoundingClientRect();
		var x = clientX - bbox.left;
		var y = clientY - bbox.top;

		if (this.markers.length === 0) {
			addEndClickArea(this, [x, y]);
		}

		var point = new leaflet.Point(x, y);
		var icon = new leaflet.DivIcon({
			className: cls('area-select-marker'),
			iconSize: [16, 16]
		});
		var marker = new leaflet.Marker(map.containerPointToLatLng(point), {
			icon: icon,
			draggable: true
		});

		var _onMarkerDrag = onMarkerDrag.bind(this);

		marker.on('drag', _onMarkerDrag(index === null ? this.markers.length : index));
		marker.on('dragstart', function (event) {
			event.target.getElement().classList.add('active');
		});
		marker.on('dragend', function (event) {
			event.target.getElement().classList.remove('active');
			requestAnimationFrame(function () {
				_this.onPolygonReady();
			});
		});
		var newEdge = {
			point: point,
			marker: marker,
			index: index
		};
		marker.on('dblclick', function (length) {
			return function (event) {
				event.originalEvent.stopPropagation();
				map.fire('as:marker-remove', _extends({}, newEdge, {
					index: index === null ? length : index
				}));
			};
		}(this.markers.length));
		marker.on(CLICK_EVT, doNothingHandler);
		marker.addTo(map);
		map.fire('as:marker-add', newEdge);

		if (index !== null) {
			var _loop = function _loop(i) {
				_this.markers[i].marker.off('drag');

				_this.markers[i].marker.on('drag', _onMarkerDrag(i));

				_this.markers[i].marker.off(CLICK_EVT);

				_this.markers[i].marker.on(CLICK_EVT, doNothingHandler);

				_this.markers[i].marker.off('dblclick');

				_this.markers[i].marker.on('dblclick', function (event) {
					map.fire('as:marker-remove', _extends({}, _this.markers[i], {
						index: i
					}));
				});
			};

			for (var i = index + 1; i < this.markers.length; i++) {
				_loop(i);
			}
		}
	}
	function onAddMarker(_ref) {
		var _ref$index = _ref.index,
				index = _ref$index === void 0 ? null : _ref$index,
				rest = _objectWithoutPropertiesLoose(_ref, ["index"]);

		var map = this.getMap();
		var edge = {
			marker: rest.marker,
			point: rest.point
		};
		var markers = this.markers;

		if (index === null) {
			markers.push(edge);
		} else {
			markers.splice(index, 0, edge);
		}

		var enoughPoints = markers.length >= 3;

		if (this.phase === 'draw') {
			if (!enoughPoints) {
				markers.forEach(function (_ref2) {
					var marker = _ref2.marker;
					var icon = marker.getIcon();
					icon.options.className = cls('area-select-marker', 'invalid');
					marker.setIcon(icon);
				});
			} else if (markers.length === 3) {
				markers.forEach(function (_ref3, index) {
					var marker = _ref3.marker;
					var icon = marker.getIcon();
					icon.options.className = cls('area-select-marker', index === 0 ? 'start-marker' : null);
					marker.setIcon(icon);
				});
			}
		}

		map.fire('as:update-polygon');

		if (this.phase === 'adjust') {
			map.fire('as:update-ghost-points');
			this.onPolygonReady();
		}

		if (this.phase === 'draw') {
			if (this.closeLine) {
				map.removeLayer(this.closeLine);
			}

			if (enoughPoints) {
				this.closeLine = new leaflet.Polyline([markers[0].marker.getLatLng(), markers[markers.length - 1].marker.getLatLng()], {
					weight: 3,
					color: '#c0c0c0',
					className: 'areaCloseLine'
				});
				map.addLayer(this.closeLine);
			}
		}
	}
	function onRemoveMarker(_ref4) {
		var _this2 = this;

		var _ref4$index = _ref4.index,
				index = _ref4$index === void 0 ? 0 : _ref4$index;
		var map = this.getMap();
		var markers = this.markers;
		var enoughPoints = markers.length > 3;

		if (!enoughPoints) {
			return;
		}

		var removed = this.markers.splice(index || 0, 1);
		removed[0].marker.removeFrom(map);
		map.fire('as:update-polygon');

		if (this.phase === 'adjust') {
			map.fire('as:update-ghost-points');
		}

		var _loop2 = function _loop2(i) {
			_this2.markers[i].marker.off('drag');

			_this2.markers[i].marker.on('drag', onMarkerDrag.bind(_this2)(i));

			_this2.markers[i].marker.off(CLICK_EVT);

			_this2.markers[i].marker.on(CLICK_EVT, doNothingHandler);

			_this2.markers[i].marker.off('dblclick');

			_this2.markers[i].marker.on('dblclick', function (event) {
				event.originalEvent.stopPropagation();
				map.fire('as:marker-remove', _extends({}, _this2.markers[i], {
					index: i
				}));
			});
		};

		for (var i = index; i < this.markers.length; i++) {
			_loop2(i);
		}

		this.onPolygonReady();
	}
	function onUpdatePolygon() {
		var _this3 = this;

		var map = this.getMap();
		var markers = this.markers;
		var enoughPoints = markers.length >= 3;
		var polygon = new leaflet.Polygon(markers.map(function (_ref5) {
			var marker = _ref5.marker;
			return marker.getLatLng();
		}), _extends({
			color: enoughPoints ? 'rgb(45, 123, 200)' : 'rgba(220, 53, 69, 0.7)',
			weight: 2
		}, !enoughPoints && {
			dashArray: '5, 10'
		}, {
			className: 'drawing-area-poligon'
		}));
		polygon.on(CLICK_EVT, function (ev) {
			leaflet.DomEvent.stopPropagation(ev);
		});
		polygon.on('dblclick', function (ev) {
			leaflet.DomEvent.stopPropagation(ev);

			_this3.onPolygonDblClick(ev);

			return false;
		});

		if (this.polygon) {
			map.removeLayer(this.polygon);
		}

		this.polygon = polygon;
		map.addLayer(this.polygon);
	}
	function onUpdateGhostPoints() {
		var _this4 = this;

		var map = this.getMap();
		requestAnimationFrame(function () {
			_this4.clearGhostMarkers();

			var markers = _this4.markers,
					ghostMarkers = _this4.ghostMarkers;
			markers.forEach(function (currentMarker, index) {
				var nextMarker = markers[index + 1] ? markers[index + 1] : markers[0];
				var currentLatLng = currentMarker.marker.getLatLng();
				var nextLatLng = nextMarker.marker.getLatLng();
				var point = map.latLngToContainerPoint([(currentLatLng.lat + nextLatLng.lat) / 2, (currentLatLng.lng + nextLatLng.lng) / 2]);
				var icon = new leaflet.DivIcon({
					className: cls('area-select-ghost-marker'),
					iconSize: [16, 16]
				});
				var marker = new leaflet.Marker(map.containerPointToLatLng(point), {
					icon: icon,
					draggable: true
				});
				var newGhostMarker = {
					point: point,
					marker: marker
				};
				marker.on(CLICK_EVT, doNothingHandler);
				marker.on('dblclick', doNothingHandler);
				marker.on('dragstart', onGhostMarkerDragStart.bind(_this4)());
				marker.on('drag', onGhostMarkerDrag.bind(_this4)(ghostMarkers.length));
				marker.on('dragend', onGhostMarkerDragEnd.bind(_this4)(ghostMarkers.length));
				ghostMarkers.push(newGhostMarker);
				marker.addTo(map);
			});
		});
	}
	function onPolygonCreationEnd() {
		var map = this.getMap();
		map.dragging.enable();
		map.removeLayer(this.closeLine);
		this.closeLine = null;
		this.markers[0].marker.getElement().classList.remove('start-marker');
		this.setPhase('adjust');
		map.fire('as:update-ghost-points');
		this.onPolygonReady();
		removeEndClickArea(this);
	}
	function onActivate(event) {
		if (!isTrustedEvent(event)) {
			return;
		}

		var map = this.getMap();
		this._dragStatus = map.dragging._enabled;
		event.stopPropagation();
		event.target.blur();
		var activeState = this.options.active || this.phase === 'adjust';

		if (activeState) {
			if (!this._dragStatus) {
				map.dragging.disable();
			}

			this.options.onButtonDeactivate(this.polygon, this, event);

			if (!event.defaultPrevented) {
				this.deactivate();
			}
		} else {
			this.options.onButtonActivate(this, event);

			if (!event.defaultPrevented) {
				map.dragging.disable();
				this.activateButton.classList.add('active');
				map.getContainer().classList.add('drawing-area');
				this.setPhase('draw', true);
			}
		}
	}
	function onMarkerDrag(index) {
		var _this5 = this;

		var map = this.getMap();
		return function (event) {
			var latlng = event.latlng;
			requestAnimationFrame(function () {
				var newPoint = map.latLngToContainerPoint(latlng);
				var point = _this5.markers[index].point;
				point.x = newPoint.x;
				point.y = newPoint.y;
				map.fire('as:update-polygon');
				map.fire('as:update-ghost-points');
			});
		};
	}
	function onGhostMarkerDrag(index) {
		var _this6 = this;

		var map = this.getMap();
		return function (event) {
			var latlng = event.latlng;
			requestAnimationFrame(function () {
				var firstPoint = _this6.markers[index];
				var lastPoint = _this6.markers[index + 1] ? _this6.markers[index + 1] : _this6.markers[0];

				if (_this6.ghostPolygon) {
					map.removeLayer(_this6.ghostPolygon);
				}

				_this6.ghostPolygon = new leaflet.Polygon([map.containerPointToLatLng(firstPoint.point), latlng, map.containerPointToLatLng(lastPoint.point)], {
					color: 'rgb(45, 123, 200)',
					weight: 2,
					opacity: 0.5,
					fillOpacity: 0.1,
					dashArray: '5, 10'
				});
				map.addLayer(_this6.ghostPolygon);
				map.fire('as:update-polygon');
			});
		};
	}
	function onGhostMarkerDragStart() {
		return function (event) {
			event.target.getElement().classList.add('active');
		};
	}
	function onGhostMarkerDragEnd(index) {
		var _this7 = this;

		var map = this.getMap();
		return function (event) {
			var target = event.target;
			target.getElement().classList.remove('active');
			target.removeFrom(map);

			if (_this7.ghostPolygon) {
				map.removeLayer(_this7.ghostPolygon);
			}

			var newPoint = map.latLngToContainerPoint(target.getLatLng());
			var container = map.getContainer();
			var bbox = container.getBoundingClientRect();
			var fakeEvent = {
				clientX: newPoint.x + bbox.left,
				clientY: newPoint.y + bbox.top,
				index: index + 1
			};
			map.fire('as:point-add', fakeEvent);
		};
	}
	function onMouseMove(event) {
		if (!this.mapMoving && this.markers.length === 0 && event.which !== 0 && event.buttons === 1) {
			var map = this.getMap();

			if (!this.rectDrawing) {
				this.rectDrawStart = [event.clientX, event.clientY];
				var props = {
					weight: 2,
					color: '#8B4513',
					className: 'rect-progress-line',
					opacity: 0.6
				};
				this.draggingRect = new leaflet.LayerGroup().addLayer(new leaflet.Polyline([], props)).addLayer(new leaflet.Polyline([], props)).addTo(map);
				this.rectDrawing = true;
				return;
			}

			this.rectDrawEnd = [event.clientX, event.clientY];
			var pointA = [this.rectDrawStart[0], event.clientY];
			var pointB = [event.clientX, this.rectDrawStart[1]];
			var layers = this.draggingRect.getLayers();
			layers[0].setLatLngs([map.mouseEventToLatLng({
				clientX: this.rectDrawEnd[0],
				clientY: this.rectDrawEnd[1]
			}), map.mouseEventToLatLng({
				clientX: pointA[0],
				clientY: pointA[1]
			}), map.mouseEventToLatLng({
				clientX: this.rectDrawStart[0],
				clientY: this.rectDrawStart[1]
			})]);
			layers[1].setLatLngs([map.mouseEventToLatLng({
				clientX: this.rectDrawEnd[0],
				clientY: this.rectDrawEnd[1]
			}), map.mouseEventToLatLng({
				clientX: pointB[0],
				clientY: pointB[1]
			}), map.mouseEventToLatLng({
				clientX: this.rectDrawStart[0],
				clientY: this.rectDrawStart[1]
			})]);
		}
	}
	function onDraggingRectEnd() {
		this.rectDrawing = false;
		var vertex1 = {
			clientX: this.rectDrawStart[0],
			clientY: this.rectDrawStart[1]
		};
		var vertex2 = {
			clientX: this.rectDrawEnd[0],
			clientY: this.rectDrawStart[1]
		};
		var vertex3 = {
			clientX: this.rectDrawEnd[0],
			clientY: this.rectDrawEnd[1]
		};
		var vertex4 = {
			clientX: this.rectDrawStart[0],
			clientY: this.rectDrawEnd[1]
		};
		onAddPoint.bind(this)(vertex1);
		onAddPoint.bind(this)(vertex2);
		onAddPoint.bind(this)(vertex3);
		onAddPoint.bind(this)(vertex4);

		this._map.fire('as:creation-end');

		this.rectDrawStart = null;
		this.rectDrawEnd = null;
		this.draggingRect.removeFrom(this._map);
	}

	var DrawAreaSelection = leaflet.Control.extend({
		options: {
			active: false,
			fadeOnActivation: true,
			onPolygonReady: function onPolygonReady(polygon, control) {},
			onPolygonDblClick: function onPolygonDblClick(polygon, control, event) {},
			onButtonActivate: function onButtonActivate(control, event) {},
			onButtonDeactivate: function onButtonDeactivate(polygon, control, event) {}
		},
		initialize: function initialize(options) {
			if (options === void 0) {
				options = {};
			}

			leaflet.Util.setOptions(this, options);
			this._map = null;
			this.phase = options.active ? 'draw' : 'inactive';
			this.mapMoving = false;
			this.rectDrawing = false;
			this.rectDrawStart = null;
			this.rectDrawEnd = null;
			this.draggingRect = null;
			this.markers = [];
			this.ghostMarkers = [];
			this.polygon = null;
			this.closeLine = null;
			this._mapMoveStart = this._mapMoveStart.bind(this);
			this._mapMoveEnd = this._mapMoveEnd.bind(this);
			this._handleMouseMove = this._handleMouseMove.bind(this);
		},
		onAdd: function onAdd(map) {
			this._container = leaflet.DomUtil.create('div', '', null);

			// Create a leaflet-bar div to hold the button
			var bar = leaflet.DomUtil.create('div', '', this._container);
			bar.classList.add('leaflet-bar');
		
			this.activateButton = leaflet.DomUtil.create('button', 'leaflet-button', bar);
			//this.activateButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pentagon-fill" viewBox="0 0 16 16"><path d="M7.685.256a.5.5 0 0 1 .63 0l7.421 6.03a.5.5 0 0 1 .162.538l-2.788 8.827a.5.5 0 0 1-.476.349H3.366a.5.5 0 0 1-.476-.35L.102 6.825a.5.5 0 0 1 .162-.538l7.42-6.03Z"/></svg>';
			this.activateButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" vector-effect="non-scaling-stroke" class="bi bi-bounding-box" viewBox="0 0 16 16"><path d="M5 2V0H0v5h2v6H0v5h5v-2h6v2h5v-5h-2V5h2V0h-5v2H5zm6 1v2h2v6h-2v2H5v-2H3V5h2V3h6zm1-2h3v3h-3V1zm3 11v3h-3v-3h3zM4 15H1v-3h3v3zM1 4V1h3v3H1z"/></svg>';
			this.activateButton.setAttribute('aria-label', 'Draw shape');
			this.activateButton.setAttribute('aria-describedby', 'draw-panel-help');
			this.activateButton.addEventListener('click', onActivate.bind(this));
			this.activateButton.addEventListener('dblclick', function (event) {
				event.stopPropagation();
			});
			this.options.active ? this.activateButton.classList.add('active') : this.activateButton.classList.remove('active');
			this._map = map;
			var pane = createPane(map, this.options);
			this.addUserHelpPanel(pane);
			map.getContainer().addEventListener('mousemove', this._handleMouseMove);
			map.on('movestart', this._mapMoveStart);
			map.on('moveend', this._mapMoveEnd);
			map.on('as:point-add', onAddPoint.bind(this));
			map.on('as:marker-add', onAddMarker.bind(this));
			map.on('as:marker-remove', onRemoveMarker.bind(this));
			map.on('as:creation-end', onPolygonCreationEnd.bind(this));
			map.on('as:update-polygon', onUpdatePolygon.bind(this));
			map.on('as:update-ghost-points', onUpdateGhostPoints.bind(this));
			map.on('as:dragging-rect-end', onDraggingRectEnd.bind(this));
			return this._container;
		},
		onRemove: function onRemove(map) {
			map.getContainer().removeEventListener('mousemove', this._handleMouseMove);
			map.off('movestart', this._mapMoveStart);
			map.off('moveend', this._mapMoveEnd);
			map.off('as:point-add');
			map.off('as:marker-add');
			map.off('as:marker-remove');
			map.off('as:creation-end');
			map.off('as:update-polygon');
			map.off('as:update-ghost-points');
			map.off('as:dragging-rect-end');
		},
		getMap: function getMap() {
			return this._map;
		},
		onPolygonReady: function onPolygonReady() {
			this.options.onPolygonReady(this.polygon, this);
		},
		onPolygonDblClick: function onPolygonDblClick(ev) {
			this.options.onPolygonDblClick(this.polygon, this, ev);
		},
		addUserHelpPanel: function addUserHelpPanel(pane) {
			var panel = leaflet.DomUtil.create('div', cls('draw-pane-help'));
			panel.setAttribute('id', 'draw-panel-help');
			panel.setAttribute('role', 'tooltip');
			var help = "Define a polygon by clicking of the map to define vertexes" + (leaflet.Browser.mobile ? "." : " or click-and-drag to obtain a rectangular shape.");
			panel.textContent = help;
			pane.appendChild(panel);
		},
		setPhase: function setPhase(phase, forceClear) {
			if (forceClear === void 0) {
				forceClear = false;
			}

			this.phase = phase;
			this.options.active = phase === 'draw';

			if (forceClear || this.phase === 'draw') {
				this.clearGhostMarkers();
				this.clearMarkers();
				this.clearPolygon();
			}

			var pane = this._map.getPane(PANE_NAME);

			var container = pane.parentNode;
			this.options.active ? container.classList.remove('inactive') : container.classList.add('inactive');
		},
		_mapMoveStart: function _mapMoveStart() {
			if (!this.options.active) {
				return;
			}

			this.mapMoving = true;
		},
		_mapMoveEnd: function _mapMoveEnd() {
			var _this = this;

			if (!this.options.active) {
				return;
			}

			var map = this._map;
			requestAnimationFrame(function () {
				_this.mapMoving = false;
			});
			var pane = map.getPane(PANE_NAME);
			var touchMarker = pane.querySelector('.end-selection-area');

			if (touchMarker) {
				var firstMarker = this.markers[0].marker;
				var bbox = touchMarker.getBoundingClientRect();
				var point = map.latLngToContainerPoint(firstMarker.getLatLng());
				setPosition(touchMarker, point, new leaflet.Point(-bbox.width / 2, -bbox.height / 2));
			}

			this.translatePolygon();
		},
		translatePolygon: function translatePolygon() {
			if (this.markers.length === 0) {
				return;
			}

			var map = this._map;
			this.markers.forEach(function (data) {
				data.point = map.latLngToContainerPoint(data.marker.getLatLng());
			});
			this.ghostMarkers.forEach(function (data) {
				data.point = map.latLngToContainerPoint(data.marker.getLatLng());
			});
		},
		hoverClosePoint: function hoverClosePoint(event) {
			if (this.markers.length > 2 && this.closeLine) {
				this.closeLine.removeFrom(this._map);
			}
		},
		outClosePoint: function outClosePoint(event) {
			if (this.closeLine) {
				this.closeLine.addTo(this._map);
			}
		},
		clearMarkers: function clearMarkers() {
			var _this2 = this;

			this.markers.forEach(function (_ref) {
				var marker = _ref.marker;
				marker.removeFrom(_this2._map);
			});
			this.markers = [];
		},
		clearGhostMarkers: function clearGhostMarkers() {
			var _this3 = this;

			this.ghostMarkers.forEach(function (_ref2) {
				var marker = _ref2.marker;
				marker.removeFrom(_this3._map);
			});
			this.ghostMarkers = [];
		},
		clearPolygon: function clearPolygon() {
			this.polygon && this.polygon.removeFrom(this._map);
			this.polygon = null;
			this.closeLine && this.closeLine.removeFrom(this._map);
			this.closeLine = null;
		},
		deactivate: function deactivate() {
			removeEndClickArea(this);
			this.activateButton.classList.remove('active');

			this._map.getContainer().classList.remove('drawing-area');

			this.setPhase('inactive', true);
		},
		_handleMouseMove: function _handleMouseMove(event) {
			if (!this.options.active) {
				return;
			}

			onMouseMove.bind(this)(event);
		}
	});
	var drawAreaSelection = function drawAreaSelection(options) {
		if (options === void 0) {
			options = {};
		}

		return new DrawAreaSelection(options);
	};

	leaflet.Util.extend(leaflet.Control, {
		DrawAreaSelection: DrawAreaSelection,
		drawAreaSelection: drawAreaSelection
	});

	exports.DrawAreaSelection = DrawAreaSelection;
	exports.drawAreaSelection = drawAreaSelection;

})));
//# sourceMappingURL=index.umd.js.map
