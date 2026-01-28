$(document).ready(function () {	
	const servers = JSON.parse(getCookie('servers'));
	servers.forEach(server => {
		addCard(server);
	});
});

$(function() {	
	$("#btn-add-server").click(function() {
		let name = prompt('Server name: ', 'computer');
		let addr = prompt('Server address: ', 'wss://');
		
		servers = JSON.parse(getCookie('servers'));
		if (servers === null)
			servers = [];
		servers.push({
			name: name,
			addr: addr
		});
		
		setCookie('servers', JSON.stringify(servers))
	});
});


function setCookie(cname, cvalue) {
	document.cookie = cname + "=" + cvalue + "; path=/; SameSite=Lax; secure";
}

function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return null;
}

function addCard(obj) {
	content = `<div class="col-sm-12 mt-1">
				<div class="card">
					<div class="card-body">
						<h5 class="card-title">` + obj.name + `</h5>
						<h6 class="card-subtitle mb-2 text-muted">` + obj.addr + `</h6>
						<p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
						<a href="#" class="card-link">Card link</a>
						<a href="#" class="card-link">Another link</a>
						<canvas id="` + obj.name + `-gpu"></canvas>
						<canvas id="` + obj.name + `-memory"></canvas>
					</div>
				</div>
			</div>`;
	$("#list-cards").append(content);
	
	const ctx = document.getElementById(obj.name + "-gpu");
	
	const annotation = {
	  type: 'doughnutLabel',
	  content: ({chart}) => [
		chart.data.datasets[0].data[0].toFixed(2) + ' %',
		'CPU utilization',
	  ],
	  drawTime: 'beforeDraw',
	  position: {
		y: '-50%'
	  },
	  font: [{size: 50, weight: 'bold'}, {size: 20}],
	  color: ({chart}) => [COLORS[index(chart.data.datasets[0].data[0])], 'grey']
	};
	
	const COLORS = ['rgb(140, 214, 16)', 'rgb(239, 198, 0)', 'rgb(231, 24, 49)'];
	const MIN = 0;
	const MAX = 100;

	const value = Math.floor(Math.random() * MAX);

	const data = {
	  datasets: [{
		data: [value, 100 - value],
		backgroundColor(ctx) {
		  if (ctx.type !== 'data') {
			return;
		  }
		  if (ctx.index === 1) {
			return 'rgb(234, 234, 234)';
		  }
		  return COLORS[index(ctx.raw)];
		}
	  }]
	};
	
	const config = {
	  type: 'doughnut',
	  data,
	  options: {
		responsive: false,
		aspectRatio: 2,
		circumference: 180,
		rotation: -90,
		plugins: {
		  annotation: {
			annotations: {
			  annotation
			}
		  }
		}
	  }
	};

	const chart = new Chart(ctx, config);
	
	connect(chart, obj.addr);
}

function index(perc) {
  return perc < 70 ? 0 : perc < 90 ? 1 : 2;
}


function connect(chart, uri){
	var ws = new WebSocket(uri);
	
	ws.onopen = function(event) {
		console.log('Connection established.');
		// You can send a message here upon open
	};
	
	ws.onmessage = function(event) {
		// console.log('Message received:', event.data);
		// Process the incoming data
		const obj = JSON.parse(event.data)
		// console.log(obj)
		
		chart.data.datasets.forEach(dataset => {
			dataset.data = [obj[0].temp, 75 - obj[0].temp];
		});
		chart.update();
	};
	
	ws.onclose = function(event) {
		// console.log('Connection closed:', event);
		setTimeout(connect(uri), 10000);
	};
	
	ws.onerror = function(error) {
		// console.error('WebSocket error:', error);
	};
}