// Adds a situation's recording and its line times to content/conversations/topics.json.
//
//   npm run conversations:times -- <situation> <labels.txt> [recording.mp3]
//
// The labels are Audacity's export (File › Export Other › Export Labels): one label per line of
// the dialogue, at the line's start, named after its speaker. A header row is fine. The labels must
// match the dialogue's lines in number and speaker, so a missing or extra label can't shift the
// times. With a recording, it's copied to public/audio/conversations/<dialect>/<situation>.mp3
// and becomes the situation's audio.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CONTENT = "content/conversations/topics.json";

// Rows of start, end and name, separated by tabs. Rows whose start isn't a number, such as a
// header, are skipped.
export function parseLabels(text) {
  return text
    .split(/\r?\n/)
    .map((row) => row.split("\t"))
    .filter(([start]) => start !== undefined && start.trim() !== "" && !Number.isNaN(Number(start)))
    .map(([start, , name = ""]) => ({ start: Number(start), name: name.trim() }));
}

// The lines with their start times, or an error naming the first mismatch.
export function timeLines(lines, labels) {
  if (labels.length !== lines.length) {
    throw new Error(`${labels.length} labels for ${lines.length} lines: one label per line, please`);
  }
  return lines.map((line, index) => {
    const label = labels[index];
    if (label.name && label.name.toLowerCase() !== line.speaker.toLowerCase()) {
      throw new Error(
        `Label ${index + 1} is ${label.name}, but line ${index + 1} is ${line.speaker}: "${line.swissGerman}"`,
      );
    }
    if (index > 0 && label.start < labels[index - 1].start) {
      throw new Error(`Label ${index + 1} starts before label ${index}`);
    }
    // Hundredths of a second are precise enough, and keep the file readable.
    return { ...line, start: Math.round(label.start * 100) / 100 };
  });
}

function main([situationId, labelsPath, recordingPath]) {
  if (!situationId || !labelsPath) {
    throw new Error("Usage: npm run conversations:times -- <situation> <labels.txt> [recording.mp3]");
  }
  const content = JSON.parse(readFileSync(CONTENT, "utf8"));
  const situation = content.topics
    .flatMap((topic) => topic.situations)
    .find((candidate) => candidate.id === situationId);
  if (!situation) throw new Error(`No situation ${situationId} in ${CONTENT}`);

  situation.lines = timeLines(situation.lines, parseLabels(readFileSync(labelsPath, "utf8")));

  if (recordingPath) {
    if (!existsSync(recordingPath)) throw new Error(`No recording at ${recordingPath}`);
    const url = `/audio/conversations/${situation.dialect}/${situation.id}.mp3`;
    const target = resolve("public", `.${url}`);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(recordingPath, target);
    situation.audio = url;
  }

  writeFileSync(CONTENT, `${JSON.stringify(content, null, 2)}\n`);
  console.log(
    `Timed ${situation.lines.length} lines of ${situation.id}${situation.audio ? `, recording ${situation.audio}` : ""}`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
