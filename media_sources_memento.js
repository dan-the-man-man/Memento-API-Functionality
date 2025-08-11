/**
 * Discogs API Data Source for Memento
 * @param {string} apiKey - Consumer key.
 * @param {string} apiSecret - Consumer secret.
 * @param {string} type - release, master, artist.
 */

function Discogs(apiKey, apiSecret, type) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.type = type;
}

// Search query
Discogs.prototype.search = function (query) {
    var url = "https://api.discogs.com/database/search?q=" + encodeURIComponent(query)
        + "&key=" + this.apiKey
        + "&secret=" + this.apiSecret
        + "&type=" + this.type;

    var result = http().get(url);
    var json = JSON.parse(result.body);
    return json.results;
}

// Barcode search
Discogs.prototype.barcode = function (code) {
    var url = "https://api.discogs.com/database/search?barcode=" + encodeURIComponent(code)
        + "&key=" + this.apiKey
        + "&secret=" + this.apiSecret
        + "&type=" + this.type;

    var result = http().get(url);
    var json = JSON.parse(result.body);
    return json.results;
}

// Extra info
Discogs.prototype.extra = function (id) {
    var url = "https://api.discogs.com/" + this.type + "s/" + id
        + "?key=" + this.apiKey
        + "&secret=" + this.apiSecret;

    var resultJson = http().get(url);
    var result = JSON.parse(resultJson.body);

    if (result.images) result.images = result.images.map(e => e.uri).join();
    if (result.videos) result.videos = result.videos.map(e => e.uri).join();
    if (result.artists) result.artists = result.artists.map(e => e.name).join();
    if (result.tracklist) result.tracklist = result.tracklist.map(e => e.position + ". " + e.title + " " + e.duration).join("\n");
    if (result.styles) result.styles = result.styles.join();
    if (result.genres) result.genres = result.genres.join();

    return result;
}

// Memento entry point
function main(query) {
    var discogs = new Discogs("YOUR_KEY", "YOUR_SECRET", "release");
    var r = discogs.search(query);
    return result(r, function (id) {
        return discogs.extra(id);
    });
}
