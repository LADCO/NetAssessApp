library(shiny)
library(sp)

load(normalizePath("data/states.rda"))
states.list <- as.character(states$GEOID)
names(states.list) <- as.character(states$NAME)
states.list <- states.list[order(names(states.list))]

load(normalizePath("data/cbsa.rda"))
cbsa.list <- as.character(cbsa$GEOID)
names(cbsa.list) <- as.character(cbsa$NAME)
cbsa.list <- cbsa.list[order(names(cbsa.list))]

load(normalizePath("data/csa.rda"))
csa.list <- as.character(csa$GEOID)
names(csa.list) <- as.character(csa$NAME)
csa.list <- csa.list[order(names(csa.list))]

shinyServer(function(input, output, session) {
  
  # Observer to update predefined area select input based on Area Type
  observe({
    
    if(!is.null(input$areaSelect)) {
      
      if(input$areaSelect=="State") {
        choices = states.list
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
      
      type <- tolower(isolate(input$areaSelect))
      
      src <- switch(type, state = states, cbsa = cbsa, csa = csa)
      
      poly <- src[src$GEOID == input$areaSelectSelect, ]
      
      coords <- lapply(seq(length(poly@polygons[[1]]@Polygons)), function(i) {
        x <- poly@polygons[[1]]@Polygons[[i]]@coords[, c(2,1)]
      })
      
      session$sendCustomMessage(type="displayArea", list(properties = list(name = poly$NAME[1], type = type, id = as.character(as.integer(input$areaSelectSelect))), coords = coords))
      
    }
    
  })


})


