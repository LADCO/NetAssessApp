library(ggplot2)
library(plyr)

agePyramid <- function(df, id) {

  m <- df[df$id == id, grep("^m_", colnames(df))]
  f <- df[df$id == id, grep("^f_", colnames(df))]
  r <- gsub("_", "-", substr(colnames(m), 3, 10))
  r[length(r)] <- "Over 84"
  
  m <- as.data.frame(cbind(r, t(m), deparse.level = 0), stringsAsFactors = FALSE)
  m$gender = "Male"

  f <- as.data.frame(cbind(r, t(f), deparse.level = 0), stringsAsFactors = FALSE)
  f$gender = "Female"
  
  d <- rbind(m, f)
  colnames(d) <- c("Age", "Count", "Gender")
  rownames(d) <- NULL
  d$Age <- factor(d$Age, levels = r)
  d$Count <- as.numeric(d$Count)
  d$Gender <- as.factor(d$Gender)
    
  m <- max(d$Count)
  s <- 10^floor(log10(m))
  ss <- seq(-ceiling(m/s) * s, ceiling(m/s) * s, s*2)
  
  gg <- suppressWarnings({ggplot(d) +
        geom_bar(subset=plyr::.(Gender=="Male"), aes(x=Age, y=Count*(-1), fill = Gender), stat = "identity") + 
        geom_bar(subset=plyr::.(Gender=="Female"), aes(x=Age, y=Count, fill = Gender), stat = "identity") + 
        scale_y_continuous(breaks=ss, labels = abs(ss)) + ylab("Count") +
        coord_flip() + theme(legend.position="bottom")})
  
  return(gg)
  
}