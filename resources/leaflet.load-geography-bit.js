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
		container.innerHTML = '<div class="leaflet-bar"><form><button class="leaflet-button"><svg fill="currentColor" version="1.0" viewBox="0 0 16 16" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.045465 0 0 .045465 4.1022 1.6728)"><path d="m14.5 282.13s9.75 0.75 9.25 6.75c0 0 4.25-2.75 5.25-6.5s6 0 6 0 2-3.75 2.25-4.5 20.5 9.75 21.5 10 8.25-15 8.25-15 28.25 8.5 29.5 8.25 0.75-4.5 0.75-4.5l14.25 0.75-1.5-6 12.5 9 14.5-1 7.25 4.75 14-6 1.5 2 4-4.5 7-0.75 2-10.5-11.5 1.75-1.5-6s-8-0.25-7.5-1 10.5-0.75 10.5-0.75l3-5.75s-4.25-1.25-4.5-1.5 7.25 0 7.25 0l3.5-2.25-2.75-3.75 5 1.25s14.75-14 11-23.5-17.5-14.5-23.75-14-5.083 5.751-5.083 5.751-4.167-0.5-5.5-4c0 0 1-3.166 5.5-4.833s-0.501-12.167-2.667-16.167 0.168-2.667 2.334-3.667-2.501-7.834-4.834-12 1.125-4.584 3-6.334-3.5-5.25-6.125-7.375-3.625-11.625-12.5-12-5-28.75-3.75-33.125-4.625-0.5-7.625-12.333-8.333-7.5-11.167-7.833-11 3.167-12.333-0.167 5-2.667 7.333-2.333 1.5-1 2.667-2.833 8.333 6 8-0.333-4.167-6-4.167-6l1.833-2.167s18.833-17 19-24.167 5.833-4.167 5.833-9.167-18.667-8.167-21.667-7.667-6.833-4.167-9-2.667-6 4-7.333 3.167-8.333 1.333-8.167-1 3.333-5.166 4.833-3.833 3.167 0.5 3.167 0.5 3-2.667 3.333-3.5-2.333-1-3.667-1-1.667-0.833-1.167-1.333 19.5-13.333 20-14.167 3.666-5 3.833-7.5-23.5-3.5-23.833-2.167-2.5 3.5-2.5 3.5-0.333-2.833-1-4.667-6.5-8.167-7.5-4.167-1.667 6.5-2.667 6.5-7 2.333 1.667 6c0 0-1.167 3.667-4.333 1s-3.667-3.333-3 0.333l0.167 3.833-3.667-2.5s-2.375 2.417 0.375 4.667c0 0 3 1.875 1.375 3s-2.25 0.25-4.25-1.875-2.625 1.875-1.5 4.25-1.125 1.375-2 0-2.25-4.25-3.25-2.375 1.25 8.25 3.25 10.75 0.875 10.5 0.625 10.875-6.25-1.125-5.625 0.875 6.625 3.375 4.625 5.125-4.5 2.125-6.375 0.125-7.125 1.5-4 5.125 1.125 3.75-1.375 2.625-6.125-2.25-5.875 0.25 0.375 2.875 0.375 2.875-4.25-0.5-3.375 1.5 4.5 0.75 5.25 2.375-1.375 4.875-3.625 5-6.875-0.625-4.25 2.25 11.375 1.125 13.5-2 2.875-4.125 3.5-4.625 3.125-2.375 3.125-2.375l3.752-2.124 0.5 2-5.5 3.75-1.75 3.75-3.625 3.5c0.25 2.5-0.5 8-0.5 8l-5.375 3.25s3.375 0.375 4.5-0.375-3.625 4-3.625 4l2.25 2.25s-4.25 2.25-4.75 6.25-3.5 7.25-4.25 7.75-1.25 3 1 3.125 5-1.5 5-1.5l1.5-4.375 0.875-2.625 1.375-4.625 3.25-2.125 0.375-4-1-3.25 10.875-6.5s-0.375 5.75 0.75 8.375 5.5 3.375 5.5 3.375l-6.75-0.875s-2.375 6.875-2.375 7.5 3.5 7.25 3.5 7.25l-5.5 5.625-5.25 7.5-0.5 4.375s-3.125 0.5-3.5 0.625 5.75 4.875 5.75 4.875l1.625-2.125 5.625 8.25 2-2.625s-0.375-5.25-0.375-5.5 5.5 6.875 5.5 6.875l3.75-0.75s4.5-4.25 6.25-2.25 3.875-2.125 3.875-2.125l3.25 1.125 3.625 0.125-0.75 1.75s-6-1-6.625 1.25-6.625 9.5-6.625 9.5 1.875 2.25 3 5.75-0.625 5.875-0.625 5.875l1.375 1.25 2.5-1.25-0.25 4.625v0.625l2.875 0.875 3.875-4.5 0.875 2.5-2.875 3.75 1.125 1.75-0.625 1.75-4.875-0.75-1 3.625 3.5 2.625-0.125 1.75-5 3.625 0.75 4.25 6.5 4.625-2.25 2.5-4.625-6.125-2 1.875 1.875 2.875-2.125 2.375-1.625-4.5s-3.875-1.875-5-0.25-3.125 2.125-4.25 0.75-2.5-3.25-2.5-3.25-2.125 2.125-2.25 2.5-4.375 0.25-4.375 0.25l1.5-3.25-6-6.375-3.75 3.5 3.625 7.25-4.75 5.75s-4.875 3.125-4.875 2.625 2 4.625 2 4.625l6.875-5 4 5.125 0.125 9.5-11.5 10-5.5-0.625-3.75 4.625-10.125-1.625-0.875 9.125 2.5 1.375 2.375 4.125 5.5 0.375 3-3.375 5.625 0.125 0.875 8.375 4.125-0.375 2.125-2 2.875 0.875 2.125 6.75 5 4.25 4.125-0.625 4.625-4.875 3.25 0.75 2.375 1.25-5.25 4.25-1.875 4.25s0.25 0.625-0.125 0.625-6.5 1.375-6.5 1.375l-8.5-5.375s-8.5 0.5-8.75 0.125-3.875 6.375-3.875 6.375h-3l-1.75-3.25-3.25 3.125 1.5 5-7.75 5.75s-1.875-0.75-2.375-0.75-2.25 3.875-2.25 3.875-4.125 2.125-4 1.875-1.375 3.625-1.375 3.625l-9.125 0.125-3.75 0.5z"/><path d="m0 126.76 10.5 13.375 5.875-0.125 1.125-6.125 5.375-1.125 0.75 6.625 4.125 3.125-1.75 3.5 4.75 1.375 1.375-2.375 4.5 3.25 3-0.375 2.75-5.125 8-0.625 0.75-11.125-5.375 0.875-2.625-1 5.875-5.125-0.375-2.75-3.375-1.625-0.75-4 0.75-5.125-6.375-3.875h-4.25l-1.75 1.625-4.5-1.5-2.375 4.5-3.375-0.625s-2.125-1.375-2.5-1.375-5 8.75-5 8.75l-6.25-0.5 2.125 4.25z"/></g></svg></button><div class="control"><input class="place" id="search" name="place" value="" placeholder="Search for a UK area..." type="text" style="border:0;height:30px;display:none;width:15em;max-width:80vw;" /></div></div></form></div>';
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
						for(code in lookup) items.push({'code':code,'url':'https://open-innovations.github.io/geography-bits/data/'+code+'.geojsonl','name':lookup[code].name,'type':lookup[code].type||""});
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
