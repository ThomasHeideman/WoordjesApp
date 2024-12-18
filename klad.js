'use strict';
const lists = {
  unidad_1: 'unidad_1.json',
  unidad_2: 'unidad_2.json',
  los_numeros: 'los_numeros_0_100.json',
  all: ['unidad_1.json', 'unidad_2.json', 'los_numeros_0_100.json'],
};

let woordenlijst = [];
let randomWords = [];
let currentIndex = 0;
let score = 0;
let foutenCount = 0;
let setIndex = 0;
let fouten = [];
let nieuweFouten = [];
let isRepeatRound = false;

let oefenrichting = 'spaans-nederlands';
let setSize = 2; // Altijd 10 woorden per set
let highscoreSpaansNederlands =
  localStorage.getItem('highscore-spaans-nederlands') || 0;
let highscoreNederlandsSpaans =
  localStorage.getItem('highscore-nederlands-spaans') || 0;
let currentWord = null;

// HTML-elementen selecteren
const listSelectEl = document.getElementById('list-select');
const directionSelectEl = document.getElementById('direction-select');
const startButtonEl = document.getElementById('start-button');
const backButtonEl = document.getElementById('back-button');
const quizContainerEl = document.getElementById('quiz-container');
const questionContainerEl = document.getElementById('question-container');
const questionEl = document.querySelector('.question');
const optionsEl = document.querySelector('.options');
const feedbackEl = document.querySelector('.feedback');
const progressBarEl = document.querySelector('.progress-bar');
const setProgressBarEl = document.querySelector('.set-progress-bar');
const progressInfoEl = document.querySelector('.progress-info');
const setProgressInfoEl = document.querySelector('.set-progress-info');
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

// Update highscore display
highscoreSpaansNederlandsEl.textContent = `Highscore Spaans-Nederlands: ${highscoreSpaansNederlands}`;
highscoreNederlandsSpaansEl.textContent = `Highscore Nederlands-Spaans: ${highscoreNederlandsSpaans}`;

startButtonEl.addEventListener('click', () => {
  oefenrichting = directionSelectEl.value;
  const selectedList = listSelectEl.value;
  let fetchPromises;
  highscoreContainerEl.style.display = 'none';

  if (selectedList === 'all') {
    fetchPromises = lists[selectedList].map(url =>
      fetch(url)
        .then(response => response.json())
        .catch(error => {
          console.error(`Fout bij het laden van woordenlijst ${url}:`, error);
        })
    );
    Promise.all(fetchPromises)
      .then(dataArrays => {
        woordenlijst = [].concat(...dataArrays.map(data => data?.spaans ?? []));
        console.log(
          'Aantal woorden geladen in woordenlijst:',
          woordenlijst.length
        );

        if (woordenlijst.length === 0) {
          console.error('Geen woorden gevonden om te oefenen.');
          return;
        }
        console.log('Woordenlijst geladen:', woordenlijst);
        startQuiz();
      })
      .catch(error =>
        console.error('Fout bij het laden van woordenlijsten:', error)
      );
  } else {
    fetch(lists[selectedList])
      .then(response => response.json())
      .then(data => {
        woordenlijst = data.spaans ?? [];
        if (woordenlijst.length === 0) {
          console.error('Geen woorden gevonden om te oefenen.');
          return;
        }
        console.log('Woordenlijst geladen:', woordenlijst);
        startQuiz();
      })
      .catch(error =>
        console.error('Fout bij het laden van woordenlijst:', error)
      );
  }
});

backButtonEl.addEventListener('click', () => {
  quizContainerEl.style.display = 'none';
  backButtonEl.style.display = 'none';
  startButtonEl.style.display = 'block';
  listSelectEl.parentElement.style.display = 'flex';
  directionSelectEl.parentElement.style.display = 'flex';
  highscoreContainerEl.style.display = 'block';

  // Reset alle belangrijke variabelen naar hun beginwaarden
  currentIndex = 0;
  setIndex = 0;
  score = 0;
  foutenCount = 0;
  fouten = [];
  woordenlijst = [];
});

function startQuiz() {
  randomWords = woordenlijst.slice();
  if (woordenlijst.length === 0) {
    console.error('Woordenlijst is leeg, kan de quiz niet starten.');
    return;
  }
  currentIndex = 0;
  setIndex = 0;
  score = 0;
  foutenCount = 0;
  fouten = [];
  nieuweFouten = []; // Reset nieuwe fouten bij het starten van een nieuw spel
  motivationalMessageEl.textContent = '';
  questionContainerEl.style.display = 'block';
  quizContainerEl.style.display = 'block';
  startButtonEl.style.display = 'none';
  backButtonEl.style.display = 'flex';
  listSelectEl.parentElement.style.display = 'none';
  directionSelectEl.parentElement.style.display = 'none';
  resultEl.textContent = '';
  highscoreEl.textContent = `Highscore: ${
    oefenrichting === 'spaans-nederlands'
      ? highscoreSpaansNederlands
      : highscoreNederlandsSpaans
  }`;
  updateScoreDisplay();
  loadQuestionSet(); // Hier geen parameter nodig, de standaardwaarde is 0
}

