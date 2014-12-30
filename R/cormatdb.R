cormat <- function(db, sites, parameter, output = "screen") {
   
  chart_label <- switch(as.character(parameter),
                        "44201" = "8-Hour Daily Max Ozone Correlation Matrix",
                        "88101" = "Daily PM2.5 FRM/FEM (88101) Correlation Matrix",
                        "88502" = "Daily PM2.5 Non-FEM (88502) Correlation Matrix")
  
  makeMatrix <- function(df, site.info) {
    val <- colnames(df)[!colnames(df) %in% c("site1", "site2")]
    cast <- dcast(df, site2~site1, fun.aggregate=mean, value.var = val)
    rownames(cast) <- sapply(cast$site2, function(key) {site.info$id[site.info$Key == key]})
    cast <- cast[,2:ncol(cast)]
    colnames(cast) <- sapply(colnames(cast), function(key) {site.info$id[site.info$Key == key]})
    as.matrix(cast)
  }
  
  # Query the database for the needed correlation data
  sql <- paste0("SELECT site1, site2, cor, dif, dis FROM correlation WHERE parameter = ", parameter, " AND site1 IN (", paste0(sites, collapse = ", "), ")  AND site2 IN (", paste0(sites, collapse = ", "), ")")
  q <- dbGetQuery(db, sql)
  
  # Get the site ids from the database
  sql <- paste0("SELECT Key, State_Code, County_Code, Site_ID FROM sites WHERE Key IN (", paste0(sites, collapse = ", "), ")")
  site.info <- dbGetQuery(db, sql)
  site.info$id <- sprintf("%02i-%03i-%04i", site.info$State_Code, site.info$County_Code, site.info$Site_ID)
  
  # Create the matrices
  cor <- makeMatrix(q[, c("site1", "site2", "cor")], site.info)
  dif <- makeMatrix(q[, c("site1", "site2", "dif")], site.info)
  dis <- t(makeMatrix(q[, c("site1", "site2", "dis")], site.info))
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
  
  text(x=.05,y=.15,adj=0,labels="Pearson Correlation (r^2)",cex=1.5,srt=90)
  
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