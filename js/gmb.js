$(document).ready(function () {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const region = urlParams.get('region');
	const route_code = urlParams.get('route_code');
	
	$.ajax({
		type: 'GET',
		dataType: "json",
		url: `https://data.etagmb.gov.hk/route/${region}/${route_code}`,
		success: function (responseData, textStatus, jqXHR) {
			console.log(responseData);
			const detail = responseData.data[0];
			for (const key in detail) {
				$(`#${key}`).html('').append(detail[key]);
			}
		}
	});
});