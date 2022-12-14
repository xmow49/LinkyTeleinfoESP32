const {
    createApp
} = Vue

var app = createApp({
    data() {
        return {
            connected: false,
            HCHC: 0,
            HCHP: 0,
            BASE: 0,
            PAPP: 0,
            IINST: 0,
            live: {
                PAPP: "?",
                IINST: "?",
                date: "?",
                BASE: "?",
                OPTARIF: "?",
                VCONDO: "?",

            },
            config: {
                PRIX_BASE: 0,
            },
            totals: {
                day: 0,
                week: 0,
                month: 0,
                year: 0,
            },
            startDisplayDate: new Date(new Date().setHours(0, 0, 0, 0)),
            endDisplayDate: new Date(new Date().setHours(23, 59, 59, 999)),
            period: "day",
            settingsWindowActive: false,
            //----------------
            consoChart: null,

        }
    },
    mounted() {
        const canvas = document.getElementById('consoChart').getContext('2d');
        this.consoChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                    label: 'Consommation',
                    data: [0],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: '#01A2E0',
                    tension: 0.1
                }]
            },
            options: {
                tooltips: {
                    callbacks: {
                        label: function(value, index, values) {
                            return value.yLabel + " Wh";
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: false,
            },

        });



    },
    methods: {
        dateToString(date) {
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            if (day < 10) {
                day = "0" + day;
            }
            if (month < 10) {
                month = "0" + month;
            }
            return day + "/" + month + "/" + year;
        },
        previous() {
            switch (this.period) {
                case "day":
                    this.startDisplayDate = new Date(this.startDisplayDate.setDate(this.startDisplayDate.getDate() - 1));
                    this.endDisplayDate = new Date(this.endDisplayDate.setDate(this.endDisplayDate.getDate() - 1));
                    break;
                case "week":
                    this.startDisplayDate = new Date(this.startDisplayDate.setDate(this.startDisplayDate.getDate() - 7));
                    this.endDisplayDate = new Date(this.endDisplayDate.setDate(this.endDisplayDate.getDate() - 7));
                    break;
                case "month":
                    this.startDisplayDate = new Date(this.startDisplayDate.setMonth(this.startDisplayDate.getMonth() - 1));
                    const lastDay = new Date(this.startDisplayDate.getFullYear(), this.startDisplayDate.getMonth() + 1, 0);
                    this.endDisplayDate = new Date(this.startDisplayDate.getFullYear(), this.startDisplayDate.getMonth(), lastDay.getDate());
                    break;
                case "year":
                    this.startDisplayDate = new Date(this.startDisplayDate.setFullYear(this.startDisplayDate.getFullYear() - 1));
                    this.endDisplayDate = new Date(this.endDisplayDate.setFullYear(this.endDisplayDate.getFullYear() - 1));
                    break;
            }
            this.updateChart();
        },
        next() {
            switch (this.period) {
                case "day":
                    this.startDisplayDate = new Date(this.startDisplayDate.setDate(this.startDisplayDate.getDate() + 1));
                    this.endDisplayDate = new Date(this.endDisplayDate.setDate(this.endDisplayDate.getDate() + 1));
                    break;
                case "week":
                    this.startDisplayDate = new Date(this.startDisplayDate.setDate(this.startDisplayDate.getDate() + 7));
                    this.endDisplayDate = new Date(this.endDisplayDate.setDate(this.endDisplayDate.getDate() + 7));
                    break;
                case "month":
                    this.startDisplayDate = new Date(this.startDisplayDate.setMonth(this.startDisplayDate.getMonth() + 1));
                    const lastDay = new Date(this.endDisplayDate.getFullYear(), this.endDisplayDate.getMonth() + 2, 0);
                    this.endDisplayDate = new Date(this.endDisplayDate.setMonth(this.endDisplayDate.getMonth() + 1));
                    break;
                case "year":
                    this.startDisplayDate = new Date(this.startDisplayDate.setFullYear(this.startDisplayDate.getFullYear() + 1));
                    this.endDisplayDate = new Date(this.endDisplayDate.setFullYear(this.endDisplayDate.getFullYear() + 1));
                    break;
            }
            this.updateChart();
        },
        updateChart() {
            let start = this.startDisplayDate;
            let end = this.endDisplayDate;
            let data = {
                start: start,
                end: end
            }
            socket.emit("get_data", data);
        },
        today() {
            this.period = "day";
            this.startDisplayDate = new Date(new Date().setHours(0, 0, 0, 0));
            this.endDisplayDate = new Date(new Date().setHours(23, 59, 59, 999))
            this.updateChart();
        },

        timeAgo(time, from) {
            let now;
            if (from == undefined) {
                now = new Date();
            } else {
                now = new Date(from);
            }
            let diff = new Date(now).getTime() - new Date(time).getTime();
            let diffInMinutes = Math.floor(diff / 1000 / 60);
            let diffInHours = Math.floor(diff / 1000 / 60 / 60);
            let diffInDays = Math.floor(diff / 1000 / 60 / 60 / 24);
            if (isNaN(diffInMinutes)) {
                return "Inconnu";
            } else if (diff / 1000 < 60) {
                return Math.floor(diff / 1000) + " secondes";
            } else if (diffInMinutes < 60) {
                return diffInMinutes + " minutes";
            } else if (diffInHours < 24) {
                return diffInHours + " heures";
            } else {
                return diffInDays + " jours";
            }
        },
        nextValue(lastDate) {
            let date = new Date(lastDate);

            let lastTimePlusRefreshRate = date.getTime() + this.config.REFRESH_RATE * this.config.DATA_COUNT * 1000;

            if (lastTimePlusRefreshRate - new Date().getTime() > 0) {
                const diff = (lastTimePlusRefreshRate - new Date().getTime()) / 1000;
                let diffInMinutes = (diff / 60).toFixed(1);
                let diffInHours = (diff / 60 / 60).toFixed(1);
                let diffInDays = (diff / 60 / 60 / 24).toFixed(1);
                if (isNaN(diffInMinutes)) {
                    return "Inconnu";
                } else if (diff < 60) {
                    return Math.floor(diff) + " secondes";
                } else if (diffInMinutes < 60) {
                    return diffInMinutes + " minutes";
                } else if (diffInHours < 24) {
                    return diffInHours + " heures";
                } else {
                    return diffInDays + " jours";
                }
            } else {
                return "?";
            }
        },
        toggleSettingsWindowActive() {
            this.settingsWindowActive = !this.settingsWindowActive;
        },
        saveConfig() {
            this.toggleSettingsWindowActive();
            socket.emit("set_config", this.config);
        },
        getPrice(period) {
            switch (period) {
                case "day":
                    return (this.totals.day / 1000 * this.config.PRIX_BASE).toFixed(2);
                case "week":
                    return (this.totals.week / 1000 * this.config.PRIX_BASE).toFixed(2);
                case "month":
                    return (this.totals.month / 1000 * this.config.PRIX_BASE).toFixed(2);
                case "year":
                    return (this.totals.year / 1000 * this.config.PRIX_BASE).toFixed(2);
            }
        }

    },
    computed: {
        strStartDisplayDate() {
            return this.dateToString(this.startDisplayDate);
        },
        strEndDisplayDate() {
            return this.dateToString(this.endDisplayDate);
        },

    },
    watch: {
        period() {
            switch (this.period) {
                case "day":
                    //select today
                    this.startDisplayDate = new Date();
                    this.endDisplayDate = new Date(new Date().getTime() + 86400000);
                    break;
                case "week":
                    //select this week
                    this.startDisplayDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    this.endDisplayDate = new Date();
                    break;
                case "month":
                    //select this month (1st to last day of month)
                    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    this.startDisplayDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    this.endDisplayDate = new Date(new Date().getFullYear(), new Date().getMonth(), daysInMonth);
                    break;
                case "year":
                    //select this year
                    this.startDisplayDate = new Date(new Date().getFullYear(), 0, 1);
                    this.endDisplayDate = new Date(new Date().getFullYear(), 11, 31);
                    break;
            }

            this.updateChart();
        }
    },

}).mount('body')

