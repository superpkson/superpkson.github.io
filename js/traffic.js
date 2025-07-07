var getLocalStorage = function (key, api) {
	return new Promise(resolve => {
		let value = localStorage.getItem(key);
		
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate());
		expirationDate.setHours(5);
		expirationDate.setMinutes(0);
		expirationDate.setSeconds(0);
			
		if (value == null || Date.parse(JSON.parse(value).generated_timestamp) <= expirationDate.getTime()) {
			$.ajax({
				type: 'GET',
				dataType: "json",
				url: api,
				success: function (responseData, textStatus, jqXHR) {
					localStorage.setItem(key, JSON.stringify(responseData));
					return resolve(responseData);
				}
			});
		} else {
			return resolve(JSON.parse(value));
		}
	});
}

var getOnlineCSV = async function (key, url) {
	let value = localStorage.getItem(key);
	
	const expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate());
	expirationDate.setHours(5);
	expirationDate.setMinutes(0);
	expirationDate.setSeconds(0);
	
	if (value == null || Date.parse(JSON.parse(value).generated_timestamp) <= expirationDate.getTime()) {
	
		try {
			const response = await fetch(url);
			// Check if the request was successful (status code 200-299)
			if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
			}
			const csvString = await response.text();
			
			const rows = csvString.split('\n');
			const headers = rows[0].split(','); // Assuming the first row contains headers
			const jsonData = [];

			for (let i = 1; i < rows.length; i++) {
				const values = rows[i].split(',');
				const obj = {};

				for (let j = 0; j < headers.length; j++) {
					const key = headers[j].trim();
					const value = values[j] ? values[j].trim() : ''; // Handle potential missing values
					obj[key] = value;
				}
				jsonData.push(obj);
			}
			return { 
				generated_timestamp: new Date(),
				data: jsonData
			};
		} catch (error) {
			console.error('Error fetching CSV:', error);
			return null; // Or handle the error as appropriate for your application
		}
	} else {
		return resolve(JSON.parse(value));
	}
}

$(document).ready(function () {
	getLocalStorage('kmb_route', "https://data.etabus.gov.hk/v1/transport/kmb/route/").then((kmb_route) => {
		getLocalStorage('kmb_stop', "https://data.etabus.gov.hk/v1/transport/kmb/stop").then((kmb_stop) => {
			getLocalStorage('kmb_route_stop', "https://data.etabus.gov.hk/v1/transport/kmb/route-stop").then((kmb_route_stop) => {
				getLocalStorage('ctb', "https://rt.data.gov.hk/v2/transport/citybus/route/ctb").then((ctb) => {
					getOnlineCSV('light_rail', 'https://opendata.mtr.com.hk/data/light_rail_routes_and_stops.csv').then((light_rail_data) => {
					
						new Dashboard('#dashboard');
						
						let table = new DataTable('#kmbTable', {
							//searching: false,
							"data": kmb_route['data'].concat(ctb['data']),
							columns: [
								{
									className: 'dt-control',
									orderable: false,
									data: null,
									defaultContent: ''
								},
								{
									data: 'route', 
									"title": "#",
								}, {
									data: null,
									orderable: false,
									render: function (data, type, row, meta) {
										if ('co' in row && row['co'] == 'CTB')
											return `${row['orig_tc']} <> ${row['dest_tc']} <span class="badge rounded-pill text-bg-primary">城巴</span>`;
										else {
											let result = `${row['orig_tc']} -> ${row['dest_tc']} <span class="badge rounded-pill text-bg-danger">九巴</span>`;
											if (row.service_type > 1) {
												result += `<span class="badge rounded-pill text-bg-warning">特別車</span>`;
											}
											return result;
										}
									}
								}
							],
							"order": [[ 1, "asc" ]],
							layout: {
								topStart: null,
								topEnd: null,
								bottom: 'paging',
								bottomEnd: 'pageLength',
							}
						});
						
						$('nav input[type="search"]').on( "focus", function() {
							$("#dashboard").slideUp( "slow", function() {
								// Animation complete.
							});
						});
						$('nav input[type="search"]').on( "focusout", function() {
							$("#dashboard").slideDown( "slow", function() {
								// Animation complete.
							});
						});
		
						$('nav input[type="search"]').on('input', function () {
							table.search(this.value).draw();
						});
						
						function format(row) {
							let route_stops = kmb_route_stop.data.filter(stop => stop.route == row.route && stop.bound == row.bound && stop.service_type == row.service_type);
							route_stops.sort((a, b) => a.seq - b.seq);
							let result = '<dl>';
							for (const route_stop of route_stops) {
								let stop_data = kmb_stop.data.find(stop => stop.stop == route_stop.stop);
								result += `<dd class="eta" data-stop="${stop_data.stop}" data-route="${row.route}" data-service-type="${row.service_type}">${stop_data.name_tc} <i class="bi bi-pin-angle"></i><br/> <span data-seq="1" class="text-primary"></span><small class="text-secondary">-><span data-seq="2"></span>-><span data-seq="3"></span></small></dd>`;
							}
							return result + '</dl>';
						}
						
						function getETA() {
							$("dd.eta").each(function (){
								const stop = this.dataset.stop;
								$.get(`https://data.etabus.gov.hk/v1/transport/kmb/eta/${this.dataset.stop}/${this.dataset.route}/${this.dataset.serviceType}`, function (data) {
									for (const eta_data of data.data) {
										const diff = Date.parse(eta_data.eta) - new Date();
										var minutes = Math.floor(diff / 60000);
										var seconds = ((diff % 60000) / 1000).toFixed(0);
										$(`dd.eta[data-stop="${stop}"][data-route="${eta_data.route}"][data-service-type="${eta_data.service_type}"] span[data-seq="${eta_data.eta_seq}"]`).html('').append(`${seconds == 60 ? (minutes+ 1) : minutes} 分鐘`);
									}
								});
							});
						}
						
						$('#kmbTable tbody').on('click', 'td.dt-control', function () {
							var tr = $(this).closest('tr');
							var row = table.row(tr);

							if (row.child.isShown()) {
							// This row is already open - close it
								row.child.hide();
							}
							else {
							// Open this row
								row.child(format(row.data())).show();
								getETA();
								setInterval(getETA, 30000);
							}
						});
						
						$('#kmbTable tbody').on( 'click', 'i.bi-pin-angle', function () {
							var tr = $(this).closest('tr');
							var row = table.row(tr);
							
							let card = new KMBCard(row.data());
							card.save().draw();
						});
						
						
						$('#dashboard').on( 'click', 'a.btn-danger', function () {
							var li = $(this).closest('li');
							dashboard.item(li).remove();
							dashboard.draw();
						});
					
					
					});
				});
			});
		});
	});
});

