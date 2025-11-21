$(document).ready(function () {
	let table = new DataTable('#orderedTable', {
		ajax: {
			url: 'data.json',
			dataSrc: ''
		},
		columnDefs: [
			{
				render: (data, type, row) => `<a href="${row.img}" data-lightbox="group"><img src="${row.img}" class="img-fluid" alt="${row.title}" style="max-height: 130px;"></a>`,
				targets: 0,
				orderable: false,
			},
			{
				render: (data, type, row) => `<h6><a href="${row.href}">${row.title}</a></h6><p>${row.item}</p><small>#${row.order}</small>`,
				targets: 1
			},
			{
				render: (data, type, row) => `<p class="small">${row.unitPrice} *${row.amount}</p><p class="small">=${row.total}</p>`,
				targets: 2,
				orderable: false,
			}
		],
		order: [[1, "asc"]]
	});
});