library(RSQLite)
library(sp)
library(deldir)

db <- dbConnect(SQLite(), dbname = "data/netassess.sqlite")

states <- unique(dbGetQuery(db, "SELECT State_Code, State_Name FROM states"))
state.list <- states$State_Code
names(state.list) <- states$State_Name

cbsa <- dbGetQuery(db, "SELECT CODE, NAME FROM cbsas")
cbsa.list <- cbsa$CODE
names(cbsa.list) <- cbsa$NAME

csa <- dbGetQuery(db, "SELECT CODE, NAME FROM csas")
csa.list <- csa$CODE
names(csa.list) <- csa$NAME



mons <- dbGetQuery(db, "SELECT monitors.Parameter, monitors.POC, monitors.Key,
                                monitors.Date_Sampling_Began, sites.State_Code, 
                                sites.County_Code, sites.Site_ID, 
                                sites.Latitude, sites.Longitude, 
                                sites.Street_Address 
                         FROM monitors 
                         JOIN sites ON monitors.Site_Key = sites.Key")

s <- split(mons, paste(mons$Longitude, mons$Latitude))

sites <- lapply(s, function(df) {
  
  site_id <- unique(sprintf("%02i-%03i-%04i", df$State_Code, df$County_Code, df$Site_ID))
  geometry <- paste0("[", df$Longitude[1], ", ", df$Latitude[1], "]")
  monitors <- apply(df, 1, function(r) {
    paste0('{"Key": ', r[['Key']], ', "Parameter": ', r[['Parameter']], ', "POC": ', r[['POC']], ', "Start_Date": "', r[['Date_Sampling_Began']], '"}')
  })
  monitors <- paste0("[", paste0(monitors, collapse = ", "), "]")
  site <- paste0('{"type": "Feature", "geometry": {"type": "Point", "coordinates": ', geometry, '}, "properties": {"monitors": ', monitors, '}}')
  return(site)
  
})

sites <- paste('{"type": "FeatureCollection", "features": [', paste(sites, collapse = ', '), ']}')

write(sites, file = "www/data/sites.geojson")





# names(sites) <- NULL
# 
# writeGeoJSONPoint <- function(df, digits = 4) {
#   
#   f <- paste0(apply(df, 1, function(r) {
#     y <- paste0('{"type": "Feature", "geometry": {"type": "Point", "coordinates": [', round(as.numeric(r['LONGITUDE']), digits), ', ', round(as.numeric(r['LATITUDE']), digits), ']},')
#     props <- r[!names(r) %in% c("LATITUDE", "LONGITUDE")]
#     if(length(props) > 0) {
#       props <- paste(paste0('"', names(props), '"'), paste0('"', props, '"'), sep = ": ", collapse = ", ")
#     } else {
#       props <- ""
#     }
#     y <- paste0(y, ' "properties": {', props, '}}')
#   }), collapse = ", ")
#   
#   paste('{"type": "FeatureCollection", "features": [', f, ']}')
#   
# }
# 
# 
# 
# 
# 
# 
# 
# 
# o3mon <- dbGetQuery(db, "SELECT DISTINCT monitors.LOCATION_ID, sites.STATE_CODE, sites.CBSA_CODE, sites.CSA_CODE, sites.LATITUDE, sites.LONGITUDE FROM monitors JOIN sites ON monitors.LOCATION_ID = sites.LOCATION_ID WHERE monitors.PARAMETER_CODE = '44201'")
# o3del <- deldir(as.numeric(o3mon$LONGITUDE), as.numeric(o3mon$LATITUDE))
# o3w <- tile.list(o3del)
# write(writeGeoJSONPoint(o3mon), file = "www/data/o3mon.geojson")
# 
# pm25mon <- dbGetQuery(db, "SELECT DISTINCT monitors.LOCATION_ID, sites.STATE_CODE, sites.CBSA_CODE, sites.CSA_CODE,  sites.LATITUDE, sites.LONGITUDE FROM monitors JOIN sites ON monitors.LOCATION_ID = sites.LOCATION_ID WHERE monitors.PARAMETER_CODE = '88101'")
# write(writeGeoJSONPoint(pm25mon), file = "www/data/pm25mon.geojson")