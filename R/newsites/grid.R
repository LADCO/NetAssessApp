# make raster grid of US using shapefile from https://www.census.gov/geo/maps-data/data/tiger-cart-boundary.html
library("sp", "rgdal")
esri.file <- "C:\\R repositories\\NetAssessApp\\data\\us_grid_clipped\\us_grid_clipped.shp"
ogrListLayers(esri.file)
# [1] "us_grid_clipped"
grid <- readOGR(esri.file, layer = "us_grid_clipped")
plot(grid)
grid <- raster(grid)
save(grid, file = "C:/R repositories/NetAssessApp/data/grid.rda")