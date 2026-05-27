import { readFile } from "node:fs/promises";

const queuePath = new URL("../data/transcript-intake/queue.json", import.meta.url);
const queue = JSON.parse(await readFile(queuePath, "utf8"));

const nextCompany = queue.find((item) => item.status === "new" || item.status === "needs_retry");

if (!nextCompany) {
  console.log("No transcript intake companies are ready.");
} else {
  console.log(JSON.stringify(nextCompany, null, 2));
}
