library(RSQLite)

db <- dbConnect(SQLite(), dbname = "data/netassess.sqlite")

states <- dbGetQuery(db, "SELECT CODE, NAME FROM STATES")
state.list <- states$CODE
names(state.list) <- states$NAME

cbsa <- dbGetQuery(db, "SELECT CODE, NAME FROM CBSA")
cbsa.list <- cbsa$CODE
names(cbsa.list) <- cbsa$NAME

csa <- dbGetQuery(db, "SELECT CODE, NAME FROM CSA")
csa.list <- csa$CODE
names(csa.list) <- csa$NAME

writeGeoJSONPoint <- function(df, digits = 4) {
  
  f <- paste0(apply(df, 1, function(r) {
    y <- paste0('{"type": "Feature", "geometry": {"type": "Point", "coordinates": [', round(as.numeric(r['LONGITUDE']), digits), ', ', round(as.numeric(r['LATITUDE']), digits), ']},')
    props <- r[!names(r) %in% c("LATITUDE", "LONGITUDE")]
    if(length(props) > 0) {
      props <- paste(paste0('"', names(props), '"'), paste0('"', props, '"'), sep = ": ", collapse = ", ")
    } else {
      props <- ""
    }
    y <- paste0(y, ' "properties": {', props, '}}')
  }), collapse = ", ")
  
  paste('{"type": "FeatureCollection", "features": [', f, ']}')
  
}

o3mon <- dbGetQuery(db, "SELECT DISTINCT monitors.LOCATION_ID, sites.STATE_CODE, sites.CBSA_CODE, sites.CSA_CODE, sites.LATITUDE, sites.LONGITUDE FROM monitors JOIN sites ON monitors.LOCATION_ID = sites.LOCATION_ID WHERE monitors.PARAMETER_CODE = '44201'")
write(writeGeoJSONPoint(o3mon), file = "www/data/o3mon.geojson")

pm25mon <- dbGetQuery(db, "SELECT DISTINCT monitors.LOCATION_ID, sites.STATE_CODE, sites.CBSA_CODE, sites.CSA_CODE,  sites.LATITUDE, sites.LONGITUDE FROM monitors JOIN sites ON monitors.LOCATION_ID = sites.LOCATION_ID WHERE monitors.PARAMETER_CODE = '88101'")
write(writeGeoJSONPoint(pm25mon), file = "www/data/pm25mon.geojson")