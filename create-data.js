import fs from "node:fs";

const words = JSON.parse(fs.readFileSync("data/words.json", "utf-8"));
const verbs = JSON.parse(fs.readFileSync("data/verbs.json", "utf-8"));
const translations = JSON.parse(
  fs.readFileSync("data/merged-translations.json", "utf-8"),
);

const finalData = [];

const verbsMap = new Map();
const translationsMap = new Map();

verbs.result.rows.forEach((row) => {
  const id = row[0];
  const aspect = row[1];
  const verb = row[2];
  const bareForm = row[3]?.bare;
  verbsMap.set(id, { verb, aspect, other: { bareForm } });
});

for (const row of words.result.rows) {
  const wholeWord = {
    id: row[0],
    word: row[2],
    rank: row[5],
    usage: row[8],
    type: row[11],
  };

  if (wholeWord.type === "verb") {
    const verb = verbsMap.get(wholeWord.id);

    if (verb) {
      wholeWord.verbForms = [
        {
          form: verb.aspect === "perfective" ? "imperfective" : "perfective",
          text: verb.verb,
        },
        {
          form: verb.aspect,
          text: verb.other.bareForm,
        },
      ];
    }
  }

  const translation = translations[wholeWord.id];
  wholeWord.translationInfo = translation ? translation : null;
  finalData.push(wholeWord);
}

fs.writeFileSync("data/finalData.json", JSON.stringify(finalData, null, 2));
