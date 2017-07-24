'use strict';

var states = ['empty', 'foundation', 'hut', 'tower', 'spire', 'monolith', 'megalith'];

const units = {
  empty: {
    price: 0,
    height: 0,
    tippet: '<div class="coin small">1: Clear a foundation</div>'
  },
  foundation: {
    price: 1,
    height: 0,
    tippet: '<div class="coin small">2: Build a hut</div>'
  },
  hut: {
    price: 2,
    height: 2,
    tippet: '<div class="coin small">5: Build a tower</div>'
  },
  tower: {
    price: 5,
    height: 4,
    tippet: '<div class="coin small">20: Build a spire</div>'
  },
  spire: {
    price: 20,
    height: 6,
    tippet: '<div class="coin small">50: Build a monolith</div>'
  },
  monolith: {
    price: 80,
    height: 8,
    tippet: '<div class="coin small">250: Build a megalith</div>'
  },
  megalith: {
    price: 240,
    height: 10,
    tippet: 'This structure is complete'
  }
};

var upgrade = new Pizazz({
  size: 30,
  buffer: 20,
  spacing: 15,
  speed: 1,
  stroke: 'white',
  strokeWidth: 2
});

var warning = new Pizazz({
  size: 20,
  buffer: 10,
  spacing: 10,
  speed: 1,
  stroke: '#fff',
  strokeWidth: 1
});

var sceneRotation = -135;
var sceneGrid;
var coins;
var firstLogin;
var lastLogin;

var getRandomVal = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var genBlankGrid = function() {
  return _.fill(Array(100), 0);
};

var $stage = document.getElementById('scene');
var $ground = document.getElementById('ground_grid');
var $scene = document.getElementById('scene_grid');
var $counter = document.getElementById('days_since');
var $coins = document.getElementById('coin_count');
var $coinModal = document.getElementById('coin_modal');

var renderGrid = function(grid, id) {
  var texture = states;
  var frag = '';
  for (var i = 0; i < grid.length; i++) {
    var tile;
    if (id === 'scene_grid') {
      tile = `<div class="${texture[grid[i]]}" data-index="${i}" onclick="upgradeSquare()"></div>`;
    } else {
      tile = `<div class="ground" data-index="${i}"></div>`;
    }
    frag += tile;
  }
  document.getElementById(id).innerHTML = frag;
  enableTippets();
};

var enableTippets = function() {
  var squares = [...$scene.querySelectorAll('div')];
  for(var i = 0; i < sceneGrid.length; i++) {
    let state = states[sceneGrid[i]];
    squares[i].setAttribute('data-tippet', units[state].tippet);
  }
  tippet.update();
};

var upgradeSquare = function(){
  const el = event.target;
  let currentState = states.indexOf(el.classList.value);
  let nextState = states[currentState + 1];
  var cost = units[nextState].price;
  if(coins >= cost) {
    var index = [].indexOf.call($scene.childNodes, el);
    if(currentState < states.length - 1) {
      currentState = currentState < states.length - 1 ? currentState : -1;
      el.classList = nextState;
      var height = units[nextState].height;
      el.setAttribute('style',`transform: translate3d(0,0,${height}em) rotateZ(${-45 * (sceneRotation / 45) + 225}deg)`);
      sceneGrid[index] = currentState + 1;
      upgrade.play(el);
      tippet.inject(units[nextState].tippet);
      el.setAttribute('data-tippet', units[nextState].tippet);
      playSound('build.wav');
      playSound('spend.wav');
      console.log('bing')
      updateCoins(-cost);
      localforage.setItem('scene', sceneGrid);
    }
  }
  else {
    var knock = new Pizazz({
      size: 20,
      buffer: 10,
      spacing: 15,
      speed: 1,
      stroke: '#B2AC7C',
      strokeWidth: 2
    });
    knock.play(el);
  }
};

var getRandomVal = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var playSound = function(soundType) {
  var sound = document.createElement('audio');
  sound.setAttribute('src', `assets/sounds/${soundType}`);
  sound.play();
  sound.remove();
};

var rotateScene = function(direction) {
  var delta = direction === 'left' ? -90 : 90;
  sceneRotation += delta;
  $scene.setAttribute('style', `transform: rotateX(55deg) rotateZ(${sceneRotation}deg) translate3d(0,0,0em)`);
  var elements = [...$scene.querySelectorAll('div:not(.empty)')];
  for(var element of elements) {
    var height = units[element.classList[0]].height;
    element.setAttribute('style',`transform: translate3d(0,0,${height}em) rotateZ(${-45 * (sceneRotation / 45) + 225}deg)`);
  }
};

var updateCoins = function(amt) {
  var amount = amt ? amt : 0;
  localforage.getItem('coins').then(function(s) {
    coins = s + amount;
    $coins.innerHTML = coins;
    localforage.setItem('coins', coins);
  });
};

