// Get chart.js from CDN
const Chart = window.Chart.Chart;

// Event Listeners to ensure text and range inputs match
const inputs = document.querySelectorAll('.input');

const updateInputs = (e) => {
	const id = e.target.id;

	switch (id) {
		case 'session-text':
			e.target.value = e.target.value.split(',').join('');
			document.getElementById('session-range').value = e.target.value;
			e.target.value = Number(e.target.value).toLocaleString('en-US');
			break;
		case 'session-range':
			document.getElementById('session-text').value = Number(
				e.target.value
			).toLocaleString('en-US');
			break;
		case 'bounce-text':
			document.getElementById('bounce-range').value = e.target.value;
			break;
		case 'bounce-range':
			document.getElementById('bounce-text').value = e.target.value;
			break;
		case 'conversion-text':
			document.getElementById('conversion-range').value = e.target.value;
			break;
		case 'conversion-range':
			document.getElementById('conversion-text').value = e.target.value;
			break;
		case 'aov-text':
			e.target.value = e.target.value.split(',').join('');
			document.getElementById('aov-range').value = e.target.value;
			e.target.value = Number(e.target.value).toLocaleString('en-US');
			break;
		case 'aov-range':
			document.getElementById('aov-text').value = Number(
				e.target.value
			).toLocaleString('en-US');
			break;
	}
};

inputs.forEach((e) => e.addEventListener('input', updateInputs));

// Calculator Logic
const low = {
	influencedSessions: {
		bounceRate: 0.2,
		conversionRate: 0.05,
		aov: 0.05,
	},
	impact: {
		bounceRate: 0.2,
		conversionRate: 0.25,
		aov: 0.25,
	},
};

const medium = {
	influencedSessions: {
		bounceRate: 0.25,
		conversionRate: 0.1,
		aov: 0.1,
	},
	impact: {
		bounceRate: 0.3,
		conversionRate: 0.5,
		aov: 0.25,
	},
};

const high = {
	influencedSessions: {
		bounceRate: 0.3,
		conversionRate: 0.15,
		aov: 0.15,
	},
	impact: {
		bounceRate: 0.35,
		conversionRate: 0.6,
		aov: 0.4,
	},
};

const calculateIncrementalRevenue = (data, engagement) => {
	debugger;
	const { aov, bounce, conversion, sessions } = data;
	const { impact, influencedSessions } = engagement;

	const engagedSessions = sessions * (1 - bounce);
	const saleCount = engagedSessions * conversion;
	const annualRevenue = saleCount * aov;

	const newBounceRate =
		bounce * (1 - impact.bounceRate * influencedSessions.bounceRate);
	const newEngagedSessions = (1 - newBounceRate) * sessions;
	const netConversion =
		conversion *
		(1 + impact.conversionRate * influencedSessions.conversionRate);
	const newSaleCount = newEngagedSessions * netConversion;
	const grossConversion = newSaleCount / sessions;
	const newAov = aov * (1 + impact.aov * influencedSessions.aov);
	const newAnnualRevenue = newSaleCount * newAov;
	const incrementalRevenue = newAnnualRevenue - annualRevenue;
	const increasePercentage = (newAnnualRevenue / annualRevenue - 1) * 100;

	return {
		bounce: (newBounceRate * 100).toFixed(2),
		engagedSessions: newEngagedSessions,
		netConversion: (netConversion * 100).toFixed(2),
		saleCount: newSaleCount,
		grossConversion: (grossConversion * 100).toFixed(2),
		aov: newAov.toFixed(2),
		annualRevenue: newAnnualRevenue.toFixed(2),
		incrementalRevenue: incrementalRevenue.toFixed(2),
		increasePercentage: increasePercentage.toFixed(2),
	};
};

// Extract data from form and calculate on submit
function getData(form) {
	const formData = new FormData(form);
	const data = Object.fromEntries(formData);
	data.bounce = data.bounce / 100;
	data.conversion = data.conversion / 100;
	data.sessions = data.sessions.split(',').join('');
	return data;
}

