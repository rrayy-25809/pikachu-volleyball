import "./css/style.css";
// import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';
import { settings } from '@pixi/settings';
import { SCALE_MODES } from '@pixi/constants';
import { Renderer, BatchRenderer, autoDetectRenderer } from '@pixi/core';
import { Prepare } from '@pixi/prepare';
import { Container } from '@pixi/display';
import { Loader } from '@pixi/loaders';
import { SpritesheetLoader } from '@pixi/spritesheet';
import { Ticker } from '@pixi/ticker';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { CanvasSpriteRenderer } from '@pixi/canvas-sprite';
import { CanvasPrepare } from '@pixi/canvas-prepare';
import '@pixi/canvas-display';
import { PikachuVolleyball } from './js/pikavolley.js';
import { ASSETS_PATH } from './js/assets_path.js';
import { setUpUI } from './js/ui.js';

// Reference for how to use Renderer.registerPlugin:
// https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js/src/index.ts#L27-L34
Renderer.registerPlugin('prepare', Prepare);
Renderer.registerPlugin('batch', BatchRenderer);
// Reference for how to use CanvasRenderer.registerPlugin:
// https://github.com/pixijs/pixijs/blob/af3c0c6bb15aeb1049178c972e4a14bb4cabfce4/bundles/pixi.js-legacy/src/index.ts#L13-L19
CanvasRenderer.registerPlugin('prepare', CanvasPrepare);
CanvasRenderer.registerPlugin('sprite', CanvasSpriteRenderer);
Loader.registerPlugin(SpritesheetLoader);

// Set settings.RESOLUTION to 2 instead of 1 to make the game screen do not look
// much blurry in case of the image rendering mode of 'image-rendering: auto',
// which is like bilinear interpolation, which is used in "soft" game graphic option.
settings.RESOLUTION = 2;
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const renderer = autoDetectRenderer({
  width: 432,
  height: 304,
  antialias: false,
  backgroundColor: 0x000000,
  backgroundAlpha: 1,
  // Decided to use only Canvas for compatibility reason. One player had reported that
  // on their browser, where pixi chooses to use WebGL renderer, the graphics are not fine.
  // And the issue had been fixed by using Canvas renderer. And also for the sake of testing,
  // it is more comfortable just to stick with Canvas renderer so that it is unnecessary to switch
  // between WebGL renderer and Canvas renderer.
  forceCanvas: true,
});

const stage = new Container();
const ticker = new Ticker();
const loader = new Loader();

renderer.view.setAttribute('id', 'game-canvas');
document.getElementById('game-canvas-container').appendChild(renderer.view);
renderer.render(stage); // To make the initial canvas painting stable in the Firefox browser.

loader.add(ASSETS_PATH.SPRITE_SHEET);
for (const prop in ASSETS_PATH.SOUNDS) {
  loader.add(ASSETS_PATH.SOUNDS[prop]);
}

setUpInitialUI();

/**
 * Set up the initial UI.
 */
function setUpInitialUI() {
  const loadingBox = document.getElementById('loading-box');
  const progressBar = document.getElementById('progress-bar');
  loader.onProgress.add(() => {
    progressBar.style.width = `${loader.progress}%`;
  });
  loader.onComplete.add(() => {
    loadingBox.classList.add('hidden');
  });

  const aboutBox = document.getElementById('about-box');
  const aboutBtn = document.getElementById('about-btn');
  const closeAboutBtn = document.getElementById('close-about-btn');
  const gameDropdownBtn = document.getElementById('game-dropdown-btn');
  const optionsDropdownBtn = document.getElementById('options-dropdown-btn');
  // @ts-ignore
  gameDropdownBtn.disabled = true;
  // @ts-ignore
  optionsDropdownBtn.disabled = true;
  const closeAboutBox = () => {
    if (!aboutBox.classList.contains('hidden')) {
      aboutBox.classList.add('hidden');
      // @ts-ignore
      aboutBtn.disabled = true;
    }
    aboutBtn.getElementsByClassName('text-play')[0].classList.add('hidden');
    aboutBtn.getElementsByClassName('text-about')[0].classList.remove('hidden');
    aboutBtn.classList.remove('glow');
    closeAboutBtn
      .getElementsByClassName('text-play')[0]
      .classList.add('hidden');
    closeAboutBtn
      .getElementsByClassName('text-close')[0]
      .classList.remove('hidden');
    closeAboutBtn.classList.remove('glow');

    loader.load(setup); // setup is called after loader finishes loading
    loadingBox.classList.remove('hidden');
    aboutBtn.removeEventListener('click', closeAboutBox);
    closeAboutBtn.removeEventListener('click', closeAboutBox);
  };
  aboutBtn.addEventListener('click', closeAboutBox);
  closeAboutBtn.addEventListener('click', closeAboutBox);
}

/**
 * Set up the game and the full UI, and start the game.
 */
function setup() {
  const pikaVolley = new PikachuVolleyball(stage, loader.resources);
  setUpUI(pikaVolley, ticker);
  start(pikaVolley);
}

function start(pikaVolley: PikachuVolleyball) {
  ticker.maxFPS = pikaVolley.normalFPS;
  ticker.add(() => {
    pikaVolley.gameLoop();
    renderer.render(stage);
  });
  ticker.start();
}
