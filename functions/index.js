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
const db = admin.firestore();
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));

class Feature {
  constructor(id) {
    this.type = 'Feature';
    this.properties = {'ID':id,'label':'','info':'','status':'','val':-1,'units':''};
  }
  id() {return this.properties.ID}
  info() {return this.properties}
  addProp(name,value) {
    try {
      this.properties[name] = value;
      return (`${name}: ${value} added to Feature ID: ${this.id()}`); }
    catch { (`Could NOT add ${name}: ${value}!`) }
  }
  addProps(arr) {
    try { arr.forEach(d => this.properties[d[0]] = d[1])}
    catch { return (`Could NOT add ${arr} to ${this.id()}`) }
  }
};
class GeoPoint extends Feature {
  constructor(id,[lon,lat],props = {}) {
    super(id);
    this.properties.EPSG = 4326, this.properties.source = '', this.properties.crs = 'WGS 84';
    this.geometry = {'type':'Point','coordinates':[lon,lat]};
    Object.entries(props).forEach(([d,i]) => (this.properties[d] = i));
  }  
  geo() {return this.geometry.coordinates}
  crs() {return [(`EPSG:${this.properties.EPSG}`),this.properties.crs]}
};
class FeatureCollection {
  constructor(meta) {
    this.type = 'FeatureCollection';
    this.metadata = meta;
    this.features = [];
  }
  geoType() { try {return this.features[0].geometry.type}
              catch {return "It doesn't appear their are any features yet..."} }
  fCount() {return this.features.length};
  fProps() {try {return this.features[0].properties}
              catch {return "It doesn't appear their are any features yet..."} }
  fPush(feature) {
    try { this.features.push(feature);
      return `Added Feature Number ${this.fCount()}`; }
    catch { return "Cannot add ${feature} to Feature Collection"} }
};


exports.saveData = functions.pubsub.schedule('0 * * * *').onRun(async context => {
  const saveData = await (await fetch('https://purpleairwidget.firebaseapp.com/airData/')).json();
  //const saveData = await airData();
  functions.logger.log(await saveData);
});

const airData = async () => {
  //try {
    const data = await fetch('https://purpleairwidget.firebaseapp.com/purpleAirData/44439,41995,41993,41907,97713,42005');
    const dataJSON = await (data).json();
    console.log('fetch')
    const dataMap = data.features.map(d => { 
      d.properties.time = Date.now(), d.properties.date = new Date();
      r = db.collection('nhbp-pa-data').doc(`${(d.properties.time).toString()}-${(d.properties.ID).toString()}`).set(d.properties);
      return [`Successfully stored station record: ${d.properties.label} - REC ID - ${d.properties.time}`, d.properties];
    });
    return await dataMap;
  //}
  //catch (err) {
  //  console.error('FIRESTORE DB AQ DATA ERROR');
  //}
};
//airData();

// Firestore Test DB function 5-16-2021
app.get("/airData/", async (req, res) => {
  try {
    const data = await (await fetch('https://purpleairwidget.firebaseapp.com/purpleAirData/44439,41995,41993,41907,97713,42005')).json();
    const dataMap = data.features.map(d => { 
      d.properties.time = Date.now(), d.properties.date = new Date();
      r = db.collection('nhbp-pa-data').doc(`${(d.properties.time).toString()}-${(d.properties.ID).toString()}`).set(d.properties);
      return [`Successfully stored station record: ${d.properties.label} - REC ID - ${d.properties.time}`, d.properties];
    });
    res
    .set('Access-Control-Allow-Origin', '*')
    .status(200)
    .send(dataMap);
  }
  catch (err) {
    console.error('FIRESTORE DB ERROR');
    res
    .status(400)
    .send('FIRESTORE DB ERROR');
  }
});

