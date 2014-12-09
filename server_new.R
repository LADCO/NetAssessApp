library(shiny)

shinyServer(function(input, output, session) {
  
  ## INITIAL HOUSEKEEPING ##
  
  # Populate the parameter selection dropdowns
  updateSelectInput(session, "expParam", choices = params.list)
  updateSelectInput(session, "new_site_parameters", choices = params.list[2:length(params.list)])
  
  
  ## REACTIVES TO STORE SHARED DATA ##
  
  # Contains a list of sites based on the currently selected parameter
  sites <- reactive({
    if(!is.null(input$expParam)) {
      if(input$expParam != -1) {
        site.list <- dbGetQuery(db, paste0("SELECT sites.* FROM sites JOIN monitors ON sites.Key =  monitors.Site_Key WHERE monitors.PARAMETER = ", input$expParam))
        return(site.list)
      } else {return(NULL)}
    } else {return(NULL)}
  })
  
  # Further subsets sites() to account for the user manually hiding sites on the map
  visibleSites <- reactive({
    return(sites()[sites()$Key %in% input$visibleSites, ])
  })
  
  # Determine which of the visible sites ares currently selected
  selectedSites <- reactive({
    
    sites <- visibleSites()
    if(!is.null(sites)) {
      ss <- sites[sites$Key %in% input$selectedSites, c("Key", "Latitude", "Longitude")]
      if(nrow(ss) == 0) {ss <- NULL}
    } else {
      ss <- NULL
    }
    
    return(ss)
    
  })
  
  # Read the table of new sites added from the client and figure out which ones 
  # are currently visible
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
  
  # Determine which of the visible new sites are currently selected
  selectedNewSites <- reactive({
    vns <- visibleNewSites()
    return(vns[vns$selected, ])
  })

  ## OBSERVERS TO SHARE DATA WITH CLIENT ##
  
  # Send a custom message to update visible monitors based on parameter selection
  observe({
    if(!is.null(sites())) {
      keys <- unique(sites()$Key)
    } else {
      keys <- list()
    }
    session$sendCustomMessage(type="updateVisibleMonitors", keys)
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
  
  # Send the geometry for a predefined area selection
  observe({
    if(!is.null(input$areaSelectSelect)) {
      type <- toupper(isolate(input$areaSelect))
      src <- switch(type, STATE = "states", CBSA = "cbsas", CSA = "csas")
      q <- paste0("SELECT GEOMETRY FROM ", src, " WHERE CODE = '", 
                  input$areaSelectSelect, "'")
      coords <- eval(parse(text = dbGetQuery(db, q)[1,1]))
      session$sendCustomMessage(type="displayPredefinedArea", 
                                list(properties = list(name = "test", 
                                                       type = type, 
                                                       id = input$areaSelectSelect), 
                                     coords = coords))
    }
  })
  
  
  
  
  
  
  
  
  observe({
    debug.data <<- list(
      ss = selectedSites(),
      nss = selectedNewSites(),
      s = sites(),
      ns = input$newSites,
      vs = visibleSites(),
      nvs = visibleNewSites()
    )
  })
  
})