// Load question set
function loadQuestionSet(newSetIndex = 0) {
  // Standaardwaarde van 0
  if (newSetIndex * setSize >= woordenlijst.length) {
    showResult();
    return;
  }

  setIndex = newSetIndex; // Update de setIndex met de nieuwe waarde
  motivationalMessageEl.textContent = `Laten we beginnen - Level ${
    setIndex + 1
  }`;
  const start = setIndex * setSize;
  const end = Math.min(start + setSize, woordenlijst.length);
  currentIndex = start;
  loadQuestion(start, end);
}

// Load question
function loadQuestion(start, end, callback) {
  console.log('Loading question:', { start, end, currentIndex });
  if (currentIndex >= end) {
    console.log('We hebben het einde van de set bereikt');
    if (callback) {
      console.log('Herhalingsronde afgerond. Callback uitvoeren...');
      // foutenlijst niet leegmaken hier, dit gebeurt pas na succesvolle herhaling
      if (fouten.length > 0) {
        console.log('Herhaalfouten gevonden, opnieuw herhalen.');
        startRepeatErrors(callback);
      } else {
        callback();
      }
    } else {
      console.log('Set resultaat tonen...');
      showSetResult();
    }
    return;
  }

  currentWord = woordenlijst[currentIndex];
  const vraag =
    oefenrichting === 'spaans-nederlands'
      ? currentWord.woord
      : currentWord.vertaling;
  const correctAntwoord =
    oefenrichting === 'spaans-nederlands'
      ? currentWord.vertaling
      : currentWord.woord;

  questionEl.innerHTML = `Wat is de vertaling van: <strong class='word' style='color: #F24464';>${vraag}</strong> ?`;

  const options = shuffleOptions(correctAntwoord, woordenlijst);
  optionsEl.innerHTML = '';
  options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = `answer${index + 1}`;
    button.innerHTML = `<i class="fa"></i> ${option}`;
    button.addEventListener('click', () =>
      checkAnswer(button, option, correctAntwoord, start, end, callback)
    );
    optionsEl.appendChild(button);
  });

  updateProgressBar(start, end);
  updateSetProgressBar();
  progressInfoEl.textContent = `Vraag ${currentIndex - start + 1} van ${
    end - start
  } binnen de huidige set`;
  setProgressInfoEl.textContent = `Progressie van sets: ${
    setIndex + 1
  } van ${Math.ceil(woordenlijst.length / setSize)}`;
}

// Check answer
function checkAnswer(
  button,
  selectedOption,
  correctAnswer,
  start,
  end,
  callback
) {
  try {
    console.log('Checking answer:', { selectedOption, correctAnswer });
    const isCorrect = selectedOption === correctAnswer;
    if (isCorrect) {
      button.classList.add('correct');
      button.querySelector('i').classList.add('fa-solid', 'fa-check');
      button.style.backgroundColor = '#61B68A';
      button.style.color = '#fff';
      score++;
    } else {
      button.classList.add('wrong');
      button.querySelector('i').classList.add('fa-solid', 'fa-xmark');
      button.style.backgroundColor = '#A63841';
      button.style.color = '#fff';
      foutenCount++;

      // Voeg de fout toe aan de juiste foutenlijst
      if (!fouten.some(word => word.woord === currentWord.woord)) {
        if (isRepeatRound) {
          nieuweFouten.push(currentWord); // Voeg toe aan nieuweFouten tijdens herhaalronde
          console.log('Nieuwe fout toegevoegd aan nieuweFouten:', currentWord);
        } else {
          fouten.push(currentWord); // Voeg toe aan fouten tijdens gewone ronde
          console.log('Fout toegevoegd aan foutenlijst:', currentWord);
        }
      }

      // Markeer ook het juiste antwoord
      optionsEl.querySelectorAll('button').forEach(optButton => {
        if (optButton.textContent.trim() === correctAnswer) {
          optButton.classList.add('correct-answer');
          optButton.querySelector('i').classList.add('fa-solid', 'fa-check');
          optButton.style.backgroundColor = '#fff';
          optButton.style.border = '2px solid #61B68A';
          optButton.style.color = '#61B68A';
        }
      });
    }
    currentIndex++;
    setTimeout(() => {
      feedbackEl.textContent = '';
      if (currentIndex >= end) {
        console.log('We hebben het einde van de set bereikt');
        if (callback) {
          // foutenlijst wordt niet geleegd totdat alle fouten succesvol zijn beantwoord
          callback();
        } else {
          showSetResult();
        }
      } else {
        loadQuestion(start, end, callback);
      }
    }, 1000);
    updateScoreDisplay();
  } catch (error) {
    console.error(
      'Er is een fout opgetreden bij het afhandelen van het antwoord:',
      error
    );
  }
}