//const locData = [{"Latitude":41.6967,"Longitude":-86.2147,"UTC":"2021-02-23T16:00","Parameter":"PM2.5","Unit":"UG/M3","Value":7.3,"RawConcentration":7.05,"AQI":30,"Category":1,"SiteName":"South Bend-Shields Dr","AgencyName":"Indiana Dept. of Environmental Management","FullAQSCode":"181410015","IntlAQSCode":"840181410015"},{"Latitude":42.767799,"Longitude":-86.148598,"UTC":"2021-02-23T16:00","Parameter":"PM2.5","Unit":"UG/M3","Value":4.8,"RawConcentration":3.8,"AQI":20,"Category":1,"SiteName":"HOLLAND","AgencyName":"Michigan Department of Environment, Great Lakes, and Energy","FullAQSCode":"260050003","IntlAQSCode":"840260050003"},{"Latitude":41.656944,"Longitude":-85.96833,"UTC":"2021-02-23T16:00","Parameter":"PM2.5","Unit":"UG/M3","Value":5.3,"RawConcentration":-999,"AQI":22,"Category":1,"SiteName":"Elkhart-Prairie St.","AgencyName":"Indiana Dept. of Environmental Management","FullAQSCode":"180390008","IntlAQSCode":"840180390008"},{"Latitude":42.984699,"Longitude":-85.671097,"UTC":"2021-02-23T16:00","Parameter":"PM2.5","Unit":"UG/M3","Value":5.6,"RawConcentration":5.2,"AQI":23,"Category":1,"SiteName":"GRAND RAPIDS","AgencyName":"Michigan Department of Environment, Great Lakes, and Energy","FullAQSCode":"260810020","IntlAQSCode":"840260810020"}];
app.get("/miAirNow/", async (req, res) => {
  try {
    // getData async data fetch function
    const getData = async () => {
      const url = 'https://www.airnowapi.org/aq/data/?parameters=PM25&BBOX=-86.499991,41.465108,-82.852530,44.892602&dataType=B&format=application/json&verbose=1&nowcastonly=0&includerawconcentrations=1&API_KEY=9F2110A4-9094-4BE9-9858-258D4F6959B2';
      const data = await fetch(url);
      const dataJSON = await data.json();
      return dataJSON;
      //return locData; //for local testing
    }
    const geoData = async (data) => {
      geo = new FeatureCollection('Air Quality Stations centered in Michigan from AirNow.gov');
      data.forEach(d => {
        gp = new GeoPoint(d.SiteName,[d.Longitude,d.Latitude],d);
        geo.fPush(gp);
      });
      return geo;
    };
    res
    .set('Access-Control-Allow-Origin', '*')
    .status(200)
    .send(await geoData(await getData()));
  }
  catch (err) {
    console.error('Your AQ airNow.gov data is not happening');
    res
    .status(400)
    .send('Your AQ airNow.gov data is not happening');
  }
});

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
                'PM2_5Value':PM2_5Value,'PM2_5_1hour':pm25_1hour,'PM2_5_24hour':pm25_24hour,'PM2_5_1week':pm25_1week,'sensorDiff':diff_val,'AQI':AQI.aqi_val,'AQIText':AQI.aqi,'AQI1Hour':AQI1Hour.aqi_val,'AQI1HourText':AQI1Hour.aqi,
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
    .set('Access-Control-Allow-Origin', '*')
    .status(200)
    .send(stationsObject);
    }
  catch (err) {
    console.error("Your AQ Fetch is gone all WRONG");
    res
    .status(400)
    .send('Your AQ Fetch is gone all WRONG');
    }
});
                               
