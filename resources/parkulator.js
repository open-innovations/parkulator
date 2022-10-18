/**
	Open Innovations static version of Parkulator
	Version 0.4
 */
(function(root){

	var OI = root.OI || {};
	if(!OI.ready){
		OI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

	function Application(){

		if(!this.logSetup) this.logSetup = { 'el': document.getElementById('message') };
		this.title = "Parkulator";
		this.version = "0.4";
		this.logging = (location.search.indexOf('debug=true') >= 0);
		this.log = function(){
			var a,ext;
			// Version 1.1.1
			if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING"){
				a = Array.prototype.slice.call(arguments, 0);
				// Build basic result
				ext = ['%c'+this.title+' '+this.version+'%c: '+a[1],'font-weight:bold;',''];
				// If there are extra parameters passed we add them
				if(a.length > 2) ext = ext.concat(a.splice(2));
				if(console && typeof console.log==="function"){
					if(arguments[0] == "ERROR") console.error.apply(null,ext);
					else if(arguments[0] == "WARNING") console.warn.apply(null,ext);
					else if(arguments[0] == "INFO") console.info.apply(null,ext);
					else console.log.apply(null,ext);
				}
			}
			return this;
		};
		this.message = function(msg,attr){
			if(!attr) attr = {};
			if(!attr.type) attr.type = 'message';
			
			// Update the console
			var txt = msg;
			if(typeof txt==="string"){
				txt = txt.replace(/<[^>]+>/g,'');
			}
			if(txt) this.log(attr.type,txt,attr.extra||'');

			var css = "b5-bg";
			if(attr.type=="ERROR") css = "c12-bg";
			if(attr.type=="WARNING") css = "c14-bg";

			if(!this.logSetup.el){
				this.logSetup.el = document.createElement('div');
				document.body.appendChild(this.logSetup.el);
			}

			this.logSetup.el.innerHTML = '<div class="'+css+'">'+msg+'</div>';
			this.logSetup.el.style.display = (msg ? 'block' : 'none');

			return this;
		};
		this.log('INFO','Initialising');

		// BLAH
		this.config = {
			'parking': {
				'title': 'carparks',
				'color': '#FF6700',
				'comparison': true,
				'filters':[
					'way["amenity"="parking"]',
					'relation["amenity"="parking"]'
				]
			},
			'golf': {
				'title': 'golf courses',
				'color': '#0DBC37',
				'comparison': true,
				'filters':[
					'way["leisure"="golf_course"]',
					'relation["leisure"="golf_course"]'
				]			
			},
			'brownfield': {
				'title': 'brownfield land',
				'color': '#ce906f',
				'comparison': true,
				'filters':[
					'way["landuse"="brownfield"]',
					'relation["landuse"="brownfield"]'
				]			
			},
			'solar': {
				'title': 'solar generators',
				'color': '#F9BC26',
				'comparison': false,
				'filters':[
					'way["generator:source"="solar"]',
					'relation["generator:source"="solar"]'
				]
			},
			'park': {
				'title': 'parks',
				'color': '#67E767',
				'comparison': false,
				'filters':[
					'way["leisure"="park"]',
					'relation["leisure"="park"]',
				]
			}
		};
		var type = "parking";

		var frm = document.createElement('form');

		var div = document.getElementById('place-search');
		div.appendChild(frm);
		div.classList.add('padded');

		var lbl = document.createElement('label');
		lbl.setAttribute('for','typeahead');
		lbl.innerHTML = "Move the map to:";
		frm.appendChild(lbl);
		
		var inp = document.createElement('input');
		inp.setAttribute('type','text');
		inp.setAttribute('placeholder','e.g. Leeds, UK');
		frm.appendChild(inp);
		
		var sel = document.getElementById('type');
		var o,opt;
		for(o in this.config){
			opt = document.createElement('option');
			opt.innerHTML = this.config[o].title;
			opt.setAttribute('value',o);
			if(o==type) opt.setAttribute('selected','selected');
			sel.appendChild(opt);
		}
		sel.addEventListener('change',function(e){
			type = e.target.value;
		});

		//var place = document.getElementById('place');

		var calculate = document.getElementById('calculate');

		this.setGeo = function(lat,lon,city){
			this.map.flyTo([lat,lon],14,{animate:true,duration:0});
			return this;
		};

		// Define a function for scoring how well a string matches
		function getScore(str1,str2,v1,v2,v3){
			var r = 0;
			str1 = str1.toUpperCase();
			str2 = str2.toUpperCase();
			if(str1.indexOf(str2)==0) r += (v1||3);
			if(str1.indexOf(str2)>0) r += (v2||1);
			if(str1==str2) r += (v3||4);
			return r;
		}

		// ISO 3166 country code conversion
		var cc = {'AD':'Andorra','AE':'United Arab Emirates','AF':'Afghanistan','AG':'Antigua and Barbuda','AI':'Anguilla','AL':'Albania','AM':'Armenia','AO':'Angola','AQ':'Antarctica','AR':'Argentina','AS':'American Samoa','AT':'Austria','AU':'Australia','AW':'Aruba','AX':'Åland Islands','AZ':'Azerbaijan','BA':'Bosnia and Herzegovina','BB':'Barbados','BD':'Bangladesh','BE':'Belgium','BF':'Burkina Faso','BG':'Bulgaria','BH':'Bahrain','BI':'Burundi','BJ':'Benin','BL':'Saint Barthélemy','BM':'Bermuda','BN':'Brunei Darussalam','BO':'Bolivia','BQ':'Bonaire, Sint Eustatius and Saba','BR':'Brazil','BS':'Bahamas','BT':'Bhutan','BV':'Bouvet Island','BW':'Botswana','BY':'Belarus','BZ':'Belize','CA':'Canada','CC':'Cocos (Keeling) Islands','CD':'Congo, the Democratic Republic of the','CF':'Central African Republic','CG':'Congo','CH':'Switzerland','CI':'Côte d\'Ivoire','CK':'Cook Islands','CL':'Chile','CM':'Cameroon','CN':'China','CO':'Colombia','CR':'Costa Rica','CU':'Cuba','CV':'Cabo Verde','CW':'Curaçao','CX':'Christmas Island','CY':'Cyprus','CZ':'Czech Republic','DE':'Germany','DJ':'Djibouti','DK':'Denmark','DM':'Dominica','DO':'Dominican Republic','DZ':'Algeria','EC':'Ecuador','EE':'Estonia','EG':'Egypt','EH':'Western Sahara','ER':'Eritrea','ES':'Spain','ET':'Ethiopia','FI':'Finland','FJ':'Fiji','FK':'Falkland Islands (Malvinas)','FM':'Micronesia, Federated States of','FO':'Faroe Islands','FR':'France','GA':'Gabon','GB':'UK','GD':'Grenada','GE':'Georgia','GF':'French Guiana','GG':'Guernsey','GH':'Ghana','GI':'Gibraltar','GL':'Greenland','GM':'Gambia','GN':'Guinea','GP':'Guadeloupe','GQ':'Equatorial Guinea','GR':'Greece','GS':'South Georgia and the South Sandwich Islands','GT':'Guatemala','GU':'Guam','GW':'Guinea-Bissau','GY':'Guyana','HK':'Hong Kong','HM':'Heard Island and McDonald Islands','HN':'Honduras','HR':'Croatia','HT':'Haiti','HU':'Hungary','ID':'Indonesia','IE':'Ireland','IL':'Israel','IM':'Isle of Man','IN':'India','IO':'British Indian Ocean Territory','IQ':'Iraq','IR':'Iran, Islamic Republic of','IS':'Iceland','IT':'Italy','JE':'Jersey','JM':'Jamaica','JO':'Jordan','JP':'Japan','KE':'Kenya','KG':'Kyrgyzstan','KH':'Cambodia','KI':'Kiribati','KM':'Comoros','KN':'Saint Kitts and Nevis','KP':'Korea, Democratic People\'s Republic of','KR':'Korea, Republic of','KW':'Kuwait','KY':'Cayman Islands','KZ':'Kazakhstan','LA':'Lao People\'s Democratic Republic','LB':'Lebanon','LC':'Saint Lucia','LI':'Liechtenstein','LK':'Sri Lanka','LR':'Liberia','LS':'Lesotho','LT':'Lithuania','LU':'Luxembourg','LV':'Latvia','LY':'Libya','MA':'Morocco','MC':'Monaco','MD':'Moldova, Republic of','ME':'Montenegro','MF':'Saint Martin (French part)','MG':'Madagascar','MH':'Marshall Islands','MK':'Macedonia, the former Yugoslav Republic of','ML':'Mali','MM':'Myanmar','MN':'Mongolia','MO':'Macao','MP':'Northern Mariana Islands','MQ':'Martinique','MR':'Mauritania','MS':'Montserrat','MT':'Malta','MU':'Mauritius','MV':'Maldives','MW':'Malawi','MX':'Mexico','MY':'Malaysia','MZ':'Mozambique','NA':'Namibia','NC':'New Caledonia','NE':'Niger','NF':'Norfolk Island','NG':'Nigeria','NI':'Nicaragua','NL':'Netherlands','NO':'Norway','NP':'Nepal','NR':'Nauru','NU':'Niue','NZ':'New Zealand','OM':'Oman','PA':'Panama','PE':'Peru','PF':'French Polynesia','PG':'Papua New Guinea','PH':'Philippines','PK':'Pakistan','PL':'Poland','PM':'Saint Pierre and Miquelon','PN':'Pitcairn','PR':'Puerto Rico','PS':'Palestine, State of','PT':'Portugal','PW':'Palau','PY':'Paraguay','QA':'Qatar','RE':'Réunion','RO':'Romania','RS':'Serbia','RU':'Russian Federation','RW':'Rwanda','SA':'Saudi Arabia','SB':'Solomon Islands','SC':'Seychelles','SD':'Sudan','SE':'Sweden','SG':'Singapore','SH':'Saint Helena, Ascension and Tristan da Cunha','SI':'Slovenia','SJ':'Svalbard and Jan Mayen','SK':'Slovakia','SL':'Sierra Leone','SM':'San Marino','SN':'Senegal','SO':'Somalia','SR':'Suriname','SS':'South Sudan','ST':'Sao Tome and Principe','SV':'El Salvador','SX':'Sint Maarten','SY':'Syrian Arab Republic','SZ':'Swaziland','TC':'Turks and Caicos Islands','TD':'Chad','TF':'French Southern Territories','TG':'Togo','TH':'Thailand','TJ':'Tajikistan','TK':'Tokelau','TL':'Timor-Leste','TM':'Turkmenistan','TN':'Tunisia','TO':'Tonga','TR':'Turkey','TT':'Trinidad and Tobago','TV':'Tuvalu','TW':'Taiwan, Province of China','TZ':'Tanzania','UA':'Ukraine','UG':'Uganda','UM':'US Minor Outlying Islands','US':'USA','UY':'Uruguay','UZ':'Uzbekistan','VA':'Holy See','VC':'Saint Vincent and the Grenadines','VE':'Venezuela','VG':'British Virgin Islands','VI':'Virgin Islands, U.S.','VN':'Viet Nam','VU':'Vanuatu','WF':'Wallis and Futuna','WS':'Samoa','YE':'Yemen','YT':'Mayotte','ZA':'South Africa','ZM':'Zambia','ZW':'Zimbabwe'};

		var _obj = this;

		// Build the main search for places
		this.typeahead = TypeAhead.init(inp,{
			'items': [],
			'max': 8,	// Set a maximum number to list
			'render': function(d){
				// Construct the label shown in the drop down list
				return d.displayname;
			},
			'process': function(city){
				console.log(city);
				// A city has been selected
				fetch(city.file,{'method':'GET'})
				.then(response => { return response.text(); })
				.then(d => {
					var lat,lon,i,line,pop,tz;
					d = d.replace(/\r/,'').split(/[\n]/);
					for(i = 0; i < d.length; i++){
						line = d[i].split(/\t/);
						if(line[0] == city.i){
							lat = parseFloat(line[1]);
							lon = parseFloat(line[2]);
							tz = line[3];
							pop = parseFloat(line[4])*15000;
							i = d.length;	// Leave loop
						}
					}
					_obj.setGeo(lat,lon,city);
					inp.value = city.displayname;
				}).catch(error => {
					_obj.message('Error getting data from '+city.file,{'type':'ERROR','extra':city});
				});
			},
			'rank': function(d,str){
				// Calculate the weight to add to this airport
				var r = 0;
				var words,w;
				if(d){
					words = str.split(/[\s\,]/);
					if(typeof d.name==="string") r += getScore(d.name,str);
					if(typeof d.truename==="string") r += getScore(d.truename,str);
					for(w = 0; w < words.length; w++){
						if(words[w]){
							if(typeof d.name==="string") r += getScore(d.name,words[w]);
							if(typeof d.truename==="string") r += getScore(d.truename,words[w]);
							if(typeof d.country==="string") r += getScore(d.country,words[w]);
						}
					}
					r *= d.n;
				}
				return r;
			}
		});

		inp.addEventListener('focus',function(e){
			e.currentTarget.value = "";
		});

		calculate.addEventListener('click',function(e){
			// Blur the button
			e.target.blur();
			_obj.calculate();
		});
		
		var loading = {};
		// Attach a callback to the 'change' event. This gets called each time the user enters/deletes a character.
		this.typeahead.on('change',{'me':this.typeahead},function(e){
			var name = toPlainASCII(e.target.value.toLowerCase());
			var fl = name[0];
			if(fl && fl.match(/[a-zA-Z\'\`]/i)){
				if(!loading[fl]){
					var file = 'geo/ranked-'+fl+'.tsv';
					var _obj = e.data.me;

					fetch(file,{})
					.then(response => { return response.text(); })
					.then(d => {
						
						var data,l,c,header,cols,datum;
						d = d.replace(/\r/g,'').split(/[\n]/);
						data = new Array(d.length);
						header = ["truename","name","cc","admin1","n"];
						for(l = 0; l < d.length; l++){
							cols = d[l].split(/\t/);
							datum = {};
							for(c = 0; c < cols.length; c++){
								datum[header[c]] = cols[c].replace(/(^\"|\"$)/g,"");
								// Convert numbers
								if(parseFloat(datum[header[c]])+"" == datum[header[c]]) datum[header[c]] = parseFloat(datum[header[c]]);
								datum.id = fl+'-'+l;
								datum.i = l;
								datum.file = 'geo/cities/'+fl+'-'+(Math.floor(l/100))+'.tsv';
								datum.country = (datum.cc && cc[datum.cc] ? cc[datum.cc]:'');
								datum.displayname = datum.truename+(datum.cc=="US" ? ', '+datum.admin1+'':'')+(datum.country ? ', '+datum.country : '');
							}
							data[l] = datum;
						}
						_obj.addItems(data);
					}).catch(error => {
						_obj.message('Unable to load file '+file,{'type':'ERROR','extra':{}});
					});
					loading[fl] = true;
				}
			}
		});

		function toPlainASCII(str){
		
			var map = [
				{'b':'A', 'l':/[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g},
				{'b':'AA','l':/[\uA732]/g},
				{'b':'AE','l':/[\u00C6\u01FC\u01E2]/g},
				{'b':'AO','l':/[\uA734]/g},
				{'b':'AU','l':/[\uA736]/g},
				{'b':'AV','l':/[\uA738\uA73A]/g},
				{'b':'AY','l':/[\uA73C]/g},
				{'b':'B', 'l':/[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
				{'b':'C', 'l':/[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g},
				{'b':'D', 'l':/[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g},
				{'b':'DZ','l':/[\u01F1\u01C4]/g},
				{'b':'Dz','l':/[\u01F2\u01C5]/g},
				{'b':'E', 'l':/[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g},
				{'b':'F', 'l':/[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
				{'b':'G', 'l':/[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g},
				{'b':'H', 'l':/[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g},
				{'b':'I', 'l':/[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g},
				{'b':'J', 'l':/[\u004A\u24BF\uFF2A\u0134\u0248]/g},
				{'b':'K', 'l':/[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g},
				{'b':'L', 'l':/[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g},
				{'b':'LJ','l':/[\u01C7]/g},
				{'b':'Lj','l':/[\u01C8]/g},
				{'b':'M', 'l':/[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
				{'b':'N', 'l':/[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g},
				{'b':'NJ','l':/[\u01CA]/g},
				{'b':'Nj','l':/[\u01CB]/g},
				{'b':'O', 'l':/[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g},
				{'b':'OI','l':/[\u01A2]/g},
				{'b':'OO','l':/[\uA74E]/g},
				{'b':'OU','l':/[\u0222]/g},
				{'b':'P', 'l':/[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
				{'b':'Q', 'l':/[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
				{'b':'R', 'l':/[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g},
				{'b':'S', 'l':/[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g},
				{'b':'T', 'l':/[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g},
				{'b':'TZ','l':/[\uA728]/g},
				{'b':'U', 'l':/[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g},
				{'b':'V', 'l':/[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
				{'b':'VY','l':/[\uA760]/g},
				{'b':'W', 'l':/[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
				{'b':'X', 'l':/[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
				{'b':'Y', 'l':/[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g},
				{'b':'Z', 'l':/[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g},
				{'b':'a', 'l':/[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g},
				{'b':'aa','l':/[\uA733]/g},
				{'b':'ae','l':/[\u00E6\u01FD\u01E3]/g},
				{'b':'ao','l':/[\uA735]/g},
				{'b':'au','l':/[\uA737]/g},
				{'b':'av','l':/[\uA739\uA73B]/g},
				{'b':'ay','l':/[\uA73D]/g},
				{'b':'b', 'l':/[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
				{'b':'c', 'l':/[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g},
				{'b':'d', 'l':/[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g},
				{'b':'dz','l':/[\u01F3\u01C6]/g},
				{'b':'e', 'l':/[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g},
				{'b':'f', 'l':/[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
				{'b':'g', 'l':/[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g},
				{'b':'h', 'l':/[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g},
				{'b':'hv','l':/[\u0195]/g},
				{'b':'i', 'l':/[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g},
				{'b':'j', 'l':/[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
				{'b':'k', 'l':/[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g},
				{'b':'l', 'l':/[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g},
				{'b':'lj','l':/[\u01C9]/g},
				{'b':'m', 'l':/[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
				{'b':'n', 'l':/[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g},
				{'b':'nj','l':/[\u01CC]/g},
				{'b':'o', 'l':/[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g},
				{'b':'oi','l':/[\u01A3]/g},
				{'b':'ou','l':/[\u0223]/g},
				{'b':'oo','l':/[\uA74F]/g},
				{'b':'p','l':/[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
				{'b':'q','l':/[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
				{'b':'r','l':/[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g},
				{'b':'s','l':/[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g},
				{'b':'t','l':/[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g},
				{'b':'tz','l':/[\uA729]/g},
				{'b':'u','l':/[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g},
				{'b':'v','l':/[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
				{'b':'vy','l':/[\uA761]/g},
				{'b':'w','l':/[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
				{'b':'x','l':/[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
				{'b':'y','l':/[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g},
				{'b':'z','l':/[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g}
			];


			for(var i = 0; i < map.length; i++) str = str.replace(map[i].l, map[i].b);

			return str;
		}

		// Set drag/drop events
		function dropOver(evt){
			evt.stopPropagation();
			evt.preventDefault();
			this.classList.add('drop');
			this.classList.remove('loaded');
		}
		function dragOff(){
			this.classList.remove('drop');
		}
		function dropHandler(ev) {
			var item,blob,reader,i,source;
			this.classList.remove('drop');
			// Prevent default behavior (Prevent file from being opened)
			ev.preventDefault();

			if(ev.dataTransfer.items){
				for(i = 0; i < ev.dataTransfer.items.length; i++){
					item = ev.dataTransfer.items[i];
					blob = item.getAsFile();
					reader = new FileReader();
					reader.onload = function(event){
						var geojson = JSON.parse(event.target.result);
						// If the result seems to be GeoJSON then set the boundary
						if(geojson.type == "FeatureCollection" && geojson.features.length > 0) _obj.setBoundary(geojson);
						else if(geojson.type == "GeometryCollection" && geojson.geometries.length > 0) _obj.setBoundary(geojson);
						else if(geojson.type == "Feature" && geojson.geometry.type=="Polygon"){
							geojson = {'type':'FeatureCollection','features':[geojson]};
							_obj.setBoundary(geojson);
						}
					};
					source = reader.readAsBinaryString(blob);
				}
			}
		}
		// Setup the dnd listeners.
		var dropZone = document.getElementById('map');
		dropZone.addEventListener('dragover', dropOver, false);
		dropZone.addEventListener('dragout', dragOff, false);
		dropZone.addEventListener('drop', dropHandler, false);


		// Add a simple Polygon in a GeoJSON structure as a boundary
		this.setBoundary = function(geojson){
			var coord,i,geo,feature;

			// Cope with different types of GeoJSON (e.g. http://polygons.openstreetmap.fr/get_geojson.py?id=118362&params=0)
			if(geojson.type == "GeometryCollection"){
				var features = [];
				for(i = 0; i < geojson.geometries.length; i++) features.push({'geometry':geojson.geometries[i]});
				geojson = {"type":"FeatureCollection","features":features};
			}

			feature = geojson.features[0];

			if(feature.geometry.type === "MultiPolygon"){
				// Find largest polyon
				var max_area_polygon;
				var max_area = 0 ;
				var polygon,area;
				for(var poly in (feature.geometry.coordinates)){                              
					polygon = turf.polygon((feature.geometry.coordinates)[poly]);
					area = turf.area(polygon); 

					if(area > max_area){
						max_area = area;
						max_area_polygon = polygon; // polygon with the largest area
					}
				}
				feature = max_area_polygon;
				this.message('Using largest polygon',{'type':'WARNING'});
			}
			
			// If there are more than 500 points we simplify the polygon
			if(feature.geometry.coordinates[0].length > 500){
				feature = turf.simplify(feature,{tolerance: 0.002, highQuality: true});
			}

			coord = feature.geometry.coordinates[0];				
			this.areaSelection.startPolygon();
			for(i = 0; i < coord.length; i++){
				this.areaSelection.addPoint({'latitude':coord[i][1],'longitude':coord[i][0]});
			}
			this.areaSelection.endPolygon();
			geo = L.geoJson(feature, {});
			this.map.fitBounds(geo.getBounds());

			return this;
		};
		
		// e.g. https://open-innovations.github.io/geography-bits/data/LAD21CD/E08000035.geojsonl
		this.loadArea = function(url){
			fetch(url,{})
			.then(response => { return response.json(); })
			.then(feature => {
				_obj.setBoundary({'type':'FeatureCollection','features':[feature]});
			}).catch(error => {
				_obj.message('Unable to load URL '+url,{'type':'ERROR','extra':{}});
			});
			return this;
		};

		this.computePolygons = function(geojson){
			this.geojson = geojson;
			this.log('INFO','computePolygons',geojson);
			var polygons = [];
			var i,p,featureCollection;
			for(i = 0; i < geojson.features.length; i++){

				if(geojson.features[i].geometry.type==="Polygon"){

					polygons.push(geojson.features[i]);

				}else if(geojson.features[i].geometry.type==="MultiPolygon"){
					
					for(p = 0; p < geojson.features[i].geometry.coordinates.length; p++) polygons.push(turf.polygon(geojson.features[i].geometry.coordinates[p]));

				}else{

					console.error('bad');

				}
			}
			
			if(!polygons || polygons.length==0){
				this.message('No '+this.config[type].title+' found in this area.',{'type':'ERROR'});
				return this;
			}

			featureCollection = turf.dissolve(turf.featureCollection(polygons));

			/*
			// Show the original polygons
			L.geoJSON(geojson, {
				style: function (feature) {
					return {color: '#2254F4'};
				}
			}).addTo(this.map);
			*/
			/*
			// Show the dissolved polygons
			L.geoJSON(featureCollection, {
				style: function (feature) {
					return {color: 'red'};
				}
			}).addTo(this.map);
			*/
			if(!this.areaSelection.polygon){
				this.message('No area has been selected!',{'type':'ERROR'});
				return this;
			}

			var drawnBoxGeojson = this.areaSelection.polygon.toGeoJSON();

			/*
			// Show the drawn box
			L.geoJSON(drawnBoxGeojson, {
				style: function (feature) {
					return {color: 'yellow'};
				}
			}).addTo(this.map);*/

			var intersectList = [];
			var conflict;
			for(i = 0; i < featureCollection.features.length; i++){
				// Check that the particular parking polygon intercepts with the drawn box.
				try{
					conflict = turf.intersect(featureCollection.features[i], drawnBoxGeojson);
				}catch(e){
					console.error(e);
				}

				// Two shapes overlap.
				if(conflict != null){
					// Add this area to the intersection
					intersectList.push(conflict);
				}
			}
			
			// Create a feature group from the intersecting layers.
			var intersectionGroup = turf.featureCollection(intersectList);

			var intersectArea = turf.area(intersectionGroup);

			var color = this.config[type].color||'#FF6700';
			if(!this.layerGroup){
				this.layerGroup = new L.LayerGroup();
				this.layerGroup.addTo(this.map);
			}
			if(this.layerIntersect){
				this.layerGroup.removeLayer(this.layerIntersect);
				delete this.layerIntersect;
			}


			// Add the dissolved polygons within the selected area in orange
			this.layerIntersect = L.geoJSON(intersectionGroup, {
				style: function (feature) {
					return {color: color};
				}
			});
			this.layerGroup.addLayer(this.layerIntersect);

			// Area of drawn box shape.
			var boxArea = turf.area(drawnBoxGeojson);

			// Percentage of area occupied by parking.
			var percentageArea = ((intersectArea / boxArea) * 100).toFixed(2);

			// Center of the rectangle drawn by the user/
			var rectangleCenter = (turf.center(drawnBoxGeojson).geometry.coordinates);

			var intersectInHectares = (intersectArea / 10000).toFixed(2);

			// Only small percentage of parking
			var content = "<strong>" + percentageArea + "% of this area</strong> (" + intersectInHectares + " hectares) is occupied by " + this.config[type].title + ".";
			if(this.config[type].comparison){
				content += " On this we could build:";
				content += "<br/><strong>" + Number((intersectInHectares * 100).toFixed(0)).toLocaleString() + " homes</strong> at London density;";
				content += "<br/><strong>" + Number((intersectInHectares * 300).toFixed(0)).toLocaleString() + " homes</strong> at Paris density;";
				content += "<br/><strong>" + Number((intersectInHectares * 500).toFixed(0)).toLocaleString() + " homes</strong> at Barcelona density;";
				content += "<br /><strong>" + Number((intersectInHectares / 0.65).toFixed(0)).toLocaleString() + " parks</strong> like <a class='popuplink' target='_blank' href='http://www.bing.com/images/search?q=park%20square%20leeds&qs=n&form=QBIR&pq=park%20square%20leeds&sc=6-17&sp=-1&sk='>Park Square, Leeds</a>.";

				/*
				// Calculate solar insolation https://en.wikipedia.org/wiki/Direct_insolation for the best case scenario
				// Get the best possible zenith angle
				// Between the Tropic of Cancer and Tropic of Capricorn it'll be 0
				// Closer to the poles will be the difference between latitude and the tilt of the Earth
				var earthtilt = 23.43633;
				var latitude = rectangleCenter[1];
				var zenithangle = Math.max(0,Math.abs(latitude) - earthtilt);
				// Solar insolation is in W/m^2
				var Id = 1353 * Math.pow(0.7, Math.pow((1/Math.cos((zenithangle) * Math.PI/180)), 0.678));
				// Find total Watts by multiplying by area in square metres (a hectare is 10000m^2)
				var Watts = Id * (intersectInHectares*10000);
				*/

				// Simpler calculation
				// https://www.solarproguide.com/how-much-power-can-1-acre-of-solar-panels-produce/ mentions a solar farm covering 10,000 acres and generating 2,245 MW i.e. 0.2245 MW per acres
				// The HoC estimate 25 acres for 5MW
				var MW = (intersectArea * 0.00024710538146717) * 0.2;
				var homes = Math.round(Math.round(MW*300)/100)*100;
				content += "<br />This area could generate as much as <strong>"+Math.round(MW)+"MW</strong> (equivalent to "+(homes.toLocaleString())+" homes) from solar power<sup><a href=\"#solar-estimate\" style=\"text-decoration:none;color: inherit;\">&dagger;</a></sup>.";
			}

			// Create a popup at the center of the rectangle to display the occupancy of the area:
			var parkingPopup = L.popup();
			parkingPopup.setContent(content);
			parkingPopup.setLatLng([this.areaSelection.polygon.getBounds()._northEast.lat, rectangleCenter[0]]); //calculated based on the e.layertype
			parkingPopup.openOn(this.map);

			return this;
		};

		this.getFromFile = function(file){
			
			this.message('Loading data... please wait<br /><svg version="1.1" width="64" height="64" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.11601 0 0 .11601 -49.537 -39.959)"><path d="m610.92 896.12m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="-0.83333s" repeatCount="indefinite" /></path><path d="m794.82 577.6m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="-0.6666s" repeatCount="indefinite" /></path><path d="m1162.6 577.6m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="-0.5s" repeatCount="indefinite" /></path><path d="m1346.5 896.12m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="-0.3333s" repeatCount="indefinite" /></path><path d="m1162.6 1214.6m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="-0.1666s" repeatCount="indefinite" /></path><path d="m794.82 1214.6m183.9-106.17-183.9-106.17-183.9 106.17v212.35l183.9 106.17 183.9-106.17z" fill="black"><animate attributeName="opacity" values="1;0;0" keyTimes="0;0.7;1" dur="1s" begin="0s" repeatCount="indefinite" /></path></g></svg>',{'type':'INFO'});

			return fetch(file,{'method':'GET'})
			.then(response => { return response.json(); })
			.then(json => {
				var i,n,node,features,feature,r,rways,mpoly,outer,inner,m,w,poly,cpoly;

				_obj.message('');

				// Update the time stamp
				_obj.lastupdate = json.osm3s.timestamp_osm_base.replace('T'," ");
				_obj.map.attributionControl.setPrefix("OSM data last updated: "+(new Date(_obj.lastupdate)).toLocaleString());

				var ways = [];
				var nodes = {};
				var relations = [];
				for(i = 0; i < json.elements.length; i++){
					if(json.elements[i].type==="way") ways.push(json.elements[i]);
					if(json.elements[i].type==="node") nodes['node-'+json.elements[i].id] = {'lat':json.elements[i].lat,'lon':json.elements[i].lon};
					if(json.elements[i].type==="relation") relations.push(json.elements[i]);
				}

				features = [];
				for(i = 0; i < ways.length; i++){
					feature = {'type':'Feature','properties':{},'geometry':{'type':'Polygon','coordinates':[[]]}};
					
					if(ways[i].nodes[0]!=ways[i].nodes[ways[i].nodes.length-1]){
						this.log('WARNING','Way '+i+' does not have the same start and end',ways[i]);
					}else{
						for(n = 0; n < ways[i].nodes.length; n++){
							node = 'node-'+ways[i].nodes[n];
							if(nodes[node] && typeof nodes[node].lon==="number") feature.geometry.coordinates[0].push([nodes[node].lon, nodes[node].lat]);
							else console.warn('Bad node '+i+' / '+n,nodes[node]);
						}
						features.push(feature);
					}
				}

				// Process relations as potential MultiPolygons
				// A relation consists of several members - we'll only deal with ways
				for(r = 0; r < relations.length; r++){
					feature = {'type':'Feature','properties':{},'geometry':{'type':'MultiPolygon','coordinates':[]}};

					rways = [];
					mpoly = [[]];
					outer = [];
					inner = [];
					for(m = 0; m < relations[r].members.length; m++){
						if(relations[r].members[m].type=="way"){
							for(w = 0; w < ways.length; w++){
								if(relations[r].members[m].ref == ways[w].id){
									if(relations[r].members[m].role=="outer"){
										for(n = 0; n < ways[w].nodes.length; n++){
											outer.push(ways[w].nodes[n]);
											mpoly[0].push(ways[w].nodes[n]);
										}
									}
									if(relations[r].members[m].role=="inner"){
										if(mpoly.length == 1) mpoly.push([]);
										for(n = 0; n < ways[w].nodes.length; n++){
											inner.push(ways[w].nodes[n]);
											mpoly[1].push(ways[w].nodes[n]);
										}
									}

								}
							}
						}
					}
					mpoly = [];
					// Loop over outer
					poly = [];
					for(i = 0; i < outer.length; i++){
						// Add the node to the polygon
						poly.push(outer[i]);
						// If the polygon is more than 2 nodes and the last node joins up with the first node, we start a new polygon
						if(poly.length > 2 && poly[0]==poly[poly.length-1]){
							cpoly = [];
							for(p = 0; p < poly.length; p++){
								node = 'node-'+poly[p];
								if(nodes[node] && typeof nodes[node].lon==="number") cpoly.push([nodes[node].lon, nodes[node].lat]);
								else console.warn('Bad node '+p+' / '+n,nodes[node]);
							}
							if(cpoly.length < 4){
								this.log('WARNING','poly (outer) has too few nodes to make a polygon',cpoly);
							}else{
								mpoly.push([cpoly]);
							}
							poly = [];
						}
					}
					var p = 0;
					poly = [];
					for(i = 0; i < inner.length; i++){
						poly.push(inner[i]);
						if(poly.length > 2 && poly[0]==poly[poly.length-1]){
							cpoly = [];
							for(p = 0; p < poly.length; p++){
								node = 'node-'+poly[p];
								if(nodes[node] && typeof nodes[node].lon==="number") cpoly.push([nodes[node].lon, nodes[node].lat]);
								else console.warn('Bad node '+p+' / '+n,nodes[node]);
							}
							if(cpoly.length < 4){
								this.log('WARNING','poly (inner) has too few nodes to make a polygon',cpoly);
							}else{
								mpoly[0].push(cpoly);
							}
							poly = [];
						}
					}

					feature.geometry.coordinates = mpoly;
					features.push(feature);
				}

				_obj.computePolygons({ "type": "FeatureCollection", "features": features });

			}).catch(error => {
				this.message('Error getting data',{'type':'ERROR','extra':error});
			});
		};

		this.getFromOverpass = function(b){
			
			var qs,i,a,bbox,url;
			a = this.config[type].filters;
			bbox = b._southWest.lat + ',' + b._southWest.lng + ',' + b._northEast.lat + ',' + b._northEast.lng;

			if(!b) b = this.map.getBounds();
			qs = encodeURIComponent("[out:json][timeout:25];(");
			for(i = 0; i < a.length; i++) qs += ''+encodeURIComponent(a[i] + '(' + bbox + ');');
			qs += encodeURIComponent(");out body;>;out skel qt;");

			url = "https://overpass-api.de/api/interpreter?data=" + qs;
			
			this.log('INFO','Getting Overpass API result: '+decodeURIComponent(url));

			this.getFromFile(url);

			return this;
		};

		this.calculate = function(){
			this.log('INFO','calculate',this.areaSelection.polygon);
			if(this.areaSelection.polygon){
				this.message('');
				this.getFromOverpass(this.areaSelection.polygon.getBounds());
			}else{
				this.message('No area has been selected on the map. Please use the <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" vector-effect="non-scaling-stroke" class="bi bi-bounding-box" viewBox="0 0 16 16"><path d="M5 2V0H0v5h2v6H0v5h5v-2h6v2h5v-5h-2V5h2V0h-5v2H5zm6 1v2h2v6h-2v2H5v-2H3V5h2V3h6zm1-2h3v3h-3V1zm3 11v3h-3v-3h3zM4 15H1v-3h3v3zM1 4V1h3v3H1z"/></svg> tool to draw an area or <svg width="16" height="16" fill="currentColor" version="1.0" viewBox="0 0 16 16" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.045465 0 0 .045465 4.1022 1.6728)"><path d="m14.5 282.13s9.75 0.75 9.25 6.75c0 0 4.25-2.75 5.25-6.5s6 0 6 0 2-3.75 2.25-4.5 20.5 9.75 21.5 10 8.25-15 8.25-15 28.25 8.5 29.5 8.25 0.75-4.5 0.75-4.5l14.25 0.75-1.5-6 12.5 9 14.5-1 7.25 4.75 14-6 1.5 2 4-4.5 7-0.75 2-10.5-11.5 1.75-1.5-6s-8-0.25-7.5-1 10.5-0.75 10.5-0.75l3-5.75s-4.25-1.25-4.5-1.5 7.25 0 7.25 0l3.5-2.25-2.75-3.75 5 1.25s14.75-14 11-23.5-17.5-14.5-23.75-14-5.083 5.751-5.083 5.751-4.167-0.5-5.5-4c0 0 1-3.166 5.5-4.833s-0.501-12.167-2.667-16.167 0.168-2.667 2.334-3.667-2.501-7.834-4.834-12 1.125-4.584 3-6.334-3.5-5.25-6.125-7.375-3.625-11.625-12.5-12-5-28.75-3.75-33.125-4.625-0.5-7.625-12.333-8.333-7.5-11.167-7.833-11 3.167-12.333-0.167 5-2.667 7.333-2.333 1.5-1 2.667-2.833 8.333 6 8-0.333-4.167-6-4.167-6l1.833-2.167s18.833-17 19-24.167 5.833-4.167 5.833-9.167-18.667-8.167-21.667-7.667-6.833-4.167-9-2.667-6 4-7.333 3.167-8.333 1.333-8.167-1 3.333-5.166 4.833-3.833 3.167 0.5 3.167 0.5 3-2.667 3.333-3.5-2.333-1-3.667-1-1.667-0.833-1.167-1.333 19.5-13.333 20-14.167 3.666-5 3.833-7.5-23.5-3.5-23.833-2.167-2.5 3.5-2.5 3.5-0.333-2.833-1-4.667-6.5-8.167-7.5-4.167-1.667 6.5-2.667 6.5-7 2.333 1.667 6c0 0-1.167 3.667-4.333 1s-3.667-3.333-3 0.333l0.167 3.833-3.667-2.5s-2.375 2.417 0.375 4.667c0 0 3 1.875 1.375 3s-2.25 0.25-4.25-1.875-2.625 1.875-1.5 4.25-1.125 1.375-2 0-2.25-4.25-3.25-2.375 1.25 8.25 3.25 10.75 0.875 10.5 0.625 10.875-6.25-1.125-5.625 0.875 6.625 3.375 4.625 5.125-4.5 2.125-6.375 0.125-7.125 1.5-4 5.125 1.125 3.75-1.375 2.625-6.125-2.25-5.875 0.25 0.375 2.875 0.375 2.875-4.25-0.5-3.375 1.5 4.5 0.75 5.25 2.375-1.375 4.875-3.625 5-6.875-0.625-4.25 2.25 11.375 1.125 13.5-2 2.875-4.125 3.5-4.625 3.125-2.375 3.125-2.375l3.752-2.124 0.5 2-5.5 3.75-1.75 3.75-3.625 3.5c0.25 2.5-0.5 8-0.5 8l-5.375 3.25s3.375 0.375 4.5-0.375-3.625 4-3.625 4l2.25 2.25s-4.25 2.25-4.75 6.25-3.5 7.25-4.25 7.75-1.25 3 1 3.125 5-1.5 5-1.5l1.5-4.375 0.875-2.625 1.375-4.625 3.25-2.125 0.375-4-1-3.25 10.875-6.5s-0.375 5.75 0.75 8.375 5.5 3.375 5.5 3.375l-6.75-0.875s-2.375 6.875-2.375 7.5 3.5 7.25 3.5 7.25l-5.5 5.625-5.25 7.5-0.5 4.375s-3.125 0.5-3.5 0.625 5.75 4.875 5.75 4.875l1.625-2.125 5.625 8.25 2-2.625s-0.375-5.25-0.375-5.5 5.5 6.875 5.5 6.875l3.75-0.75s4.5-4.25 6.25-2.25 3.875-2.125 3.875-2.125l3.25 1.125 3.625 0.125-0.75 1.75s-6-1-6.625 1.25-6.625 9.5-6.625 9.5 1.875 2.25 3 5.75-0.625 5.875-0.625 5.875l1.375 1.25 2.5-1.25-0.25 4.625v0.625l2.875 0.875 3.875-4.5 0.875 2.5-2.875 3.75 1.125 1.75-0.625 1.75-4.875-0.75-1 3.625 3.5 2.625-0.125 1.75-5 3.625 0.75 4.25 6.5 4.625-2.25 2.5-4.625-6.125-2 1.875 1.875 2.875-2.125 2.375-1.625-4.5s-3.875-1.875-5-0.25-3.125 2.125-4.25 0.75-2.5-3.25-2.5-3.25-2.125 2.125-2.25 2.5-4.375 0.25-4.375 0.25l1.5-3.25-6-6.375-3.75 3.5 3.625 7.25-4.75 5.75s-4.875 3.125-4.875 2.625 2 4.625 2 4.625l6.875-5 4 5.125 0.125 9.5-11.5 10-5.5-0.625-3.75 4.625-10.125-1.625-0.875 9.125 2.5 1.375 2.375 4.125 5.5 0.375 3-3.375 5.625 0.125 0.875 8.375 4.125-0.375 2.125-2 2.875 0.875 2.125 6.75 5 4.25 4.125-0.625 4.625-4.875 3.25 0.75 2.375 1.25-5.25 4.25-1.875 4.25s0.25 0.625-0.125 0.625-6.5 1.375-6.5 1.375l-8.5-5.375s-8.5 0.5-8.75 0.125-3.875 6.375-3.875 6.375h-3l-1.75-3.25-3.25 3.125 1.5 5-7.75 5.75s-1.875-0.75-2.375-0.75-2.25 3.875-2.25 3.875-4.125 2.125-4 1.875-1.375 3.625-1.375 3.625l-9.125 0.125-3.75 0.5z"/><path d="m0 126.76 10.5 13.375 5.875-0.125 1.125-6.125 5.375-1.125 0.75 6.625 4.125 3.125-1.75 3.5 4.75 1.375 1.375-2.375 4.5 3.25 3-0.375 2.75-5.125 8-0.625 0.75-11.125-5.375 0.875-2.625-1 5.875-5.125-0.375-2.75-3.375-1.625-0.75-4 0.75-5.125-6.375-3.875h-4.25l-1.75 1.625-4.5-1.5-2.375 4.5-3.375-0.625s-2.125-1.375-2.5-1.375-5 8.75-5 8.75l-6.25-0.5 2.125 4.25z"/></g></svg> / <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-globe" viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/></svg> to search for administrative areas.',{'type':'WARNING'});
			}
		};

		this.setupMap = function(){
			
			// Clear loader
			document.getElementById('map').innerHTML = "";
			// Set up map
			this.map = L.map('map').setView([53.8, -1.55], 14);
			this.map.createPane('labels');
			this.map.getPane('labels').style.zIndex = 650;
			this.map.getPane('labels').style.pointerEvents = 'none';
			// Add tile layers
			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
				attribution: '',
				pane: 'labels'
			}).addTo(this.map);
			L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
				attribution: 'Tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
				subdomains: 'abcd',
				maxZoom: 19
			}).addTo(this.map);

			this.areaSelection = new window.leafletAreaSelection.DrawAreaSelection({
				'position': 'topleft',
				'onPolygonReady':function(a){
					//_obj.getFromOverpass(a.getBounds());
				},
				'onPolygonDblClick':function(a){
					console.log('onPolygonDblClick',a);
				}
			});
			this.map.addControl(this.areaSelection);

			// Add control for loading geography bit
			L.control.loadgeographybit({
				'position': 'topleft',
				'process': function(d){
					if(d.url){
						_obj.loadArea(d.url);
					}
				}
			}).addTo(this.map);
			
			// Add control for loading geography bit
			L.control.loadosmarea({
				'position': 'topleft',
				'process': function(d){
					if(d.url){
						_obj.loadArea(d.url);
					}
				}
			}).addTo(this.map);
			
			if(location.search.indexOf('area=')>0){
				var qs = location.search.replace(/^\?/,"");
				var bits = qs.split("&");
				qs = {};
				for(var b = 0; b < bits.length; b++){
					bit = bits[b].split(/=/);
					qs[bit[0]] = bit[1];
				}
				if(qs.area){
					var url = "https://open-innovations.github.io/geography-bits/data/"+qs.area+".geojsonl";
					this.loadArea(url);
				}
			}
		};
		
		this.setupMap();

		return this;
	}

	OI.Application = Application;

	root.OI = OI||root.OI||{};
	
})(window || this);

OI.ready(function(){
	
	app = new OI.Application({});
	app.setGeo(53.7965, -1.5478,{"displayname":"Leeds, UK","n":30});

});

/*!
	Typeahead search v0.1.8
*/
!function(e){void 0===e.TypeAhead&&(e.TypeAhead=new function(){return this.version="0.1.8",this.init=function(e,t){return new function(e,t){if(t||(t={}),"string"==typeof e&&(e=document.querySelector(e)),!e)return console.warn("No valid element provided"),this;var n,o,i=this,a={},r=t.items||[],s="boolean"==typeof t.inline&&t.inline;function l(){return n?n.querySelectorAll("li"):[]}function f(o){o&&(i.input=e,"function"==typeof t.process?t.process.call(i,r[o]):console.log(r[o])),n&&(n.innerHTML=""),s&&(e.style.marginBottom="0px")}function c(){for(var e=l(),t=0;t<e.length;t++)if(e[t].classList.contains("selected"))return f(e[t].getAttribute("data-id"))}return this.update=function(){var t=document.createEvent("HTMLEvents");return t.initEvent("keyup",!1,!0),e.dispatchEvent(t),this},this.on=function(u,d,p){return e?("change"==u?(a[u]||(a[u]=[],e.addEventListener("keyup",function(d){d.preventDefault(),d.stopPropagation(),40==d.keyCode||38==d.keyCode?function(e){for(var t,n=l(),o=-1,i=0;i<n.length;i++)n[i].classList.contains("selected")&&(o=i);t=o,40==e?o++:o--,o<0&&(o=n.length-1),o>=n.length&&(o=0),t>=0&&n[t].classList.remove("selected"),n[o].classList.add("selected")}(d.keyCode):13==d.keyCode?c():(function(c,u,d){var p,h,y,v,g,m,k;if(v=c.toUpperCase(),y=[],v){for(h=0;h<r.length;h++)m={rank:0,key:h,value:r[h]},"function"==typeof t.rank?m.rank=t.rank(r[h],c):(0==r[h].toUpperCase().indexOf(v)&&(m.rank+=3),r[h].toUpperCase().indexOf(v)>0&&(m.rank+=1)),y.push(m);y=function(e,t){return e.sort(function(e,n){return e[t]<n[t]?1:-1})}(y,"rank")}if(n||(e.parentElement.style.position="relative",(n=document.createElement("div")).classList.add("typeahead-results"),n.style.top=e.offsetTop+e.offsetHeight+"px",n.style.left=e.offsetLeft+"px",n.style.maxWidth=e.parentElement.offsetWidth-e.offsetLeft-parseInt(window.getComputedStyle(e.parentElement,null).getPropertyValue("padding-right"))+"px",n.style.position="absolute",o.style.position="relative",e.insertAdjacentElement("afterend",n)),g="",y.length>0){for(p="number"==typeof t.max?Math.min(y.length,t.max):y.length,g="<ol>",h=0;h<p;h++)y[h].rank>0&&(g+='<li data-id="'+y[h].key+'" '+(0==h?' class="selected"':"")+'><a tabindex="0" href="#" class="name item">'+("function"==typeof t.render?t.render(r[y[h].key]):r[y[h].key])+"</a></li>");g+="</ol>"}n.innerHTML=g,s&&(e.style.marginBottom=n.offsetHeight+"px");var b=l();for(h=0;h<b.length;h++)b[h].addEventListener("click",function(e){e.preventDefault(),e.stopPropagation(),f(this.getAttribute("data-id"))});if(a[d])for(u._typeahead=i,h=0;h<a[d].length;h++)k=a[d][h],u.data=k.data||{},"function"==typeof k.fn&&k.fn.call(k.data.this||this,u)}(this.value,d,u),"function"==typeof t.endsearch&&t.endsearch(this.value))}),e.addEventListener("blur",function(e){"function"==typeof t.blur&&t.blur()})),a[u].push({fn:p,data:d})):"blur"==u?console.log("blur"):console.warn("No event of type "+u),this):(console.warn("Unable to attach event "+u),this)},this.off=function(e,t){if(a[e])for(var n=0;n<a[e].length;n++)a[e][n].fn==t&&a[e].splice(n,1)},e.form&&(o=e.form).addEventListener("submit",function(e){e.preventDefault(),e.stopPropagation(),c()},!1),e&&e.setAttribute("autocomplete","off"),this.addItems=function(e){r||(r=[]),r=r.concat(e)},this.clearItems=function(){r=[]},this.on("change",{},function(e){}),this}(e,t)},this})}(window||this);
