'use strict';

// Define current version
const CURRENT_VERSION = '1.1';

// Migration functions
const migrations = {
  0.9: data => {
    // Example: Suppose in version 1.0, you added a new property `completedSets`
    data.completedSets = data.completedSets || 0;
    data.version = '1.0';
    return data;
  },
  1.0: data => {
    data.isFlashcards = data.isFlashcards ?? false; // Set default value if not present
    data.version = '1.1';
    return data;
  },
  // Future migrations can be added here
};

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
  isFlashcards: false, // Indicates if the current game is flashcards
  version: CURRENT_VERSION, // Current version
};

// Data loaded from languages.json
let data = {};

// HTML elements
const languageSelectEl = document.getElementById('language-select');
const directionSelectEl = document.getElementById('direction-select');
const wordListSelectEl = document.getElementById('list-select');
// const startButtonEl = document.getElementById('start-button');
const selectMethodContainer = document.getElementById(
  'select-method-container'
);
// New start method buttons
const multipleChoiceBtnEl = document.getElementById('multiple-choice-btn');
const flashcardsBtnEl = document.getElementById('flashcards-btn');
// Flashcards elements
const flashcardContainerEl = document.getElementById('flashcard-container');
const flashcardQuestionEl = document.querySelector('.flashcard-question');
const flashcardAnswerInputEl = document.getElementById(
  'flashcard-answer-input'
);
const flashcardSubmitBtnEl = document.getElementById('flashcard-submit-btn');
const flashcardFeedbackEl = document.querySelector('.flashcard-feedback');
// Multiple choice elements
const controlsEl = document.getElementById('controls');
const quizContainerEl = document.getElementById('quiz-container');
const questionContainerEl = document.getElementById('question-container');
const optionsEl = document.querySelector('.options');
const feedbackEl = document.querySelector('.feedback');
const progressBarEl = document.querySelector('.progress-bar');
const levelProgressBarEl = document.querySelector('.level-progress-bar');
const progressInfoEl = document.querySelector('.progress-info');
const levelProgressInfoEl = document.querySelector('.level-progress-info');
// Controls elements
const backButtonEl = document.getElementById('back-button');
const questionEl = document.querySelector('.question');
const repeatErrorsButtonEl = document.getElementById('repeat-errors');
const nextLevelButtonEl = document.getElementById('next-level');

const resultEl = document.querySelector('.result');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const highscoreContainerEl = document.getElementById('highscore-container');
const motivationalMessageEl = document.getElementById('motivational-message');
const savedSessionsContainerEl = document.getElementById(
  'saved-sessions-container'
);
const savedSessionsListEl = document.getElementById('saved-sessions-list');

