const INTERPOLATE = true;

const fs = require('fs');
const { exit } = require('process');

// let rawdata = fs.readFileSync('./data/postCalibration_22.03.-06.06.22.json');
let rawdata = fs.readFileSync('./data/humidityComparison_Sensor2_14.06.-27.06.22.json');

let jsonData = JSON.parse(rawdata);

let sensor1 = jsonData["53"].measurements.filter(s => null != s.temperature);
let sensor2 = jsonData["56"].measurements.filter(s => null != s.temperature);

// let sensor3 = jsonData["58"].measurements.filter(s => null != s.temperature);
// sensor2 = sensor3;


for (let i = 0; i < sensor1.length; i++) {
    sensor1[i].time = new Date(sensor1[i].time);

    // if (sensor1[i].temperature == null) sensor1.splice(i, 1);
}
for (let i = 0; i < sensor2.length; i++) {
    sensor2[i].time = new Date(sensor2[i].time);
    // if (sensor2[i].temperature == null) sensor2.splice(i, 1);
}

let earliestSensor;
if (sensor1[0].time.getTime() < sensor2[0].time.getTime()) earliestSensor = sensor1;
else earliestSensor = sensor2;

let otherSensor;
if (earliestSensor == sensor1) otherSensor = sensor2;
else otherSensor = sensor1;

console.log(earliestSensor[0].room_id);
console.log(otherSensor[0].room_id);


let firstSensorString, secondSensorString;
if (earliestSensor == sensor1) {
    firstSensorString = " 1"
    secondSensorString = " 2";
} else {
    firstSensorString = " 2";
    secondSensorString = " 1";
}

let valueToInterpolate = "humidity";

let outputString = `time,temperature${firstSensorString},humidity${firstSensorString},pressure${firstSensorString},voltage${firstSensorString},temperature${secondSensorString},humidity${secondSensorString},pressure${secondSensorString},voltage${secondSensorString},${valueToInterpolate}${firstSensorString} int.,${valueToInterpolate}${secondSensorString} int.`;
outputString += '\n';
let j = 0;
for (let i = 0; i < earliestSensor.length; i++) {
    outputString += measurementToCSV(earliestSensor, i, 0);

    if (!INTERPOLATE) {
        outputString += '\n';
        continue;
    }
    if (j - 1 > 0 && j < otherSensor.length) {
        outputString += earliestSensor[i][valueToInterpolate] + ',';
        outputString += interpolateMeasurement(otherSensor[j - 1].time.getTime(), otherSensor[j].time.getTime(), otherSensor[j - 1][valueToInterpolate], otherSensor[j][valueToInterpolate], earliestSensor[i].time.getTime()) + ',';
    }
    outputString += '\n';

    while ((j < otherSensor.length) && (i + 1 >= earliestSensor.length || otherSensor[j].time.getTime() < earliestSensor[i + 1].time.getTime())) {
        // console.log(measurementToCSV(otherSensor, j, 4));
        outputString += measurementToCSV(otherSensor, j, 4);


        if (i < earliestSensor.length - 1) {
            outputString += interpolateMeasurement(earliestSensor[i].time.getTime(), earliestSensor[i + 1].time.getTime(), earliestSensor[i][valueToInterpolate], earliestSensor[i + 1][valueToInterpolate], otherSensor[j].time.getTime()) + ',';
            outputString += otherSensor[j][valueToInterpolate] + ',';
        }
        outputString += '\n';


        j++;
    }
}

function measurementToCSV(measurement, i, columnOffset) {
    let output = "";
    output += measurement[i].time.getTime() - earliestSensor[0].time.getTime();
    output += ',';
    for (let j = 0; j < columnOffset; j++) { output += ',' }
    output += measurement[i].temperature;
    output += ',';
    output += measurement[i].humidity;
    output += ',';
    output += measurement[i].pressure;
    output += ',';
    output += measurement[i].voltage;
    output += ',';
    if (columnOffset == 0) for (let j = 0; j < 4; j++) { output += ',' }
    return output;
}
function interpolateMeasurement(time1, time2, measurement1, measurement2, actualTime) {
    let interpolatedMeasurement = measurement1 + (actualTime - time1) * (measurement2 - measurement1) / (time2 - time1);
    return interpolatedMeasurement;
}

// console.log(outputString)


fs.writeFile('./output/output.csv', outputString, { flag: "wx" }, err => {
    if (err) {
        console.error(err)
        return
    }
    //file written successfully
})
