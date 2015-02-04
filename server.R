library(shiny)

shinyServer(function(input, output, session) {
  
  tools <- reactiveValues(cormat = "download", output = NULL)
  values <- reactiveValues()
  
  showLoading <- function() {
    session$sendCustomMessage("loading", "show")
  }
  
  hideLoading <- function() {
    session$sendCustomMessage("loading", "hide")
  }
  
  updateSelectInput(session, "paramOfInterest", choices = params.list)
  updateSelectInput(session, "newSiteParameters", choices = params.list[2:length(params.list)])
  
  # Produce a dataframe of sites that monitor for the selected Parameter of
  # Interest
  parameterSites <- reactive({
    site.list <- NULL
    if(!is.null(input$paramOfInterest)) {
      if(input$paramOfInterest != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.* FROM sites JOIN monitors ON sites.Key = monitors.Site_Key WHERE monitors.PARAMETER = ", input$paramOfInterest))
      }
    }
    return(site.list)
  })
  
  newSites.df <- reactive({
    newSites <- input$newSites
    if(length(newSites) > 0) {
      newdf <- data.frame()
      for(i in seq(length(newSites))) {
        
        dr <- c(newSites[[i]]$key, newSites[[i]]$lat, newSites[[i]]$lng)
        newdf <- rbind(newdf, dr)
        
      }
      colnames(newdf) <- c("Key", "Latitude", "Longitude")
      return(newdf)
    } else {
      return(NULL)
    }
    
  })
  
  visibleSites <- reactive({
    sites <- parameterSites()
    ss <- NULL
    sns <- NULL
    if(!is.null(sites)) {
      ss <- sites[sites$Key %in% input$visibleSites, c("Key", "Latitude", "Longitude")]
    }
    newSites <- newSites.df()
    if(!is.null(newSites)) {
      sns <- newSites[newSites$Key %in% input$visibleNewSites, ]
      ss <- rbind(ss, sns)
    }
    
    return(ss)
    
  })
  
  activeSites <- reactive({
    selSites <- input$selectedSites
    visSites <- input$visibleSites
    actSites <- intersect(selSites, visSites)
    return(actSites)
  })
  
  activeNewSites <- reactive({
    selSites <- input$selectedNewSites
    visSites <- input$visibleNewSites
    actSites <- intersect(selSites, visSites)
    return(actSites)  
  })
  
  areaOfInterest <- reactive({
    
    aoi <- input$areaOfInterest[[1]]
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
  
  # Send a custom messages to display sites that monitor the selected parameter
  observe({
    if(!is.null(parameterSites())) {
      keys <- unique(parameterSites()$Key)
    } else {
      keys <- list()
    }
    session$sendCustomMessage(type = "updateVisibleMonitors", keys)
  })
  
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

    if(!is.null(input$areaSelectSelect) && input$areaSelectSelect != "") {
      type <- toupper(isolate(input$areaSelect))
      src <- switch(type, STATE = "states", CBSA = "cbsas", CSA = "csas")
      q <- paste0("SELECT GEOMETRY FROM ", src, " WHERE CODE = '", input$areaSelectSelect, "'")
      coords <- eval(parse(text = dbGetQuery(db, q)[1,1]))
      session$sendCustomMessage(type="displayPredefinedArea", list(properties = list(name = "test", type = type, id = input$areaSelectSelect), coords = coords))  
    }
    
  })

## Area Served ##

  selectedSites <- reactive({
    
    sites <- parameterSites()
    ss <- NULL
    sns <- NULL
    if(!is.null(sites)) {
      ss <- sites[sites$Key %in% activeSites(), c("Key", "Latitude", "Longitude")]
    }
    newSites <- newSites.df()
    if(!is.null(newSites)) {
      sns <- newSites[newSites$Key %in% activeNewSites(), ]
      ss <- rbind(ss, sns)
    }
    
    return(ss)
    
  })

  selectedNeighbors <- reactive({
    
    ss <- selectedSites()

    all.sites <- visibleSites()
    
    op <- NULL
    
    if(!is.null(ss) && nrow(ss) != 0) {
      
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

        neighbors <- unique(all.sites[all.sites$Latitude >= lats.test[1] & 
                                    all.sites$Latitude <= lats.test[2] & 
                                    all.sites$Longitude >= lngs.test[1] & 
                                    all.sites$Longitude <= lngs.test[2], ])

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
      op <- neighbors[neighbors$Key %in% x, ]
            
    }
    
    return(op)
    
  })

  polygons <- reactive({
    
    input$areaServedButton
    
    ss <- isolate(selectedSites())
    
    # Update this variable to reflect the probability columns present in the tracts dataset
    probability.columns <- c("ozone_prob_75", "ozone_prob_70", "ozone_prob_65", "pm_prob_35")
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
        
    if(input$areaServedType == "voronoi") {
  
      if(!is.null(ss) && nrow(ss) != 0) {
        
        sn <- isolate(selectedNeighbors())
          
        if(!is.null(ss) && nrow(ss) != 0) {
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
            d <- aggregate(t[, sapply(seq(ncol(t)), function(i) {is.integer(t[, i])})], by = list(as.character(t$id)), FUN = sum, na.rm = TRUE)
            d2 <- aggregate(t[, probability.columns], by = list(as.character(t$id)), FUN = prob.bin)
            proj4string(v) <- CRS("+proj=longlat +ellps=WGS84")
            area <- areaPolygons(v, CRS("+init=epsg:2163")) 
            
            v@data <- merge(v@data, d, by.x="id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
            v@data <- merge(v@data, d2, by.x = "id", by.y = "Group.1", all.x = TRUE, all.y = FALSE)
            v@data <- merge(v@data, area, by = "id", all.x = TRUE, all.y = FALSE)
          } else {
            v <- NULL
          }
        } else {
          v <- NULL
        }
  
        return(v)
        
      }
      
    } else {
      
      ## This is where circular area served code will go.
      
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

  selectedParameter <- reactive({
    return(list(code = input$paramOfInterest, name = params$Parameter_Desc[params$Parameter_Code == input$paramOfInterest]))
  })
  
  areaServedMonitor <- reactive({
    monkey <- as.numeric(input$clickedAreaServed)
    if(length(monkey) > 0) {
      if(monkey < 90000) {
        sites <- isolate(parameterSites());
        mon <- sites[sites$Key %in% monkey, ]
        mon <- sprintf("%02i-%03i-%04i", mon$State_Code, mon$County_Code, mon$Site_ID)
      } else {
        mon <- paste(input$newSites[monkey]$properties$name, "(New Site)")
      }
      return(mon)
    }
  })


  output$areaServedParameter <- renderText({
    selectedParameter()$name
  })

  output$areaServedArea <- renderText({
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

  output$areaServedMonitor <- renderText({
    areaServedMonitor()
  })

  output$naaqsProb <- renderText({
    
    data <- as.data.frame(polygons())
    data <- data[data$id == input$clickedAreaServed, ]
    
    prob <- "Not Available"
    
    if(!is.null(input$paramOfInterest)) {
    
      if(input$paramOfInterest == 44201) {
        if(input$ozoneNAAQS == "65ppb") {
          prob <- data$ozone_prob_65[1]
        } else if(input$ozoneNAAQS == "70ppb") {
          prob <- data$ozone_prob_70[1]
        } else {
          prob <- data$ozone_prob_75[1]
        }
        prob <- paste0("<b>Maximum Probability</b>: ", prob)
      } else if(input$paramOfInterest %in% c(88101, 88502)) {
        prob <- paste0("<b>Maximum Probability</b>: ", data$pm_prob_35[1])
      }
    }
    
    return(prob)    
    
  })

  output$areaServedPopulation <- renderText({
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

  output$areaServedAgePlot <- renderPlot({
    
    input$clickedAreaServed
    
    if(!is.null(input$clickedAreaServed)) {
      p <- params$Parameter_Desc[params$Parameter_Code == input$paramOfInterest]
      title <- paste0(p, " - Area Served by ", areaServedMonitor())
      gg <- agePyramid(polygons()@data, input$clickedAreaServed) + ggtitle(title)
      suppressWarnings(print(gg))
      
    }
  }, width = 788, height = 900)

  output$areaServedRacePlot <- renderPlot({
    
    input$clickedAreaServed
    
    if(!is.null(input$clickedAreaServed)) {
      
      data <- as.data.frame(polygons())
      data <- data[data$id == input$clickedAreaServed,  c("white", "black", "native", "asian", "islander", "other", "multiple")]
      
      data <- data.frame(label = c("White", "African American", "Native American", "Asian", "Native Hawaiian/Pacific Islander", "Other", "Two or More"),
                         count = unlist(data))
      
      title <- paste0("Area Served by ", areaServedMonitor())
      
      plt <- ggplot(data, aes(x = label, y = count)) + theme_bw(base_size = 16) + 
        geom_bar(stat = "identity", fill = "turquoise3" ) +
        labs(x = "Race", y = "Population") + 
        theme(axis.text.x = element_text(angle = 20, hjust = 1)) + ggtitle(title)  
      
      plt
      
    }
    
  }, width = 788, height = 900)

  trendChart <- observe({
    
    site <- input$popupID
    param <- input$paramOfInterest
      
    if(!is.null(site) && !is.null(param)) {
      
      dv <- dbGetQuery(db, paste0("SELECT dv.*, crit_lu.NAME, naaqs.STANDARD, naaqs.UNITS FROM dv JOIN crit_lu ON dv.POLLUTANT = crit_lu.CODE JOIN naaqs ON dv.DURATION = naaqs.DURATION AND dv.POLLUTANT = naaqs.POLLUTANT WHERE crit_lu.PARAMETER = ", param, " AND dv.Key = ", site))

      if(nrow(dv) > 0) {
        
        values$trendChart <- paste0("images/temp/trend", as.integer(runif(1,1,1000000)), ".png")
        
        trendChart <- plotPNG(function() {
          
          pol <- dv$NAME[1]
          site <- sprintf("%02i-%03i-%04i", dv$STATE_CODE, dv$COUNTY_CODE, dv$SITE_ID)[1]
          if(pol == "PM<sub>2.5</sub>") {
            title <- bquote(paste("Design Value Trends: ", PM[2.5], " at ", .(site)))
          } else if(pol == "PM<sub>10</sub>") {
            title <- bquote(paste("Design Value Trends: ", PM[10], " at ", .(site)))
          } else {
            title <- paste("Design Value Trends:", pol, "at", site)
          }
          pol <- gsub("<sub>", "[", pol, fixed = TRUE)
          pol <- gsub("</sub>", "]", pol, fixed = TRUE)
          units <- dv$UNITS[1]
          if(units == "ugm3") {
            yaxis <- expression(paste("Design Value (", mu*g/m^3, ")"))
          } else {
            yaxis <- paste0("Design Value (", units, ")")
          }
          
          dv <- dv[, c("DURATION", "STANDARD", "DV_2004", "DV_2005", "DV_2006", "DV_2007", "DV_2008", "DV_2009", "DV_2010", "DV_2011", "DV_2012", "DV_2013")] 
          dv <- melt(dv)
          
          std <- dv[dv$variable == "STANDARD", c("DURATION", "value")]
          colnames(std) <- c("DURATION", "STANDARD")
          dv <- dv[dv$variable != "STANDARD", ]
          colnames(dv) <- c("DURATION", "LABEL", "DV")
          dv <- merge(dv, std, by = "DURATION")
          dv$LABEL <- as.numeric(substr(as.character(dv$LABEL), 4, 7))
          dv$SNAME <- paste(dv$DURATION, "Standard")
          dv$DURATION <- paste(dv$DURATION, "Design Value")
          
          cbPalette <- c("#E69F00", "#D55E00", "#56B4E9", "#0072B2")
                  
          plt <- ggplot(dv, aes(x = LABEL, y = DV, colour = DURATION, ymin = 0)) + labs(colour = "") +
            geom_hline(aes(yintercept = STANDARD, colour = SNAME), show_guide = TRUE, size = 1.25) +
            geom_line(size = 1.5) +
            geom_point(size = 4) +
            labs(x = "Year", y = yaxis) + 
            theme_bw(base_size = 16) + theme(legend.position="bottom") + 
            scale_colour_manual(values=cbPalette) +
            ggtitle(title)
          
          print(plt)
          
        }, width = 900, height = 450, filename = paste0("www/", values$trendChart))
        
        session$sendCustomMessage(type = "updateTrendChart", values$trendChart)
        
      }
      
    }
  })

  readings <- reactive({
    
    validate(
      need(selectedNeighbors(), message = FALSE),
      needParams(input$paramOfInterest, strict = TRUE)
    )
    
    param <- input$paramOfInterest
    sn <- selectedNeighbors()
    
    validParams <- c("44201", "88101", "88502")
    
    op <- NULL
    
    if(param %in% validParams && !is.null(sn)) {
      showLoading()
      sql <- isolate({paste0("SELECT sites.Key AS Site_Key, sites.State_Code, sites.County_Code, sites.Site_ID, sites.Latitude, sites.Longitude, monitors.Key AS Monitor_Key, monitors.POC, readings.Date, readings.Value, readings.Duration_Code FROM sites JOIN monitors ON sites.Key = monitors.Site_Key JOIN readings ON monitors.Key = readings.Key WHERE monitors.Parameter = ", param, " AND sites.Key IN ('", paste0(sn$Key, collapse = "', '"), "')")})
      q <- dbGetQuery(db, sql)
      if(nrow(q) > 0) {
        op <- q
      }
      hideLoading()    
    }

    return(op)
    
  })

  cormatTable <- reactive({
    
    op <- NULL
      
    r <- readings()
    
    if(!is.null(r)) {
      
      if(input$paramOfInterest == "88101") {
      
        if(input$pmType == "frm") {
          r <- r[r$Duration_Code == "7", ]
        } else if(input$pmType == "fem") {
          r <- r[r$Duration_Code == "X", ]
        }
        
      }
      
      r <- r[r$Site_Key %in% activeSites(), ]
      
      if(nrow(r) > 0) {
        showLoading()
        op <- cormatData(r)  
        hideLoading()
      }
      
    }
    
    return(op)
  
  })

  output$cormatChart <- renderPlot({
  
    validate(need(input$cormatButton, FALSE))
    
    input$cormatButton
    
    isolate({
    
      if(is.null(cormatTable())) {
        if(input$cormatButton > 0) {
          session$sendCustomMessage("showCormat", TRUE)
          return({
            plot(x = 0.5, y = 0.5, col = "white", axes = FALSE, xlab = "", ylab = "")
            text(x = 0.5, y = 0.5, cex = 4, labels = "Insufficient data avaialable")
          })
        }
      } else {
        session$sendCustomMessage("showCormat", TRUE)
        return(cormatChart(cormatTable(), isolate(input$paramOfInterest), isolate(input$pmType)))
      }
    
    })
      
  }, width = 1800, height = 1350)

  observeEvent(input$cormapSite, {
    
    d <- cormatTable()
    if(!is.null(cormatTable())) {
      if(!is.null(input$cormapSite)) {
        d <- d[d$key1 %in% input$cormapSite | d$key2 %in% input$cormapSite, ]
        if(nrow(d) > 0) {
          d$site <- sapply(seq(nrow(d)), function(i) {
            if(d$key1[i] %in% input$cormapSite) {
              return(d$key2[i])
            } else {
              return(d$key1[i])
            }
          })
          d <- d[, c("site", "cor", "com", "dif", "dis")]
          session$sendCustomMessage("updateCorMap", d)
        }
      }
    }
    
  })

  output$correlationDataDownload <- downloadHandler(filename = function() {paste0("netassess-correlation-", input$paramOfInterest, "-", Sys.Date(), ".csv")},
                                                    content = function(file) {
                                                      df <- cormatTable()
                                                      df <- df[, c("site1", "site2", "cor", "com", "dif", "dis")]
                                                      colnames(df) <- c("Site 1", "Site 2", "Correlation", "n", "Rel. Diff", "Distance (km)")  
                                                      write.csv(df, file, row.names = FALSE)
                                                    })


  rembiasTable <- reactive({
    
    r <- readings()
    op <- NULL
    
    if(!is.null(r)) {
      
      sN <- isolate({selectedNeighbors()})
      sN <- sN[sN$Key %in% r$Site_Key, ]
      
      sites.deldir <- deldir(sN$Longitude, sN$Latitude)
      combos <- sites.deldir$delsgs
      
      combos$dist <- mapply(FUN = earth.dist, long1 = combos[, 1],
                            lat1 = combos[, 2], long2 = combos[, 3],
                            lat2 = combos[, 4])
      
      combos$ind1 <- sN$Key[combos$ind1]
      combos$ind2 <- sN$Key[combos$ind2]
      
      d <<- list(sN, sites.deldir, combos, activeSites = activeSites(), data)
      
      rb <- lapply(activeSites(), function(site) {
        
        site.data <- r[r$Site_Key == site, c("Date", "Value")]
        
        if(nrow(site.data) > 0) {
          
          start.date <- min(site.data$Date)
          end.date <- max(site.data$Date)
          
          neighbors <- combos[combos$ind1 == site | combos$ind2 == site, ]
          neighbors$Site_Key <- apply(neighbors, 1, function(r) {if(r['ind1'] == site) {return(r['ind2'])} else {return(r['ind1'])}})
          neighbors <- neighbors[, c("Site_Key", "dist")]
          neigh.data <- r[r$Site_Key %in% neighbors$Site_Key, c("Site_Key", "Date", "Value")]
          neigh.data <- merge(neigh.data, neighbors, by = "Site_Key", all = TRUE)
          neigh.data <- neigh.data[neigh.data$Date %in% site.data$Date, ] 
          
          values <- as.matrix(dcast(neigh.data, Date~Site_Key, value.var = "Value", fun.aggregate = mean))
          rownames(values) <- values[,1]
          values <- values[, -1]
          weights <- dcast(neigh.data, Date~Site_Key, value.var = "dist", fun.aggregate = mean)
          rownames(weights) <- weights[,1]
          weights <- weights[, -1]
          weights <- 1/(weights^2)
          values[is.na(values)] = 0
          weights[is.na(weights)] = 0
          
          # multiply the values and weights matrices and calculate inner product using 
          # a vector of ones to get the sums for each row 
          summed <- (values * weights) %*% rep(1, dim(values)[2])
          
          # calculate the sum of each row in the 
          denom <- weights %*% rep(1, dim(values)[2])
          
          # if the denom vector has zeros, remove that index from denom and summed
          rn <- rownames(summed)
          summed <- summed[denom != 0]
          denom <- denom[denom != 0]
          
          # calculate inverse distance squared weighted average for each day
          weighted.avg <- summed / denom
          weighted.avg <- data.frame(Date = rn, Est = weighted.avg)
          
          # get the daily values for the monitor of interest as a vector
          daily <- merge(site.data, weighted.avg, by ="Date")
          
          # calculate difference between each interpolated value and the actual
          # value for the monitor
          daily$diff <- daily$Est - daily$Value 
          x <- daily$Value != 0
          relDiff <- round(100 * (daily$diff[x]/daily$Value[x]))
          daily$diff <- signif(daily$diff, 3)
          
          data.frame(Key = site, bias_mean = round(mean(daily$diff), 4), bias_min = min(daily$diff),
                     bias_max = max(daily$diff), bias_sd = sd(daily$diff), bias_n = nrow(neighbors),
                     relbias_mean = round(mean(relDiff)), relbias_min = min(relDiff),
                     relbias_max = max(relDiff), start_date = start.date, end_date = end.date)
          
        }
        
      })
      
      s <- do.call(rbind, rb)
      
      if(nrow(s) == 0) {
        s <- NULL
      } else {
        siteIDs <- unique(r[, c("Site_Key", "State_Code", "County_Code", "Site_ID")])
        siteIDs$id <- sprintf("%02i-%03i-%04i", siteIDs$State_Code, siteIDs$County_Code, siteIDs$Site_ID)
        siteIDs <- siteIDs[, c("Site_Key", "id")]
        s <- merge(s, siteIDs, by.x = "Key", by.y = "Site_Key", all.x = TRUE, all.y = FALSE)
      }

      op <- s
      
    } 
    
    return(op)
    
  })

  observeEvent(input$rembiasButton, {
    
    validate(need(rembiasTable(), FALSE))
    
    isolate({
    
      if(!is.null(rembiasTable())) {
        session$sendCustomMessage("rembiasUpdate", list(data = rembiasTable()))  
      }
    
    })
    
  })

  output$rembiasDataDownload <- downloadHandler(filename = function() {paste0("netassess-rembias-", input$paramOfInterest, "-", Sys.Date(), ".csv")},
                                                    content = function(file) {
                                                      df <- rembiasTable()
                                                      df <- df[, c("id", "bias_mean", "bias_min", "bias_max", "bias_sd", "bias_n", "relbias_mean", "relbias_min", "relbias_max")]
                                                      colnames(df) <- c("Site ID", "Mean Removal Bias", "Min Removal Bias", "Max Removal Bias", "Removal Bias Standard Deviation", "Neighbors Included", "Mean Relative Removal Bias (%)", "Min Relative Removal Bias (%)", "Max Relative Removal Bias (%)")
                                                      write.csv(df, file, row.names = FALSE)
                                                    })











































  
  output$sitesDataDownload <- downloadHandler(filename = function() {paste0("netassess-sites-", input$paramOfInterest, "-", Sys.Date(), ".csv")},
                                              content = function(file) {
                                                param <- input$paramOfInterest
                                                s <- parameterSites()[parameterSites()$Key %in% activeSites(), ]
                                                d <- dbGetQuery(db, paste0("SELECT dv.*, crit_lu.NAME, naaqs.STANDARD, naaqs.UNITS FROM dv JOIN crit_lu ON dv.POLLUTANT = crit_lu.CODE JOIN naaqs ON dv.DURATION = naaqs.DURATION AND dv.POLLUTANT = naaqs.POLLUTANT WHERE crit_lu.PARAMETER = ", param, " AND dv.Key IN (", paste0(activeSites(), collapse = ", "), ")"))
                                                if(nrow(d) > 0) {
                                                  s <- merge(s, d, on="Key", all.x = TRUE, all.y = FALSE)
                                                  s$Parameter <- d$NAME[1]
                                                  s$Units <- d$UNITS[1]
                                                  s$Standard <- d$STANDARD[1]
                                                } else {
                                                  s <- s[, c("State_Code", "County_Code", "Site_ID", "Latitude", "Longitude", "Street_Address", "Count", "Crit_Count", "HAP_Count", "Met_Count")]
                                                  colnames(s) <- c("State_Code", "County_Code", "Site_ID", "Latitude", "Longitude", "Street_Address", "Parameter_Count", "Criteria_Parameter_Count", "HAP_Parameter_Count", "Meteorology_Parameter_Count")
                                                }
                                               
                                                s$County_Code <- sprintf("%03i", as.integer(s$County_Code))
                                                s$Site_ID <- sprintf("%04i", as.integer(s$Site_ID))
                                                
                                                write.csv(s, file, row.names = FALSE)
                                                
                                              })


  output$areaServedDataDownload <- downloadHandler(filename = function() {paste0("netassess-areaserved-", input$paramOfInterest, "-", Sys.Date(), ".csv")},
                                                   content = function(file) {
                                                     d <- polygons()@data
                                                     d$area <- unlist(d$area)
                                                     write.csv(d, file = file)                             
                                                   })

})