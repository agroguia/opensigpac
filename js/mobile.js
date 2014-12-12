

function enableMobile(map) {
  navigator.geolocation.getCurrentPosition(getLocation);
  function getLocation(location) {
    var coords = location.coords
    map.setView([coords.latitude, coords.longitude], 16);
  }
}
