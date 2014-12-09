library(shiny)

shinyServer(function(input, output, session) {
  
#### Functions for controlling parameter selection
  
  # Populate the parameter selection dropdown  
  updateSelectInput(session, "expParam", choices = params.list)
  updateSelectInput(session, "new_site_parameters", choices = params.list[2:length(params.list)])
  
  # Contains a list of sites based on the currently selected parameter
  sites <- reactive({
    if(!is.null(input$expParam)) {
      if(input$expParam != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.* FROM sites JOIN monitors ON sites.Key =  monitors.Site_Key WHERE monitors.PARAMETER = ", input$expParam))
        return(site.list)
      } else {return(NULL)}
    } else {return(NULL)}
  })
  
  visibleNewSites <- reactive({
    new_sites <- input$newSites$data
    if(length(new_sites) > 0) {
      vns <- data.frame(stringsAsFactors = FALSE)
      for(i in seq(length(new_sites))) {
        n <- new_sites[[i]]
        if(n$visible == TRUE) {
          vns <- rbind(vns, c(n$lat, n$lng, n$key, n$selected, n$name))
        }
      }
      
      colnames(vns) <- c("Latitude", "Longitude", "Key", "selected", "name")
      vns$Latitude <- as.numeric(vns$Latitude)
      vns$Longitude <- as.numeric(vns$Longitude)
      vns$selected <- as.logical(vns$selected)
      return(vns)
    }
  })
  
  selectedNewSites <- reactive({
    vns <- visibleNewSites()
    return(vns[vns$selected, ])
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
    ss <<- ss
    nss <- selectedNewSites()[, c("Key", "Latitude", "Longitude")]
    nss <<- nss
    sss <- isolate(visibleSites()[, c("Key", "Latitude", "Longitude")])
    sss <<- sites
    newsites <- isolate(visibleNewSites()[, c("Key", "Latitude", "Longitude")])
    newsites <<- newsites
    
    ss <- rbind(ss, nss)
    sites <- rbind(sss, newsites)

    
    
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
      nss <- selectedNewSites()[, c("Key", "Latitude", "Longitude")]
      ss <- rbind(ss, nss)
      
      sn <- isolate(selectedNeighbors())
      
      # Update this variable to reflect the probability columns present in the tracts dataset
      probability.columns <- c("ozone_prob_75", "pm_prob_35")
      
      prob.bin <- function(values) {
        
        value = max(values, na.rm = TRUE)
        
        if(value < 0.25) {
          x <- "<25%"
        } else if(value <= 0.5) {
          x <- "25%-50%"
        } else if(value <= 0.7) {
          x <- "50%-70%"
        } else if(value <= 0.8) {
          x <- "70%-80%"
        } else if(value <= 0.9) {
          x <- "80%-90%"
        } else if(value <= 1) {
          x <- ">90%"
        } else {
          x <- "NA"
        }
        
        return(x)
        
      }
      
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
          t <- cbind(as.data.frame(tracts), ov)
          t <- t[!is.na(t$id), ]
          test <<- t
          vest <<- v
          d <- aggregate(t[, sapply(seq(ncol(t)), function(i) {is.integer(t[, i])})], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
          d2 <- aggregate(t[, probability.columns], by = list(as.character(t$id)), FUN = prob.bin)
          proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
          area <- areaPolygons(v, CRS("+init=epsg:2163")) 

          v@data <- merge(v@data, d, by.x="id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
          v@data <- merge(v@data, d2, by.x = "id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
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
    monkey <- as.numeric(input$clickedAreaServed)
    if(length(monkey) > 0) {
      if(monkey < 90000) {
        sites <- isolate(sites())
        mon <- sites[sites$Key %in% monkey, ]
        mon <- sprintf("%02i-%03i-%04i", mon$State_Code, mon$County_Code, mon$Site_ID)
      } else {
        sites <- isolate(visibleNewSites())
        mon <- paste(sites[sites$Key %in% monkey, "name"], "(New Site)")
      }
      return(mon)
    }
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
      km2 <- as.numeric(data$area[data$id == input$clickedAreaServed])
      mi2 <- round(km2 * 0.38610215854, 0)
      txt <- paste0("<b>Area</b>: ", format(mi2, big.mark = ","), "mi<sup>2</sup> (", format(km2, big.mark = ","), "km<sup>2</sup>)")
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
      txt <- paste("<b>Total Population</b>:", format(data$total[data$id == input$clickedAreaServed], big.mark = ","))
    } else {
      txt <- ""
    }
    return(txt)
  })

  observe({
    session$sendCustomMessage(type = "areaServedMonitorUpdate", areaServedMonitor())
  })

  output$agePlot <- renderPlot({
    
    input$clickedAreaServed

    if(!is.null(input$clickedAreaServed)) {
      
      title <- paste0("Area Served by ", areaServedMonitor())
      gg <- agePyramid(polygons()@data, input$clickedAreaServed) + ggtitle(title) 
      suppressWarnings(print(gg))
      
    }
  }, width = 525, height = 600)

  output$naaqsProb <- renderText({

    if(!is.null(input$expParam)) {
      data <- as.data.frame(polygons())
      data <- data[data$id == input$clickedAreaServed, ]
      prob <- "Not Available"
      if(input$expParam == 44201) {
        prob <- paste0("<b>Maximum Probability</b>: ", data$ozone_prob_75[1])
      } else if(input$expParam %in% c(88101, 88502)) {
        prob <- paste0("<b>Maximum Probability</b>: ", data$pm_prob_35[1])
      }
      return(prob)
    }
  })

  output$racePlot <- renderPlot({
    
    input$clickedAreaServed
    
    if(!is.null(input$clickedAreaServed)) {
      
      data <- as.data.frame(polygons())
      data <- data[data$id == input$clickedAreaServed,  c("white", "black", "native", "asian", "islander", "other", "multiple")]
      
      data <- data.frame(label = c("White", "African American", "Native American", "Asian", "Native Hawaiian/Pacific Islander", "Other", "Two or More"),
                        count = unlist(data))
      
      
      rat <- max(data$count)/min(data$count)
      
      title <- paste0("Area Served by ", areaServedMonitor())
      
      plt <- ggplot(data, aes(x = label, y = count)) + 
        geom_bar(stat = "identity", fill = "turquoise3" ) +
        labs(x = "Race", y = "Population") + 
        theme(axis.text.x = element_text(angle = 15, hjust = 1)) + ggtitle(title) 
      
      if(rat > 100) {
        plt <- plt + scale_y_log10()
      }
      
      plt
      
    }
    
  }, width = 525, height = 600)

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

