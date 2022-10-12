/* Make area polygon search */
L.Control.loadOSMArea = L.Control.extend({        
	options: {
		position: 'topleft'
	},

	onAdd: function(map){

		function trigger(el, eventType) {
			if(typeof eventType === 'string' && typeof el[eventType] === 'function') {
				el[eventType]();
			}else{
				const event = eventType === 'string' ? new Event(eventType, {bubbles: true}) : eventType;
				el.dispatchEvent(event);
			}
		}
		function setState(state){
			if(typeof state!=="boolean") state = !container.classList.contains('open'); 
			if(state){
				container.classList.add('open');
				inp.style.display = '';
				inp.focus();
			}else{
				container.classList.remove('open');
				inp.style.display = 'none';
				btn.focus();
				inp.value = "";
			}			
		}

		var container = L.DomUtil.create('div', 'leaflet-control leaflet-control-search');
		container.innerHTML = '<div class="leaflet-bar"><form><button class="leaflet-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/></svg></button><div class="control"><input class="place" id="search" name="place" value="" placeholder="Search for an area..." type="text" style="border:0;height:30px;display:none;width:15em;max-width:80vw;" /></div></div></form></div>';
		var btn = container.querySelector('button');
		var inp = container.querySelector('input');
		
		// Stop map dragging on the element
		inp.addEventListener('mousedown', function(){ map.dragging.disable(); });
		inp.addEventListener('mouseup', function(){ map.dragging.enable(); });
		
		btn.addEventListener('click',setState);
		btn.addEventListener('dblclick', function(event){
			event.stopPropagation();
		});

		var letters = {};
		var lookup = {};

		var opts = this.options;

		this.areaSearch = TypeAhead.init(inp,{
			'items': [],
			'rank': function(d,str){
				// Calculate a weighting
				var r = 0;
				// If the name starts with the string add 3
				if(d.name.toUpperCase().indexOf(str.toUpperCase())==0) r += 3;
				// If the name includes the string add 1
				if(d.name.toUpperCase().indexOf(str.toUpperCase())>0) r += 1;
				// If the name matches the start of the string we add more to the score if the remaining letters are few
				if(d.name.toUpperCase().indexOf(str.toUpperCase())==0){
					restofstr = d.name.toUpperCase().replace(new RegExp("^"+str.toUpperCase()),"");
					r += Math.max(0,6-restofstr.length);
					// Add based on the level
					r += (10-d.level)/5;
					// Scale based on population
					r *= (d.population)/1e6
				}
				return r;
			},
			'render': function(d){
				return d.name+(d.type ? ' ('+d.type+')' : '');
			},
			'process': function(d){
				if(typeof opts.process==="function") opts.process.call(this,d);
				setState(false);
			}
		});

		this.areaSearch.on('change',{this:this},function(e){
			var fl = e.target.value.replace(/[\'\`\-\. ]/,"").toLowerCase().substr(0,2);
			if(fl && fl.length==2){
				if(!letters[fl]){
					letters[fl] = {'loaded':false};
					var url = 'areas/osm/'+fl+'.tsv';
					fetch(url,{})
					.then(response => { return response.text() })
					.then(tsv => {
						letters[fl].loaded = true;
						letters[fl].data = tsv;
						var items = [];
						var lines = tsv.split(/[\n]/);
						for(i = 0; i < lines.length; i++){
							(cols) = lines[i].split(/\t/);
							dir = Math.floor(parseInt(cols[2])/1e5)*100000;
							items.push({'code':cols[2],'url':'https://raw.githubusercontent.com/open-innovations/geography-bits-osm/main/data/OSM/'+dir+'/'+cols[2]+'.geojson','name':cols[0]+(cols[1] ? ", "+cols[1] : ""),'population':parseInt(cols[4]),'level':cols[3]});
						}
						this.areaSearch.clearItems();
						this.areaSearch.addItems(items);
					}).catch(error => {
						console.error('Unable to load URL '+url);
					});
				}
			}
		});

		return container;
	}
});
L.control.loadosmarea = function(opts){ return new L.Control.loadOSMArea(opts); };