app.get('/msuWeatherData/:stations', async (request, response) => {
      const browser1 = await puppeteer.launch({headless: true, devtools: false, 
        args: ['--no-sandbox', '--user-data-dir=./chromeData', '--disable-setuid-sandbox']});
      const browser2 = await puppeteer.launch({headless: true, devtools: false,
        args: ['--no-sandbox', '--user-data-dir=./chromeData', '--disable-setuid-sandbox']});
      const page1 = await browser1.newPage();
      const page2 = await browser2.newPage();
      
  try {
      const sta_list = request.params.stations.split(',');  
      let scrapeRecord = await stationScrape(sta_list);
      browser1.close(); 
      browser2.close();
      response
      .set('Access-Control-Allow-Origin', '*')
      .status(200)
      .json(scrapeRecord);   
  } catch (error) {
      console.log('ERROR!!!!');
  }  
//abbreviations for weather station locations
//meta function - loops through list of station IDs
async function stationScrape(stationList) {
  console.log(stationList);
  //let stationList = ['men''cld', 'cer', 'alb', 'cnt', 'kzo'];
  
  const urlData = 'https://enviroweather.msu.edu/weather.php?stn=';
  const urlCoords = 'https://mawn.geo.msu.edu/station.asp?id=';
  var scrapeRun = [];
  var scrapeStats = {};
  try {
      let x = 0;
      for(staID of stationList) {
          scrapeStats = await scrapeSite((urlData + staID), (urlCoords + staID), staID);
          console.log("StationID:" + staID); 
          scrapeRun[x] = scrapeStats;
          x++;
      }         
  }
  catch {
      console.log("error return");
  }
  return (scrapeRun);
}       
//this is primary scraper function, url is passed with staID added to end of address
async function scrapeSite(url1, url2, id) {
  //station data page access to scrape
  console.log("Scraping:" + id);
  await page1.goto(url1);
  //geolocation coordinates are on a separate page, also load that page :()
  await page2.goto(url2);
  let [el] = "", txt, valTxt, [el2] = "", txt2, labelTxt, [el3] = "", txt3, titleTxt, testTxt,
  scrapeError = 'FALSE', keyIndex = 0, [el4] ="", txt4, lonLat, trmTxt;
  //Title of station - outside of parameters loop
  [el3] = await page1.$x('//*[@id="weatherPadding"]/h1');
  txt3 = await el3.getProperty('textContent');
  titleTxt = await txt3.jsonValue();
  var jsonObject = { type:"Feature", properties: {stationID: staID, stationName: titleTxt }};
  let keyList = ['airTemp', 'rainfallToday', 'relHumidity', 'dewpoint', 'windDir', 'windSpeed', 'leafWetness'];     
  //Loop through all parameters shown on station webpage, stop when next value is undefined
  for (i=2; scrapeError!='TRUE';i++) {
      try {
          [el] = await page1.$x('//*[@id="latestObsWeather"]/table/tbody/tr[' + i +']/td');
          txt = await el.getProperty('textContent');
          trmTxt = await txt.jsonValue(), valTxt = trmTxt.trim();
          [el2] = await page1.$x('//*[@id="latestObsWeather"]/table/tbody/tr[' + i + ']/th');
          txt2 = await el2.getProperty('textContent');
          labelTxt = await txt2.jsonValue();
      } catch (error) {
          console.log('ERROR eh?');
          scrapeError = 'TRUE';
      }
      try {
          //test of next set of text values to see if at end of list
          [eltest] = await page1.$x('//*[@id="latestObsWeather"]/table/tbody/tr[' + (i+1) +']/td');
          txtest = await eltest.getProperty('textContent');
          testTxt = await txtest.jsonValue();
      } catch (error) {
          console.log('End of parameters');
          scrapeError = 'TRUE';
      }  
  jsonObject.properties[keyList[keyIndex]] = valTxt;
  keyIndex++
  }
  jsonObject.geometry = {type:"Point", coordinates: [-1, -1]};
  //scrape coordinates from url2
  for (x=0;x<2;x++) {
      [el4] = await page2.$x('/html/body/table/tbody/tr[2]/td/table[1]/tbody/tr/td[1]/table/tbody/tr[' + (x+7) + ']/td[2]');
      txt4 = await el4.getProperty('textContent');
      let coordsTemp = await txt4.jsonValue();
      lonLat = coordsTemp.substring(0, 8);
      jsonObject.geometry.coordinates[1-x] = lonLat;
  }
  console.log("Finished Scraping:" + id);
  return jsonObject;
}
//browser1.close(); 
//browser2.close();
}); 

exports.api = functions.runWith({ memory: '2GB' }).https.onRequest(app);