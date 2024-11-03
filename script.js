'use strict';

// Application state
let appState = {
  words: [],
  originalWords: [],
  currentLevel: 1,
  currentSetIndex: 0,
  currentWordIndex: 0,
  score: 0,
  foutenCount: 0,
  errors: [],
  oefenrichting: null,
  setSize: 10, // Always 10 words per set
  currentWord: null,
  currentLevelWords: [],
  selectedList: null,
  languageCode: null,
};

// Data loaded from languages.json
let data = {};

// HTML elements
const languageSelectEl = document.getElementById('language-select');
const directionSelectEl = document.getElementById('direction-select');
const wordListSelectEl = document.getElementById('list-select');
const startButtonEl = document.getElementById('start-button');
const controlsEl = document.getElementById('controls');
const backButtonEl = document.getElementById('back-button');
const quizContainerEl = document.getElementById('quiz-container');
const questionContainerEl = document.getElementById('question-container');
const questionEl = document.querySelector('.question');
const optionsEl = document.querySelector('.options');
const feedbackEl = document.querySelector('.feedback');
const progressBarEl = document.querySelector('.progress-bar');
const levelProgressBarEl = document.querySelector('.level-progress-bar');
const progressInfoEl = document.querySelector('.progress-info');
const levelProgressInfoEl = document.querySelector('.level-progress-info');
const resultEl = document.querySelector('.result');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const highscoreContainerEl = document.getElementById('highscore-container');
const motivationalMessageEl = document.getElementById('motivational-message');
const repeatErrorsButtonEl = document.getElementById('repeat-errors');
const nextLevelButtonEl = document.getElementById('next-level');
const savedSessionsContainerEl = document.getElementById(
  'saved-sessions-container'
);
const savedSessionsListEl = document.getElementById('saved-sessions-list');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadLanguageData().then(() => {
    goToStartScreen();
  });
});

startButtonEl.addEventListener('click', startQuiz);
backButtonEl.addEventListener('click', goToStartScreen);
repeatErrorsButtonEl.addEventListener('click', startErrorReview);
nextLevelButtonEl.addEventListener('click', proceedToNextLevel);
languageSelectEl.addEventListener('change', onLanguageSelected);
directionSelectEl.addEventListener('change', checkStartButtonAvailability);
wordListSelectEl.addEventListener('change', checkStartButtonAvailability);

// Load language data from languages.json
async function loadLanguageData() {
  try {
    const response = await fetch('languages.json');
    data = await response.json();
    populateLanguageSelect();
    displaySavedSessions(); // Call this after data is loaded
  } catch (error) {
    console.error('Error loading language data:', error);
  }
}

// Populate the language select element
function populateLanguageSelect() {
  // Clear existing options (if any)
  languageSelectEl.innerHTML = '';

  // Add the default placeholder option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Kies een taal';
  defaultOption.selected = true;
  defaultOption.disabled = true;
  languageSelectEl.appendChild(defaultOption);

  data.languages.forEach(language => {
    const option = document.createElement('option');
    option.value = language.code;
    option.textContent = language.name;
    languageSelectEl.appendChild(option);
  });
}

// Handle language selection
function onLanguageSelected() {
  const selectedLanguageCode = languageSelectEl.value;
  const selectedLanguage = data.languages.find(
    lang => lang.code === selectedLanguageCode
  );

  if (selectedLanguage) {
    // Populate Direction Select
    populateDirectionSelect(selectedLanguage.directions);

    // Populate Word List Select
    populateWordListSelect(selectedLanguage.wordLists);

    // Enable the direction and word list selects
    directionSelectEl.disabled = false;
    wordListSelectEl.disabled = false;

    // Reset the selected values
    directionSelectEl.value = '';
    wordListSelectEl.value = '';

    // Disable the start button until all selections are made
    startButtonEl.disabled = true;
  } else {
    // If no language is selected, disable direction and list selects
    directionSelectEl.disabled = true;
    wordListSelectEl.disabled = true;
  }
}