async function createCharts(results) {
	Chart.defaults.font.family = "'Montserrat', 'sans-serif'";
	const incrementalRevenueChart = new Chart(
		document.getElementById('incrementalRevenue'),
		{
			type: 'bar',
			data: {
				labels: ['Year 1', 'Year 2', 'Year 3'],
				datasets: [
					{
						label: 'Incremental Revenue',
						data: results.map((row) => row.incrementalRevenue),
						backgroundColor: ['#FFCB53', '#F36B21', '#8566AB'],
					},
				],
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Incremental Revenue',
					},
					colors: {
						enabled: false,
					},
					legend: {
						display: false,
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								let label = context.dataset.label || '';

								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD',
									}).format(context.parsed.y);
								}
								return label;
							},
							afterLabel: function (context) {
								const percent =
									results[context.dataIndex].increasePercentage;
								return `${percent}% Revenue Growth`;
							},
						},
					},
				},
			},
		}
	);

	const totalRevenueChart = new Chart(
		document.getElementById('totalRevenue'),
		{
			type: 'bar',
			data: {
				labels: ['Year 1', 'Year 2', 'Year 3'],
				datasets: [
					{
						label: 'Total Revenue',
						data: results.map((row) => row.annualRevenue),
						backgroundColor: ['#FFCB53', '#F36B21', '#8566AB'],
					},
				],
			},
			options: {
				plugins: {
					title: {
						display: true,
						text: 'Total Revenue',
					},
					colors: {
						enabled: false,
					},
					legend: {
						display: false,
					},
					tooltip: {
						callbacks: {
							label: function (context) {
								let label = context.dataset.label || '';

								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += new Intl.NumberFormat('en-US', {
										style: 'currency',
										currency: 'USD',
									}).format(context.parsed.y);
								}
								return label;
							},
						},
					},
				},
			},
		}
	);
}

function showTotalAndDownloadBtn(total) {
	const currentTotalLine = document.querySelector('.chart-container h2');
	if (currentTotalLine) {
		currentTotalLine.innerHTML = `Total 3 Year Return: <em>$${Math.round(
			+total
		).toLocaleString()}</em>`;
	} else {
		const chartContainer = document.querySelector('.chart-container');
		const totalLine = document.createElement('h2');
		totalLine.innerHTML = `Total 3 Year Return: <em>$${Math.round(
			+total
		).toLocaleString()}</em>`;
		chartContainer.appendChild(totalLine);

		const downloadBtn = document.createElement('button');
		downloadBtn.innerText = 'Download Your Value Brief';
		chartContainer.appendChild(downloadBtn);
	}
}

function showDownloadBtn() {}

document
	.getElementById('benefits-form')
	.addEventListener('submit', function (e) {
		e.preventDefault();
		const data = getData(e.target);
		const lowEngagement = calculateIncrementalRevenue(data, low);
		const medEngagement = calculateIncrementalRevenue(data, medium);
		const highEngagement = calculateIncrementalRevenue(data, high);
		const threeYearTotal = (
			+lowEngagement.incrementalRevenue +
			+medEngagement.incrementalRevenue +
			+highEngagement.incrementalRevenue
		).toFixed(2);

		const results = [lowEngagement, medEngagement, highEngagement];
		console.log(results, threeYearTotal);

		const incrementalRevenueCanvas = Chart.getChart('incrementalRevenue');
		const totalRevenueCanvas = Chart.getChart('totalRevenue');

		function destroyCanvas(chart) {
			if (chart != undefined) {
				chart.destroy();
			}
		}

		destroyCanvas(incrementalRevenueCanvas);
		destroyCanvas(totalRevenueCanvas);

		createCharts(results);
		showTotalAndDownloadBtn(threeYearTotal);
	});
