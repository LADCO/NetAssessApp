################################
#
# Correlation Matrix Tool
# For the Air Monitoring Network Assessment Web Tool
#
# Code prepared by Cassie McMahon, Minnesota Pollution Control Agency
# cassie.mcmahon(at)state.mn.us
#
# Last update: 10/29/2014
#
################################

###Functions


  # Create function to calculate distance in kilometers between two points
  earth.dist <- function (long1, lat1, long2, lat2){
  rad = pi/180
  a1 = lat1 * rad
  a2 = long1 * rad
  b1 = lat2 * rad
  b2 = long2 * rad
  dlon = b2 - a2
  dlat = b1 - a1
  a = (sin(dlat/2))^2 + cos(a1) * cos(b1) * (sin(dlon/2))^2
  c = 2 * atan2(sqrt(a), sqrt(1 - a))
  R = 6378.145
  d = R * c
  return(d)
  }

###Read data

  #Read in site table
  site_table=read.csv("small_site_table.csv")

  #Read in data set based on user inputs
  	user_data="PM25_FRMFEM" #update to match shiny input variable name options include: "Ozone-8HR", "PM25_FRMFEM","PM25_SC"
 		if(user_data=="Ozone-8HR"){
        data=read.csv("ozone_dailysum_2011-2013.csv")
        chart_label="8-Hour Daily Max Ozone Correlation Matrix"} else {
        if(user_data=="PM25_FRMFEM"){
          data=read.csv("all88101.csv")
          chart_label="Daily PM2.5 FRM/FEM (88101) Correlation Matrix" } else {
          if(user_data=="PM25_SC"){
            data=read.csv("all88502.csv")
            chart_label="Daily PM2.5 Non-FEM (88502) Correlation Matrix"
          }
    	  }
    }

  #Subset data based on user inputs
  	user_subset=40 #update to match shiny input variable (Currently coded to be state code - may need to be updated to be list of AQS IDs
  	user_year=c(2011,2012,2013) #update to match shiny input variable (list or single year)
    data_subset=subset(data, data$State.Code ==user_subset & data$year %in% c(user_year),select=c("aqsid_dash","date","Max.Value")) #Update subset code to match input variables (change state to AQS ID)


###Perform calcuations

  #Calculate correlation, average absolute difference, number of pairs, and site distance in KM and return a dataframe

  sites=unique(data_subset$aqsid_dash) #create list of unique AQSIDs
 	results_table=data.frame(NULL) #create empty data frame
	options(warn=-1) #turn off warnings
  	
 	for(i in sites){
     for(j in sites){
     sub_data=subset(data_subset,data_subset$aqsid_dash==i | data_subset$aqsid_dash==j)
     sub_matrix=dcast(sub_data,sub_data$date~sub_data$aqsid_dash,fun.aggregate=mean)
     if(i!=j){ 
        pearson.corr=cor(sub_matrix[2],sub_matrix[3],use="pairwise.complete.obs",method="pearson")
        count.pairs=sum(complete.cases(sub_matrix))
        sub_matrix$dif=(abs(sub_matrix[,2]-sub_matrix[,3]))/((sub_matrix[,2]+sub_matrix[,3])/2)
        distance_sub=subset(site_table,site_table$aqsid_dash==i | site_table$aqsid_dash==j,select=c("aqsid_dash","Latitude","Longitude"))
        distance=earth.dist(as.numeric(distance_sub[1,3]),as.numeric(distance_sub[1,2]),as.numeric(distance_sub[2,3]),as.numeric(distance_sub[2,2]))
        park=data.frame(primary.site=i,test.site=j,pearson.corr=pearson.corr[1], avg.absDif=mean(sub_matrix$dif,na.rm=TRUE),pairs=count.pairs,distance.km=distance)
        results_table=rbind(results_table,park)
        next
        }
     park=data.frame(primary.site=i,test.site=j,pearson.corr=1, avg.absDif=0,pairs=nrow(sub_matrix),distance.km=NA)
     results_table=rbind(results_table,park)
     next
    }
  }

  #Calculate Pearson Correlations and store results as a correlation matrix for plotcorr function
  	create_matrix=dcast(data_subset,data_subset$date~data_subset$aqsid_dash,fun.aggregate=mean)
  	corr_results=cor(create_matrix[2:ncol(create_matrix)],use="pairwise.complete.obs",method="pearson")
 	