// Populate the direction select element
function populateDirectionSelect(directions) {
  directionSelectEl.innerHTML = '';

  // Add default placeholder option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Kies een richting';
  defaultOption.selected = true;
  defaultOption.disabled = true;
  directionSelectEl.appendChild(defaultOption);

  directions.forEach(direction => {
    const option = document.createElement('option');
    option.value = direction.value;
    option.textContent = direction.text;
    directionSelectEl.appendChild(option);
  });
}

// Populate the word list select element
function populateWordListSelect(wordLists) {
  wordListSelectEl.innerHTML = '';

  // Add default placeholder option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Kies een lijst';
  defaultOption.selected = true;
  defaultOption.disabled = true;
  wordListSelectEl.appendChild(defaultOption);

  wordLists.forEach(list => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = list.title;
    wordListSelectEl.appendChild(option);
  });
}

// Function to enable the start button when all selections are made
function checkStartButtonAvailability() {
  if (
    languageSelectEl.value &&
    directionSelectEl.value &&
    wordListSelectEl.value
  ) {
    startButtonEl.disabled = false;
  } else {
    startButtonEl.disabled = true;
  }
}
// Start the quiz
async function startQuiz() {
  appState.languageCode = languageSelectEl.value;
  appState.oefenrichting = directionSelectEl.value;
  appState.selectedList = wordListSelectEl.value;

  const selectedLanguage = data.languages.find(
    lang => lang.code === appState.languageCode
  );

  const selectedWordList = selectedLanguage.wordLists.find(
    list => list.id === appState.selectedList
  );

  try {
    appState.originalWords = await loadWords(selectedWordList.file);

    // Reset the application state
    appState = {
      ...appState,
      words: appState.originalWords.slice(),
      currentLevel: 1,
      currentSetIndex: 0,
      currentWordIndex: 0,
      score: 0,
      foutenCount: 0,
      errors: [],
      currentLevelWords: [],
      currentWord: null,
    };

    // Hide start screen elements
    startButtonEl.style.display = 'none';
    savedSessionsContainerEl.style.display = 'none';
    languageSelectEl.parentElement.style.display = 'none';
    directionSelectEl.parentElement.style.display = 'none';
    wordListSelectEl.parentElement.style.display = 'none';
    controlsEl.style.display = 'flex';
    quizContainerEl.style.display = 'block';
    resultEl.textContent = '';
    motivationalMessageEl.textContent = '';
    highscoreEl.textContent = `Highscore: ${
      localStorage.getItem(getHighscoreKey()) || 0
    }`;
    updateScoreDisplay();
    startNewSet();
  } catch (error) {
    console.error('Fout bij het starten van de quiz:', error);
  }
}

// Load words from the selected word list file
async function loadWords(filePath) {
  const response = await fetch(filePath);
  const data = await response.json();
  return data.words ?? [];
}

// Start a new set of questions
function startNewSet() {
  const { currentSetIndex, words, setSize } = appState;
  const totalSets = Math.ceil(words.length / setSize);

  if (currentSetIndex >= totalSets) {
    showResult();
    return;
  }

  const startIdx = currentSetIndex * setSize;
  const endIdx = Math.min(startIdx + setSize, words.length);

  // Extract words for the current level
  const currentLevelWords = words.slice(startIdx, endIdx);
  // Shuffle the words for the current level
  const shuffledLevelWords = shuffleArray(currentLevelWords);

  // Update the app state with the shuffled words for the current level
  appState.currentLevelWords = shuffledLevelWords;
  appState.currentWordIndex = 0;
  appState.errors = [];

  motivationalMessageEl.textContent = `Laten we beginnen - Level ${appState.currentLevel}`;
  questionContainerEl.style.display = 'block';
  displayQuestion();
}