// Show set result
function showSetResult() {
  questionContainerEl.style.display = 'none';
  let message = '';
  if (score < 5) {
    message = 'Nog niet helemaal onder de knie, maar je bent goed op weg!';
  } else if (score < 8) {
    message = 'Goed bezig, ga zo door!';
  } else {
    message = 'Wow, fantastisch gedaan!';
  }

  motivationalMessageEl.innerHTML = `${message} <br/>`;

  // Controleer of er fouten zijn en of we in een herhaalronde zitten
  if (fouten.length > 0 || nieuweFouten.length > 0) {
    console.log(
      'Foutenlijst bevat nog fouten of nieuwe fouten, start opnieuw:',
      fouten
    );
    fouten = nieuweFouten.length > 0 ? nieuweFouten.slice() : fouten; // Stel fouten in op nieuwe fouten indien beschikbaar
    nieuweFouten = []; // Leeg nieuweFouten
    motivationalMessageEl.innerHTML +=
      '<button id="repeat-errors" class="start-btn">Laten we de fouten nog eens herhalen.</button>';
    document.getElementById('repeat-errors').addEventListener('click', () => {
      startRepeatErrors(() => {
        if (fouten.length > 0) {
          console.log('Niet alle fouten zijn herhaald, opnieuw herhalen.');
          startRepeatErrors(() => {
            fouten = []; // Leeg de foutenlijst pas nadat alle fouten correct zijn beantwoord
            showSetResult(); // Na succesvolle herhaling, opnieuw showSetResult() aanroepen
            console.log(
              'Alle fouten herhaald, showSetResult opnieuw aangeroepen'
            );
          });
        } else {
          fouten = []; // Leeg de foutenlijst na succesvolle herhaling
          showSetResult();
        }
      });
    });
  } else {
    motivationalMessageEl.innerHTML +=
      '<button id="next-level" class="start-btn">Volgende Level</button>';
    document.getElementById('next-level').addEventListener('click', () => {
      loadQuestionSet(setIndex + 1); // Verhoog setIndex bij het aanroepen
    });
  }
}

function showResult() {
  try {
    resultEl.textContent = `Je hebt ${score} van de ${woordenlijst.length} goed!`;
    quizContainerEl.style.display = 'none';
    if (
      score >
      (oefenrichting === 'spaans-nederlands'
        ? highscoreSpaansNederlands
        : highscoreNederlandsSpaans)
    ) {
      if (oefenrichting === 'spaans-nederlands') {
        highscoreSpaansNederlands = score;
        localStorage.setItem('highscore-spaans-nederlands', score);
      } else {
        highscoreNederlandsSpaans = score;
        localStorage.setItem('highscore-nederlands-spaans', score);
      }
      highscoreEl.textContent = `Nieuwe highscore: ${score}`;
    }
  } catch (error) {
    console.error(
      'Er is een fout opgetreden bij het tonen van het resultaat:',
      error
    );
  }
}

// Start repeat errors
function startRepeatErrors(callback) {
  try {
    console.log('Starting repeat errors');
    isRepeatRound = true; // Stel in op true om aan te geven dat we een herhaalronde starten
    woordenlijst = fouten.slice();
    fouten = [];
    currentIndex = 0;
    score = 0;
    foutenCount = 0;
    motivationalMessageEl.textContent = '';
    questionContainerEl.style.display = 'block';
    console.log('Woordenlijst voor herhaling:', woordenlijst);
    loadQuestion(0, woordenlijst.length, callback);
  } catch (error) {
    console.error(
      'Er is een fout opgetreden bij het herhalen van fouten:',
      error
    );
  }
}

// Update score display
function updateScoreDisplay() {
  scoreEl.textContent = `Goed: ${score} | Fout: ${foutenCount}`;
}

function updateProgressBar(start, end) {
  const progress = ((currentIndex - start) / (end - start)) * 100;
  progressBarEl.style.width = `${progress}%`;
}

function updateSetProgressBar() {
  const setProgress =
    ((setIndex + 1) / Math.ceil(woordenlijst.length / setSize)) * 100;
  setProgressBarEl.style.width = `${setProgress}%`;
}

// Nieuwe shuffleOptions functie
function shuffleOptions(correctAnswer) {
  const allWords =
    oefenrichting === 'spaans-nederlands'
      ? randomWords.map(word => word.vertaling)
      : randomWords.map(word => word.woord);
  let options = [correctAnswer];

  while (options.length < 4) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    if (!options.includes(randomWord) && randomWord !== undefined) {
      options.push(randomWord);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}
