/**
 * Data source for obtaining information from MangaDex and Google Books APIs
 * @param {string} apiKey - Google Books API key (optional for MangaDex)
 * @param {string} type - Either "manga" or "book"
 * @example 
 * var source = new MangaBook(null, "manga");
 * var r = source.search(query);
 * result(r, function(id) { return source.extra(id); });
 */
function MangaBook(apiKey, type) {
    this.apiKey = apiKey;
    this.type = type;
}

/**
 * Issue a search query to the appropriate API
 * @param {string} query - Search query
 */
MangaBook.prototype.search = function(query) {
    if (this.type === "manga") {
        return this.searchMangaDex(query);
    } else if (this.type === "book") {
        return this.searchGoogleBooks(query);
    }
    return [];
};

/**
 * Search MangaDex API
 * @param {string} query - Search query
 */
MangaBook.prototype.searchMangaDex = function(query) {
    var limit = 7; // MangaDex returns 7 results
    var url = "https://api.mangadex.org/manga?limit=" + limit + "&title=" + encodeURIComponent(query);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    
    return json.data.map(function(manga) {
        return {
            id: manga.id,
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
            year: manga.attributes.year,
            description: manga.attributes.description?.en || "",
            type: "manga"
        };
    });
};

/**
 * Search Google Books API
 * @param {string} query - Search query
 */
MangaBook.prototype.searchGoogleBooks = function(query) {
    var limit = 3; // Google Books returns 3 results
    var url = "https://www.googleapis.com/books/v1/volumes?q=" + 
              encodeURIComponent(query) + "&maxResults=" + limit + 
              (this.apiKey ? "&key=" + this.apiKey : "");
    var result = http().get(url);
    var json = JSON.parse(result.body);
    
    if (!json.items) return [];
    
    return json.items.map(function(book) {
        return {
            id: book.id,
            title: book.volumeInfo.title,
            authors: book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "",
            year: book.volumeInfo.publishedDate ? book.volumeInfo.publishedDate.substring(0,4) : "",
            description: book.volumeInfo.description || "",
            type: "book"
        };
    });
};

/**
 * Get extra details for a specific item
 * @param {string} id - The resource identifier
 */
MangaBook.prototype.extra = function(id) {
    if (this.type === "manga") {
        return this.getMangaDexDetails(id);
    } else if (this.type === "book") {
        return this.getGoogleBooksDetails(id);
    }
    return {};
};

/**
 * Get detailed information from MangaDex
 * @param {string} id - Manga ID
 */
MangaBook.prototype.getMangaDexDetails = function(id) {
    var url = "https://api.mangadex.org/manga/" + id + "?includes[]=author&includes[]=artist";
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var manga = json.data;
    
    var details = {
        title: manga.attributes.title.en || Object.values(manga.attributes.title)[0],
        altTitles: manga.attributes.altTitles ? 
                  Object.values(manga.attributes.altTitles).map(t => Object.values(t)[0]).join(", ") : "",
        description: manga.attributes.description?.en || "",
        year: manga.attributes.year,
        status: manga.attributes.status,
        contentRating: manga.attributes.contentRating,
        tags: manga.attributes.tags ? 
             manga.attributes.tags.map(tag => tag.attributes.name.en).join(", ") : "",
        authors: [],
        artists: [],
        links: []
    };
    
    // Get authors and artists
    json.relationships.forEach(function(rel) {
        if (rel.type === "author") details.authors.push(rel.attributes?.name);
        if (rel.type === "artist") details.artists.push(rel.attributes?.name);
    });
    
    // Get links
    if (manga.attributes.links) {
        for (var key in manga.attributes.links) {
            details.links.push(key + ": " + manga.attributes.links[key]);
        }
    }
    
    // Convert arrays to strings
    details.authors = details.authors.join(", ");
    details.artists = details.artists.join(", ");
    details.links = details.links.join("\n");
    
    return details;
};

/**
 * Get detailed information from Google Books
 * @param {string} id - Book ID
 */
MangaBook.prototype.getGoogleBooksDetails = function(id) {
    var url = "https://www.googleapis.com/books/v1/volumes/" + id + 
              (this.apiKey ? "?key=" + this.apiKey : "");
    var result = http().get(url);
    var book = JSON.parse(result.body);
    var info = book.volumeInfo;
    
    return {
        title: info.title,
        subtitle: info.subtitle || "",
        authors: info.authors ? info.authors.join(", ") : "",
        publisher: info.publisher || "",
        publishedDate: info.publishedDate || "",
        description: info.description || "",
        isbn: info.industryIdentifiers ? 
             info.industryIdentifiers.map(id => id.type + ": " + id.identifier).join(", ") : "",
        pageCount: info.pageCount || "",
        categories: info.categories ? info.categories.join(", ") : "",
        language: info.language || "",
        previewLink: info.previewLink || "",
        infoLink: info.infoLink || ""
    };
};
