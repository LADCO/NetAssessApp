# load regional ozone tables
files <- list.files("./data/")
ozone.files <- files[grep("44201_region", files, fixed = T)]
lapply(ozone.files, function(x) load(paste0("data/", x), envir = globalenv()))

# get simple frequency of exceeding 85% of NAAQS
probExceed <- function(daily.values, NAAQS){
  sum(daily.values > .85*NAAQS, na.rm = T)/sum(!is.na(daily.values))
}

ozone.data.frames <- ls(pattern = "44201_region")


ozone.prob.list <- lapply(ozone.data.frames, function(x){
  apply(eval(parse(text = paste0(x, "[, -1]"))), 2, probExceed, NAAQS = 0.075)
} 
)

# get lat longs for ozone monitors
long.ozone.files <- files[grep("44201", files, fixed = T)]
long.ozone.files <- files[grep("region", long.ozone.files, fixed = T, invert = T)]
latlongs <- lapply(long.ozone.files, function(x){
  load(paste0("data/", x)) # load long data frame
  df <- strsplit(x, ".", fixed = T)[[1]][1] # get data frame name
  eval(parse(text = paste0("df <- ", df))) # rename the data frame as 'df'
  # add monitor column
  df <- data.frame(Monitor = paste0(sprintf("%02d", df[, "State.Code"]),
                                         sprintf("%03d", df[, "County.Code"]),
                                         sprintf("%04d", df[, "Site.Num"])),
                        df)
  unique(df[, c("Monitor", "Latitude", "Longitude")])
} )

latlongs.df <- latlongs[[1]]
for(i in 2:length(latlongs)){
  rbind(latlongs.df, latlongs[[i]])
}

ozone.latlongs.df <- unique(latlongs.df)
save("")  
