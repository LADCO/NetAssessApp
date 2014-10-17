library(shiny)
library(sp)

shinyServer(function(input, output, session) {
  
  updateSelectInput(session, "expParam", choices = params.list)
  
  # This stores a makeshift bounding box to subset the monitors on
  bbox <- reactive({

    north = input$mapBounds$bounds[[2]]$lat
    east = input$mapBounds$bounds[[2]]$lng
    south = input$mapBounds$bounds[[1]]$lat
    west = input$mapBounds$bounds[[1]]$lng
    print(input$mapBounds$zoom)
    vert = min((north - south) / 2, 4)
    horz = min(abs(west - east) / 2, 4)
    
    north = north + vert
    east = east + horz
    south = south - vert
    west = west - horz
    
    list(north = north, east = east, south = south, west = west)
    
  })
  
  localTracts <- reactive({
    subset(tracts, lat > bbox()$south & lat < bbox()$north & lng > bbox()$west & lng < bbox()$east)
  })
  
  sites <- reactive({
    if(!is.null(input$expParam)) {
      if(input$expParam != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.Key, sites.Latitude, sites.Longitude FROM sites JOIN monitors ON sites.Key =  monitors.Site_Key WHERE monitors.PARAMETER = ", input$expParam))
        site.list <- unique(site.list[site.list$Latitude <= bbox()$north & 
                                      site.list$Latitude >= bbox()$south &
                                      site.list$Longitude >= bbox()$west &
                                      site.list$Longitude <= bbox()$east, ])
        return(site.list)
      } else {return(NULL)}
    } else {return(NULL)}
  })
  
  observe({
    if(!is.null(sites())) {
      ss <- Sys.time()
      keys <- unique(sites()$Key)
      session$sendCustomMessage(type="showMonitors", keys)
      
      if(input$expParam %in% aSapp & nrow(sites()) <= 400 & nrow(sites()) >= 2) {
        print(ss)
        v <- voronoi(sites()$Key, sites()$Latitude, sites()$Longitude, usborder)
        ov <- over(localTracts(), v)
        t <- cbind(localTracts()@data, ov)
        t <- t[!is.na(t$id), ]
        d <- aggregate(t[, 3:47], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
        voronoi <- lapply(v@polygons, function(p) {
          lapply(p@Polygons, function(pp) {
            coords <- pp@coords
            apply(coords, 1, function(r) {
              list(lat = r[[2]], lng = r[[1]])
            })
          })
        })
        proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
        (areaPolygons(v, CRS("+init=epsg:2163")))
        session$sendCustomMessage(type = "showArea", voronoi)
      }
      print(Sys.time() - ss)
    }
  })
  
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
  
  observe({
    
    if(!is.null(input$areaSelectSelect)) {
      
      type <- toupper(isolate(input$areaSelect))
      
      src <- switch(type, STATE = "states", CBSA = "cbsas", CSA = "csas")

      q <- paste0("SELECT GEOMETRY FROM ", src, " WHERE CODE = '", input$areaSelectSelect, "'")

      coords <- eval(parse(text = dbGetQuery(db, q)[1,1]))
      
      session$sendCustomMessage(type="displayArea", list(properties = list(name = "test", type = type, id = input$areaSelectSelect), coords = coords))
      
    }
    
  })


})


