const device_chart = {}

$(document).ready(function () {	
	const urlParams = new URLSearchParams(window.location.search);
	const server = urlParams.get('s');
	connect(server);
});

const COLORS = ['rgb(140, 214, 16)', 'rgb(239, 198, 0)', 'rgb(231, 24, 49)'];

function initGaugeChart(ctx, title) {	
	const annotation = {
		type: 'doughnutLabel',
		content: ({chart}) => [
			(chart.data.datasets[0].data[0] / (chart.data.datasets[0].data[0] + chart.data.datasets[0].data[1]) * 100).toFixed(2) + ' %',
			title // 'CPU utilization',
		],
		drawTime: 'beforeDraw',
		position: {
			y: '-50%'
		},
		font: [{size: 50, weight: 'bold'}, {size: 20}],
		color: ({chart}) => [COLORS[index(chart.data.datasets[0].data[0])], 'grey']
	};
	
	const data = {
	  datasets: [{
		data: [0, 100],
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

	return new Chart(ctx, config);
}

function index(perc) {
  return perc < 70 ? 0 : perc < 90 ? 1 : 2;
}


function connect(uri){
	var ws = new WebSocket(uri);
	
	ws.onopen = function(event) {
		console.log('Connection established.');
		// You can send a message here upon open
	};
	
	ws.onmessage = function(event) {
		// console.log('Message received:', event.data);
		// Process the incoming data
		const obj = JSON.parse(event.data)
		// console.log(obj);
		
		for (let i = 0; i < obj.gpu.length; i++) {
			const gpu = obj.gpu[i];
			if ($('#gpu' + i).length === 0) {
				content = `<div class="col m-1 p-0">
							<div class="card" id="gpu` + i + `">
								<div class="card-body">
									<h5 class="card-title">` + gpu.name + `</h5>
									<h6 class="card-subtitle mb-2 text-muted">#gpu` + i + ` - v` + gpu.driver + `</h6>
									<div class="row">
										<canvas class="col chart-temp"></canvas>
										<canvas class="col chart-memory"></canvas>
									</div>
								</div>
							</div>
						</div>`;
				$("#list-cards").append(content);
				
				const chart_temp = initGaugeChart($("#gpu" + i).find(".chart-temp")[0], 'Temperature');
				const chart_memory = initGaugeChart($("#gpu" + i).find(".chart-memory")[0], 'Memory');
				
				device_chart["gpu" + i] = {
					"temp": chart_temp,
					"memory": chart_memory
				};
			}
			device_chart["gpu" + i].temp.data.datasets.forEach(dataset => {
				dataset.data = [gpu.temp, 75 - gpu.temp];
			});
			device_chart["gpu" + i].temp.update();
			
			
			device_chart["gpu" + i].memory.data.datasets.forEach(dataset => {
				dataset.data = [gpu.memory.used, gpu.memory.free];
			});
			device_chart["gpu" + i].memory.update();
			//chart.data.datasets.forEach(dataset => {
			//	dataset.data = [obj[0].temp, 75 - obj[0].temp];
			//});
			//chart.update();
		}
		
	};
	
	ws.onclose = function(event) {
		// console.log('Connection closed:', event);
		setTimeout(connect(uri), 10000);
	};
	
	ws.onerror = function(error) {
		// console.error('WebSocket error:', error);
	};
}