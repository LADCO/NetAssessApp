voronoi <- function(ids, lats, longs, boundary) {

  # Create a dataframe from the user's inputs
  df <- cbind(ids, lats, longs)
  # Create a SpatialPointsDataFrame
  points <- SpatialPointsDataFrame(list(longs, lats), data.frame(ids))
  # Extract the coordinates from the SpatialPointsDataFrame
  crds <- coordinates(points)
  # If a boundary files was provided, use that to calculate a bounding box when
  # calculating the voronoi polygons vertices
  if(!missing(boundary)) {
    bb <- bbox(boundary)
    bb2 <- bbox(points)
    bb[1,1] <- min(bb[1,1], bb2[1,1])
    bb[2,1] <- min(bb[2,1], bb2[2,1])
    bb[1,2] <- max(bb[1,2], bb2[1,2])
    bb[2,2] <- max(bb[2,2], bb2[2,2])
    rw <- as.numeric(t(bb))
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
  pid2 <- as.numeric(sapply(pid, function(x) unlist(strsplit(x, " "))[1]))
  points <- points[points$ids %in% pid2, ]
  crds <- coordinates(points)
  voronoi <- SpatialPolygonsDataFrame(SP, data=data.frame(pnt_x=crds[,1],
                                                          pnt_y = crds[,2], id = pid2, row.names=pid, stringsAsFactors = FALSE))
  # Return the SpatialPolygonsDataFrameObject
  return(voronoi)
}