cormatData <- function(data) {
   
  d <- data[order(data$Site_Key), ]
  site.info <- unique(d[, c("Site_Key", "State_Code", "County_Code", "Site_ID")])
  site.info$id <- sprintf("%02i-%03i-%04i", site.info$State_Code, site.info$County_Code, site.info$Site_ID)
  sites <- unique(d$Site_Key) #create list of unique AQSIDs
  k <- 1
  tot <- length(sites) - 1

  results_table <- data.frame() #create empty data frame
  for(i in seq(tot)) {
    for(j in seq(i+1, length(sites))) {
      sub_data=subset(d,d$Site_Key==sites[i] | d$Site_Key==sites[j])
      c1 <- c(sub_data$Latitude[sub_data$Site_Key == sites[i]][1], sub_data$Longitude[sub_data$Site_Key == sites[i]][1])
      c2 <- c(sub_data$Latitude[sub_data$Site_Key == sites[j]][1], sub_data$Longitude[sub_data$Site_Key == sites[j]][1])
      distance.km <- round(earth.dist(c1[2], c1[1], c2[2], c2[1]),0)
      results <- list()
      sub_data=dcast(sub_data,sub_data$Date~sub_data$Site_Key, fun.aggregate=mean, value.var = "Value")
      results$site1 <- sites[i]
      results$site2 <- sites[j]
      results$cor <- round(cor(sub_data[2],sub_data[3],use="pairwise.complete.obs",method="pearson"),3)
      results$com <- sum(complete.cases(sub_data))
      results$dif <- mean((abs(sub_data[,2]-sub_data[,3]))/((sub_data[,2]+sub_data[,3])/2), na.rm = TRUE)
      results$dis <- round(earth.dist(c1[2], c1[1], c2[2], c2[1]),0)
      results_table <- rbind(results_table, results)
    }
  }

  results_table$site1 = sapply(results_table$site1, function(site) {site.info$id[site.info$Site_Key == site]})
  results_table$site2 = sapply(results_table$site2, function(site) {site.info$id[site.info$Site_Key == site]})
  
  return(results_table)
  
}
  
cormatChart <- function(cormat_data, parameter) {
  
  chart_label <- switch(as.character(parameter),
                        "44201" = "8-Hour Daily Max Ozone Correlation Matrix",
                        "88101" = "Daily PM2.5 FRM/FEM (88101) Correlation Matrix",
                        "88502" = "Daily PM2.5 Non-FEM (88502) Correlation Matrix")
  
  makeMatrix <- function(df) {
    val <- colnames(df)[!colnames(df) %in% c("site1", "site2")]
    cast <- dcast(df, site2~site1, fun.aggregate=mean, value.var = val)
    rownames(cast) <- cast$site2
    cast <- cast[,2:ncol(cast)]
    as.matrix(cast)
  }
  
  # Create the matrices
  cor <- makeMatrix(cormat_data[, c("site1", "site2", "cor")])
  dif <- makeMatrix(cormat_data[, c("site1", "site2", "dif")])
  dis <- t(makeMatrix(cormat_data[, c("site1", "site2", "dis")]))
  dis[lower.tri(dis)] <- ""  
  dis[is.nan(dis)] == ""
  
  # colfunc=colorRampPalette(c("white","yellow","orange","red","purple"))(11)
  colfunc <- c("#FFFFFF", "#FFFF99", "#FFFF32", "#FFEC00", "#FFC900", "#FFA500",
               "#FF6200", "#FF2000", "#EB0630", "#C51390", "#A020F0")
  #Create color palette that runs from 0 to 1.1 and apply it to average abs.diferrence results
  dif <- matrix(cut(dif,breaks=seq(from=0,to=1.1,by=.1),labels=colfunc,include.lowest=TRUE,right=TRUE),
                nrow = nrow(cor), dimnames = list(rownames(cor), colnames(cor)))
  
  #Set up screens for layout
  split.screen(rbind(c(0,.9,0,1),c(.9,1,0.1,.5),c(.9,1,.55,.8),c(0,1,0,.1)))
  
  #Plot correlation matrix: width of ellipse=pearson corr;color=average absolute difference; number=distance in KM
  screen(1)
  par(plt=c(0,0.8,0,1),new=TRUE)
  plotcorr(cor,type="lower",col=dif,diag=TRUE,cex.lab=2, cex.main = 2.5, mar=c(3,0,3,1),outline=TRUE, main=paste(chart_label,"- All Valid Pairs"))
  text(expand.grid(y=seq(nrow(dis)),x=seq(nrow(dis), 1)),labels=dis,font=2,cex=1.5,col="blue",srt=45)
  
  #Plot ellipse legend
  screen(2)
  par(plt=c(.9,1,0.1,.5),new=TRUE)
  y=0.1
  x=0.15
  #  corrlist=(c(1.0,0.8,0.6,0.4,0.2,0))
  corrlist=seq(0, 1, by = 0.2)
  
  subplot(plot(ellipse(1), axes = FALSE, type="l",xlab="",ylab="", col = "white"), x=x, y=y, size=c(0.1,0.1)) #Something is not working with the first ellipse - it is plotting in the wrong position
  
  for (i in corrlist) {
    subplot(plot(ellipse(i), axes = FALSE, type="l",xlab="",ylab=""), x=x, y=y, size=c(.15,.15)) #Something is not working with the first ellipse - it is plotting in the wrong position
    text(x=x+.15, y = y, labels = as.character(i), cex=1.5)
    y=y+.15
  }  
  
  text(x=.05,y=.15,adj=0,labels="Pearson Correlation (r)",cex=1.5,srt=90)
  
  #Plot avg relative difference legend
  screen(3)
  par(plt=c(.9,1,.6,1),new=TRUE)
  gradient.rect(.1,0,.2,.9,nslices=10,col=colfunc,gradient="Y")
  text(x=.3, y=seq(from=0, to=.8 ,by=.16), labels = c(seq(from=0,to=1,by=.2)),cex=1.5)       
  text(x =0.05, y=0,adj=0,labels="Average Relative Difference",srt=90,cex=1.5)
  
  #Paste note on distance values
  screen(4)
  par(plt=c(0,1,0,.1),new=TRUE)
  text(x=.2,y=.5,labels="values in ellipse = distance in kilometers",col="blue", cex=2.5,mar=c(0,0,0,0))
  
  close.screen(all.screens=TRUE)
  
}