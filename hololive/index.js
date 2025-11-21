$(document).ready(function () {
	let table = new DataTable('#orderedTable', {
		ajax: {
			url: 'data.json',
			dataSrc: ''
		},
		columnDefs: [
			{
				render: (data, type, row) => row.order,
				targets: 0,
			},
			{
				render: (data, type, row) => `<a href="${row.img}" data-lightbox="group"><img src="${row.img}" class="img-thumbnail rounded-start" alt="${row.title}" style="max-height: 130px;"></a>`,
				targets: 1,
				orderable: false,
			},
			{
				render: (data, type, row) => `<h6><a href="${row.href}">${row.title}</a></h6><p>${row.item}</p>`,
				targets: 2
			},
			{
				render: (data, type, row) => `<p class="small">${row.unitPrice} *${row.amount}</p><p class="small">=${row.total}</p>`,
				targets: 3,
				orderable: false,
			}
		],
		order: [[0, "desc"], [2, "asc"]]
	});
});