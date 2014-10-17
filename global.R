library(RSQLite)
library(sp)
library(deldir)
library(rgeos)
require(ggplot2)
require(plyr)

source("R/voronoi.R")
load("data/tracts.rda")
load("data/usborder.rda")

db <- dbConnect(SQLite(), dbname = "data/netassess.sqlite")

aSapp <- c(42401, 44201, 88101, 88502)

states <- unique(dbGetQuery(db, "SELECT CODE, NAME FROM states"))
state.list <- states$CODE
names(state.list) <- states$NAME

cbsa <- dbGetQuery(db, "SELECT CODE, NAME FROM cbsas")
cbsa.list <- cbsa$CODE
names(cbsa.list) <- cbsa$NAME

csa <- dbGetQuery(db, "SELECT CODE, NAME FROM csas")
csa.list <- csa$CODE
names(csa.list) <- csa$NAME

params <- dbGetQuery(db, "SELECT Parameter_Code, Parameter_Desc, Count FROM params")
params.list <- params$Parameter_Code
names(params.list) <- paste(params$Parameter_Code, params$Parameter_Desc, sep = " - ")
params.list <- c("None" = -1, params.list)

createSites <- function() {
  
  jsonArray <- function(a, quote = FALSE) {
    if(quote) {
      op <- paste0('["', paste0(a, collapse = '", "'), '"]')
    } else {
      op <- paste0("[", paste0(a, collapse = ", "), "]")      
    }
    return(op)
  }
  
  jsonObject <- function(o) {
    
    n <- paste0('"', names(o), '"')
    p <- sapply(o, function(x) {
      if((substr(x, 1, 1) == "[" & substr(x, nchar(x), nchar(x)) == "]") |
         (substr(x, 1, 1) == "{" & substr(x, nchar(x), nchar(x)) == "}")) {
        op <- x
      } else {
        op <- paste0('"', x, '"')
      }
      return(op)
    })
    paste0("{", paste(n, p, sep = ": ", collapse = ", "), "}")
    
  }
  
  mons <- dbGetQuery(db, "SELECT * FROM sites")
  latlng <- paste(mons$Latitude, mons$Longitude, sep = "_")
  dup <- duplicated(latlng)
  s <- mons[!dup, ]
  d <- mons[dup, ]
  sites <- sapply(seq(nrow(s)), function(r) {
    
    alt <- d$Latitude == s$Latitude[r] & d$Longitude == s$Longitude[r]
    key <- s$Key[r]
    site_id <- sprintf("%02i-%03i-%04i", s$State_Code[r], s$County_Code[r], s$Site_ID[r])
    if(sum(alt) > 0) {
      key <- c(key, d$Key[alt])
      site_id <- c(site_id, sprintf("%02i-%03i-%04i", d$State_Code[alt], d$County_Code[alt], d$Site_ID[alt]))
      s$Count[r] <- s$Count[r] + sum(d$Count[alt])
      s$Crit_Count[r] <- s$Crit_Count[r] + sum(d$Crit_Count[alt])
      s$HAP_Count[r] <- s$HAP_Count[r] + sum(d$HAP_Count[alt])
      s$Met_Count[r] <- s$Met_Count[r] + sum(d$Met_Count[alt])
    }
    key <- jsonArray(key)
    site_id <- jsonArray(site_id, TRUE)

    properties <- c(key = key, site_id = site_id, as.list(s[r, c("State_Code", "County_Code", "Street_Address", "Count", "Crit_Count", "HAP_Count", "Met_Count")]))
    properties$Street_Address <- gsub("'", "&#039;", properties$Street_Address, fixed = TRUE)
    properties$Street_Address <- gsub('"', "&quot;", properties$Street_Address, fixed = TRUE)
    properties <- jsonObject(properties)
    geometry <- jsonObject(list(type = "Point", coordinates = jsonArray(c(s$Longitude[r], s$Latitude[r]))))

    return(jsonObject(list(type = "Feature", geometry = geometry, properties = properties)))
    
  })
  
  write(jsonObject(list(type = "FeatureCollection", features = jsonArray(sites))), file = "www/data/sites.geojson")

}

createSites()

areaPolygons<- function(spPoly, proj4string = NULL) {
  if(class(spPoly)[[1]] != "SpatialPolygonsDataFrame" & class(spPoly)[[1]] != "SpatialPolygons") {
    stop("spPoly must be a SpatialPolygonsDataFrame or a SpatialPolygons object.")
  }
  require(sp)
  require(rgdal)
  if(!is.null(proj4string)) {
    if(class(proj4string)[[1]] != "CRS") {
      stop("The proj4string must be of class CRS")
    }
    spP <- spTransform(spPoly, CRS = proj4string)
  }
  else {
    spP <- spPoly
  }
  areas <- unlist(lapply(spP@polygons, function(x) a <- x@area))
  return(round(areas * 3.86101e-7, 1))
}


