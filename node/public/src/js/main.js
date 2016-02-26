window.setTimeout(function(){
    $('.moods').addClass('hide');
    $('input').addClass('hide');
    setTimeout(function() {
        $('.music').addClass('show');
      }, 1000);
    setTimeout(function(){
        $('input').addClass('show').removeClass('hide').delay(5000);
    }, 2200);
}, 3000);

$( "input" ).focus(function() {
    $('.musiclist').addClass('show');
});
$( "input" ).focusout(function() {
    $('.musiclist').removeClass('show').addClass('hide');
});
$( ".musiclist li" ).on('click',function() {
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

function scrollWrap () {

  itemsScrolled = Math.ceil( (this.scrollTop + listOpts.itemHeight / 3 ) / listOpts.itemHeight);

//Isso é um tratamento para o primeiro item aparecer com active
if (this.scrollTop < 1) {
  itemsScrolled = 0;
}
// Isso aqui tira a classe active
listOpts.items.forEach(function (ele) {
  ele.classList.remove("active");
})
// Isso aqui adiciona a active
if (itemsScrolled < listOpts.items.length) {
  listOpts.items[itemsScrolled].classList.add("active");
}
}

function initItems (scrollSmooth) {

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
  $('#ul-scroll li').eq(index).find('span').attr('id','selectedmood');

  $('#wrap-scroll').animate({
        scrollTop : $("#selectedmood").position().top-60,
  }, index*200);

  if(index == 1) {
    $('#wrap-scroll').animate({
      scrollTop: 37,
    }, index*700);
  }else if(index == 0) {
    $('#wrap-scroll').animate({
      scrollTop: 0,
    }, index*1500);
    $('#ul-scroll li:first-child').addClass("active");
  }
}


