// Projects page: the phone preview's screen picker.
// "Demo" plays the screen recording; the other buttons swap in screenshots.
(function () {
  var picker = document.querySelector(".screen-picker");
  var video = document.getElementById("pip-video");
  var shot = document.getElementById("pip-shot");
  if (!picker || !video || !shot) return;

  var base = "img/projects/places-ive-pooped/";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function playVideo() {
    video.playbackRate = 1.75; // recording has some dead air; speed it up
    var p = video.play();
    if (p && p.catch) p.catch(function () {}); // autoplay may be blocked; poster stays
  }

  function show(btn) {
    picker.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    var screen = btn.dataset.screen;
    if (screen === "video") {
      shot.classList.remove("is-active");
      video.classList.add("is-active");
      playVideo();
    } else {
      video.pause();
      shot.src = base + screen + ".jpg";
      shot.alt = btn.dataset.alt || "";
      video.classList.remove("is-active");
      shot.classList.add("is-active");
    }
  }

  picker.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-screen]");
    if (btn) show(btn);
  });

  // Start the video only once it's on screen (and not for reduced-motion users).
  if (!reduceMotion && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!video.classList.contains("is-active")) return;
        if (en.isIntersecting) playVideo(); else video.pause();
      });
    }, { threshold: 0.4 }).observe(video);
  } else {
    video.controls = true;
  }
})();