###Plot results

  #Create color palette that runs from 0 to 1.1 and apply it to average abs.diferrence results
  	colfunc=colorRampPalette(c("white","yellow","orange","red","purple"))(11)
  	abdif=results_table$avg.absDif
  	breakpts=cut(abdif,breaks=seq(from=0,to=1.1,by=.1),labels=colfunc,include.lowest=TRUE,right=TRUE)
  	abdif_matrix=dcast(results_table,results_table$primary.site~results_table$test.site,value.var="avg.absDif",drop=FALSE,fun.aggregate=mean)
  	avgAbsDif=matrix(breakpts,ncol=nrow(abdif_matrix),nrow=nrow(abdif_matrix),dimnames=rep(list(abdif_matrix[,1]),2))

  #Create distance labels
  	distance=results_table$distance.km
  	distance_matrix=matrix(as.character(round(distance,0)),ncol=nrow(abdif_matrix),nrow=nrow(abdif_matrix),dimnames=rep(list(abdif_matrix[,1]),2))
  	distance_matrix[lower.tri(distance_matrix)]=""  


  #Plot correlation matrix and labels
   pdf(file="correlation_matrix.pdf")

    	#Set up screens for layout
    		m=rbind(c(0,.8,0,1),c(.8,1,0,.4),c(.8,1,.45,.8),c(0,1,0,.1))
    		split.screen(m)
    
    	#Plot correlation matrix: width of ellipse=pearson corr;color=average absolute difference; number=distance in KM
    		screen(1)
    		if(length(user_year)>1){
     		   plotcorr(corr_results,type="lower",col=avgAbsDif,diag=TRUE,cex.lab=.8,mar=c(0,0,2,0),outline=TRUE,main=paste(chart_label, "\n All Valid Pairs", min(user_year),"-",max(user_year), sep=" "))
          } else {
     		   plotcorr(corr_results,type="lower",col=avgAbsDif,diag=TRUE,cex.lab=.8,mar=c(0,0,2,0),outline=TRUE,main=paste(chart_label,"\n All Valid Pairs", user_year, sep=" "))
	    	}	
        text(expand.grid(x=1:nrow(distance_matrix),y=nrow(distance_matrix):1),labels=distance_matrix,font=2,cex=.5,col="blue",srt=45)
  
    	#Plot ellipse legend
   		  screen(2)
    		par(plt=c(.8,1,0,.4),new=TRUE)
    		y=0.8
    		x=0.2
    		corrlist=(c(1.0,0.8,0.6,0.4,0.2,0))

    		for (i in corrlist) {
        	  subplot(plot(ellipse(i), axes = FALSE, type="l",xlab="",ylab=""), x=0.2, y=y, size=c(.15,.15)) #Something is not working with the first ellipse - it is plotting in the wrong position
        	  text(x=x+.15, y = y, labels = as.character(i),cex=.8)
        	  y=y-.12
     		}      
        text(x=.05,y=.15,adj=0,labels="Pearson Correlation (r)",cex=.9,srt=90)

    	#Plot avg relative difference legend
    		screen(3)
    		par(plt=c(.8,1,.45,.8),new=TRUE)
   	  	gradient.rect(.1,0,.2,.9,nslices=10,col=colfunc,gradient="Y")
    		text(x=.3, y=seq(from=0, to=.8 ,by=.16), labels = c(seq(from=0,to=1,by=.2)),cex=.8)       
    		text(x =0.05, y=0,adj=0,labels="Average Relative Difference",srt=90,cex=.9)
     
    	#Paste note on distance values
   		 screen(4)
    	 par(plt=c(0,1,0,.1),new=TRUE)
    	 text(x=.2,y=.5,labels="values in ellipse = distance in kilometers",col="blue", cex=.8,mar=c(0,0,0,0))
 
  close.screen(all.screens=TRUE)
	dev.off()
