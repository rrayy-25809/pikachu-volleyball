import "./css/style.css";
// import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';
import * as PIXI from "pixi.js";
import { Assets } from "pixi.js";
import { PikachuVolleyball } from './js/pikavolley.js';
import { ASSETS_PATH } from './js/assets_path.js';
import { setUpUI } from './js/ui.js';
import { sound } from '@pixi/sound';

const app = new PIXI.Application();
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;

await app.init({
  canvas,
  width: 432,
  height: 304,
  background: "#222",
  antialias: false,
  preference: "canvas"  // 기존 forceCanvas 대체
});

// Load sprite sheet first (no audio)
await Assets.load([ASSETS_PATH.SPRITE_SHEET]);

// Audio unlock when the user interacts with the page
window.addEventListener("pointerdown", async () => {
  // Load audio assets after user gesture
  const soundList = Object.values(ASSETS_PATH.SOUNDS);
  soundList.forEach(s => {
    if (typeof s !== "string") throw new Error("Invalid sound asset path");
  });
  
  try {
    await Assets.load(soundList);
    sound.resumeAll();
  } catch (error) {
    console.error("Failed to load audio assets:", error);
  }
}, { once: true });

// Start the game immediately
setup();

/**
 * Set up the game and the full UI, and start the game.
 */
function setup() {
  const pikaVolley = new PikachuVolleyball(app.stage, Assets.cache);
  setUpUI(pikaVolley, app.ticker);
  start(pikaVolley);
}

function start(pikaVolley: PikachuVolleyball) {
  app.ticker.maxFPS = pikaVolley.normalFPS;
  app.ticker.add(() => {
    pikaVolley.gameLoop();
  });
  app.ticker.start();
}
