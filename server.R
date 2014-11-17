library(shiny)

shinyServer(function(input, output, session) {
  
#### Functions for controlling parameter selection
  
  # Populate the parameter selection dropdown  
  updateSelectInput(session, "expParam", choices = params.list)
  
  # Contains a list of sites based on the currently selected parameter
  sites <- reactive({
    if(!is.null(input$expParam)) {
      if(input$expParam != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.* FROM sites JOIN monitors ON sites.Key =  monitors.Site_Key WHERE monitors.PARAMETER = ", input$expParam))
        return(site.list)
      } else {return(NULL)}
    } else {return(NULL)}
  })
  
  visibleSites <- reactive({
    
    return(sites()[sites()$Key %in% input$visibleSites, ])
    
  })
  
  # Send a custom message to update visible monitors based on parameter selection
  observe({
    if(!is.null(sites())) {
      keys <- unique(sites()$Key)
    } else {
      keys <- list()
    }
    session$sendCustomMessage(type="updateVisibleMonitors", keys)
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

      sites <- sites()
      if(!is.null(sites)) {
        ss <- sites[sites$Key %in% input$selectedSites, c("Key", "Latitude", "Longitude")]
        if(nrow(ss) == 0) {ss <- NULL}
      } else {
        ss <- NULL
      }

      return(ss)
    
  })

  selectedNeighbors <- reactive({

    ss <- selectedSites()
    sites <- isolate(visibleSites())

    if(!is.null(ss)) {
        
      us.lats <- c(24.4, 49.4)
      us.lngs <- c(-124.8, -66.9)
      
      lats <- range(ss$Latitude)
      lngs <- range(ss$Longitude)
      
      lat.rng <- max(abs(lats[2] - lats[1]), 1)
      lng.rng <- max(abs(lngs[2] - lngs[1]), 1)
          
      gtG <- FALSE
      
      while(!gtG) {
        
        lats.test <- c(lats[1] - lat.rng, lats[2] + lat.rng)
        lngs.test <- c(lngs[1] - lng.rng, lngs[2] + lng.rng)
        
        # Test if us border has been reach in any cardinal direction
        bounds <- list(north = lats.test[2] >= us.lats[2],
                       south = lats.test[1] <= us.lats[1],
                       east =  lngs.test[2] >= us.lngs[2],
                       west =  lngs.test[1] <= us.lngs[1])

        neighbors <- unique(sites[sites$Latitude >= lats.test[1] & 
                                  sites$Latitude <= lats.test[2] & 
                                  sites$Longitude >= lngs.test[1] & 
                                  sites$Longitude <= lngs.test[2], ])

        if(!bounds$north) {
          n <- neighbors[neighbors$Latitude > lats[2], ]
          bounds$north <- (sum(n$Longitude > lngs[2]) > 0 &
                           sum(n$Longitude < lngs[1]) > 0 &
                           sum(n$Longitude < lngs[2] & n$Longitude > lngs[1]) > 0)
        }
        if(!bounds$south) {
          n <- neighbors[neighbors$Latitude < lats[1], ]
          bounds$south <- (sum(n$Longitude > lngs[2]) > 0 &
                             sum(n$Longitude < lngs[1]) > 0 &
                             sum(n$Longitude < lngs[2] & n$Longitude > lngs[1]) > 0)
        }
        if(!bounds$east) {
          n <- neighbors[neighbors$Longitude > lngs[2], ]
          bounds$east <- (sum(n$Latitude > lats[2]) > 0 &
                             sum(n$Latitude < lats[1]) > 0 &
                             sum(n$Latitude < lats[2] & n$Latitude > lats[1]) > 0)
        }
        if(!bounds$west) {
          n <- neighbors[neighbors$Longitude < lngs[1], ]
          bounds$west <- (sum(n$Latitude > lats[2]) > 0 &
                            sum(n$Latitude < lats[1]) > 0 &
                            sum(n$Latitude < lats[2] & n$Latitude > lats[1]) > 0)
        }
        
        gtG <- bounds$north & bounds$south & bounds$east & bounds$west
              
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
    if(input$areaServedCalcButton > 0) {
      ss <- isolate(selectedSites())
      sn <- isolate(selectedNeighbors())

      if(!is.null(ss)) {
        if(nrow(ss) <= 400 & nrow(sn) >= 2) {
          if(input$areaServedClipping == "none") {
            v <- voronoi(sn$Key, sn$Latitude, sn$Longitude)
          } else {
            if(input$areaServedClipping == "border") {
              b <- usborder
            } else {
              b <- areaOfInterest()
            }

            v <- voronoi(sn$Key, sn$Latitude, sn$Longitude, b)
          }
          v <- subset(v, id %in% ss$Key)
          ov <- over(tracts, v)
          t <- cbind(tracts@data, ov)
          t <- t[!is.na(t$id), ]
          d <- aggregate(t[, 3:47], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
          proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
          area <- areaPolygons(v, CRS("+init=epsg:2163"))        
          v@data <- merge(v@data, d, by.x="id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
          v@data <- merge(v@data, area, by = "id", all.x = TRUE, all.y = FALSE)
          #ids <- sapply(v@data$id, function(i) {strsplit(i, " ")[[1]][1]})
          #v@data$id <- ids
        } else {
          v <- NULL
        }
      } else {
        v <- NULL
      }
      return(v)
    }
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
      session$sendCustomMessage(type = "updateAreaServed", v)
    }
  })

  areaServedMonitor <- reactive({
    sites <- isolate(sites())
    mon <- sites[sites$Key %in% as.numeric(input$clickedAreaServed), ]
    mon <- sprintf("%02i-%03i-%04i", mon$State_Code, mon$County_Code, mon$Site_ID)
    return(mon)
  })

  output$areaServedMonitor <- renderText({
    areaServedMonitor()
  })

  areaOfInterest <- reactive({
    
    aoi <- input$areaOfInterest
    aoi <- aoi[[1]]
    if(is.null(names(aoi[[1]]))) {
      polygons <- lapply(aoi, function(p) {
        m <- matrix(as.numeric(do.call(rbind, p)), ncol = 2)
        m <- rbind(m, m[1, ])
        m <- m[, c(2, 1)]
        Polygon(coords = m, hole = FALSE)
      })
    } else {
      m <- matrix(as.numeric(do.call(rbind, aoi)), ncol = 2)
      m <- rbind(m, m[1, ])
      m <- m[, c(2, 1)]
      polygons <- list(Polygon(coords = m, hole = FALSE))
    }
    polygons <- SpatialPolygons(list(Polygons(polygons, "aoi")))
    return(polygons)
    
  })

  output$areaServed <- renderText({
    input$clickedAreaServed
    polygons <- polygons()
    if(!is.null(polygons)) {
      data <- polygons@data
      txt <- paste(format(data$area[data$id == input$clickedAreaServed], big.mark = ","), "square km")
    } else {
      txt <- ""
    }
    return(txt)
  })

  output$totalPopServed <- renderText({
    input$clickedAreaServed
    polygons <- polygons()
    if(!is.null(polygons)) {
      data <- polygons@data
      txt <- paste(format(data$total[data$id == input$clickedAreaServed], big.mark = ","), "Total Population")
    } else {
      txt <- ""
    }
    return(txt)
  })

  output$agePlot <- renderPlot({
    
    input$clickedAreaServed

    if(!is.null(input$clickedAreaServed)) {
      
      gg <- agePyramid(polygons()@data, input$clickedAreaServed)
      suppressWarnings(print(gg))
      
    }
  }, width = 400, height = 450)

  output$corplot <- renderPlot({
    
    input$cormatButton
    parameter <- isolate(input$expParam)
    if(is.null(parameter)) {parameter = -1}
    sites <- isolate(selectedSites()$Key)
        
    if(parameter %in% c(44201, 88101, 88502) & length(sites) > 1) {
      return(cormat(db, sites, parameter))      
    
    }
  
  }, width = 1200, height = 900)

  output$downloadAgePlot <- downloadHandler(filename = function() {paste("AgePlot_", areaServedMonitor(), "_", input$expParam, ".png")},
                                            content = function(file) {
                                              device <- function(..., width, height) grDevices::png(..., width = 6, height = 8, res = 150, units = "in")
                                              ggsave(file, plot = agePyramid(polygons()@data, input$clickedAreaServed) + ggtitle(bquote(atop("Age Pyramid", atop(.(paste0("Site ID: ", areaServedMonitor())), .(paste0("Parameter Code: ", input$expParam)))))), device = device)
                                            })

  output$downloadCorMat <- downloadHandler(filename = function() {paste("CorMat_", input$expParam, "_", as.integer(runif(1, 1, 999999)),".png")},
                                           content = function(file) {
                                             parameter <- isolate(input$expParam)
                                             if(is.null(parameter)) {parameter = -1}
                                             sites <- isolate(selectedSites()$Key)
                                             if(parameter %in% c(44201, 88101, 88502) & length(sites) > 1) {
                                               png(file, 1200, 900)
                                               cormat(db, sites, parameter)      
                                               dev.off()
                                             }
                                           })

  output$downloadData <- downloadHandler(filename = function() {paste0("netassess-", Sys.Date(), ".csv")},
                                         content = function(file) {
                                           d <- polygons()@data
                                           d$area <- unlist(d$area)
                                           d <- merge(d, sites(), by.x = "id", by.y = "Key", all.x = TRUE, all.y = FALSE)
                                           d <- d[, c("State_Code", "County_Code", "Site_ID", "Latitude", "Longitude", "Street_Address", "area", "total", "Count", "Crit_Count", "HAP_Count", "Met_Count")]
                                           colnames(d) <- c("State Code", "County Code", "Site ID", "Latitude", "Longitude", "Street Addres", "Area (km^2)", "Total Population", "Total Parameters Monitored", "Criteria Monitored", "HAPS Monitored", "Meteorology Monitored")
                                           write.csv(d, file, row.names = FALSE)
                                         })


})

