module.exports = class GMapsAPI
{

constructor()
{
  const GoogleMapsAPI = require('googlemaps');
  var publicConfig = {
    key: 'AIzaSyCYtlcX6HByoHsNAIcSOpTpRLffPai-i7g',
    stagger_time: 1000, // for elevationPath
    encode_polylines: false,
    secure: true, // use https
    //proxy:              'http://127.0.0.1:9999' // optional, set a proxy for HTTP requests
  },
  gmAPI = new GoogleMapsAPI(publicConfig);
}

getCityChannelName(coordIn)
{
  let reverseGeocodeParams = {
  				  "latlng":        coordIn,
  				  "result_type":   "locality",
  				  "language":      "en",
  				  "location_type": "APPROXIMATE"
  				};
  
  let cityChanName = '';
  gmAPI.reverseGeocode(reverseGeocodeParams, function(err, result){
  cityChanName = result.results[0].address_components[0].short_name.toLowerCase().replace( ' ', '_' );
});
  return cityChanName;
}

};