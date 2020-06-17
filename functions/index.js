require('dotenv').config();
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
};
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(firebaseConfig);
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }))

app.get("/purpleAirData/:stationList", async (req, res) => {
  const sta_list = req.params.stationList.split(',');  
  const metaData = "GeoJSON of Purple Air Stations requested by station ID, data from PA API, AQI Index calculated using USEPA methods by NHBP, WGS 84 Coordinate System";
  let stationsObject = { "type": "FeatureCollection", "metadata": metaData, "features": []}, airObject = {}; 
  const airQualityFetch = async (staID) => {
    const airData = await fetch(`https://www.purpleair.com/json?show=${staID}`); 
    const airDataJSON = await airData.json();  
    const {Label, ID, PM2_5Value, Lat, Lon, Flag, Version, RSSI} = airDataJSON.results[0], sta_stats = (airDataJSON.results[0].Stats).split(":");
    //console.log(sta_stats[7].substr(0, 4));
    const pm25_1hour = Number((sta_stats[4]).substr(0, 4)), pm25_24hour = Number((sta_stats[6]).substr(0, 4)), pm25_1week = Number((sta_stats[7]).substr(0, 4));
    //console.log(`${Label} ${ID} ${PM2_5Value} ${Lat} ${Lon} ${pm25_1hour} ${pm25_24hour}`);
    const AQI = await airQualityIndex(PM2_5Value), AQI1Hour = await airQualityIndex(pm25_1hour);
    const AQI24Hour = await airQualityIndex(pm25_24hour), AQI1Week = await airQualityIndex(pm25_1week);
    const diff_val = Math.abs(airDataJSON.results[0].PM2_5Value - airDataJSON.results[1].PM2_5Value).toFixed(2);
    //console.log(`${(await currentAQI).aqi_val} ${(await currentAQI).aqi} ${(await oneHourAQI).aqi_val}`);
    airObject = { 'type': 'Feature', 'properties': {'ID':ID,'label':Label,'flagged_high':Flag,'version':Version,'WiFiSignal':RSSI,
                'PM2_5Value':PM2_5Value,'sensorDiff':diff_val,'AQI':AQI.aqi_val,'AQIText':AQI.aqi,'AQI1Hour':AQI1Hour.aqi_val,'AQI1HourText':AQI1Hour.aqi,
                'AQI24Hour':AQI24Hour.aqi_val,'AQI24HourText':AQI24Hour.aqi,'AQI1Week':AQI1Week.aqi_val,'AQI1WeekText':AQI1Week.aqi},
                'geometry': { 'type':'Point','coordinates': [Lon,Lat] } };
    return airObject;   
  };

  const airQualityIndex = async (airValue) => {
    const c_low = [0, 12.1, 35.5, 55.5, 150.5, 250.5, 350.5], c_high = [12, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4];  
    const aqi_low = [0, 51, 101, 151, 201, 301, 401], aqi_hi = [50, 100, 150, 200, 300, 400, 500];
    const aqi_fac = [4.17, 2.10, 2.46, 0.52, 0.99, 0.99, 0.66]
    const aqi_range = ["Good","Moderate","Unhealthy for Sensitive Groups","Unhealthy","Very Unhealthy","Hazardous","Hazardous"];
    for (z in aqi_range) {
      if (airValue > c_high[z]) {
      //console.log('Status = Current');
      } else { aqi_val = (aqi_fac[z] * (airValue - c_low[z]) + aqi_low[z]); 
          aqi_val = Math.round(aqi_val); 
          aqi = aqi_range[z];
          //console.log(`test function ${airValue}, ${aqi_val}, ${aqi}`);   
          return {aqi_val, aqi};
          }
      }
  };

  try {
    
    for(x in sta_list){
      const stationAQI = await airQualityFetch(sta_list[x]);
      //console.log(await stationAQI);
      stationsObject.features[x] = stationAQI;
    }
    res
    .status(200)
    .send(stationsObject);
    }
  catch (err) {
    console.error("Your AQ Fetch is gone all WRONG");
    res
    .status(400)
    .send('ERROR MESSAGE bad GeoJSON mate!');
    }
});
                               
exports.api = functions.runWith({ memory: '2GB' }).https.onRequest(app);