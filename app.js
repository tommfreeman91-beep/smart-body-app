(function () {
  "use strict";

  // TODO: replace with the real invite link to the club when it's ready
  var CLUB_LINK = "https://t.me/PLACEHOLDER";

  var TRAININGS = [
    {
      youtubeId: "jkouQAPIaGY",
      title: "Растяжка на всё тело",
      lead: "Первая тренировка — сразу на всё тело. Не нужно готовиться, разминаться неделю и покупать коврик за пять тысяч. Просто расстели что-нибудь на полу и жми play."
    },
    {
      youtubeId: "aPlU9OcTZ_0",
      title: "Растяжка на ноги / шпагат",
      lead: "Сегодня — ноги и шпагат. Знаю, звучит страшно. Но шпагат — это не про боль, это про терпение к себе, которого у большинства из нас в дефиците."
    },
    {
      youtubeId: "wwKbzkmOJ5M",
      title: "Здоровая спина",
      lead: "Тренировка на здоровую спину. Если ты весь день сидишь, сутулишься и терпишь — тело это запоминает. Сегодня разжимаем."
    },
    {
      youtubeId: "QWpaZ5xfyUk",
      title: "Растяжка на всё тело",
      lead: "Снова растяжка на всё тело. И да, повторение — это нормально. Тело меняется не от одного раза, а от того, что ты возвращаешься."
    },
    {
      youtubeId: "UNcJXfTpz0Y",
      title: "Растяжка на ноги / шпагат",
      lead: "Опять ноги и шпагат. Если в прошлый раз было тяжело — так и должно быть, это не должно получаться сразу. Идём дальше, чуть глубже."
    },
    {
      youtubeId: "8OSz3ncw9kU",
      title: "Здоровая спина",
      lead: "Снова спина. Знаете, что я заметила? Люди часами разбираются в чужих проблемах и совсем забывают спросить у своей спины, как она вообще держится."
    },
    {
      youtubeId: "AcqAdmCTOgw",
      title: "Растяжка на всё тело",
      lead: "Тренировка №7. Осталась всего одна. Ты уже не та, кто листает сторис и думает «начну с понедельника» — ты просто начала."
    },
    {
      youtubeId: "jiBwmQ_Hjrc",
      title: "Ежедневная растяжка на всё тело",
      lead: "Последняя. Ежедневная растяжка на всё тело — та, которую можно оставить себе навсегда, даже когда программа закончится. Это не финиш. Это то, с чем ты теперь живёшь."
    }
  ];

  var state = {
    step: 0 // index into TRAININGS, -1 = cover, TRAININGS.length = final
  };
  var STEP_COVER = -1;
  var STEP_FINAL = TRAININGS.length;

  // ---------- Telegram WebApp integration ----------
  // telegram-web-app.js defines window.Telegram.WebApp even when the page
  // is opened in a plain browser (outside the Telegram client) — it's just
  // a stub there, with platform "unknown" and empty initData. Only treat
  // it as a real Telegram session when one of those is populated, otherwise
  // MainButton will never actually render and we must use the in-page button.
  var tgCandidate = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  var tg = null;

  function initTelegram() {
    if (!tgCandidate) return;
    var isRealTelegram = !!tgCandidate.initData || (tgCandidate.platform && tgCandidate.platform !== "unknown");
    if (!isRealTelegram) return;

    try {
      tg = tgCandidate;
      tg.ready();
      tg.expand();
      applyTheme();
      if (tg.themeParams) {
        tg.onEvent && tg.onEvent("themeChanged", applyTheme);
      }
      document.body.classList.add("tg-mainbutton");
    } catch (e) {
      // Telegram SDK present but something failed — fall back to in-page buttons
      tg = null;
    }
  }

  function applyTheme() {
    if (!tg || !tg.themeParams) return;
    var tp = tg.themeParams;
    var root = document.documentElement.style;
    if (tp.bg_color) root.setProperty("--bg", tp.bg_color);
    if (tp.text_color) root.setProperty("--text", tp.text_color);
    if (tp.hint_color) root.setProperty("--text-dim", tp.hint_color);
    if (tp.button_color) root.setProperty("--accent", tp.button_color);
    if (tp.button_text_color) root.setProperty("--accent-text", tp.button_text_color);
  }

  var mainButtonHandler = null;

  function setActionButton(label, onClick) {
    var fallbackBtn = getFallbackButtonForCurrentScreen();

    if (tg && tg.MainButton) {
      if (mainButtonHandler) {
        tg.MainButton.offClick(mainButtonHandler);
      }
      mainButtonHandler = onClick;
      tg.MainButton.setText(label);
      tg.MainButton.onClick(mainButtonHandler);
      tg.MainButton.show();
      if (fallbackBtn) fallbackBtn.hidden = true;
    } else if (fallbackBtn) {
      fallbackBtn.hidden = false;
      fallbackBtn.textContent = label;
      fallbackBtn.onclick = onClick;
    }
  }

  function getFallbackButtonForCurrentScreen() {
    if (state.step === STEP_COVER) return document.getElementById("btn-start");
    if (state.step === STEP_FINAL) return document.getElementById("btn-club");
    return document.getElementById("btn-next");
  }

  function openLink(url) {
    if (tg && tg.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, "_blank", "noopener");
    }
  }

  // ---------- Screens ----------
  var screenCover = document.querySelector('[data-screen="cover"]');
  var screenTraining = document.getElementById("screen-training");
  var screenFinal = document.querySelector('[data-screen="final"]');

  function showScreen(el) {
    [screenCover, screenTraining, screenFinal].forEach(function (s) {
      s.hidden = s !== el;
    });
    window.scrollTo(0, 0);
  }

  function renderTraining(index) {
    var data = TRAININGS[index];

    document.getElementById("training-counter").textContent =
      "Тренировка " + (index + 1) + " из " + TRAININGS.length;
    document.getElementById("training-title").textContent = data.title;
    document.getElementById("training-lead").textContent = data.lead;

    var youtubeUrl = "https://www.youtube.com/watch?v=" + data.youtubeId;
    var linkEl = document.getElementById("youtube-link");
    linkEl.href = youtubeUrl;
    linkEl.onclick = function (e) {
      e.preventDefault();
      openLink(youtubeUrl);
    };

    renderVideo(data.youtubeId, youtubeUrl);

    var dotsWrap = document.getElementById("progress-dots");
    dotsWrap.innerHTML = "";
    for (var i = 0; i < TRAININGS.length; i++) {
      var dot = document.createElement("div");
      dot.className = "progress-dot";
      if (i < index) dot.className += " is-done";
      if (i === index) dot.className += " is-current";
      dotsWrap.appendChild(dot);
    }

    var isLast = index === TRAININGS.length - 1;
    setActionButton(isLast ? "Завершить" : "Далее", function () {
      goToStep(index + 1);
    });
  }

  function renderVideo(youtubeId, youtubeUrl) {
    var videoWrap = document.getElementById("video-wrap");
    videoWrap.innerHTML = '<div class="video-embed" id="video-embed"></div>';
    var embedWrap = document.getElementById("video-embed");

    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + youtubeId + "?playsinline=1&rel=0";
    iframe.title = "Тренировка Smart Body";
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "lazy");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    // Fallback: if the iframe fails to load (e.g. embedding disabled),
    // swap in a thumbnail + "watch on YouTube" button.
    var fellBack = false;
    var fallbackTimer = setTimeout(function () {
      showVideoFallback(youtubeId, youtubeUrl);
      fellBack = true;
    }, 6000);

    iframe.onload = function () {
      clearTimeout(fallbackTimer);
    };
    iframe.onerror = function () {
      clearTimeout(fallbackTimer);
      if (!fellBack) showVideoFallback(youtubeId, youtubeUrl);
    };

    embedWrap.appendChild(iframe);
  }

  function showVideoFallback(youtubeId, youtubeUrl) {
    var videoWrap = document.getElementById("video-wrap");
    var thumbUrl = "https://i.ytimg.com/vi/" + youtubeId + "/hqdefault.jpg";
    videoWrap.innerHTML =
      '<div class="video-fallback">' +
      '<img src="' + thumbUrl + '" alt="Превью тренировки">' +
      '<button type="button" class="video-fallback-btn" id="video-fallback-btn">Смотреть на YouTube ↗</button>' +
      "</div>";
    document.getElementById("video-fallback-btn").onclick = function () {
      openLink(youtubeUrl);
    };
  }

  function goToStep(step) {
    state.step = step;

    if (step === STEP_COVER) {
      showScreen(screenCover);
      setActionButton("Начать", function () {
        goToStep(0);
      });
    } else if (step === STEP_FINAL) {
      showScreen(screenFinal);
      setActionButton("Хочу в клуб", function () {
        openLink(CLUB_LINK);
      });
    } else {
      showScreen(screenTraining);
      renderTraining(step);
    }
  }

  // ---------- Init ----------
  initTelegram();
  goToStep(STEP_COVER);
})();
