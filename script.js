'use strict';

const lists = {
  unidad_1: 'unidad_1.json',
  unidad_2: 'unidad_2.json',
  los_numeros: 'los_numeros_0_100.json',
  all: ['unidad_1.json', 'unidad_2.json', 'los_numeros_0_100.json'],
};

// Applicatiestatus
let appState = {
  words: [],
  originalWords: [],
  currentLevel: 1,
  currentSetIndex: 0,
  currentWordIndex: 0,
  score: 0,
  foutenCount: 0,
  errors: [],
  oefenrichting: 'spaans-nederlands',
  setSize: 10, // Altijd 10 woorden per set
  highscoreSpaansNederlands:
    localStorage.getItem('highscore-spaans-nederlands') || 0,
  highscoreNederlandsSpaans:
    localStorage.getItem('highscore-nederlands-spaans') || 0,
  currentWord: null,
  currentLevelWords: [], // Add this line
};

// HTML-elementen selecteren
const listSelectEl = document.getElementById('list-select');
const directionSelectEl = document.getElementById('direction-select');
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
const highscoreSpaansNederlandsEl = document.getElementById(
  'highscore-spaans-nederlands'
);
const highscoreNederlandsSpaansEl = document.getElementById(
  'highscore-nederlands-spaans'
);
const highscoreContainerEl = document.getElementById('highscore-container');
const motivationalMessageEl = document.getElementById('motivational-message');
const repeatErrorsButtonEl = document.getElementById('repeat-errors');
const nextLevelButtonEl = document.getElementById('next-level');

// Update highscore display
highscoreSpaansNederlandsEl.textContent = `Highscore Spaans-Nederlands: ${appState.highscoreSpaansNederlands}`;
highscoreNederlandsSpaansEl.textContent = `Highscore Nederlands-Spaans: ${appState.highscoreNederlandsSpaans}`;

// Event Listeners
startButtonEl.addEventListener('click', startQuiz);
backButtonEl.addEventListener('click', goToStartScreen);
repeatErrorsButtonEl.addEventListener('click', startErrorReview);
nextLevelButtonEl.addEventListener('click', proceedToNextLevel);

// utility functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function goToStartScreen() {
  quizContainerEl.style.display = 'none';
  controlsEl.style.display = 'none';
  startButtonEl.style.display = 'block';
  listSelectEl.parentElement.style.display = 'flex';
  directionSelectEl.parentElement.style.display = 'flex';
  highscoreContainerEl.style.display = 'block';
  resultEl.textContent = '';
  motivationalMessageEl.textContent = '';

  // Reset de applicatiestatus
  appState = {
    ...appState,
    words: [],
    originalWords: [],
    currentLevel: 1,
    currentSetIndex: 0,
    currentWordIndex: 0,
    score: 0,
    foutenCount: 0,
    errors: [],
  };
}

async function startQuiz() {
  appState.oefenrichting = directionSelectEl.value;
  const selectedList = listSelectEl.value;
  highscoreContainerEl.style.display = 'none';

  try {
    appState.originalWords = await loadWords(selectedList);
    if (appState.originalWords.length === 0) {
      console.error('Geen woorden gevonden om te oefenen.');
      return;
    }
    // Reset de applicatiestatus
    appState = {
      ...appState,
      words: appState.originalWords.slice(),
      currentLevel: 1,
      currentSetIndex: 0,
      currentWordIndex: 0,
      score: 0,
      foutenCount: 0,
      errors: [],
    };
    startButtonEl.style.display = 'none';
    listSelectEl.parentElement.style.display = 'none';
    directionSelectEl.parentElement.style.display = 'none';
    controlsEl.style.display = 'flex';
    quizContainerEl.style.display = 'block';
    resultEl.textContent = '';
    motivationalMessageEl.textContent = '';
    highscoreEl.textContent = `Highscore: ${
      appState.oefenrichting === 'spaans-nederlands'
        ? appState.highscoreSpaansNederlands
        : appState.highscoreNederlandsSpaans
    }`;
    updateScoreDisplay();
    startNewSet();
  } catch (error) {
    console.error('Fout bij het starten van de quiz:', error);
  }
}

async function loadWords(selectedList) {
  let words = [];
  if (selectedList === 'all') {
    const fetchPromises = lists.all.map(url =>
      fetch(url)
        .then(response => response.json())
        .then(data => data.spaans ?? [])
    );
    const dataArrays = await Promise.all(fetchPromises);
    words = dataArrays.flat();
  } else {
    const response = await fetch(lists[selectedList]);
    const data = await response.json();
    words = data.spaans ?? [];
  }
  return words;
}

