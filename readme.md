# AirQualityDataServices
This repo contains both backend and frontend services for the NHBP air quality Anemowen Dashboard.  Project was initiated in the summer of 2020, most recent update **May 17th 2021**.   
The project is deployed on GCP via Firebase hosting.  The functions folder contains two endpoints: **/purpleAirData/:stationList** which takes a comma separated list of Purple Air Staion ID's as a URL parameter.  The other endpoint: **/msuWeatherData/:stations** takes a comma separated list of weather station identifiers for the MSU Enviro Weather Service.  Both services return a JSON payload, formatted as GeoJSON with longitude and latitude coordinates (WGS84).   

## **MAY 2021 UPDATES**
Air Quality Data Map shows three separate layers: NHBP Purple Air Stations, other regional purple air sensors, and AirNow.gov regional stations.  NHBP Purple Air Widget, index.html, has most recent sensor ID list for NHBP, also updated map layers at this time.   

Added Firestore Database via Firebase to project to log NHBP stations data every hour, 24 times each day.  The data would record info for the 24 hour and 7 days readings as well.  Currently the data feeding the data records comes from the project endpoint which takes in the sensor IDs, fetches each record, and calculates the AQI based on the PM2_5 values.  The function is currently working to store the data, and next steps are to implement a cron job scheduler.     

8-4-2021 Updated Station widget and air quality map to include 13 active NHBP stations

8-4-2021 - List of NHBP Stations: NHBP|44439, NHBP-ORIOLE|41995, NHBP-LILAC|41993, NHBP-Goat|42005, Hillman, Michigan|41907, NHBP-OTTER|97713, NHBP-OZ|97553, NHBP-PIPER|97743, NHBP-BUSTER|97679, NHBP-BOSTON|91997, NHBP-LILY|92005, NHBP-AIR|97559, NHBP-GOODRICH|95527, NHBP-BUDDYJONES|92021

All stations active except NHBP-LILY|92005

44439,41995,41993,42005,41907,97713,97553,97743,97679,91997,97559,95527,92021 //NHBP-LILY|92005