# cek

do some simple checks with http/https. 

## usage

``` javascript

var cek = require("cek");

cek("https://example.com/", function(result){

	console.log(result);

});

```

result is an object which consists of 

| property | present | explanation
| --- | --- | --- 
| `success` | always | true if webserver replied with http status code <200
| `status` | on http(s) response | http status code
| `err` | on error | any error passed from [request](https://www.npmjs.com/package/request)
| `type` | if not successful | type of problem (`connection`,`dns`,`tls`,`protocol`,`error`,`webserver`,`backend`)
| `explain` | if not successful | human-readable explanation if possible
| `https` | if https | true if protocol is https
| `certvalid` | if valid tls | number of days that the used tls certificate is still valid
