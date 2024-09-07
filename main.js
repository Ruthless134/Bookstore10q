const searchbutton = document.getElementById("search-button"); 
const searchclose = document.getElementById("search-close"); 
const searchcontent = document.getElementById("search-content"); 
 
/* Menu show */ 
searchbutton.addEventListener("click", () => { 
    searchcontent.classList.add("show-search"); 
}); 
 
/* Menu hidden */  
searchclose.addEventListener("click", () => { 
  searchcontent.classList.remove("show-search"); 
});

/*=============== LOGIN ===============*/
const loginbutton = document.getElementById('login-button')
const loginclose = document.getElementById("login-close")
const logincontent = document.getElementById("login-content")

loginbutton.addEventListener("click", () => { 
  logincontent.classList.add("show-login"); 
});

loginclose.addEventListener("click", () => { 
logincontent.classList.remove("show-login"); 
});

/*=============== ADD SHADOW HEADER ===============*/
const shadowHeader = () =>{
  const header = document.getElementById('header')
  // Add a class if the bottom offset is greater than 50 of the viewport
  this.scrollY >= 50 ? header.classList.add('shadow-header') 
                     : header.classList.remove('shadow-header')
}
window.addEventListener('scroll', shadowHeader)

/*=============== HOME SWIPER ===============*/
let totalSlides = 5;
let initialSlideIndex = Math.floor(totalSlides / 2);

let swiperHome = new Swiper('.Home_swiper', {
  loop: false,
  spaceBetween: -20,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: true,
  initialSlide: initialSlideIndex,

  autoplay:{
    delay: 3000,
    disableOnInteraction: false,
  },

  breakpoints: {
    1220: {
      spaceBetween: -20, 
    },
    768: {
      spaceBetween: -10,
    },
    480: {
      spaceBetween: -10, 
    }
  }
})

/*=============== FEATURED SWIPER ===============*/

let swiperFeatured = new Swiper('.featured_swiper', {
  loop: true,
  spaceBetween: 16,
  grabCursor: true,
  slidesPerView: 'auto',
  centeredSlides: true,

  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },


  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  breakpoints: {
    1150: {
      slidesPerView: 4,
      centeredSlides: false,
    }
  }
});

var container = document.getElementById("featured");

container.addEventListener("mouseover", (event) => {
  swiperFeatured.autoplay.stop();
});

container.addEventListener("mouseout", (event) => {
  swiperFeatured.autoplay.start();
});

/*=============== NEW SWIPER ===============*/


/*=============== TESTIMONIAL SWIPER ===============*/


/*=============== SHOW SCROLL UP ===============*/ 


/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/


/*=============== DARK LIGHT THEME ===============*/ 


/*=============== SCROLL REVEAL ANIMATION ===============*/






if ('WebSocket' in window) {
  (function () {
    function refreshCSS() {
      var sheets = [].slice.call(document.getElementsByTagName("link"));
      var head = document.getElementsByTagName("head")[0];
      for (var i = 0; i < sheets.length; ++i) {
        var elem = sheets[i];
        var parent = elem.parentElement || head;
        parent.removeChild(elem);
        var rel = elem.rel;
        if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {
          var url = elem.href.replace(/(&|\?)_cacheOverride=\d+/, '');
          elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
        }
        parent.appendChild(elem);
      }
    }
    var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
    var address = protocol + window.location.host + window.location.pathname + '/ws';
    var socket = new WebSocket(address);
    socket.onmessage = function (msg) {
      if (msg.data == 'reload') window.location.reload();
      else if (msg.data == 'refreshcss') refreshCSS();
    };
    if (sessionStorage && !sessionStorage.getItem('IsThisFirstTime_Log_From_LiveServer')) {
      console.log('Live reload enabled.');
      sessionStorage.setItem('IsThisFirstTime_Log_From_LiveServer', true);
    }
  })();
}
else {
  console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
}