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
      sites <- isolate(sites())
      return(sites[sites$Key %in% isolate(input$selectedSites), c("Key", "Latitude", "Longitude")])
    }
  })

  selectedNeighbors <- reactive({

    ss <- selectedSites()
    sites <- isolate(sites())
    
    if(!is.null(ss)) {
      bounds <- list(list(24.4, -124.8), list(49.4, -66.9))
      
      us.lats <- c(24.4, 49.4)
      us.lngs <- c(-124.8, -66.9)
      
      lats <- range(ss$Latitude)
      lngs <- range(ss$Longitude)
      lat.rng <- abs(lats[2] - lats[1])
      lng.rng <- abs(lngs[2] - lngs[1])
      
      gtG <- FALSE
      
      while(!gtG) {
        
        lats.test <- c(max(lats[1] - lat.rng, us.lats[1]), min(lats[2] + lat.rng, us.lats[2]))
        lngs.test <- c(max(lngs[1] - lng.rng, us.lngs[1]), min(lngs[2] + lng.rng, us.lngs[2]))

        neighbors <- unique(sites[sites$Latitude >= lats.test[1] & sites$Latitude <= lats.test[2] & sites$Longitude >= lngs.test[1] & sites$Longitude <= lngs.test[2], ])
      
        new.lats <- range(neighbors$Latitude)
        new.lngs <- range(neighbors$Longitude)
        
        if((new.lats[1] < lats[1] | new.lats[1] <= us.lats[1]) &
           (new.lats[2] > lats[2] | new.lats[2] >= us.lats[2]) &
           (new.lngs[1] < lngs[1] | new.lngs[1] <= us.lngs[1]) &
           (new.lngs[2] > lngs[2] | new.lngs[2] >= us.lngs[2])) {
          gtG = TRUE
        }
        
        lat.rng <- lat.rng * 2
        lng.rng <- lng.rng * 2
        
      }
      
      neighbors <- neighbors[!duplicated(neighbors[, c("Latitude", "Longitude")]), ]
      v <- deldir(neighbors$Longitude, neighbors$Latitude)
      x <- v$delsgs
      x$ind1 <- neighbors$Key[x$ind1]
      x$ind2 <- neighbors$Key[x$ind2]
      x <- x[x$ind1 %in% ss$Key | x$ind2 %in% ss$Key, ]
      x <- unique(c(x$ind1, x$ind2))
    
      return(neighbors[neighbors$Key %in% x, ])
    
    }
    
  })

  polygons <- reactive({
    ss <- isolate(selectedSites())
    sn <- selectedNeighbors()
    if(!is.null(ss)) {
      if(nrow(ss) <= 300 & nrow(ss) >= 2) {
        v <- voronoi(sn$Key, sn$Latitude, sn$Longitude, usborder)
        v <- isolate({subset(v, id %in% ss$Key)})
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
      polygons <- polygons()
      v <- lapply(seq(nrow(polygons)), function(i) {
        list(id = unlist(strsplit(polygons@polygons[[i]]@ID, " "))[1], 
             coords = lapply(polygons@polygons[[i]]@Polygons, function(pp) {
                coords <- pp@coords
                apply(coords, 1, function(r) {
                  list(lat = r[[2]], lng = r[[1]])
                })
              })
        )
      })
      session$sendCustomMessage(type = "showArea", v)
    }
  })

  output$areaServed <- renderText({
    input$clickedAreaServed
    polygons <- isolate({polygons()})
    if(!is.null(polygons)) {
      data <- polygons@data
      txt <- paste(data$area[data$id == input$clickedAreaServed], "square km")
    } else {
      txt <- ""
    }
    return(txt)
  })

output$totalPopServed <- renderText({
  input$clickedAreaServed
  polygons <- isolate({polygons()})
  if(!is.null(polygons)) {
    data <- polygons@data
    txt <- paste(data$total[data$id == input$clickedAreaServed], "Total Population")
  } else {
    txt <- ""
  }
  return(txt)
})

  output$agePlot <- renderPlot({
    input$clickedAreaServed
    print(1)
    if(!is.null(input$clickedAreaServed)) {
      title <- isolate(sites()[sites()$Key %in% input$clickedAreaServed, ])
      print(title)
      if(nrow(title) > 0) {
        
        title <- paste0("Population served by ",
                        sprintf("%02i-%03i-%04i", title$State_Code, title$County_Code, title$Site_ID))
        gg <- agePyramid(polygons()@data, input$clickedAreaServed) + ggtitle(title)
        print(gg)
      } else {
        return(NULL)
      }  
      
    }
  }, width = 400, height = 450)


})

