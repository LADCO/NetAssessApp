voronoi <- function(ids, lats, longs, boundary) {
  
  # Create a dataframe from the user's inputs
  df <- cbind(ids, lats, longs)
  # Create a SpatialPointsDataFrame
  points <- SpatialPointsDataFrame(list(longs, lats), data.frame(ids))
  
  # Extract the coordinates from the SpatialPointsDataFrame
  crds <- points@coords
  
  # If a boundary files was provided, use that to calculate a bounding box when 
  # calculating the voronoi polygons vertices
  if(!missing(boundary)) {
    bb <- bbox(boundary)
    rw <- as.numeric(t(bbox(boundary)))
    z <- deldir(crds[,1], crds[,2], rw=rw)  
  } else {
    z <- deldir(crds[,1], crds[,2])
  }
  
  # Create a list of the voronoi polygons, the create and empty vector 'poly' 
  # of same length to store new polygons
  w <- tile.list(z)
  polys <- vector(mode="list", length=length(w))
  
  # Loop through the list, w, creating polygon objects for each in the poly 
  # vector
  for(i in seq(along = polys)) {
    pcrds <- cbind(w[[i]]$x, w[[i]]$y)
    pcrds <- rbind(pcrds, pcrds[1, ])
    polys[[i]] <- Polygons(list(Polygon(pcrds)), ID=ids[i])
  }
  
  # Create a SpatialPolygons Object to store the new polygons
  SP <- SpatialPolygons(polys)
  
  # If a boundary file was provided, perform a final clip to that boundary file
  # NOTE: This can be slow, and appears to be the biggest bottleneck in the 
  # script.
  if(!missing(boundary)) SP <- gIntersection(SP, boundary, byid = TRUE)
  
  # Use the SP object to create a SpatialPolygonsDataFrame that has the polygons
  # plus additional information like the the monitor id.
  pid <- sapply(slot(SP, "polygons"), function(x) slot(x, "ID"))
  voronoi <- SpatialPolygonsDataFrame(SP, data=data.frame(pnt_x=crds[,1], 
                pnt_y = crds[,2], id = pid, row.names=pid, stringsAsFactors = FALSE))  
  
  # Return the SpatialPolygonsDataFrameObject
  return(voronoi)
  
}