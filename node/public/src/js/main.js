window.setTimeout(function() {
    $('.moods').addClass('hide');
    $('.songSearch').addClass('hide');
    setTimeout(function() {
        $('.music').addClass('show');
    }, 1000);
    setTimeout(function() {
        $('.songSearch').addClass('show').removeClass('hide').delay(5000);
    }, 2200);
}, 3000);

// $(".songSearch").focus(function() {
//     $('.musiclist').addClass('show');
// });
// $(".songSearch").focusout(function() {
//     $('.musiclist').removeClass('show').addClass('hide');
// });
$(".musiclist li").on('click', function() {
    $('.music').removeClass('show').addClass('hide');
    setTimeout(function() {
        $('.moodfinal').addClass('show');
        moodScroll(40).delay(300);
    }, 500);
});

// Mood Scroller

var scrollW = document.getElementById("wrap-scroll");
var scrollUl = document.getElementById("ul-scroll");
var itemsScrolled,
    itemsMax,
    cloned = false;

var listOpts = {
    itemCount: null,
    itemHeight: null,
    items: [],
};

function scrollWrap() {

    itemsScrolled = Math.ceil((this.scrollTop + listOpts.itemHeight / 3) / listOpts.itemHeight);

    //Isso é um tratamento para o primeiro item aparecer com active
    if (this.scrollTop < 1) {
        itemsScrolled = 0;
    }
    // Isso aqui tira a classe active
    listOpts.items.forEach(function(ele) {
            ele.classList.remove("active");
        })
        // Isso aqui adiciona a active
    if (itemsScrolled < listOpts.items.length) {
        listOpts.items[itemsScrolled].classList.add("active");
    }
}

function initItems(scrollSmooth) {

    listOpts.items = [].slice.call(scrollUl.querySelectorAll("li"));
    listOpts.itemHeight = 60;
    listOpts.itemCount = listOpts.items.length;

    if (!itemsMax) {
        itemsMax = listOpts.itemCount;
    }

    if (scrollSmooth) {
        var seamLessScrollPoint = ((itemsMax - 3) * listOpts.itemHeight);
        scrollW.scrollTop = seamLessScrollPoint;
    }

}

document.addEventListener("DOMContentLoaded", function(event) {
    initItems();
    scrollW.onscroll = scrollWrap;
});

var moodtop = 60;

function moodScroll(index) {
    $('#ul-scroll li span').removeAttr('id');
    $('#ul-scroll li').eq(index).find('span').attr('id', 'selectedmood');

    $('#wrap-scroll').animate({
        scrollTop: $("#selectedmood").position().top - 60,
    }, index * 200);

    if (index == 1) {
        $('#wrap-scroll').animate({
            scrollTop: 37,
        }, index * 700);
    } else if (index == 0) {
        $('#wrap-scroll').animate({
            scrollTop: 0,
        }, index * 1500);
        $('#ul-scroll li:first-child').addClass("active");
    }
}

var scrollW = document.getElementById("wrap-scroll");
var scrollUl = document.getElementById("ul-scroll");
var itemsScrolled,
    itemsMax,
    cloned = false;

var listOpts = {
    itemCount: null,
    itemHeight: null,
    items: [],
};

function scrollWrap() {

    itemsScrolled = Math.ceil((this.scrollTop + listOpts.itemHeight / 3) / listOpts.itemHeight);

    //Isso é um tratamento para o primeiro item aparecer com active
    if (this.scrollTop < 1) {
        itemsScrolled = 0;
    }
    // Isso aqui tira a classe active
    listOpts.items.forEach(function(ele) {
            ele.classList.remove("active");
        })
        // Isso aqui adiciona a active
    if (itemsScrolled < listOpts.items.length) {
        listOpts.items[itemsScrolled].classList.add("active");
    }
}

function initItems(scrollSmooth) {

    listOpts.items = [].slice.call(scrollUl.querySelectorAll("li"));
    listOpts.itemHeight = 60;
    listOpts.itemCount = listOpts.items.length;

    if (!itemsMax) {
        itemsMax = listOpts.itemCount;
    }

    if (scrollSmooth) {
        var seamLessScrollPoint = ((itemsMax - 3) * listOpts.itemHeight);
        scrollW.scrollTop = seamLessScrollPoint;
    }

}

document.addEventListener("DOMContentLoaded", function(event) {
    initItems();
    scrollW.onscroll = scrollWrap;
});

var moodtop = 60;

function moodScroll(index) {
    $('#ul-scroll li span').removeAttr('id');
    $('#ul-scroll li').eq(index).find('span').attr('id', 'selectedmood');

    $('#wrap-scroll').animate({
        scrollTop: $("#selectedmood").position().top - 60,
    }, index * 200);

    if (index == 1) {
        $('#wrap-scroll').animate({
            scrollTop: 37,
        }, index * 700);
    } else if (index == 0) {
        $('#wrap-scroll').animate({
            scrollTop: 0,
        }, index * 700);
        $('#ul-scroll li:first-child').addClass("active");
    }
}



// if ($('.moodfinal').hasClass('show')) {
//     // moodScroll(4);
//     alert('TEM A CLASSE');
// };

$('.songSearch').keyup(function() {
    var _this = $(this);
    var size = _this.val().length;
    $('.musiclist').html('');
    if (size > 3) {
        $.ajax({
            url: 'https://api.spotify.com/v1/search?query='+encodeURIComponent(_this.val())+'&offset=0&limit=50&type=track',
            success: function(data) {
                var items = data.tracks.items;
                if (items.length > 0) {
                    $('.musiclist').html('');
                    items.forEach(function(item) {
                        var template = '<li><img src="'+item.album.images[0].url+'" alt="'+item.name+'"><span class="song">'+item.name+'</span><span>'+item.artists[0].name+'</span></li>';
                        $('.musiclist').append(template);
                    });
                    $('.musiclist').addClass('show');
                }
            }
        })
    }
});

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
            //$('body').css("background-color", rgbToHex(color[0], color[1], color[2]));
            moodboard(preview_url);
        },
        error: function(error) {
            console.log(error);
        }
    })
});
//moodboard('https://p.scdn.co/mp3-preview/23552502ef8477c882d6f2ae07e7579f38b8a92d');

initApp();

function rotate() {
    object.scene.rotation.y += 0.01;
    setTimeout(rotate, 100);
}

rotate();
