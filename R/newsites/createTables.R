library(XML)
library(reshape2)

# get the list of ozone .rda files
files <- list.files("C:/R repositories/NetAssessApp/data")
files <- paste0("C:/R repositories/NetAssessApp/data/", files[grep("daily_44201", files)])

# load the ozone data frames
for(i in files) load(i) 

# create long data frame of ozone values
long.df <- rbind(daily_44201_2009, daily_44201_2010, daily_44201_2011,
                 daily_44201_2012, daily_44201_2013)
remove(daily_44201_2009, daily_44201_2010, daily_44201_2011,
       daily_44201_2012, daily_44201_2013)

# add monitor column
long.df <- data.frame(Monitor = paste0(sprintf("%02d", long.df$State.Code),
                                      sprintf("%03d", long.df$County.Code),
                                      sprintf("%04d", long.df$Site.Num)),
                     long.df)

# filter out days that don't have 75% completion and drop extra POCs
long.df <- long.df[long.df$Observation.Percent >= 75, ]
library(dplyr)
long.df <- arrange(long.df, Monitor, Date.Local, desc(Observation.Percent), POC)
duplicates <- duplicated(long.df[, c("Monitor", "Date.Local")])
long.df <- long.df[!duplicates, ]

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


makeWideTable <- function(states, region, pollutant.code, long.data.frame, directory){
  # region.states <- list.regions["4"]
  # region <- 4
  # pollutant.code <- 44201
  # long.data.frame <- long.df
  # directory <- "C:/R repositories/NetAssessApp/data"
  
  long.sub <- long.data.frame[long.data.frame$State.Code %in% as.integer(states), ]
  wide.df <- dcast(long.sub, Date.Local ~ Monitor,
                   value.var = colnames(long.sub)[grep("Max.Value", colnames(long.sub))])
  wide.df[, "Date.Local"] <- as.Date(wide.df$Date.Local); colnames(wide.df)[1] <- "date"
  
  data.frame.name <- paste("daily", pollutant.code, "region", region, sep = "_")
  
  assign(data.frame.name, wide.df)
  
  eval(parse(text = paste0("save(", data.frame.name, ", file = '", directory, "/",
                           data.frame.name, ".rda')")))
}


mapply(makeWideTable, states = list.regions, region = names(list.regions),
       MoreArgs = list(pollutant.code = 44201, long.data.frame = long.df, 
                       directory <- "C:/R repositories/NetAssessApp/data"))
