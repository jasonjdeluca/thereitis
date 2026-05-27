import { readFile } from "node:fs/promises";

const queuePath = new URL("../data/transcript-intake/queue.json", import.meta.url);
const queue = JSON.parse(await readFile(queuePath, "utf8"));

const counts = queue.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

console.log("Transcript intake queue status counts");

for (const status of Object.keys(counts).sort()) {
  console.log(`${status}: ${counts[status]}`);
}

console.log(`total: ${queue.length}`);
