/* media_sources_memento.js
   Memento-compatible, ES5-safe helper for Google Books + MangaDex.
   Exposes: GoogleBooks.prototype.search(query) and MangaDex.prototype.search(query)
*/

function GoogleBooks() {}

GoogleBooks.prototype.search = function(query) {
    try {
        var url = "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&maxResults=5";
        var resp = http().get(url);
        // Some http wrappers return string, some object with .body — handle both
        var body = (typeof resp === 'string') ? resp : (resp && resp.body ? resp.body : '');
        var json = body ? JSON.parse(body) : {};
        var out = [];
        var items = json.items || [];
        for (var i = 0; i < items.length; i++) {
            var v = items[i].volumeInfo || {};
            out.push({
                title: v.title || "",
                desc: (v.authors ? v.authors.join(", ") + " — " : "") + (v.description ? (v.description.length > 200 ? v.description.substring(0,200) + "..." : v.description) : ""),
                thumb: (v.imageLinks && v.imageLinks.thumbnail) ? v.imageLinks.thumbnail : "",
                id: "GB:" + (items[i].id || ("gb_" + i))
            });
        }
        return out;
    } catch (e) {
        log("GoogleBooks.search error: " + e);
        return [];
    }
};

function MangaDex() {}

MangaDex.prototype.search = function(query) {
    try {
        var url = "https://api.mangadex.org/manga?title=" + encodeURIComponent(query) + "&limit=5&includes[]=cover_art";
        var resp = http().get(url);
        var body = (typeof resp === 'string') ? resp : (resp && resp.body ? resp.body : '');
        var json = body ? JSON.parse(body) : {};
        var data = json.data || [];
        var out = [];
        for (var i = 0; i < data.length; i++) {
            var m = data[i];
            var attr = m.attributes || {};
            // find cover filename safely
            var coverFileName = "";
            if (m.relationships && m.relationships.length) {
                for (var j = 0; j < m.relationships.length; j++) {
                    if (m.relationships[j] && m.relationships[j].type === "cover_art" && m.relationships[j].attributes && m.relationships[j].attributes.fileName) {
                        coverFileName = m.relationships[j].attributes.fileName;
                        break;
                    }
                }
            }
            var coverUrl = coverFileName ? ("https://uploads.mangadex.org/covers/" + (m.id || "") + "/" + coverFileName) : "";
            // description may be object with languages; try 'en' fallback
            var desc = "";
            try {
                if (attr.description) {
                    if (typeof attr.description === "string") desc = attr.description;
                    else if (attr.description.en) desc = attr.description.en;
                    else {
                        // pick first property
                        for (var k in attr.description) { if (attr.description[k]) { desc = attr.description[k]; break; } }
                    }
                }
            } catch(e2) { desc = ""; }
            out.push({
                title: (attr.title && (attr.title.en || (function(){ for(var t in attr.title){ return attr.title[t]; }})() )) || "",
                desc: desc ? (desc.length > 200 ? desc.substring(0,200) + "..." : desc) : "",
                thumb: coverUrl,
                id: "MD:" + (m.id || ("md_" + i))
            });
        }
        return out;
    } catch (e) {
        log("MangaDex.search error: " + e);
        return [];
    }
};
