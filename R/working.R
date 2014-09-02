library(sp)
library(deldir)
library(maptools)
library(rgeos)

source("area.served/voronoi.R")

load("area.served/data/o3network.rda")
load("area.served/data/tracts.rda")
load("area.served/data/us.border.rda")

area.served <- function(id, lat, lon, boundary, data.frame = FALSE) {
  
  if(!missing(boundary)) {
    v <- voronoi(id, lat, lon, boundary)
  else {
    v <- voronoi(id, lat, lon)
  }
  
  ov <- over(tracts, v)
  tracts@data <- cbind(tracts@data, ov)

  data <- tracts@data
  data$id <- as.character(data$id)
  
  ids <- as.character(data$id)
  data2 <- data[, c(8:51)]
  
  data2 <- aggregate(data2, by = list(ids), FUN = sum)
  data2$POP10_SQMI <- data2$POP10 / data2$SQMI
  data2$POP12_SQMI <- data2$POP12 / data2$SQMI
  
}

v <- voronoi(o3$MONITOR_ID, o3$LATITUDE, o3$LONGITUDE, us.border)

v <- voronoi(o3$MONITOR_ID, o3$LATITUDE, o3$LONGITUDE)

ov <- over(tracts, v)
tracts@data <- cbind(tracts@data, ov)

data <- tracts@data
data$id <- as.character(data$id)

ids <- as.character(data$id)
data2 <- data[, c(8:51)]


data2 <- aggregate(data2, by = list(ids), FUN = sum)
colnames(data2)[1] <- "id"
data3 <- v@data
data3$id = unlist(strsplit(data3$id, " .*"))
data3 <- merge(data2, data3, by = "id", all.y = TRUE)
v@data <- data3

census <- readShapePoly("C:/Users/ebailey/mapdata/tracts2010.shp")

mon.area <- unionSpatialPolygons(census, ov$id)
census2 <- SpatialPolygonsDataFrame(census2, data = census@data)
writeOGR(census2, "census", layer ="", driver="GeoJSON")


points <- SpatialPointsDataFrame(list(o3$LONGITUDE, o3$LATITUDE), data.frame(o3$MONITOR_ID))
writeOGR(points, "points", layer ="", driver="GeoJSON")