// Display the current question
function displayQuestion() {
  const { currentWordIndex, currentLevelWords } = appState;

  if (currentWordIndex >= currentLevelWords.length) {
    checkIfSetCompleted();
    return;
  }

  appState.currentWord = currentLevelWords[currentWordIndex];

  const [fromLang, toLang] = appState.oefenrichting.split('-');
  const vraag =
    fromLang === appState.languageCode
      ? appState.currentWord.word // Word in the foreign language
      : appState.currentWord.translation; // Word in Dutch

  const correctAntwoord =
    toLang === appState.languageCode
      ? appState.currentWord.word // Word in the foreign language
      : appState.currentWord.translation; // Word in Dutch

  questionEl.innerHTML = `<div class="what-is">Wat is de vertaling van</div><div class='word' style='color: #F24464;'>'${vraag}'</div>`;

  const options = shuffleOptions(correctAntwoord);
  optionsEl.innerHTML = '';
  options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = `answer${index + 1}`;
    button.innerHTML = `<i class="fa"></i> ${option}`;
    button.addEventListener('click', () =>
      processAnswer(button, option, correctAntwoord)
    );
    optionsEl.appendChild(button);
  });

  updateProgressBar();
  updateLevelProgressBar();

  progressInfoEl.innerHTML = `Vraag <strong style="color: #2f2570">${
    currentWordIndex + 1
  }</strong> van ${currentLevelWords.length}`;
  levelProgressInfoEl.innerHTML = `Level <strong style="color: #2f2570">${
    appState.currentLevel
  }</strong> van ${Math.ceil(
    appState.originalWords.length / appState.setSize
  )}`;
}

