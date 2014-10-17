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
  
  polygons <- reactive({
    if(!is.null(sites())) {
      if(input$expParam %in% aSapp & nrow(sites()) <= 400 & nrow(sites()) >= 2) {
        v <- voronoi(sites()$Key, sites()$Latitude, sites()$Longitude, usborder)
        ov <- over(localTracts(), v)
        t <- cbind(localTracts()@data, ov)
        t <- t[!is.na(t$id), ]
        d <- aggregate(t[, 3:47], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
        proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
        area <- areaPolygons(v, CRS("+init=epsg:2163"))
        v@data <- merge(v@data, d, by.x="id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
        v@data <- cbind(v@data, area = area)
        ids <- sapply(v@data$id, function(i) {strsplit(i, " ")[[1]][1]})
        v@data$id <- ids
      } else {v <- NULL}
    } else {v <- NULL}
    return(v)
  })
  
  observe({
    if(!is.null(sites())) {
      ss <- Sys.time()
      keys <- unique(sites()$Key)
      session$sendCustomMessage(type="showMonitors", keys)
    }
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
      session$sendCustomMessage(type = "showArea", v)
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

  output$agePlot <- renderPlot({
    
    data <- polygons()@data
    ggplot(data=data,aes(x=as.factor(v),fill=g)) + 
      geom_bar(subset=.(g=="F")) + 
      geom_bar(subset=.(g=="M"),aes(y=..count..*(-1))) + 
      scale_y_continuous(breaks=seq(-40,40,10),labels=abs(seq(-40,40,10))) + 
      coord_flip()
    
  })

})