function startNewSet() {
  const { currentSetIndex, words, setSize } = appState;
  const totalSets = Math.ceil(words.length / setSize);

  if (currentSetIndex >= totalSets) {
    showResult();
    return;
  }

  const startIdx = currentSetIndex * setSize;
  const endIdx = Math.min(startIdx + setSize, words.length);

  // extract words for the current level
  const currentLevelWords = words.slice(startIdx, endIdx);
  //shuffle the words for the current level
  const shuffledLevelWords = shuffleArray(currentLevelWords);

  // update the app state with the shuffled words for the current level
  appState.currentLevelWords = shuffledLevelWords;
  appState.currentWordIndex = 0;
  appState.errors = [];

  motivationalMessageEl.textContent = `Laten we beginnen - Level ${appState.currentLevel}`;
  questionContainerEl.style.display = 'block';
  displayQuestion();
}

function displayQuestion() {
  const { currentWordIndex, currentLevelWords } = appState;

  if (currentWordIndex >= currentLevelWords.length) {
    checkIfSetCompleted();
    return;
  }

  appState.currentWord = currentLevelWords[currentWordIndex];
  const vraag =
    appState.oefenrichting === 'spaans-nederlands'
      ? appState.currentWord.woord
      : appState.currentWord.vertaling;
  const correctAntwoord =
    appState.oefenrichting === 'spaans-nederlands'
      ? appState.currentWord.vertaling
      : appState.currentWord.woord;

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
  updatelevelProgressBar();

  progressInfoEl.innerHTML = `Vraag <strong style="color: #2f2570">${
    currentWordIndex + 1
  }</strong> van ${currentLevelWords.length}`;
  levelProgressInfoEl.innerHTML = `Level <strong style="color: #2f2570">${
    appState.currentLevel
  }</strong> van ${Math.ceil(
    appState.originalWords.length / appState.setSize
  )}`;
}
// processAnswer function that processes the user's answer
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
}

function checkIfSetCompleted() {
  if (appState.errors.length > 0) {
    showSetResult(false);
  } else {
    showSetResult(true);
  }
}

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
}

function proceedToNextLevel() {
  appState.currentSetIndex++;
  appState.currentLevel++;
  appState.currentWordIndex = appState.currentSetIndex * appState.setSize;
  appState.words = appState.originalWords.slice();
  questionContainerEl.style.display = 'block';
  nextLevelButtonEl.style.display = 'none';
  motivationalMessageEl.textContent = '';
  startNewSet();
}

function showResult() {
  resultEl.textContent = `Je hebt ${appState.score} van de ${appState.originalWords.length} goed!`;
  quizContainerEl.style.display = 'none';

  const currentHighscore =
    appState.oefenrichting === 'spaans-nederlands'
      ? appState.highscoreSpaansNederlands
      : appState.highscoreNederlandsSpaans;

  if (appState.score > currentHighscore) {
    if (appState.oefenrichting === 'spaans-nederlands') {
      appState.highscoreSpaansNederlands = appState.score;
      localStorage.setItem('highscore-spaans-nederlands', appState.score);
    } else {
      appState.highscoreNederlandsSpaans = appState.score;
      localStorage.setItem('highscore-nederlands-spaans', appState.score);
    }
    highscoreEl.textContent = `Nieuwe highscore: ${appState.score}`;
  }
}

function updateScoreDisplay() {
  scoreEl.innerHTML = `<span style="color:#a3e5e3"><span class="emoji emoji-small">✅</span> Goed: ${appState.score}</span>  <span style="color: #fab4c1"><span class="emoji emoji-small">❌</span> Fout: ${appState.foutenCount}</span>`;
}

function updateProgressBar() {
  const progress =
    (appState.currentWordIndex / appState.currentLevelWords.length) * 100;
  progressBarEl.style.width = `${progress}%`;
}

function updatelevelProgressBar() {
  const progress =
    ((appState.currentSetIndex + 1) /
      Math.ceil(appState.originalWords.length / appState.setSize)) *
    100;
  levelProgressBarEl.style.width = `${progress}%`;
}

function shuffleOptions(correctAnswer) {
  const allWords =
    appState.oefenrichting === 'spaans-nederlands'
      ? appState.originalWords.map(word => word.vertaling)
      : appState.originalWords.map(word => word.woord);
  let options = [correctAnswer];

  while (options.length < 4) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    if (!options.includes(randomWord) && randomWord !== undefined) {
      options.push(randomWord);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}
