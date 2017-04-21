'use strict';

var sceneUnits = {
  0: '',
  1: 'doorway',
  2: 'wall',
  3: 'tower',
  4: 'spire',
  5: 'monolith',
  6: 'megalith',
  'p': 'player'
};

var tippets = {
  0: '<div class="coin small">1: Place a foundation</div>',
  1: '<div class="coin small">1: Build a hut</div>',
  2: '<div class="coin small">2: Build a hall</div>',
  3: '<div class="coin small">3: Build a tower</div>',
  4: '<div class="coin small">4: Build a monolith</div>',
  5: '<div class="coin small">5: Build a megalith</div>',
  6: 'This structure is complete'
};

var groundUnits = {
  0: 'ground',
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

var $ground = document.getElementById('ground_grid');
var $scene = document.getElementById('scene_grid');
var $counter = document.getElementById('days_since');
var $coins = document.getElementById('coin_count');
var $coinModal = document.getElementById('coin_modal');

var renderGrid = function(grid, id) {
  document.getElementById(id).innerHTML = '';
  var texture;
  if(id === 'scene_grid') {
    texture = sceneUnits;
  }
  else {
    texture = groundUnits;
  }
  for (var i = 0; i < grid.length; i++) {
    var el = document.createElement('div');
    el.setAttribute('data-index', i);
    el.classList = texture[grid[i]];
    el.onclick = upgradeSquare;
    if(coins > 0) {
      el.setAttribute('data-tippet', tippets[grid[i]]);
    }
    document.getElementById(id).appendChild(el);
  }
  tippet.update();
};

var enableTippets = function() {
  var squares = [...$scene.querySelectorAll('div')];
  for(var i = 0; i < sceneGrid.length; i++) {
    squares[i].setAttribute('data-tippet', tippets[sceneGrid[i]]);
  }
  tippet.update();
};

var upgradeSquare = function(e){
  var el = e.target;
  var states = ['', 'doorway', 'wall', 'tower', 'spire', 'monolith', 'megalith'];
  var currentState = states.indexOf(el.classList.value);
  var cost = currentState <= 1 ? 1 : currentState;
  if(coins >= cost) {
    var index = [].indexOf.call($scene.childNodes, el);
    if(currentState < states.length - 1) {
      el.classList = states[currentState+1];
      sceneGrid[index] = currentState+1;
      upgrade.play(el);
      el.setAttribute('data-tippet', tippets[currentState+1]);
      tippet.inject(tippets[currentState+1]);
      playSound('build.wav');
      playSound('spend.wav');
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
  $scene.setAttribute('style',`transform: rotateX(55deg) rotateZ(${sceneRotation}deg) translate3d(0,0,-25vh)`);
  // var elements = [...$scene.querySelectorAll('div')];
  // for(var element of elements) {
  //   element.setAttribute('style',`transform: rotateZ(${sceneRotation + (sceneRotation/45)*-45}deg)`);
  // }
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

var initScene = function() {
  var now = new Date();
  var sessionElapsed;
  localforage.config();
  localforage.getItem('first_login').then(function(fl) {
    if(fl) {
      firstLogin = fl;
    }
    else {
      firstLogin = new Date();
      localforage.setItem('first_login', firstLogin);
      showCoinModal(2, {
        title: 'Welcome',
        message: `You've begun! Here are two coins to start you off. Use them to build on the map. You'll earn more with each day you stick to it.`,
        button: `Let's do this`,
        link: ' ',
      });
      coins = 2;
    }
    localforage.getItem('last_login').then(function(ll) {
      if(ll) {
        var localElapsed = getTimeDifference(ll, now);
        var totalElapsed = getTimeDifference(fl, now);
        lastLogin = ll;
        if(localElapsed.days > 0) {
          showCoinModal(totalElapsed.days+1, {
            title: 'A new day begins'
          });
        }
        else {
          updateCoins();
        }
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
    showCoinModal(totalElapsed.days, {
      title: 'A new day begins'
    });
  }
  if(localElapsed.minutes > 0) {
    renderClock(getTimeDifference(firstLogin, now));
  }
};

initScene();