class Dashboard {
	constructor(selector) {
		this.ele = $(selector);
		this.cards = localStorage.getItem('cards') || '[]';
		this.cards = JSON.parse(this.cards);
		this.draw();
	}
	
	add(co, data) {
		//this.cards.push(new {co = co, data = data});
		localStorage.setItem('cards', JSON.stringify(this.cards));
		return this;
	}
	
	remove(card) {
	}
	
	draw() {
		this.ele.html('');
		for (const card of this.cards) {
			new KMBCard(card).draw();
		}
		return this;
	}
}

class Card {
	constructor(data) {
		this.data = data;
		console.log(data);
	}
	
	get co() { return this._co; }
	set co(x) { this._co = x; }
	
	get route() { return this._route; }
	set route(x) { this._route = x; }
	
	get dest() { return this._dest; }
	set dest(x) { this._dest = x; }
	
	draw() {
		$('#dashboard').append(
			`<li class="list-group-item">
				<div class="card" style="width: 11rem;">
					<div class="card-body">
						<h1 class="card-title">${this.route}</h1>
						<span class=""position-relative>${this.co}</span>
						<figcaption  class="blockquote-footer text-nowrap">往 ${this.dest}</figcaption >
						<h6 class="card-subtitle mb-2 text-body-secondary">${this.co}</h6>
						<p class="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
						<a href="#" class="btn btn-primary bi bi-caret-left"></a>
						<a href="#" class="btn btn-primary bi bi-caret-right"></a>
						<a href="#" class="btn btn-danger bi bi-trash"></a>
					</div>
				</div>
			</li>`);
	}
	
	save() {
		let cards = localStorage.getItem('cards');
		if (cards == null) {
			let cards = [this.data];
			localStorage.setItem('cards', JSON.stringify(cards));
		} else {
			console.log(cards);
			let cards = JSON.parse(cards);
			cards.push(this.data);
			localStorage.setItem('cards', JSON.stringify(cards));
		}
		return this;
	}
}

class KMBCard extends Card {
	constructor(data) {
		super(data);
		this.co = '<span class="badge rounded-pill text-bg-danger">九巴</span>';
		this.route = data.route;
		this.dest = data.dest_tc;
	}
}