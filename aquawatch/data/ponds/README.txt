AquaWatch pond detections
=========================

Method    : object-based detection on multi-pass SAR
Sensor    : Sentinel-1 RTC (VV), 10 m, Microsoft Planetary Computer
CRS       : EPSG:4326 (WGS84 lon/lat)
Min area  : 0.25 ha
Features  : 10,658  (see caveat: some are merged farm blocks)
Total area: 28,323.9 ha

IMPORTANT
---------
Automatic detections from Sentinel-1 SAR, not a cadastral or surveyed product. Boundaries are raster-derived at 10 m and are approximate. Accuracy is still being measured against hand-checked optical imagery; the previously published F1 ~0.90 is agreement with the OBIA detector, NOT accuracy against the ground. Adjacent ponds that share a bund merge into ONE polygon, so a feature can be a farm block rather than a single pond: the feature count is a lower bound on the number of ponds, and area is the reliable quantity. Do not use as sole evidence for enforcement or for any legal determination of ownership, extent or permitting status.

Fields
------
feature_id  stable id, <belt>-<index>
likely_block  true when >5 ha, i.e. probably merged neighbouring ponds
belt      detection belt
district  district, where known
area_ha   polygon area in hectares, computed in the projected CRS
lat, lon  centroid
source    obia | unet
surveyed  always false; these are detections
