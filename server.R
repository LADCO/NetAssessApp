library(shiny)
library(sp)

shinyServer(function(input, output, session) {
  
#### Functions for controlling parameter selection
  
  # Populate the parameter selection dropdown  
  updateSelectInput(session, "expParam", choices = params.list)
  
  # Contains a list of sites based on the currently selected parameter
  sites <- reactive({
    if(!is.null(input$expParam)) {
      if(input$expParam != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.Key, sites.State_Code, sites.County_Code, sites.Site_ID, sites.Latitude, sites.Longitude FROM sites JOIN monitors ON sites.Key =  monitors.Site_Key WHERE monitors.PARAMETER = ", input$expParam))
# This code subsets the site.list based on a bounding box provided by the map
# This may improve performance of the browser (especially Firefox)
#        site.list <- unique(site.list[site.list$Latitude <= bbox()$north & 
#                                        site.list$Latitude >= bbox()$south &
#                                        site.list$Longitude >= bbox()$west &
#                                        site.list$Longitude <= bbox()$east, ])
        return(site.list)
      } else {return(NULL)}
    } else {return(NULL)}
  })
  
  # Send a custom message to update visible monitors based on parameter selection
  observe({
    if(!is.null(sites())) {
      keys <- unique(sites()$Key)
    } else {
      keys <- list()
    }
    session$sendCustomMessage(type="showMonitors", keys)
  })

#### Functions for controlling the Area of Interest Selection

  # Observer to update predefined area select input based on Area Type
  observe({
    
    if(!is.null(input$areaSelect)) {
      
      if(input$areaSelect=="State") {
        choices = state.list
      } else if(input$areaSelect == "CBSA") {
        choices = cbsa.list
      } else if(input$areaSelect == "CSA") {
        choices = csa.list
      } else {
        choices = c("")
      }
      
      updateSelectInput(session, "areaSelectSelect", choices = choices)
      
    }
    
  })

  # Send the geometry for a predefined area selection
  observe({
    
    if(!is.null(input$areaSelectSelect)) {
      
      type <- toupper(isolate(input$areaSelect))
      
      src <- switch(type, STATE = "states", CBSA = "cbsas", CSA = "csas")
      
      q <- paste0("SELECT GEOMETRY FROM ", src, " WHERE CODE = '", input$areaSelectSelect, "'")
      
      coords <- eval(parse(text = dbGetQuery(db, q)[1,1]))
      
      session$sendCustomMessage(type="displayPredefinedArea", list(properties = list(name = "test", type = type, id = input$areaSelectSelect), coords = coords))
      
    }
    
  })

##### Area Served Functions

  selectedSites <- reactive({
    if(input$areaServedCalcButton > 0) {
      session$sendCustomMessage(type = "showLoading", TRUE)
      return(sites()[sites()$Key %in% isolate(input$selectedSites), c("Key", "Latitude", "Longitude")])
    }
  })

  selectedNeighbors <- reactive({
    
    lats <- list(min(selectedSites()$Latitude), max(selectedSites()$Latitude))
    lngs <- list(min(selectedSites()$Longitude), max(selectedSites()$Longitude))
    
    lat.rng <- abs(lats[[2]] - lats[[1]]) * 1.5
    lng.rng <- abs(lngs[[2]] - lngs[[1]]) * 1.5
    
    lats <- list(lats[[1]] - lat.rng, lats[[2]] + lat.rng)
    lngs <- list(lngs[[1]] - lng.rng, lngs[[2]] + lng.rng)
    
    neighbors <- unique(sites()[sites()$Latitude >= lats[[1]] & sites()$Latitude <= lats[[2]] & sites()$Longitude >= lngs[[1]] & sites()$Longitude <= lngs[[2]], ])
    v <- deldir(neighbors$Longitude, neighbors$Latitude)
    x <- v$delsgs
    x$ind1 <- neighbors$Key[x$ind1]
    x$ind2 <- neighbors$Key[x$ind2]
    x <- x[x$ind1 %in% selectedSites()$Key | x$ind2 %in% selectedSites()$Key, ]
    x <- unique(c(x$ind1, x$ind2))
    return(neighbors[neighbors$Key %in% x, ])
    
  })

  polygons <- reactive({
    if(!is.null(selectedSites())) {
      if(nrow(selectedSites()) <= 300 & nrow(selectedSites()) >= 2) {
        v <- voronoi(selectedNeighbors()$Key, selectedNeighbors()$Latitude, selectedNeighbors()$Longitude, usborder)
        v <- subset(v, id %in% selectedSites()$Key)
        ov <- over(tracts, v)
        t <- cbind(tracts@data, ov)
        t <- t[!is.na(t$id), ]
        d <- aggregate(t[, 3:47], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
        proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
        area <- areaPolygons(v, CRS("+init=epsg:2163"))
        v@data <- merge(v@data, d, by.x="id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
        v@data <- cbind(v@data, area = area)
        ids <- sapply(v@data$id, function(i) {strsplit(i, " ")[[1]][1]})
        v@data$id <- ids
      } else {
        v <- NULL
      }
    } else {
      v <- NULL
    }
    return(v)
  })

  observe({
    if(!is.null(polygons())) {
      v <- lapply(polygons()@polygons, function(p) {
        lapply(p@Polygons, function(pp) {
          coords <- pp@coords
          apply(coords, 1, function(r) {
            list(lat = r[[2]], lng = r[[1]])
          })
        })
      })
      session$sendCustomMessage(type = "hideLoading", TRUE)
      session$sendCustomMessage(type = "showArea", v)
    }
  })

})


