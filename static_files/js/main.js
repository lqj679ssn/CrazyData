class MainComponent {
    constructor({splineContainerId, barContainerId, projectId}) {
        this.splineContainerId = splineContainerId;
        this.barContainerId = barContainerId;
        this.initProject(projectId);
        this.title = document.getElementsByTagName('title')[0];
    }

    initProject(projectId) {
        Request.get(`https://data.6-79.cn/v1/project/@${projectId}`)
            .then(data => {
                this.project = new Project(data);
                this.title.innerText = '数据食堂 - ' + this.project.name;
                this.crazyFetch = new CrazyFetch(this.project);
                this.crazyFetch.fetchNewData(true)
                    .then(this.prepareData.bind(this));
            });
    }

    prepareData(dataFlow) {
        // dataFlow = dataFlow.slice(dataFlow.length - 10);
        // dataFlow = dataFlow.slice(1);
        this.splineSeries = [];
        this.barSeries = [{name: '', data: []}];
        this.labels = [];
        dataFlow.forEach(data => {
            let time = data.time * 1000;
            data.waves.forEach(wave => {
                let index = this.labels.indexOf(wave.label);
                if (index === -1) {
                    this.splineSeries.push({name: wave.label, data: []});
                    this.labels.push(wave.label);
                    index = this.labels.indexOf(wave.label);
                }
                this.splineSeries[index].data.push({x: time, y: wave.value});
                this.barSeries[0].data[index] = wave.value;
            });
        });

        this.splineTitle = this.project.name + '时间折线图';
        this.barTitle = this.project.name + '实时柱形图';
        this.initSplineGraph();
        this.initBarGraph();
        this.updateData();
    }

    updateData() {
        setInterval( () => {
            this.crazyFetch.fetchNewData()
                .then((dataFlow) => {
                    if (!dataFlow.length) {
                        return;
                    }
                    dataFlow.forEach(data => {
                        let time = data.time * 1000;
                        let barData = [];
                        data.waves.forEach(wave => {
                            let index = this.labels.indexOf(wave.label);
                            if (index === -1) {
                                this.splineChart.addSeries({name: wave.label, data: []});
                                this.labels.push(wave.label);
                                index = this.labels.indexOf(wave.label);
                            }
                            this.splineChart.series[index].addPoint([time, wave.value], true, false);
                            barData[index] = wave.value;
                        });
                        this.barChart.series[0].setData(barData);
                    })
                })
        }, 5000);
    }

    initBarGraph() {
        this.barChart = Highcharts.chart(this.barContainerId, {
            chart: {
                type: 'bar',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                zoomType: 'xy',
            },
            title: {
                text: this.barTitle,
            },
            xAxis: {
                categories: this.labels,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: '',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                enabled: false,
            },
            credits: {
                enabled: false
            },
            series: this.barSeries,
        });
    }

    initSplineGraph() {
        this.splineChart = Highcharts.chart(this.splineContainerId, {
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                zoomType: 'xy',
            },
            plotOptions: {
                series: {
                    turboThreshold: 0,
                },
                turboThreshold: 10,
            },
            time: {
                useUTC: false
            },
            title: {
                text: this.splineTitle,
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150,
            },
            yAxis: {
                title: {
                    text: ''
                },
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br/>',
                pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y}'
            },
            exporting: {
                enabled: true,
                filename: this.splineTitle,
            },
            series: this.splineSeries,
            credits: {
                enabled: false
            },
        });
    }
}