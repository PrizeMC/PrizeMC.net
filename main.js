// Click a server address row to copy it. The hint in the row swaps to
// "copied" for a moment, and the same message goes to a live region.

(function () {
  'use strict';

  var status = document.getElementById('copy-status');

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  // In-app browsers (Discord's, for one) can expose the clipboard API and then
  // refuse the write, so a rejection still gets the older method.
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  document.querySelectorAll('.row').forEach(function (row) {
    var hint = row.querySelector('.hint');
    var address = row.dataset.copy;
    var timer;

    function confirm() {
      row.classList.add('copied');
      hint.textContent = 'copied';
      if (status) status.textContent = address + ' copied to clipboard';
      clearTimeout(timer);
      timer = setTimeout(function () {
        row.classList.remove('copied');
        hint.textContent = 'copy';
      }, 1900);
    }

    row.addEventListener('click', function () {
      copyText(address).then(confirm, function () {
        hint.textContent = 'failed';
        clearTimeout(timer);
        timer = setTimeout(function () { hint.textContent = 'copy'; }, 1900);
      });
    });
  });
})();

// Server status: ask a public status API whether HorizonMines answers on its
// Minecraft port, and colour the signal meter green or red. If the status
// service itself can't be reached, the indicator stays hidden. Browsers can't
// open raw TCP sockets, so the ping goes through api.mcstatus.io (which caches
// each result for up to a minute).
//
// The address resolves to the network's Velocity proxy, so the player count
// covers everyone connected to the network, the same number horizonmines.net
// shows.

(function () {
  'use strict';

  var el = document.getElementById('server-status');
  if (!el) return;

  var label = el.querySelector('.status-label');
  var API = 'https://api.mcstatus.io/v2/status/java/HorizonMines.net:25565';
  var INTERVAL = 10000;
  var timer;

  function show(state, players) {
    el.hidden = false;
    el.dataset.state = state;
    if (state !== 'online') {
      label.textContent = 'Offline';
    } else if (players && typeof players.online === 'number') {
      // The noun has its own span so it can drop out where the line is tight.
      label.innerHTML = players.online + ' <span class="status-noun">' +
        (players.online === 1 ? 'player' : 'players') + ' </span>online';
    } else {
      label.textContent = 'Online';
    }
    el.title = 'HorizonMines.net: ' + label.textContent;
  }

  function check() {
    clearTimeout(timer);
    fetch(API, { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
      .then(function (data) { show(data.online ? 'online' : 'offline', data.players); })
      // Service unreachable: we don't know the server's state, so hide.
      .catch(function () { el.hidden = true; })
      .then(function () {
        if (!document.hidden) timer = setTimeout(check, INTERVAL);
      });
  }

  // Stop polling while the tab is in the background; catch up on return.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) clearTimeout(timer);
    else check();
  });

  check();
})();

// Scrambled release date for PrisonEscape: the game's obfuscated text format.
// Only glyphs of one width are used, so it reads as noise rather than as
// near-words. With reduced motion it stays as the question marks in the HTML.

(function () {
  'use strict';

  var name = document.querySelector('[data-scramble]');
  if (!name) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GLYPHS = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdeghjmnopqrsuvwxyz023456789';
  var cells = name.querySelectorAll('span');

  setInterval(function () {
    if (document.hidden) return;
    cells.forEach(function (cell) {
      cell.textContent = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
    });
  }, 90);
})();
