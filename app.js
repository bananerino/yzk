// ============================================================
// TRANSLITERATION SYSTEM (ISO TRANSLITERATION)
// ============================================================

const transliterationMap = {
  // Digraphs (must be checked first)
  zh: "ж",
  ch: "ч",
  sh: "ш",
  "ch'": "щ",
  ts: "ц",
  ya: "я",
  yo: "ё",
  "y'": "й",
  ye: "е",
  yu: "ю",

  // Single characters
  a: "а",
  b: "б",
  c: "ц",
  d: "д",
  e: "е",
  f: "ф",
  g: "г",
  h: "х",
  i: "и",
  j: "й",
  k: "к",
  l: "л",
  m: "м",
  n: "н",
  o: "о",
  p: "п",
  r: "р",
  s: "с",
  t: "т",
  u: "у",
  v: "в",
  w: "в",
  x: "х",
  y: "ы",
  z: "з",
  "'": "ь",
  "‘": "ь",
  '"': "ъ",
  "“": "ъ",
};

// Convert Latin input to Cyrillic
function latinToCyrillic(latinText) {
  if (!latinText) return "";

  // Normalize smart quotes to regular ASCII quotes
  latinText = latinText
    .replace(/[''"]/g, "'") // Various single quotes to ASCII single quote
    .replace(/["""]/g, '"'); // Various double quotes to ASCII double quote

  let cyrillic = "";
  let i = 0;
  latinText = latinText.toLowerCase();

  while (i < latinText.length) {
    // Try two-character combinations first
    let twoChar = latinText.substring(i, i + 2);
    if (transliterationMap[twoChar]) {
      cyrillic += transliterationMap[twoChar];
      i += 2;
      continue;
    }

    // Try three-character combinations (for ch')
    let threeChar = latinText.substring(i, i + 3);
    if (transliterationMap[threeChar]) {
      cyrillic += transliterationMap[threeChar];
      i += 3;
      continue;
    }

    // Single character
    let oneChar = latinText.charAt(i);
    if (transliterationMap[oneChar]) {
      cyrillic += transliterationMap[oneChar];
    } else {
      // Keep character as-is if not in map (numbers, spaces, etc.)
      cyrillic += oneChar;
    }
    i++;
  }

  return cyrillic;
}

// Normalize Cyrillic for comparison (remove diacritical marks)
function normalize(text) {
  if (!text) return "";
  // NFD decomposition separates base characters from diacritics
  // Then filter out combining marks
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove combining marks
}

// ============================================================
// APP STATE & DATA LOADING
// ============================================================

let allWords = [];
let filteredWords = [];
let currentWord = null;
let hintsRevealed = 0;
let activeFilter = "all";
let currentMode = "quiz"; // "quiz" or "cards"

// Load data from finalData.json
async function loadData() {
  try {
    const response = await fetch("data/finalData.json");
    if (!response.ok) throw new Error("Failed to load data");
    allWords = await response.json();
    console.log(`Loaded ${allWords.length} words`);
    applyFilter("all");
    loadNewWord();
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("word").textContent =
      "Error loading data. Please refresh.";
  }
}

// Apply filter to word list
function applyFilter(filterType) {
  activeFilter = filterType;

  if (filterType === "all") {
    filteredWords = [...allWords];
  } else {
    filteredWords = allWords.filter((word) => word.type === filterType);
  }

  // Update button states
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filter === filterType) {
      btn.classList.add("active");
    }
  });

  console.log(
    `Applied filter '${filterType}': ${filteredWords.length} words available`,
  );

  // Reset and load new word
  loadNewWord();
}

// ============================================================
// WORD SELECTION & DISPLAY
// ============================================================

function getRandomWord() {
  if (filteredWords.length === 0) return null;
  return filteredWords[Math.floor(Math.random() * filteredWords.length)];
}

function displayWord(word) {
  currentWord = word;

  // Reset hints BEFORE displaying
  hintsRevealed = 0;

  // Display the Cyrillic word (with hints hidden initially)
  updateWordDisplay();

  // Display word type
  document.getElementById("wordType").textContent = word.type;

  // Display translations
  const translationsList = document.getElementById("translations");
  translationsList.innerHTML = "";

  if (word.translationInfo && word.translationInfo.translations) {
    word.translationInfo.translations.forEach((trans) => {
      const li = document.createElement("li");
      li.textContent = trans.translation;
      if (trans.exampleEn) {
        li.textContent += ` (e.g., ${trans.exampleEn})`;
      }
      translationsList.appendChild(li);
    });
  }

  // Hide usage until answer is submitted
  const usageSection = document.getElementById("usageSection");
  usageSection.style.display = "none";

  // Handle verb forms
  const verbForm2Group = document.getElementById("verbForm2Group");
  const answer1Label = document.querySelector('label[for="answer1"]');
  const answer1 = document.getElementById("answer1");
  const answer2 = document.getElementById("answer2");

  if (word.type === "verb") {
    verbForm2Group.style.display = "block";
    answer1Label.textContent = "Imperfective form:";
    answer1.placeholder = "Imperfective form";
    answer2.value = "";
  } else {
    verbForm2Group.style.display = "none";
    answer1Label.textContent = "Enter the word:";
    answer1.placeholder = "Type Latin characters (e.g., zhivoy, koshka)";
  }

  // Clear inputs and feedback
  answer1.value = "";
  answer2.value = "";
  document.getElementById("feedback").className = "feedback hidden";
  document.getElementById("feedback").innerHTML = "";

  // Focus on first input
  answer1.focus();

  // Enable buttons
  document.querySelector('button[type="submit"]').disabled = false;
  document.getElementById("hintBtn").disabled = false;
  document.getElementById("newWordBtn").disabled = false;
}

function loadNewWord() {
  const word = getRandomWord();
  if (word) {
    displayWord(word);
  }
}

// ============================================================
// HINT SYSTEM
// ============================================================

function updateWordDisplay() {
  const wordElement = document.getElementById("word");
  if (!currentWord) return;

  const word = currentWord.word;
  if (hintsRevealed === 0) {
    // Show all as underscores
    wordElement.textContent = "_".repeat(word.length);
  } else if (hintsRevealed >= word.length) {
    // Show full word
    wordElement.textContent = word;
    document.getElementById("hintBtn").disabled = true;
  } else {
    // Show first N characters + underscores for the rest
    const revealed = word.substring(0, hintsRevealed);
    const hidden = "_".repeat(word.length - hintsRevealed);
    wordElement.textContent = revealed + hidden;
  }
}

function showHint() {
  if (!currentWord) return;

  const maxHints = currentWord.word.length;
  if (hintsRevealed < maxHints) {
    hintsRevealed++;
    updateWordDisplay();
  }

  // Disable button when all characters are revealed
  if (hintsRevealed >= maxHints) {
    document.getElementById("hintBtn").disabled = true;
  }
}

// ============================================================
// ANSWER VALIDATION
// ============================================================

function checkAnswer() {
  if (!currentWord) return;

  const answer1Element = document.getElementById("answer1");
  const answer2Element = document.getElementById("answer2");
  const feedbackElement = document.getElementById("feedback");

  const userAnswer1 = answer1Element.value.trim();
  const userAnswer2 = answer2Element.value.trim();

  // For verbs, both fields must be filled
  if (currentWord.type === "verb" && (!userAnswer1 || !userAnswer2)) {
    feedbackElement.className = "feedback incorrect";
    feedbackElement.innerHTML =
      "<div>Please fill in both forms (imperfective and perfective).</div>";
    return;
  }

  // For non-verbs, check if answer matches word
  if (currentWord.type !== "verb") {
    const convertedAnswer = latinToCyrillic(userAnswer1);
    const correctWord = normalize(currentWord.word);
    const normalizedAnswer = normalize(convertedAnswer);

    if (normalizedAnswer === correctWord) {
      feedbackElement.className = "feedback correct";
      feedbackElement.innerHTML = "<div>✓ Correct!</div>";
      answer1Element.disabled = true;
      document.querySelector('button[type="submit"]').disabled = true;
      showUsage();
    } else {
      feedbackElement.className = "feedback incorrect";
      feedbackElement.innerHTML = `
                <div>✗ Incorrect</div>
                <div class="correct-answer">Correct answer: ${currentWord.word}</div>
            `;
      showUsage();
    }
    return;
  }

  // For verbs, validate both forms
  if (currentWord.type === "verb" && currentWord.verbForms) {
    // Get the expected forms from the data
    const imperfectiveForm = currentWord.verbForms.find(
      (f) => f.form === "imperfective",
    );
    const perfectiveForm = currentWord.verbForms.find(
      (f) => f.form === "perfective",
    );

    const convertedAnswer1 = latinToCyrillic(userAnswer1);
    const convertedAnswer2 = latinToCyrillic(userAnswer2);

    let correctImperfective = "";
    let correctPerfective = "";

    if (imperfectiveForm) {
      // imperfectiveForm.text can have multiple forms separated by ;
      correctImperfective = imperfectiveForm.text.split(";")[0].trim();
    }

    if (perfectiveForm) {
      correctPerfective = perfectiveForm.text.trim();
    }

    const normalizedAnswer1 = normalize(convertedAnswer1);
    const normalizedAnswer2 = normalize(convertedAnswer2);
    const normalizedCorrect1 = normalize(correctImperfective);
    const normalizedCorrect2 = normalize(correctPerfective);

    if (
      normalizedAnswer1 === normalizedCorrect1 &&
      normalizedAnswer2 === normalizedCorrect2
    ) {
      feedbackElement.className = "feedback correct";
      feedbackElement.innerHTML = "<div>✓ Correct!</div>";
      answer1Element.disabled = true;
      answer2Element.disabled = true;
      document.querySelector('button[type="submit"]').disabled = true;
      showUsage();
    } else {
      feedbackElement.className = "feedback incorrect";
      feedbackElement.innerHTML = `
                <div>✗ Incorrect</div>
                <div class="correct-answer">Correct answers: ${correctImperfective} / ${correctPerfective}</div>
            `;
      showUsage();
    }
  }
}

// Show usage section
function showUsage() {
  const usageSection = document.getElementById("usageSection");
  if (currentWord && currentWord.usage) {
    document.getElementById("usage").textContent = currentWord.usage;
    usageSection.style.display = "block";
  }
}

// ============================================================
// CARDS MODE FUNCTIONS
// ============================================================

function displayCard(word) {
  currentWord = word;

  // Display the word
  document.getElementById("cardWord").textContent = word.word;

  // Display word type
  const cardType = document.getElementById("cardType");
  cardType.innerHTML = `<span style="display: inline-block; background: #667eea; color: white; padding: 8px 18px; border-radius: 20px; font-size: 0.9em; font-weight: 600; text-transform: capitalize;">${word.type}</span>`;

  // Display translations
  const translationsList = document.getElementById("cardTranslations");
  translationsList.innerHTML = "";

  if (word.translationInfo && word.translationInfo.translations) {
    word.translationInfo.translations.forEach((trans) => {
      const li = document.createElement("li");
      li.textContent = trans.translation;
      if (trans.exampleEn) {
        li.textContent += ` (e.g., ${trans.exampleEn})`;
      }
      translationsList.appendChild(li);
    });
  }

  // Display usage if available
  const usageSection = document.getElementById("cardUsageSection");
  if (word.usage) {
    document.getElementById("cardUsage").textContent = word.usage;
    usageSection.style.display = "block";
  } else {
    usageSection.style.display = "none";
  }

  // Display verb forms if it's a verb
  const verbSection = document.getElementById("cardVerbSection");
  if (word.type === "verb" && word.verbForms) {
    const imperfectiveForm = word.verbForms.find(
      (f) => f.form === "imperfective",
    );
    const perfectiveForm = word.verbForms.find(
      (f) => f.form === "perfective" || f.form === "both",
    );

    let imperfectiveText = imperfectiveForm
      ? imperfectiveForm.text.split(";")[0].trim()
      : "—";
    let perfectiveText = perfectiveForm
      ? perfectiveForm.text.split(";")[0].trim()
      : "—";

    document.getElementById("cardImperfective").textContent = imperfectiveText;
    document.getElementById("cardPerfective").textContent = perfectiveText;

    verbSection.style.display = "block";
  } else {
    verbSection.style.display = "none";
  }
}

function loadNewCard() {
  const word = getRandomWord();
  if (word) {
    displayCard(word);
  }
}

// ============================================================
// MODE SWITCHING
// ============================================================

function switchMode(mode) {
  currentMode = mode;

  const quizSection = document.querySelector(".quiz-section");
  const cardsSection = document.querySelector(".cards-section");

  // Update button states
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
    }
  });

  if (mode === "quiz") {
    quizSection.style.display = "flex";
    cardsSection.style.display = "none";
    loadNewWord();
  } else if (mode === "cards") {
    quizSection.style.display = "none";
    cardsSection.style.display = "flex";
    loadNewCard();
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

document.getElementById("answerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  checkAnswer();
});

document.getElementById("hintBtn").addEventListener("click", () => {
  showHint();
});

document.getElementById("newWordBtn").addEventListener("click", () => {
  const answer1 = document.getElementById("answer1");
  const answer2 = document.getElementById("answer2");
  answer1.disabled = false;
  answer2.disabled = false;
  loadNewWord();
});

// Add real-time transliteration preview
function updatePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  input.addEventListener("keyup", () => {
    const latinText = input.value;
    const cyrillicText = latinToCyrillic(latinText);
    preview.textContent = cyrillicText;
  });
}

// Initialize previews
updatePreview("answer1", "preview1");
updatePreview("answer2", "preview2");

// Show word button
document.getElementById("showWordBtn").addEventListener("click", () => {
  if (currentWord) {
    hintsRevealed = currentWord.word.length;
    updateWordDisplay();
  }
});

// Add filter button listeners
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const filterType = btn.dataset.filter;
    applyFilter(filterType);
  });
});

// Add mode button listeners
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    switchMode(mode);
  });
});

// Keyboard event listener for cards mode
document.addEventListener("keydown", (e) => {
  if (currentMode === "cards" && (e.code === "Space" || e.code === "Enter")) {
    e.preventDefault();
    loadNewCard();
  }
});

// ============================================================
// INITIALIZE APP
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});
