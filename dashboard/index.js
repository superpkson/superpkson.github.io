$(document).ready(function () {
	const ctx = document.getElementById('myChart');
	
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
	
	
	const ctx2 = document.getElementById('myChart2');
	
	const DATA_COUNT = 5;
	const NUMBER_CFG = {count: DATA_COUNT, min: 0, max: 100};

	const data2 = {
	  labels: ['Red', 'Orange', 'Yellow', 'Green', 'Blue'],
	  datasets: [
		{
		  label: 'Dataset 1',
		  data: [5, 89, 36, 34, 14],
		  backgroundColor: Object.values({
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}),
		}
	  ]
	};
	
	const config2 = {
	  type: 'doughnut',
	  data: data2,
	  options: {
		responsive: false,
		plugins: {
		  legend: {
			position: 'top',
		  },
		  title: {
			display: true,
			text: 'Chart.js Doughnut Chart'
		  }
		}
	  },
	};

	new Chart(ctx2, config2);
	
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
			console.log(obj)
			
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
	
	connect();
});

function index(perc) {
  return perc < 70 ? 0 : perc < 90 ? 1 : 2;
}