import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

const W = 1200;
const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "#0A1628";
ctx.fillRect(0, 0, W, H);

const inset = 24;
const borderW = 2;
ctx.strokeStyle = "#D4AF37";
ctx.lineWidth = borderW;
ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#FFFFFF";
ctx.font = "bold 72px sans-serif";
const titleText = "There It Is";
const titleMetrics = ctx.measureText(titleText);
const titleX = W / 2;
const titleY = H / 2 - 30;
ctx.fillText(titleText, titleX, titleY);

const dotX = titleX + titleMetrics.width / 2 + 4;
ctx.fillStyle = "#D4AF37";
ctx.fillText(".", dotX, titleY);

ctx.fillStyle = "#D4AF37";
ctx.font = "bold 22px sans-serif";
ctx.letterSpacing = "8px";
ctx.fillText("EARNINGS CALL BINGO", W / 2, titleY + 60);

const buf = canvas.toBuffer("image/png");
writeFileSync("public/og-image.png", buf);
console.log("OG image written to public/og-image.png");
