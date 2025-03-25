// emoji-utils.js
import { createRef } from "react";

export const emoji = {
  fire: "🔥",
  wave: "👋",
  confetti: "🎉",
  heart: "❤️",
};

export const emojiNames = Object.keys(emoji);

export const refsInit = Object.fromEntries(
  emojiNames.map((name) => [name, createRef()])
);

export function animateEmoji(
  { emoji: emojiChar, directionAngle, rotationAngle },
  target
) {
  if (!target) return;

  const rootEl = document.createElement("div");
  const directionEl = document.createElement("div");
  const spinEl = document.createElement("div");

  spinEl.innerText = emojiChar;
  directionEl.appendChild(spinEl);
  rootEl.appendChild(directionEl);
  target.appendChild(rootEl);

  Object.assign(rootEl.style, {
    transform: `rotate(${((directionAngle * 360) % 180) + 90}deg)`,
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    margin: "auto",
    zIndex: "9999",
    pointerEvents: "none",
  });

  Object.assign(spinEl.style, {
    transform: `rotateZ(${rotationAngle * 400}deg)`,
    fontSize: "40px",
  });

  setTimeout(() => {
    Object.assign(directionEl.style, {
      transform: "translateY(40vh) scale(2)",
      transition: "all 400ms",
      opacity: "0",
    });
  }, 20);

  setTimeout(() => rootEl.remove(), 800);
}
