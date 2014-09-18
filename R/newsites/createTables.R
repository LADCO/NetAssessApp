library(XML)
library(reshape2)

# get state and regional numbers
state.table <- read.csv("https://aqs.epa.gov/aqsweb/codes/data/StateCountyCodes.csv",
                       skip = 1, stringsAsFactors = F)
state.regions <- unique(state.table[, c(grep("State.Code", colnames(state.table)),
                                             grep("Region", colnames(state.table)))])

# create a named list of vectors--name is the regions and the vector contains
# the states in that region
regions <- unique(state.regions$Region)
list.regions <- lapply(regions, function(x, df) {df[df[, 2] == x, 1]},
                       df = state.regions)
names(list.regions) <- regions

# get the list of .rda files
files <- list.files("C:/R repositories/NetAssessApp/data")
files <- paste0("C:/R repositories/NetAssessApp/data/", files[grep("daily", files)])

makeWideTables <- function(rda.files, regions.list){
  
  # rda.files <- files
  # regions.list <- list.regions
  
#   long.data.frames <- sapply(rda.files, 
#                              function(x){strsplit(x, split = ".", fixed = T)[[1]][1]})
#   long.data.frames <- sapply(long.data.frames, 
#                              function(x){strsplit(x, split = "/", fixed = T)[[1]][5]})
  
  for(i in as.character(c(1:10, 25))){
    for(j in as.character(c(44201, 88101, 88502))){
      assign(paste("daily", j, "region", i, sep = "_"), 
             data.frame())
    }
  }
  
  mergeWideDf <- function(long.df.file, regions){
    # long.df.file <- files[1]
    # regions <- list.regions
    load(long.df.file)
    data.frame.name <- strsplit(long.df.file, split = ".", fixed = T)[[1]][1]
    data.frame.name <- strsplit(data.frame.name, split = "/", fixed = T)[[1]][5]
    df <- eval(as.name(data.frame.name))
    states <- sprintf("%02d", unique(df$State.Code))
    for(i in states){
      # i <- states[1]
      df.sub <- df[df$State.Code == i, ]
      df.sub <- data.frame(Monitor = paste0(sprintf("%02d", df.sub$State.Code),
                                            sprintf("%03d", df.sub$County.Code),
                                            sprintf("%04d", df.sub$Site.Num)),
                           df.sub)
      
      df.sub <- dcast(df.sub,  ~ Monitor)
      
      
      file.region <- names(list.regions)[grep(i, list.regions, fixed = T)]
      df.region <- strsplit(data.frame.name, "_", fixed = T)[[1]][1:2]
      df.region <- paste(c(df.region, "region", file.region), collapse = "_")
      df.region <- eval(as.name(df.region))
      df.region <- merge(df.region, df.sub, all = T)
    }
  }
  
  
  
}