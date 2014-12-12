

function PlotsLayer(map, tiledLayer, template) {
  var self = this;
  this.map = map;
  this.tiledLayer = tiledLayer;
  this.template = template;
  this.geometriesCount = {}
  this.geometries = {}
  this.tile = {}

  var zxyRe = /\/(\d+)[\/\.](\d+)[\/\.](\d+)\..../;

  tiledLayer.on('tileloadstart', function(o) {
    var xyz = o.url.match(zxyRe);
    if (xyz.length) {
      var z = xyz[1]
      var x = xyz[2]
      var y = xyz[3]
      if (z < PlotsLayer.MAX_ZOOM){ 
        return;
      }
      var zd = (z - 15);
      zd = Math.pow(2, zd);
      x = (x/zd) >> 0;
      y = (y/zd) >> 0;
      //y =  (1 << 15) - y;
      z = 15;
      var url = self.template
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y)
      //url = 'test/15.15949.20555'
      self.getTile(url, function(geojson) {
        self.onTileLoaded(geojson, z, x, y);
      });
    }
  });

  tiledLayer.on('tileunload', function(o) {
    var xyz = o.tile.src.match(zxyRe);
    if (xyz && xyz.length) {
      var z = xyz[1]
      var x = xyz[2]
      var y = xyz[3]
      var tileGeoms = self.tile[x + '-' + y + '-' + z];
      _.each(tileGeoms, function(id) {
        --self.geometriesCount[id] 
        if (self.geometriesCount[id] === 0) {
          self.map.removeLayer(self.geometries[id]);
          delete self.geometries[id];
        }
      });
    }
  })
}

PlotsLayer.MAX_ZOOM = 15;
PlotsLayer.DEFAULT_STYLE = {
  fillOpacity: 0,
  stroke: true,
  weight: 1.5,
  color: '#000',
  fill: false
}

PlotsLayer.DEFAULT_STYLE_HOVER = {
  fill: true,
  fillOpacity: 0.5,
  fillColor: '#FFF',
  stroke: true,
  weight: 2.5,
  color: '#C00'
}

PlotsLayer.prototype = {

  getTile: function(url, callback) {
    $.ajax({
    url: url, // 'test/15.15949.20555',
    type: "GET",
    //dataType: "binary",
    processData: false,
    success: function(data){
        data = Base64Binary.decodeArrayBuffer(data);
        var geojson = IO.BinaryGeometrySerializer.Read(data);
        callback(geojson);
    }
    });
  },

  removeAll: function() {
    var self = this;
    _.each(this.geometries, function(g) {
      self.map.removeLayer(g);
    });
    self.geometriesCount = {}
    self.tile = {}
  },

  onTileLoaded: function(geojson, z, x, y) {
    var self = this;
    var tileGeoms = this.tile[x + '-' + y + '-' + z] = []
    _.each(geojson, function(geo) {
      self.geometriesCount[geo.ID] = self.geometriesCount[geo.ID] || 0;
      ++self.geometriesCount[geo.ID]
      tileGeoms.push(geo.ID);
      if (!self.geometries[geo.ID]) {
        var layerGeo = L.geoJson(geo, {
          coordsToLatLng: function(coords) {
            var earthRadius = 6378137; 
            return L.CRS.EPSG3857.projection.unproject({
                x: coords[0]/earthRadius,
                y: coords[1]/earthRadius
            });
          }
        }).addTo(self.map);
        layerGeo.attributes = geo.Attributes;
        layerGeo.id = geo.ID;
        layerGeo.setStyle(PlotsLayer.DEFAULT_STYLE)
        self.addInteraction(layerGeo);
        self.geometries[geo.ID] = layerGeo;
      }
    });
  },

  addInteraction: function(geo) {
    geo.on('click', function() { 

    })
    geo.on('mouseover', function() { 
      if (geo.hovered) return;
      geo.setStyle(PlotsLayer.DEFAULT_STYLE_HOVER)
      geo.hovered = true;
    })
    geo.on('mouseout', function() { 
      if (!geo.hovered) return;
      geo.hovered = false;
      geo.setStyle(PlotsLayer.DEFAULT_STYLE)
    })
  }


}
