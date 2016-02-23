function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

$('#searchSong').submit(function(event) {
    event.preventDefault();
    event.stopPropagation();
    var url = $(this).attr('action');
    $.ajax({
        url: url,
        type: 'POST',
        data: {
            song: $('.song').val(),
            artist: $('.artist').val()
        },
        success: function(data) {
            console.log(data);
            var preview_url = data.preview_url;
            var color = data.mood.color;
            $('body').css("background-color", rgbToHex(color[0], color[1], color[2]));
            moodboard(preview_url);
        },
        error: function(error) {
            console.log(error);
        }
    })
});
//moodboard('https://p.scdn.co/mp3-preview/23552502ef8477c882d6f2ae07e7579f38b8a92d');
