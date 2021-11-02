console.log('loaded chart')
const Budget=[13680147, 14223655, 15499349, 16281145, 16754687, 17355103, 20258656, 22375818];
const Stops=[103, 356, 389, 316, 250, 289, 276, 199];
const Arrests=[101, 309, 381, 416, 418, 481, 467, 665];
const Budget_Normalized=[136.80147, 142.23655, 154.99349, 162.81145, 167.54687, 173.55103, 202.58656, 223.75818];
const data_order = [Budget, Budget_Normalized, Arrests, Stops];
const colors = ['Blue', 'Purple', 'Green','Pink']
const labels = [
    '2012',
    '2013',
    '2014',
    '2015',
    '2016',
    '2017',
    '2018',
    '2019'
    ];
const lines = ['Budget','Budget in $100,000','Arrests','Stops']
//const data = {}

const data = {
    labels: labels,
    datasets: []
};
function addData(i) {
    const info = {
        label: lines[i],
        borderColor: colors[i],
        data: data_order[i],
        }
    // ++step_number;
    data.datasets.push(info);
    console.log(data)
    myChart.update();
}

function removeData(){
    // -- step_number;
    data.datasets.pop();
}

let ctx = document.getElementById('myChart');
let myChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
            scales: {
                yAxes: [
                    {
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                            }); // convert value to dollar format
                        },
                    min: 0,
                    //max: 25000,
                    //stepSize: 5000,
                    },
                },
                ],
                xAxes: [
                  {
                    scaleLabel: {
                      display: true,
                      labelString: 'Year',
                    },
                  },
                ],
              },
        }
    }
);