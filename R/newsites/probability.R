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



  
