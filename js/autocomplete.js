var config = {
    gadm_table: 'municipios_2014_cropti',
    cartodb_user: 'jorgearevalo',
    sql_api: 'http://jorgearevalo.cartodb.com'
}

var municipios = [];
var poligonos = [];
var parcelas = [];

var selected_address;


function autocomplete(map) {
    
    // Get all municipalities
    var search_query = "select lon as lng, lat as lat, name as poblacion, provincia as provincia, id, provincia_id from " + config.gadm_table

    var sql = cartodb.SQL({ user: config.cartodb_user, completeDomain: config.sql_api });    

    sql.execute(search_query).done(function(data) {
           console.log(data.rows);    

           _.map(data.rows, function(r) {   
              municipios.push({
                label: r.poblacion + " (" + r.provincia + ")",
                value: r.poblacion,
                meta:  {
                  poblacion: r.poblacion,
                  provincia: r.provincia,
                  lat: r.lat,
                  lng: r.lng,
                  id: r.id,
                  provincia_id: r.provincia_id
                }
              });     
            });

          $("#localidad").autocomplete({
            source: municipios,
            minLength: 2,
            select: function( event, ui ) {
                selected_address = ui.item.meta;
                var latlng = L.latLng(selected_address.lat, selected_address.lng);
                map.panTo(latlng);
                map.setZoom(16);

                console.log(selected_address);

                var url = "http://opensigpac.cartodb.net/vectorsdg/query/poligonos/" + selected_address.provincia_id + "/" + selected_address.id + "/0/0.gzip"

                $.ajax({
                    url: url, // 'test/15.15949.20555',
                    type: "GET",
                    //dataType: "binary",
                    processData: false,
                    success: function(data){
                        data = Base64Binary.decodeArrayBuffer(data);
                        var stuff = IO.BinaryGeometrySerializer.Read(data);

                        console.log("POLYGONS:" + stuff);
                    }
                });
            },
            position: {
                offset: "96 5"
            }
          });
        });
}