// Shuffle the answer options
function shuffleOptions(correctAnswer) {
  const [fromLang, toLang] = appState.oefenrichting.split('-');
  const allWords =
    toLang === appState.languageCode
      ? appState.originalWords.map(word => word.word)
      : appState.originalWords.map(word => word.translation);

  let options = [correctAnswer];

  while (options.length < 4) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    if (!options.includes(randomWord) && randomWord !== undefined) {
      options.push(randomWord);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

// Process the user's answer
function processAnswer(button, selectedOption, correctAnswer) {
  const isCorrect = selectedOption === correctAnswer;
  if (isCorrect) {
    button.classList.add('correct');
    button.querySelector('i').classList.add('fa-solid', 'fa-check');
    button.style.backgroundColor = '#61B68A';
    button.style.color = '#fff';
    appState.score++;
  } else {
    button.classList.add('wrong');
    button.querySelector('i').classList.add('fa-solid', 'fa-xmark');
    button.style.backgroundColor = '#A63841';
    button.style.color = '#fff';
    appState.foutenCount++;
    if (!appState.errors.includes(appState.currentWord)) {
      appState.errors.push(appState.currentWord);
    }

    // Mark the correct answer
    optionsEl.querySelectorAll('button').forEach(optButton => {
      if (optButton.textContent.trim().includes(correctAnswer)) {
        optButton.classList.add('correct-answer');
        optButton.querySelector('i').classList.add('fa-solid', 'fa-check');
        optButton.style.backgroundColor = '#fff';
        optButton.style.border = '2px solid #61B68A';
        optButton.style.color = '#61B68A';
      }
    });
  }
  appState.currentWordIndex++;
  setTimeout(() => {
    feedbackEl.textContent = '';
    displayQuestion();
  }, 1000);
  updateScoreDisplay();
  saveProgress(); // Save progress after processing the answer
}

// Check if the set is completed
function checkIfSetCompleted() {
  if (appState.errors.length > 0) {
    showSetResult(false);
  } else {
    showSetResult(true);
  }
}

// Show the result of the set
function showSetResult(isSetCleared) {
  questionContainerEl.style.display = 'none';
  if (isSetCleared) {
    motivationalMessageEl.innerHTML = `Geweldig, je hebt dit level gehaald! 💯`;
    repeatErrorsButtonEl.style.display = 'none';
    nextLevelButtonEl.style.display = 'block';
  } else {
    motivationalMessageEl.innerHTML = `Laten we de fouten nog eens bekijken. 👊`;
    repeatErrorsButtonEl.style.display = 'block';
    nextLevelButtonEl.style.display = 'none';
  }
}

// Start the error review
function startErrorReview() {
  if (appState.errors.length === 0) {
    proceedToNextLevel();
    return;
  }
  appState.currentLevelWords = shuffleArray(appState.errors.slice());
  appState.currentWordIndex = 0;
  appState.errors = [];
  questionContainerEl.style.display = 'block';
  repeatErrorsButtonEl.style.display = 'none';
  motivationalMessageEl.textContent = 'Herhalingsronde van de fouten';
  displayQuestion();
  saveProgress(); // Save progress after starting error review
}

// Proceed to the next level
function proceedToNextLevel() {
  appState.currentSetIndex++;
  appState.currentLevel++;
  appState.currentWordIndex = 0; // Reset word index for new level
  questionContainerEl.style.display = 'block';
  nextLevelButtonEl.style.display = 'none';
  motivationalMessageEl.textContent = '';
  startNewSet();
  saveProgress(); // Save progress after proceeding to next level
}

// Show the final result
function showResult() {
  resultEl.textContent = `Je hebt ${appState.score} van de ${appState.originalWords.length} goed!`;
  quizContainerEl.style.display = 'none';

  const highscoreKey = getHighscoreKey();
  const currentHighscore = parseInt(localStorage.getItem(highscoreKey)) || 0;

  if (appState.score > currentHighscore) {
    localStorage.setItem(highscoreKey, appState.score);
    highscoreEl.textContent = `Nieuwe highscore: ${appState.score}`;
  }

  // Clear saved progress for this session
  const sessionKey = generateSessionKey();
  localStorage.removeItem(sessionKey);

  // Refresh saved sessions
  displaySavedSessions();
}

// Update the score display
function updateScoreDisplay() {
  scoreEl.innerHTML = `<span style="color:#a3e5e3"><span class="emoji emoji-small">✅</span> Goed: ${appState.score}</span>  <span style="color: #fab4c1"><span class="emoji emoji-small">❌</span> Fout: ${appState.foutenCount}</span>`;
}

// Update the progress bar
function updateProgressBar() {
  const progress =
    (appState.currentWordIndex / appState.currentLevelWords.length) * 100;
  progressBarEl.style.width = `${progress}%`;
}

// Update the level progress bar
function updateLevelProgressBar() {
  const progress =
    ((appState.currentSetIndex + 1) /
      Math.ceil(appState.originalWords.length / appState.setSize)) *
    100;
  levelProgressBarEl.style.width = `${progress}%`;
}

// Shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate a session key for saving progress
function generateSessionKey() {
  return `progress_${appState.languageCode}_${appState.selectedList}_${appState.oefenrichting}`;
}

// Generate a highscore key
function getHighscoreKey() {
  return `highscore_${appState.languageCode}_${appState.oefenrichting}`;
}

// Save progress to localStorage
function saveProgress() {
  const progressData = {
    ...appState,
  };
  const sessionKey = generateSessionKey();
  localStorage.setItem(sessionKey, JSON.stringify(progressData));
}

// Load progress from localStorage
async function loadProgress(sessionKey) {
  const savedData = localStorage.getItem(sessionKey);
  if (savedData) {
    const progressData = JSON.parse(savedData);

    // Update appState with the saved data
    appState = {
      ...appState,
      ...progressData,
    };

    // Find the selected language
    const selectedLanguage = data.languages.find(
      lang => lang.code === appState.languageCode
    );

    if (!selectedLanguage) {
      console.error('Language not found.');
      return false;
    }

    // Find the selected word list
    const selectedWordList = selectedLanguage.wordLists.find(
      list => list.id === appState.selectedList
    );

    if (!selectedWordList) {
      console.error('Word list not found.');
      return false;
    }

    // Load words from the selected word list file
    appState.originalWords = await loadWords(selectedWordList.file);
    appState.words = appState.originalWords.slice();

    return true;
  }
  return false;
}

// Continue a saved session
function continueSession(sessionKey) {
  loadProgress(sessionKey)
    .then(loaded => {
      if (loaded) {
        // Hide start screen elements
        startButtonEl.style.display = 'none';
        savedSessionsContainerEl.style.display = 'none';
        languageSelectEl.parentElement.style.display = 'none';
        directionSelectEl.parentElement.style.display = 'none';
        wordListSelectEl.parentElement.style.display = 'none';
        controlsEl.style.display = 'flex';
        quizContainerEl.style.display = 'block';
        resultEl.textContent = '';
        motivationalMessageEl.textContent = '';
        highscoreEl.textContent = `Highscore: ${
          localStorage.getItem(getHighscoreKey()) || 0
        }`;
        updateScoreDisplay();
        displayQuestion();
      } else {
        alert('Geen opgeslagen sessie gevonden.');
      }
    })
    .catch(error => {
      console.error('Fout bij het laden van de sessie:', error);
      alert('Er is een fout opgetreden bij het laden van de sessie.');
    });
}

// Get all saved sessions
function getAllSavedSessions() {
  const sessions = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('progress_')) {
      sessions.push({
        key: key,
        data: JSON.parse(localStorage.getItem(key)),
      });
    }
  }
  return sessions;
}

