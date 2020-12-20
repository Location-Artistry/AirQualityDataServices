# AirQualityDataServices
This repo contains both backend and frontend services for the NHBP air quality Anemowen Dashboard.  Project was initiated in the summer of 2020, most recent update **December 20th 2020**.   
The project is deployed on GCP via Firebase hosting.  The functions folder contains two endpoints: **/purpleAirData/:stationList** which takes a comma separated list of Purple Air Staion ID's as a URL parameter.  The other endpoint: **/msuWeatherData/:stations** takes a comma separated list of weather station identifiers for the MSU Enviro Weather Service.  Both services return a JSON payload, formatted as GeoJSON with longitude and latitude coordinates (WGS84).   

HTML webpages are located in the public folder and are as follows:
