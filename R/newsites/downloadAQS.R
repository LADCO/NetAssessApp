library(XML)

# This function downloads a zipped folder from the AQS website, unzips it,
# and saves the .csv file
downloadAQS <- function(duration, pollutant.code, year,  
                         destination.directory = "."){
  file.url <- paste0("http://aqsdr1.epa.gov/aqsweb/aqstmp/airdata/", duration,
                     "_", pollutant.code, "_", year, ".zip")
  temp <- tempfile(fileext = ".zip")
  download.file(url = file.url, temp)
  fl.name <- paste0(duration, "_", pollutant.code, "_", year, ".csv")
  print(fl.name)
  unzip(temp, fl.name, exdir = destination.directory)
  file.remove(temp)
}




# This function reads in the AQS .csv file and saves it as an .rda file
csvToRda <- function(duration, pollutant.code, year, csv.directory, 
                     destination.directory){
  
  csv.file <- paste0(csv.directory, "/", duration, "_", pollutant.code, "_", year,
                     ".csv")
  rda.file <- paste0(destination.directory, "/", duration, "_", pollutant.code, "_", 
                     year, ".rda")
  
  # assign the pasted variable name to the data frame then save
  assign(paste(duration, pollutant.code, year, sep = "_"), 
         read.csv(csv.file, stringsAsFactors = F))
  
  # evaluate the text
  eval(parse(text = paste0("save(", duration, "_", pollutant.code, "_", year, ",
                           file = rda.file)")))
  
  file.remove(csv.file)
}


# download, unzip, and save as .rda files daily ozone and pm2.5 data for entire
# country, 2009-2013
pollutants <- c("44201", "88101", "88502")
years <- as.character(2009:2013)

downloads.df <- expand.grid(pollutants, years, stringsAsFactors = F)

mapply(downloadAQS, pollutant.code = downloads.df[, 1],  year = downloads.df[, 2], 
       MoreArgs = list(duration = "daily", 
                       destination.directory = "C:/R repositories/NetAssessApp/data"))

mapply(csvToRda, pollutant.code = downloads.df[, 1],  year = downloads.df[, 2], 
       MoreArgs = list(duration = "daily", 
                       destination.directory = "C:/R repositories/NetAssessApp/data",
                       csv.directory = "C:/R repositories/NetAssessApp/data"))
