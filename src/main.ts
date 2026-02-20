import "./css/style.css";
// import { DiscordSDK, DiscordSDKMock } from '@discord/embedded-app-sdk';
import * as PIXI from "pixi.js";
import { Assets, Spritesheet } from "pixi.js";
import { ASSETS_PATH } from './js/assets_path.js';
import { setUpUI } from './js/ui.js';

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

// 먼저 스프라이트 시트 JSON만 로드 (오디오는 제외)
const spritesheetPath = ASSETS_PATH.SPRITE_SHEET;
const imagePath = ASSETS_PATH.SPRITE_IMAGE;

// JSON 매니페스트 로드
await Assets.load([spritesheetPath, imagePath]);
const spritesheetJSON = await Assets.load(spritesheetPath);
const imageTexture = await Assets.load(imagePath);

// 만약 spritesheetJSON이 Pixi의 Resource라면 .data를 사용해야 할 수도 있습니다.
const rawData = spritesheetJSON.data ? spritesheetJSON.data : spritesheetJSON;

if (!rawData || !rawData.meta) {
    console.error("Spritesheet 데이터에 meta 정보가 없습니다!", rawData);
}

const spritesheet = new Spritesheet(imageTexture, rawData);
await spritesheet.parse();

// 뷰 클래스에서 사용할 수 있도록 리소스 객체 생성
const resources = {
  [ASSETS_PATH.SPRITE_SHEET]: {
    textures: spritesheet.textures
  }
};

// 사용자가 페이지와 상호작용한 뒤 오디오 활성화 (브라우저 자동 재생 제한 대응)
window.addEventListener("pointerdown", async () => {
  const { PikachuVolleyball } = await import('./js/pikavolley.js');
  const { sound } = await import('@pixi/sound');

  // 사용자 제스처 이후에 오디오 에셋 로드
  const soundList = Object.values(ASSETS_PATH.SOUNDS);
  soundList.forEach(s => {
    if (typeof s !== "string") throw new Error("Invalid sound asset path");
  });
  
  try {
    await Assets.load(soundList);
    sound.resumeAll(); // 일시 정지된 오디오 컨텍스트 재개
  } catch (error) {
    console.error("Failed to load audio assets:", error);
  }

  const pikaVolley = new PikachuVolleyball(app.stage, resources);
  setUpUI(pikaVolley, app.ticker);
  app.ticker.maxFPS = pikaVolley.normalFPS;
  app.ticker.add(() => {
    pikaVolley.gameLoop();
  });
  app.ticker.start();
}, { once: true });