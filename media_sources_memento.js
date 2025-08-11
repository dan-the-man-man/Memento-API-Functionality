/**
The data source for obtaining book information from Google Books API.
@param {string} apiKey - Your Google Books API key.
More info about Google Books API: https://developers.google.com/books/docs/v1/getting_started
@example 
var books = new GoogleBooks("YOUR_API_KEY");
var r = books.search(query);
result(r, function(id) { return books.extra(id); });
*/
function GoogleBooks(apiKey) {
    this.apiKey = apiKey;
}

/**
Issue a search query to Google Books database.
@param {string} query - Search query.
*/
GoogleBooks.prototype.search = function(query) {
    var result = http().get("https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&key=" + this.apiKey);
    var json = JSON.parse(result.body);
    if (!json.items) return [];
    
    return json.items.map(function(item) {
        return {
            id: item.id,
            title: item.volumeInfo.title || "",
            authors: (item.volumeInfo.authors || []).join(", "),
            publishedDate: item.volumeInfo.publishedDate || "",
            description: item.volumeInfo.description || "",
            thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : ""
        };
    });
}

/**
Get detailed info about a specific book by ID.
@param {string} id - The Google Books volume ID.
*/
GoogleBooks.prototype.extra = function(id) {
    var resultJson = http().get("https://www.googleapis.com/books/v1/volumes/" + id + "?key=" + this.apiKey);
    var result = JSON.parse(resultJson.body);
    var info = result.volumeInfo || {};
    
    return {
        id: id,
        title: info.title || "",
        authors: (info.authors || []).join(", "),
        publisher: info.publisher || "",
        publishedDate: info.publishedDate || "",
        description: info.description || "",
        categories: (info.categories || []).join(", "),
        pageCount: info.pageCount || "",
        language: info.language || "",
        previewLink: info.previewLink || "",
        thumbnail: info.imageLinks ? info.imageLinks.thumbnail : ""
    };
}

// CUSTOM SCRIPT CALL
var books = new GoogleBooks("YOUR_API_KEY"); // put your Google Books API key here
var r = books.search(query);
result(r, function(id) { return books.extra(id); });
