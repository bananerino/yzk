import fs from "node:fs";

const translationsMap = new Map();

const translations1 = JSON.parse(
  fs.readFileSync("data/translations1.json", "utf-8"),
);

const translations2 = JSON.parse(
  fs.readFileSync("data/translations2.json", "utf-8"),
);

const translations3 = JSON.parse(
  fs.readFileSync("data/translations3.json", "utf-8"),
);

translations1.result.rows.forEach((row) => {
  const id = row[1];
  const translation = row[4];
  const entry = translationsMap.get(id);
  if (entry) {
    entry.translations.push({
      translation,
      exampleRu: row[5],
      exampleEn: row[6],
    });
  } else {
    translationsMap.set(id, {
      translations: [
        {
          translation,
          exampleRu: row[5],
          exampleEn: row[6],
        },
      ],
    });
  }
});

translations2.result.rows.forEach((row) => {
  const id = row[1];
  const translation = row[4];
  const entry = translationsMap.get(id);
  if (entry) {
    entry.translations.push({
      translation,
      exampleRu: row[5],
      exampleEn: row[6],
    });
  } else {
    translationsMap.set(id, {
      translations: [
        {
          translation,
          exampleRu: row[5],
          exampleEn: row[6],
        },
      ],
    });
  }
});

translations3.result.rows.forEach((row) => {
  const id = row[1];
  const translation = row[4];
  const entry = translationsMap.get(id);
  if (entry) {
    entry.translations.push({
      translation,
      exampleRu: row[5],
      exampleEn: row[6],
    });
  } else {
    translationsMap.set(id, {
      translations: [
        {
          translation,
          exampleRu: row[5],
          exampleEn: row[6],
        },
      ],
    });
  }
});

fs.writeFileSync(
  "data/merged-translations.json",
  JSON.stringify(Object.fromEntries(translationsMap), null, 2),
);