var showCoinModal = function(amt, content) {
  $coinModal.classList.add("coin-modal-show");
  $coinModal.querySelector('h3').innerHTML = content && content.title ? content.title : 'Build your Rome';
  $coinModal.querySelector('.coin').innerHTML = amt;
  if(content && content.message) {
    $coinModal.querySelector('p').innerHTML = content.message;
  }
  else {
    $coinModal.querySelector('p').innerHTML = amt > 1 ? `Here's ${amt} coins. Did you earn it?.` : `Here's a coin. Did you earn it?.`;
  }
  $coinModal.querySelector('.button').innerHTML = content && content.button ? content.button : 'I earned it';
  $coinModal.querySelector('.link').innerHTML = content && content.link ? content.link : 'I didn\'t earn it';
  $coinModal.querySelector('.button').onclick = function() {
    playSound('chaching.mp3');
    updateCoins(amt);
    enableTippets();
    closeCoinModal();
  };
  $coinModal.querySelector('.link').onclick = closeCoinModal;
};

var closeCoinModal = function() {
  $coinModal.classList.remove("coin-modal-show");
};

var setTimeOfDay = function() {
  var now = new Date();
  var hour = now.getHours();
  if(hour >= 7 && hour < 19 ) {
    $stage.classList.add('dawn');
  }
  else {
    $stage.classList.add('dusk');
    document.body.setAttribute('style', 'color: white;');
  }
};

//KEY EVENTS

document.body.onkeydown = function(e) {
  if(e.keyCode === 37) {
    rotateScene('left');
  }
  else if(e.keyCode === 39){
    rotateScene('right');
  }
};

var renderClock = function(elapsed){
  $counter.querySelector('h2').innerHTML = elapsed.days + ' days';
  $counter.querySelector('h4').innerHTML = `${elapsed.hours} hours, ${elapsed.minutes} minutes`;
};

function getTimeDifference(a, b) {
    const ONE_DAY = 1000 * 60 * 60 * 24;
    const ONE_HOUR = 1000 * 60 * 60;
    const ONE_MINUTE = 1000 * 60;
    var date1_ms = a.getTime();
    var date2_ms = b.getTime();
    var difference_ms = Math.abs(date1_ms - date2_ms);
    var absHoursDifference = Math.abs(b.getHours() - a.getHours());
    var absMinutesDifference = Math.abs(b.getMinutes() - a.getMinutes());
    var days = Math.floor(difference_ms/ONE_DAY);
    var hours = Math.abs(days*24 - Math.floor(difference_ms/ONE_HOUR));
    var minutes = Math.abs(days*24*60 - Math.floor(difference_ms/ONE_MINUTE)) - hours * 60;
    return {
      days: days,
      hours: hours,
      minutes: minutes
    };
}

var reset = function() {
  if (confirm('This will reset everything. Are you sure?')) {
    localforage.removeItem('first_login');
    localforage.removeItem('last_login');
    localforage.removeItem('scene');
    localforage.removeItem('coins');
    window.location.replace('index.html');
  } else {
  }
};

var initScene = function() {
  var now = new Date();
  var sessionElapsed;
  localforage.config();
  setTimeOfDay();
  localforage.getItem('first_login').then(function(fl) {
    if(fl) {
      firstLogin = fl;
    }
    else {
      firstLogin = new Date();
      localforage.setItem('first_login', firstLogin);
      showCoinModal(5, {
        title: 'Welcome',
        message: `You've begun! Here are some coins to start you off. Use them to build a city. Everyday you'll earn a coin for each day you stick to it.`,
        button: `Let's do this`,
        link: ' ',
      });
      coins = 5;
    }
    localforage.getItem('last_login').then(function(ll) {
      if(ll) {
        var localElapsed = getTimeDifference(ll, now);
        var totalElapsed = getTimeDifference(fl, now);
        if(localElapsed.days > 0) {
          showCoinModal(totalElapsed.days+1, {
            title: 'A new day begins'
          });
        }
        else {
          updateCoins();
        }
        lastLogin = ll;
      }
      else {
        lastLogin = now;
      }
      localforage.setItem('last_login', now);
      localforage.getItem('scene').then(function(scn) {
        if(scn) {
          sceneGrid = scn;
          renderGrid(scn, 'scene_grid');
        }
        else {
          sceneGrid = genBlankGrid();
          renderGrid(sceneGrid, 'scene_grid');
        }
        renderGrid(genBlankGrid(), 'ground_grid');
        setTimeout(function() {
          var itemsToRender = [...document.querySelectorAll('.lazy-load')];
          for(var item of itemsToRender) {
            item.classList.add('show');
          }
          setInterval(tick, 1000);
        }, 1000);
      });
    });
    sessionElapsed = getTimeDifference(firstLogin, now);
    renderClock(sessionElapsed);
  });
};

var tick = function() {
  var now = new Date();
  var localElapsed = getTimeDifference(lastLogin, now);
  var totalElapsed = getTimeDifference(firstLogin, now);
  if(localElapsed.days > 0) {
    showCoinModal(totalElapsed.days+1, {
      title: 'A new day begins'
    });
    localforage.setItem('last_login', now);
    lastLogin = now;
  }
  if(localElapsed.minutes > 0) {
    renderClock(getTimeDifference(firstLogin, now));
  }
};

initScene();
