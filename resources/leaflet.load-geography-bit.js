/* Make area polygon search */
L.Control.loadGeographyBit = L.Control.extend({        
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
		container.innerHTML = '<div class="leaflet-bar"><form><button class="leaflet-button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-building" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022zM6 8.694 1 10.36V15h5V8.694zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5V15z"/><path d="M2 11h1v1H2v-1zm2 0h1v1H4v-1zm-2 2h1v1H2v-1zm2 0h1v1H4v-1zm4-4h1v1H8V9zm2 0h1v1h-1V9zm-2 2h1v1H8v-1zm2 0h1v1h-1v-1zm2-2h1v1h-1V9zm0 2h1v1h-1v-1zM8 7h1v1H8V7zm2 0h1v1h-1V7zm2 0h1v1h-1V7zM8 5h1v1H8V5zm2 0h1v1h-1V5zm2 0h1v1h-1V5zm0-2h1v1h-1V3z"/></svg></button><div class="control"><input class="place" id="search" name="place" value="" placeholder="Search for a UK area..." type="text" style="border:0;height:30px;display:none;width:15em;max-width:80vw;" /></div></div></form></div>';
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
			var fl = e.target.value[0];
			if(fl){
				if(!letters[fl]){
					letters[fl] = {'loaded':false};
					var url = 'areas/search/'+fl.toUpperCase()+'.tsv';
					fetch(url,{})
					.then(response => { return response.text() })
					.then(tsv => {
						letters[fl].loaded = true;
						letters[fl].data = tsv;
						var lines = tsv.split(/[\n]/);
						for(i = 0; i < lines.length; i++){
							(cols) = lines[i].split(/\t/);
							code = cols[0];
							if(code){
								lookup[code] = {};
								lookup[code].name = cols[1];
								if(code.indexOf("MSOA21CD")==0){
									lookup[code].type = "MSOA";
								}else if(code.indexOf("LAD21CD")==0){
									lookup[code].type = "Local Authority";
								}else if(code.indexOf("WD21CD")==0){
									lookup[code].type = "Ward";
								}else if(code.indexOf("PCON17CD")==0){
									lookup[code].type = "Constituency";
								}
							}
						}
						var items = [];
						for(code in lookup) items.push({'code':code,'name':lookup[code].name,'type':lookup[code].type||""});
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
L.control.loadgeographybit = function(opts){ return new L.Control.loadGeographyBit(opts); };
