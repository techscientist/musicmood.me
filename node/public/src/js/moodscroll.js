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
    }, index*700);
    $('#ul-scroll li:first-child').addClass("active");
  }
}

if ($('.moodfinal').hasClass('show')) {
  // moodScroll(4);
  alert('TEM A CLASSE');
};

