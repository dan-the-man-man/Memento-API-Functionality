/**
 * Google Books API
 */
function GoogleBooks() {}

GoogleBooks.prototype.search = function(query) {
    var url = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query);
    var response = http().get(url);
    var json = JSON.parse(response.body);
    if (!json.items) return [];
    return json.items.map(function(book) {
        return {
            title: book.volumeInfo.title || "",
            authors: (book.volumeInfo.authors || []).join(", "),
            published: book.volumeInfo.publishedDate || "",
            cover: book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : "",
            description: book.volumeInfo.description || ""
        };
    });
};

/**
 * MangaDex API
 */
function MangaDex() {}

MangaDex.prototype.search = function(query) {
    var url = "https://api.mangadex.org/manga?title=" + encodeURIComponent(query) + "&limit=5&includes[]=cover_art";
    var response = http().get(url);
    var json = JSON.parse(response.body);
    if (!json.data) return [];
    return json.data.map(function(manga) {
        var coverFileName = "";
        var coverRel = manga.relationships.find(function(r) { return r.type === "cover_art"; });
        if (coverRel) coverFileName = coverRel.attributes.fileName;
        return {
            title: manga.attributes.title.en || "",
            cover: coverFileName ? "https://uploads.mangadex.org/covers/" + manga.id + "/" + coverFileName : "",
            description: manga.attributes.description.en || ""
        };
    });
};