const socket = io();

socket.on("connect", () => {
    console.log("Connected");
    app.connected = socket.connected;
});
socket.on("disconnect", () => {
    console.log("Disconnected");
    app.connected = socket.connected;
});

socket.on("chart_data", (data) => {
    let values = [];
    let labels = [];

    switch (app.period) {
        case "day":
            //get one value per hour
            for (let i = 0; i < 24; i++) {
                values.push(0);
            }

            for (let i = 0; i < 24; i++) {
                if (i < 10) {
                    labels.push("0" + i + ":00");
                } else {
                    labels.push(i + ":00");
                }
            }

            //remove null values
            data = data.filter((item) => {
                return item.BASE != null;
            });
            for (let i = 0; i < data.length - 1; i++) {
                const hour = new Date(data[i].date).getHours();
                values[hour] += (data[i + 1].BASE - data[i].BASE);
            }

            var totalDay = 0;
            for (let i = 0; i < values.length; i++) {
                totalDay += values[i];
            }
            app.totals.day = totalDay;
            break;
        case "week":
            //get one value per day
            for (let i = 0; i < 7; i++) {
                values.push(0);
            }

            for (let i = 0; i < 7; i++) {
                labels.push(app.dateToString(new Date(app.endDisplayDate.getTime() - 86400000 * (6 - i))));
            }
            for (let i = 0; i < data.length - 1; i++) {
                const day = new Date(data[i].date).getDay();
                values[day] += (data[i + 1].BASE - data[i].BASE);
            }

            var totalWeek = 0;
            for (let i = 0; i < values.length; i++) {
                totalWeek += values[i];
                console.log(values[i]);
            }
            app.totals.week = totalWeek;


            break;
        case "month":
            //get one value per day
            const daysInMonth = new Date(app.endDisplayDate.getFullYear(), app.endDisplayDate.getMonth() + 1, 0).getDate();
            for (let i = 0; i < daysInMonth; i++) {
                values.push(0);
            }

            for (let i = 0; i < daysInMonth; i++) {
                labels.push(app.dateToString(new Date(app.endDisplayDate.getMonth() + 1 + "/" + (i + 1) + "/" + app.endDisplayDate.getFullYear())));
            }
            for (let i = 0; i < data.length - 1; i++) {
                const day = new Date(data[i].date).getDate();
                values[day] += (data[i + 1].BASE - data[i].BASE);
            }

            var totalMonth = 0;
            for (let i = 0; i < values.length; i++) {
                totalMonth += values[i];
            }
            app.totals.month = totalMonth;

            break;
        case "year":
            //get one value per month
            for (let i = 0; i < 12; i++) {
                values.push(0);
            }

            for (let i = 0; i < 12; i++) {
                //get month name
                const month = new Date(app.endDisplayDate.getFullYear(), i, 1).toLocaleString('default', {
                    month: 'long'
                });
                labels.push(month);
            }
            for (let i = 0; i < data.length - 1; i++) {
                const month = new Date(data[i].date).getMonth();
                values[month] += (data[i + 1].BASE - data[i].BASE);
            }

            var totalYear = 0;
            for (let i = 0; i < values.length; i++) {
                totalYear += values[i];
            }
            app.totals.year = totalYear;

            break;
    }
    app.consoChart.data.datasets[0].data = values;
    app.consoChart.data.labels = labels;
    app.consoChart.update();

});

socket.on("error", (data) => {
    console.log(data);
    alert(JSON.stringify(data));
});



socket.emit("get_data", {
    count: 20,
    start: app.startDisplayDate,
    end: app.endDisplayDate
});

socket.on("live_data", (data) => {
    app.live = data;
});
socket.emit("get_live");
window.setInterval(() => {
    socket.emit("get_live");
}, 10000);


socket.on("config_data", (data) => {
    app.config = data;
});
socket.emit("get_config");