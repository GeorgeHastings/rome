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
  0: 'Place a foundation',
  1: 'Build a hut',
  2: 'Build a hall',
  3: 'Build a tower',
  4: 'Build a monolith',
  5: 'Build a megalith',
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
  if(coins > 0) {
    var states = ['', 'doorway', 'wall', 'tower', 'spire', 'monolith', 'megalith'];
    var currentState = states.indexOf(el.classList.value);
    var index = [].indexOf.call($scene.childNodes, el);
    if(currentState < states.length - 1) {
      el.classList = states[currentState+1];
      sceneGrid[index] = currentState+1;
      upgrade.play(el);
      el.setAttribute('data-tippet', tippets[currentState+1]);
      tippet.inject(tippets[currentState+1]);
      updateCoins(-1);
      localforage.setItem('scene', sceneGrid);
    }
  }
  else {
    tippet.inject('No coins', {
      'background-color': '#A3ADC2',
      'color': '#fff'
    });
    warning.play(document.getElementById('Tippet'));
  }
};

var getRandomVal = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

var showCoinModal = function(amt) {
  $coinModal.classList.add("coin-modal-show");
  $coinModal.querySelector('.coin').innerHTML = amt;
  $coinModal.querySelector('p').innerHTML = amt > 1 ? `Here's ${amt} coins. Did you earn it?.` : `Here's a coin. Did you earn it?.`;
  $coinModal.querySelector('.button').onclick = function() {
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

//INIT DUST

var layers = 2;
var starsPerLayer = 80;

var renderLayers = function() {
  for(var i = 0; i < layers; i++) {
    var newLayer = document.createElement('div');
    newLayer.classList.add('layer');
    populateParticles(starsPerLayer, newLayer);
    document.getElementById('scene').appendChild(newLayer);
  }
};

var populateParticles = function(amt, container) {
  for(var i = 0; i < amt; i++) {
    var el = document.createElement('div');
    el.classList.add('star');
    var top = Math.floor(Math.random() * window.innerHeight);
    var left = Math.floor(Math.random() * window.innerWidth);
    el.style.top = top+'px';
    el.style.left = left+'px';
    container.appendChild(el);
  }
};

var renderDaysSince = function(elapsed){
  $counter.querySelector('h2').innerHTML = elapsed.days + ' days';
  $counter.querySelector('h4').innerHTML = `${elapsed.hours} hours, ${elapsed.minutes} minutes`;
};

function days_between(date1, date2) {
    var ONE_DAY = 1000 * 60 * 60 * 24;
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
    var difference_ms = Math.abs(date1_ms - date2_ms);
    var absHoursDifference = Math.abs(date2.getHours() - date1.getHours());
    var absMinutesDifference = Math.abs(date2.getMinutes() - date1.getMinutes());
    var minutes = 60 + date2.getMinutes() - date1.getMinutes() <= 30 ? absMinutesDifference : 60 + date2.getMinutes() - date1.getMinutes();
    var hours = minutes <= 30 ? 24 - absHoursDifference : 24 - absHoursDifference - 1;
    return {
      days: Math.floor(difference_ms/ONE_DAY),
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
      showCoinModal(2);
      coins = 2;
    }
    localforage.getItem('last_login').then(function(ll) {
      if(ll) {
        var totalElapsed = days_between(ll, now);
        lastLogin = ll;
        if(totalElapsed.days > 0) {
          showCoinModal(totalElapsed.days*2);
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
    sessionElapsed = days_between(firstLogin, now);
    renderDaysSince(sessionElapsed);
    renderLayers();
  });
};

var tick = function() {
  var now = new Date();
  var elapsed = days_between(lastLogin, now);
  if(elapsed.minutes > 0) {
    renderDaysSince(days_between(firstLogin, now));
  }
  if(elapsed.days > 0) {
    showCoinModal(elapsed.days*2);
  }
};

initScene();