// UTILITY FUNCTIONS
async function loadWords(filePath) {
  //--// Load words from the selected word list file
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(
        `Failed to load word list from ${filePath}: ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log(`Loaded word list from ${filePath}:`, data);
    return data.words ?? [];
  } catch (error) {
    console.error('Error loading word list:', error);
    alert('Er is een fout opgetreden bij het laden van de woordenlijst.');
    return [];
  }
}
function shuffleArray(array) {
  //--// Shuffle an array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function generateSessionKey() {
  //--// Generate a session key for saving progress
  const gameMode = appState.isFlashcards ? 'flashcards' : 'multipleChoice';
  return `progress_${appState.languageCode}_${appState.selectedList}_${appState.oefenrichting}`;
}
function getHighscoreKey() {
  //--// Generate a highscore key
  return `highscore_${appState.languageCode}_${appState.oefenrichting}`;
}
async function loadProgress(sessionKey) {
  // Ensure language data is loaded before loading progress
  if (!data.languages || data.languages.length === 0) {
    await loadLanguageData();
  }

  const savedData = localStorage.getItem(sessionKey);
  if (savedData) {
    try {
      let progressData = JSON.parse(savedData);
      console.log(`Loaded progress data:`, progressData);

      // Check if version exists; if not, assume it's an old version
      if (!progressData.version) {
        progressData.version = '0.9'; // Example: previous version
        console.log(`Assumed version 0.9 for saved data.`);
      }

      // Migrate data step by step to the current version
      while (progressData.version !== CURRENT_VERSION) {
        const migrate = migrations[progressData.version];
        if (migrate) {
          console.log(
            `Migrating from version ${progressData.version} to ${CURRENT_VERSION}`
          );
          progressData = migrate(progressData);
          console.log(`Progress data after migration:`, progressData);
        } else {
          console.error(
            `No migration available for version ${progressData.version}`
          );
          return false;
        }
      }

      // Ensure required properties are present
      const requiredProps = [
        'languageCode',
        'selectedList',
        'oefenrichting',
        'currentLevel',
        'currentSetIndex',
        'currentWordIndex',
        'score',
        'foutenCount',
        'errors',
        'currentLevelWords',
        'words',
        'originalWords',
        'version',
        'isFlashcards',
      ];

      const hasAllProps = requiredProps.every(prop =>
        progressData.hasOwnProperty(prop)
      );

      console.log(
        `Checking for required properties: ${hasAllProps ? 'Passed' : 'Failed'}`
      );

      if (!hasAllProps) {
        console.error('Saved progress data is incomplete or corrupted.');
        return false;
      }

      // Find the selected language
      const selectedLanguage = data.languages.find(
        lang => lang.code === progressData.languageCode
      );
      if (!selectedLanguage) {
        console.error('Language not found.');
        return false;
      }

      // Find the selected word list
      const selectedWordList = selectedLanguage.wordLists.find(
        list => list.id === progressData.selectedList
      );
      if (!selectedWordList) {
        console.error('Word list not found.');
        return false;
      }

      // Load words from the selected word list file
      const loadedWords = await loadWords(selectedWordList.file);
      if (loadedWords.length === 0) {
        console.error('No words loaded from the word list.');
        return false;
      }
      progressData.originalWords = loadedWords;
      console.log(`Loaded words from ${selectedWordList.file}:`, loadedWords);

      // Update appState with the saved data
      appState = {
        ...appState,
        ...progressData,
      };
      console.log(`Updated appState:`, appState);

      return true;
    } catch (error) {
      console.error('Error loading progress data:', error);
      return false;
    }
  }
  console.log(`No saved data found for sessionKey: ${sessionKey}`);
  return false;
}
function saveProgress() {
  const progressData = {
    ...appState,
    version: CURRENT_VERSION, // Ensure the version is saved
  };

  const sessionKey = generateSessionKey();
  try {
    localStorage.setItem(sessionKey, JSON.stringify(progressData));
    console.log(`Progress saved for sessionKey: ${sessionKey}`, progressData);
  } catch (error) {
    console.error('Error saving progress:', error);
    alert('Er is een fout opgetreden bij het opslaan van je voortgang.');
  }
}
function getAllSavedSessions() {
  //--// Get all saved sessions
  const sessions = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('progress_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        sessions.push({
          key: key,
          data: data,
        });
      } catch (error) {
        console.error(`Error parsing session data for key ${key}:`, error);
        // Optionally, remove the corrupt session
        localStorage.removeItem(key);
        console.log(`Removed corrupt session: ${key}`);
      }
    }
  }
  console.log(`Retrieved ${sessions.length} saved sessions.`);
  return sessions;
}
function deleteSession(sessionKey) {
  //--// Delete a saved session
  try {
    localStorage.removeItem(sessionKey);
    console.log(`Deleted session with key: ${sessionKey}`);
  } catch (error) {
    console.error(`Error deleting session ${sessionKey}:`, error);
    alert('Er is een fout opgetreden bij het verwijderen van de sessie.');
  }
}

// Create the special character toolbar for inserting special characters
function createSpecialCharToolbar(targetInput) {
  // Remove existing toolbar if any
  const existingToolbar = targetInput.parentNode.querySelector(
    '#special-char-toolbar'
  );
  if (existingToolbar) {
    existingToolbar.remove();
  }

  // Create the toolbar element
  const toolbar = document.createElement('div');
  toolbar.id = 'special-char-toolbar';
  toolbar.className = 'special-char-toolbar';

  // Define the special characters
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¡', '¿'];

  // Create buttons for each special character
  specialChars.forEach(char => {
    const button = document.createElement('button');
    button.className = 'special-char-btn';
    button.textContent = char;
    button.dataset.char = char;

    // Add click event to insert the character into the target input
    button.addEventListener('click', () => {
      insertCharAtCursor(targetInput, char);
    });

    toolbar.appendChild(button);
  });

  // Insert the toolbar right after the input element in the DOM
  targetInput.parentNode.insertBefore(toolbar, targetInput.nextSibling);
}

// Helper function to insert character at the cursor position
function insertCharAtCursor(input, char) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = input.value.slice(0, start) + char + input.value.slice(end);
  input.setSelectionRange(start + 1, start + 1);
  input.focus();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadLanguageData().then(() => {
    // Only attempt to display saved sessions after language data is loaded
    displaySavedSessions();
    goToStartScreen();
  });
});
multipleChoiceBtnEl.addEventListener('click', startQuiz);
flashcardsBtnEl.addEventListener('click', startFlashcardGame);
backButtonEl.addEventListener('click', goToStartScreen);
repeatErrorsButtonEl.addEventListener('click', startErrorReview);
nextLevelButtonEl.addEventListener('click', proceedToNextLevel);
languageSelectEl.addEventListener('change', onLanguageSelected);
directionSelectEl.addEventListener('change', checkStartButtonAvailability);
wordListSelectEl.addEventListener('change', checkStartButtonAvailability);
flashcardSubmitBtnEl.addEventListener('click', submitFlashcardAnswer);
flashcardAnswerInputEl.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    submitFlashcardAnswer();
  }
});
// Load language data from languages.json
async function loadLanguageData() {
  try {
    const response = await fetch('languages.json');
    if (!response.ok) {
      throw new Error(`Failed to load languages.json: ${response.statusText}`);
    }
    data = await response.json();
    console.log('Loaded languages.json:', data);
    populateLanguageSelect();
  } catch (error) {
    console.error('Error loading language data:', error);
    alert('Er is een fout opgetreden bij het laden van de taalgegevens.');
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

  console.log('Populated language select:', languageSelectEl.innerHTML);
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

    // Disable the start buttons until all selections are made
    flashcardsBtnEl.disabled = true;
    multipleChoiceBtnEl.disabled = true;

    console.log('Language selected:', selectedLanguageCode);
  } else {
    // If no language is selected, disable direction and list selects
    directionSelectEl.disabled = true;
    wordListSelectEl.disabled = true;
    console.log('No language selected.');
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

  console.log('Populated direction select:', directionSelectEl.innerHTML);
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

  console.log('Populated word list select:', wordListSelectEl.innerHTML);
}

// Function to enable the start button when all selections are made
function checkStartButtonAvailability() {
  if (
    languageSelectEl.value &&
    directionSelectEl.value &&
    wordListSelectEl.value
  ) {
    multipleChoiceBtnEl.disabled = false;
    flashcardsBtnEl.disabled = false;
    console.log('All selections made. Start button enabled.');
  } else {
    multipleChoiceBtnEl.disabled = true;
    flashcardsBtnEl.disabled = true;
    console.log('Incomplete selections. Start button disabled.');
  }
}
// Go back to the start screen
function goToStartScreen() {
  // Hide quiz-related elements
  quizContainerEl.style.display = 'none';
  flashcardContainerEl.style.display = 'none';
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
  multipleChoiceBtnEl.disabled = true;
  flashcardsBtnEl.disabled = true;

  // Show the selects
  languageSelectEl.parentElement.style.display = 'flex';
  directionSelectEl.parentElement.style.display = 'flex';
  wordListSelectEl.parentElement.style.display = 'flex';

  // Show the start button
  selectMethodContainer.style.display = 'flex';

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
    version: CURRENT_VERSION, // Ensure version is reset
  };
  console.log('Returned to start screen. Reset appState:', appState);

  // Refresh saved sessions
  displaySavedSessions();
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

      const gameTypeEmoji = session.data.isFlashcards ? '⚡' : '☑️';
      const sessionDescription = document.createElement('span');
      sessionDescription.className = 'session-description';

      const sessionGameType = document.createElement('span');
      sessionGameType.className = 'session-game-type emoji';
      sessionGameType.innerHTML = gameTypeEmoji;

      sessionDescription.innerHTML = `${languageName} | Level: ${session.data.currentLevel} | ${listText} - ${directionText}`;

      const sessionControlBtns = document.createElement('div');
      sessionControlBtns.className = 'session-control-btn-container';

      const continueBtn = document.createElement('button');
      continueBtn.className = 'continue-btn btn';
      continueBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      continueBtn.addEventListener('click', () => {
        continueSession(session.key);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn btn';
      deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
      deleteBtn.addEventListener('click', () => {
        deleteSession(session.key);
        displaySavedSessions(); // Refresh the list
      });

      sessionControlBtns.appendChild(continueBtn);
      sessionControlBtns.appendChild(deleteBtn);

      listItem.appendChild(sessionGameType);
      listItem.appendChild(sessionDescription);
      listItem.appendChild(sessionControlBtns);

      savedSessionsListEl.appendChild(listItem);
    });
    console.log('Displayed all saved sessions.');
  } else {
    savedSessionsContainerEl.style.display = 'none';
    console.log('No saved sessions to display.');
  }
}
// Continue a saved session
function continueSession(sessionKey) {
  loadProgress(sessionKey)
    .then(loaded => {
      if (loaded) {
        console.log('Session loaded successfully.');

        // Hide start screen elements
        selectMethodContainer.style.display = 'none';
        savedSessionsContainerEl.style.display = 'none';
        languageSelectEl.parentElement.style.display = 'none';
        directionSelectEl.parentElement.style.display = 'none';
        wordListSelectEl.parentElement.style.display = 'none';

        controlsEl.style.display = 'flex';
        resultEl.textContent = '';
        motivationalMessageEl.textContent = '';

        if (appState.isFlashcards) {
          flashcardContainerEl.style.display = 'flex';
          quizContainerEl.style.display = 'none';
          displayFlashcardQuestion();
          // Check if the special character toolbar is needed
          if (appState.oefenrichting === 'nl-es') {
            createSpecialCharToolbar(flashcardAnswerInputEl);
          }
        } else {
          quizContainerEl.style.display = 'block';
          flashcardContainerEl.style.display = 'none';
          displayQuestion();
        }

        updateScoreDisplay();
      } else {
        console.error(
          'Failed to load the session. The session may be corrupt or incomplete.'
        );
        alert('Geen opgeslagen sessie gevonden of sessie is corrupt.');
        deleteSession(sessionKey);
        displaySavedSessions();
      }
    })
    .catch(error => {
      console.error('Fout bij het laden van de sessie:', error);
      alert('Er is een fout opgetreden bij het laden van de sessie.');
    });
}

// Start the multiple choice game
async function startQuiz() {
  appState.languageCode = languageSelectEl.value;
  appState.oefenrichting = directionSelectEl.value;
  appState.selectedList = wordListSelectEl.value;
  appState.isFlashcards = false; // This is a multiple-choice session

  const selectedLanguage = data.languages.find(
    lang => lang.code === appState.languageCode
  );

  const selectedWordList = selectedLanguage.wordLists.find(
    list => list.id === appState.selectedList
  );

  try {
    appState.originalWords = await loadWords(selectedWordList.file);
    console.log('Loaded words:', appState.originalWords);

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
      version: CURRENT_VERSION, // Reset version
    };
    console.log('Reset appState for new quiz:', appState);

    // Hide start screen elements
    selectMethodContainer.style.display = 'none';
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

    // Save the initial state of the new game session
    saveProgress();
  } catch (error) {
    console.error('Fout bij het starten van de quiz:', error);
    alert('Er is een fout opgetreden bij het starten van de quiz.');
  }
}

// Start a new set of questions
function startNewSet() {
  const { currentSetIndex, words, setSize } = appState;
  const totalSets = Math.ceil(words.length / setSize);
  console.log(`Starting set ${currentSetIndex + 1} of ${totalSets}`);

  if (currentSetIndex >= totalSets) {
    console.log('All sets completed. Showing results.');
    showResult();
    return;
  }

  const startIdx = currentSetIndex * setSize;
  const endIdx = Math.min(startIdx + setSize, words.length);

  // Extract words for the current level
  const currentLevelWords = words.slice(startIdx, endIdx);
  console.log(`Current level words:`, currentLevelWords);

  // Shuffle the words for the current level
  const shuffledLevelWords = shuffleArray(currentLevelWords);
  console.log(`Shuffled level words:`, shuffledLevelWords);

  // Update the app state with the shuffled words for the current level
  appState.currentLevelWords = shuffledLevelWords;
  appState.currentWordIndex = 0;
  appState.errors = [];

  motivationalMessageEl.textContent = `Laten we beginnen - Level ${appState.currentLevel}`;
  questionContainerEl.style.display = 'block';
  console.log(
    'Set questionContainerEl to display: block and updated motivational message'
  );
  displayQuestion();
}
// Display the current question
function displayQuestion() {
  const { currentWordIndex, currentLevelWords } = appState;
  console.log(
    `Displaying question ${currentWordIndex + 1} of ${currentLevelWords.length}`
  );

  if (currentWordIndex >= currentLevelWords.length) {
    console.log('All questions in the current set have been answered.');
    checkIfSetCompleted();
    return;
  }

  appState.currentWord = currentLevelWords[currentWordIndex];
  console.log(`Current word:`, appState.currentWord);

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
  console.log(`Question set to: ${vraag}`);

  const options = shuffleOptions(correctAntwoord);
  console.log(`Options:`, options);

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

  // Ensure the question container is visible
  questionContainerEl.style.display = 'block';
  console.log('Set questionContainerEl to display: block');

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
  return shuffleArray(options);
}
// Process the user's answer
function processAnswer(button, selectedOption, correctAnswer) {
  const isCorrect = selectedOption === correctAnswer;
  console.log(
    `User selected: ${selectedOption} | Correct answer: ${correctAnswer} | Is correct: ${isCorrect}`
  );

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
      console.log('Added to errors:', appState.currentWord);
    }

    // Mark the correct answer
    optionsEl.querySelectorAll('button').forEach(optButton => {
      if (optButton.textContent.trim().includes(correctAnswer)) {
        optButton.classList.add('correct-answer');
        optButton.querySelector('i').classList.add('fa-solid', 'fa-check');
        optButton.style.backgroundColor = '#fff';
        optButton.style.border = '2px solid #61B68A';
        optButton.style.color = '#61B68A';
        console.log('Marked correct answer button.');
      }
    });
  }
  appState.currentWordIndex++;
  console.log(`Updated appState after answer:`, appState);

  setTimeout(() => {
    feedbackEl.textContent = '';
    displayQuestion();
  }, 1000);
  updateScoreDisplay();
  saveProgress(); // Save progress after processing the answer
}
// Check if the set is completed
function checkIfSetCompleted() {
  console.log(`Set completed. Errors count: ${appState.errors.length}`);
  if (appState.errors.length > 0) {
    showSetResult(false);
  } else {
    showSetResult(true);
  }
}
// Show the result of the set
function showSetResult(isSetCleared) {
  questionContainerEl.style.display = 'none';
  console.log(`Set result: ${isSetCleared ? 'Cleared' : 'Errors present'}`);
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
  console.log('Starting error review with errors:', appState.errors);
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
  console.log(`Proceeding to next level: ${appState.currentLevel}`);
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
  controlsEl.style.display = 'none';

  const highscoreKey = getHighscoreKey();
  const currentHighscore = parseInt(localStorage.getItem(highscoreKey)) || 0;

  if (appState.score > currentHighscore) {
    localStorage.setItem(highscoreKey, appState.score);
    highscoreEl.textContent = `Nieuwe highscore: ${appState.score}`;
    console.log('New highscore achieved:', appState.score);
  } else {
    highscoreEl.textContent = `Highscore: ${currentHighscore}`;
    console.log('Highscore remains:', currentHighscore);
  }

  // Clear saved progress for this session
  const sessionKey = generateSessionKey();
  localStorage.removeItem(sessionKey);
  console.log(`Cleared saved session: ${sessionKey}`);

  // Refresh saved sessions
  displaySavedSessions();

  // Optionally, you can add a button to restart or go back to start
}

// Update the score display
function updateScoreDisplay() {
  scoreEl.innerHTML = `<span style="color:#16aba7"><span class="emoji emoji-small">✅</span> Goed: ${appState.score}</span>  <span style="color: #da3d5a"><span class="emoji emoji-small">❌</span> Fout: ${appState.foutenCount}</span>`;
  console.log(`Updated score display:`, scoreEl.innerHTML);
}

// Update the progress bar
function updateProgressBar() {
  const progress =
    (appState.currentWordIndex / appState.currentLevelWords.length) * 100;
  progressBarEl.style.width = `${progress}%`;
  console.log(`Updated progress bar to ${progress}%`);
}

// Update the level progress bar
function updateLevelProgressBar() {
  const progress =
    ((appState.currentSetIndex + 1) /
      Math.ceil(appState.originalWords.length / appState.setSize)) *
    100;
  levelProgressBarEl.style.width = `${progress}%`;
  console.log(`Updated level progress bar to ${progress}%`);
}
// Start the flashcard game
// Start the flashcard game
// Start the flashcard game
async function startFlashcardGame() {
  appState.languageCode = languageSelectEl.value;
  appState.oefenrichting = directionSelectEl.value;
  appState.selectedList = wordListSelectEl.value;
  appState.isFlashcards = true;

  // Hide start screen elements
  selectMethodContainer.style.display = 'none';
  savedSessionsContainerEl.style.display = 'none';
  languageSelectEl.parentElement.style.display = 'none';
  directionSelectEl.parentElement.style.display = 'none';
  wordListSelectEl.parentElement.style.display = 'none';
  controlsEl.style.display = 'flex';
  flashcardContainerEl.style.display = 'flex';
  resultEl.textContent = '';
  motivationalMessageEl.textContent = '';

  // Load the words and start the flashcard session
  await loadFlashcardWords();

  // Create the special character toolbar if the direction is Dutch to Spanish
  if (appState.languageCode === 'es' && appState.oefenrichting === 'nl-es') {
    createSpecialCharToolbar(flashcardAnswerInputEl);
  }

  // Save progress
  saveProgress();
}

// Load flashcard words
async function loadFlashcardWords() {
  try {
    const selectedLanguage = data.languages.find(
      lang => lang.code === appState.languageCode
    );
    const selectedWordList = selectedLanguage.wordLists.find(
      list => list.id === appState.selectedList
    );
    appState.originalWords = await loadWords(selectedWordList.file);
    appState.words = shuffleArray(appState.originalWords.slice());
    appState.currentWordIndex = 0;
    displayFlashcardQuestion();
  } catch (error) {
    console.error('Error loading flashcard words:', error);
  }
}
// Display flashcard question
function displayFlashcardQuestion() {
  const { currentWordIndex, words, oefenrichting } = appState;

  if (currentWordIndex >= words.length) {
    showFlashcardResult();
    return;
  }

  const currentWord = words[currentWordIndex];
  const [fromLang, toLang] = oefenrichting.split('-');

  // Display the question in the "from" language
  const question =
    fromLang === 'nl'
      ? currentWord.word // The word in Dutch
      : currentWord.translation; // The word in the foreign language

  flashcardQuestionEl.innerHTML = `<div class="what-is">Wat is de vertaling van</div><div class='word' style='color: #F24464;'>'${question}'</div>`;
  flashcardAnswerInputEl.value = ''; // Clear input field
  flashcardFeedbackEl.textContent = ''; // Clear feedback
}

// Handle flashcard answer submission
function submitFlashcardAnswer() {
  const { currentWordIndex, words, oefenrichting } = appState;
  const currentWord = words[currentWordIndex];
  const [fromLang, toLang] = oefenrichting.split('-');

  // Determine the correct answer based on the "to" language
  const correctAnswer =
    toLang === 'nl'
      ? currentWord.word // The answer should be in Dutch
      : currentWord.translation; // The answer should be in the foreign language

  const userAnswer = flashcardAnswerInputEl.value.trim().toLowerCase();

  if (userAnswer === correctAnswer.toLowerCase()) {
    flashcardFeedbackEl.textContent = 'Correct!';
    flashcardFeedbackEl.style.color = 'green';
    appState.score++;
  } else {
    flashcardFeedbackEl.textContent = `Incorrect. Correct answer: ${correctAnswer}`;
    flashcardFeedbackEl.style.color = 'red';
    appState.foutenCount++;
    appState.errors.push(currentWord);
  }

  appState.currentWordIndex++;
  setTimeout(() => {
    displayFlashcardQuestion();
  }, 1000);

  // Save progress
  saveProgress();
}

// Show flashcard result
function showFlashcardResult() {
  flashcardContainerEl.style.display = 'none';
  resultEl.textContent = `You got ${appState.score} out of ${appState.originalWords.length} correct!`;
  controlsEl.style.display = 'flex';
}
