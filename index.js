let READ_INTERVALL = 13000 * 60;
let PLOT_LENGTH = 100;
let SAVE_DATA_EVERY_N_MEASUREMENTS = 1;
let startButton = document.getElementById("start");
let dataOutput = document.getElementById("dataOutput")
let data = [];
let writer;

navigator.serial.getPorts().then((ports) => {
    // Initialize the list of available ports with `ports` on page load.
    console.log(ports)
});
startButton.addEventListener('click', async () => {
    wakeLock = await navigator.wakeLock.request();
    navigator.serial.requestPort({ filters: [] }).then(async (port) => {
        console.log("port: " + port)
        await port.open({ baudRate: 9600 });


        while (port.readable) {
            writer = port.writable.getWriter();
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable
                .pipeThrough(new TransformStream(new LineBreakTransformer()))
                .getReader();

            //setTimeout(() => writer.write(new Uint8Array(['r'.charCodeAt(0)])), 3000);
            setInterval(() => {
                writer.write(new Uint8Array(['r'.charCodeAt(0)]));
            }, READ_INTERVALL)
            try {
                while (true) {
                    let { value, done } = await reader.read();
                    if (done) {
                        console.log("|reader| has been canceled.");
                        break;
                    }
                    console.log(value);
                    let timestamp = new Intl.DateTimeFormat([], { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date());
                    data.push(timestamp + ',' + value + '\n');
                    dataOutput.innerText = data.slice(Math.max(0, data.length - 11)).join('');
                    updateChart(parseFloat(value), timestamp);
                    if ((data.length % SAVE_DATA_EVERY_N_MEASUREMENTS) == 0) {
                        saveFile("test", data)
                    }
                }
            } catch (error) {
                console.log(error)
            } finally {
                reader.releaseLock();
                writer.releaseLock();
            }
        }
    }).catch((error) => {
        console.log(error);
    });
});




document.addEventListener("keyup", (e) => {
    let keyCode = e.keyCode;
    if (keyCode == 49) {
        writer.write(new Uint8Array(['1'.charCodeAt(0)]));
        console.log("resetting 1");
    } else if (keyCode == 50) {
        writer.write(new Uint8Array(['2'.charCodeAt(0)]));
        console.log("resetting 2");
    }
    else if (keyCode == 55) {
        writer.write(new Uint8Array(['7'.charCodeAt(0)]));
        console.log("Preparing ESPs (resetting 7 times)");
    }
    else if (keyCode == 77) {
        writer.write(new Uint8Array(['r'.charCodeAt(0)]));
        console.log("Taking forced measurement");
    }
}, false);




class LineBreakTransformer {
    constructor() {
        // A container for holding stream data until a new line.
        this.chunks = "";
    }

    transform(chunk, controller) {
        // Append new chunks to existing chunks.
        this.chunks += chunk;
        // For each line breaks in chunks, send the parsed lines out.
        const lines = this.chunks.split("\r\n");
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        // When the stream is closed, flush any remaining chunks out.
        controller.enqueue(this.chunks);
    }
}


function saveFile(filename, content) {
    let a = document.createElement("a");
    a.download = filename + ".csv";

    let output = content.join('');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(output);
    a.click();
}




const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            data: [],
            borderColor: "#00F",
            backgroundColor: "#00F"
        }],
        labels: []
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
let chartOnlyRecent = document.getElementById("chartOnlyRecent");
function updateChart(value, date) {
    if (chartOnlyRecent.checked) {
        let length = myChart.data.labels.length;
        myChart.data.datasets[0].data = myChart.data.datasets[0].data.slice(Math.max(0, length - PLOT_LENGTH + 1));
        myChart.data.labels = myChart.data.labels.slice(Math.max(0, length - PLOT_LENGTH + 1));
    }
    myChart.data.labels.push(date);
    myChart.data.datasets[0].data.push(value);
    myChart.update();
}

let output = []; for (let i = 0; i < a["52"].measurements.length; i++) {
    output.push(new Intl.DateTimeFormat([], { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(a["52"].measurements[i].time)) + ',' + a["52"].measurements[i].temperature);
} saveFile("raphi", output);