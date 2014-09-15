library(shiny)

tab = read.csv("data/states.csv", stringsAsFactors = FALSE)
states = tab$code
names(states) <- tab$name
tab = read.csv("data/csa.csv", stringsAsFactors = FALSE)
csa = tab$code
names(csa) <- tab$name
tab = read.csv("data/cbsa.csv", stringsAsFactors = FALSE)
cbsa = tab$code
names(cbsa) <- tab$name

shinyServer(function(input, output, session, clientData) {

  observe({
    if(input$areaSelect=="State") {
      choices = states
    } else if(input$areaSelect == "CBSA") {
      choices = cbsa
    } else if(input$areaSelect == "CSA") {
      choices = csa
    } else {
      choices = c("")
    }
    
    updateSelectInput(session, "areaSelectSelect", choices = choices)
    
  })
  
  observe({
    
    print(input$areaSelectSelect)
    
    isolate({
      
      if(input$areaSelect=="State") {
#        geo <- RCurl::getURI("http://tigerweb.geo.census.gov/arcgis/rest/services/State_County/MapServer/2/query?where=STATE%3D18&f=pjson")
      } else if(input$areaSelect=="CBSA") {
        
      } else if(input$areaSelect=="CSA") {
        
      }
      
    })
    
  })

})