// Delete a saved session
function deleteSession(sessionKey) {
  localStorage.removeItem(sessionKey);
}

// Display saved sessions on the start screen
function displaySavedSessions() {
  const sessions = getAllSavedSessions();
  if (sessions.length > 0) {
    savedSessionsContainerEl.style.display = 'block';
    savedSessionsListEl.innerHTML = '';

    sessions.forEach(session => {
      const listItem = document.createElement('li');

      // Find the language, word list, and direction texts
      const language = data.languages.find(
        lang => lang.code === session.data.languageCode
      );

      const languageName = language ? language.name : session.data.languageCode;

      const listText = language
        ? language.wordLists.find(list => list.id === session.data.selectedList)
            ?.title || session.data.selectedList
        : session.data.selectedList;

      const directionText = language
        ? language.directions.find(
            dir => dir.value === session.data.oefenrichting
          )?.text || session.data.oefenrichting
        : session.data.oefenrichting;

      const sessionDescription = document.createElement('span');
      sessionDescription.className = 'session-description';
      sessionDescription.textContent = `${languageName} | ${listText} - ${directionText} | Level: ${session.data.currentLevel}`;

      const sessionControlBtns = document.createElement('div');
      sessionControlBtns.className = 'session-control-btn-container';

      const continueBtn = document.createElement('button');
      continueBtn.className = 'continue-btn btn';
      continueBtn.textContent = 'Doorgaan';
      continueBtn.addEventListener('click', () => {
        continueSession(session.key);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
      deleteBtn.addEventListener('click', () => {
        deleteSession(session.key);
        displaySavedSessions(); // Refresh the list
      });

      sessionControlBtns.appendChild(continueBtn);
      sessionControlBtns.appendChild(deleteBtn);

      listItem.appendChild(sessionDescription);
      listItem.appendChild(sessionControlBtns);

      savedSessionsListEl.appendChild(listItem);
    });
  } else {
    savedSessionsContainerEl.style.display = 'none';
  }
}

// Go back to the start screen
function goToStartScreen() {
  // Hide quiz-related elements
  quizContainerEl.style.display = 'none';
  controlsEl.style.display = 'none';
  resultEl.textContent = '';
  motivationalMessageEl.textContent = '';

  // Reset the selects
  languageSelectEl.value = '';
  directionSelectEl.value = '';
  wordListSelectEl.value = '';

  // Disable the direction and word list selects
  directionSelectEl.disabled = true;
  wordListSelectEl.disabled = true;

  // Disable the start button
  startButtonEl.disabled = true;

  // Show the selects
  languageSelectEl.parentElement.style.display = 'flex';
  directionSelectEl.parentElement.style.display = 'flex';
  wordListSelectEl.parentElement.style.display = 'flex';

  // Show the start button
  startButtonEl.style.display = 'block';

  // Show the highscore container
  highscoreContainerEl.style.display = 'block';

  // Reset the application state
  appState = {
    words: [],
    originalWords: [],
    currentLevel: 1,
    currentSetIndex: 0,
    currentWordIndex: 0,
    score: 0,
    foutenCount: 0,
    errors: [],
    oefenrichting: null,
    setSize: 10,
    currentWord: null,
    currentLevelWords: [],
    selectedList: null,
    languageCode: null,
  };

  // Refresh saved sessions
  displaySavedSessions();
}
