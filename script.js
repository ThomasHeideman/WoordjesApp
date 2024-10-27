document.addEventListener('DOMContentLoaded', function () {
  const lists = {
    unidad_1: 'unidad_1.json',
    unidad_2: 'unidad_2.json',
    los_numeros: 'los_numeros_0_100.json',
    all: ['unidad_1.json', 'unidad_2.json', 'los_numeros_0_100.json'],
  };

  let woordenlijst = [];
  let currentIndex = 0;
  let score = 0;
  let setIndex = 0;
  let fouten = {};
  let oefenrichting = 'spaans-nederlands';
  let setSize = 10;

  // HTML-elementen selecteren
  const listSelectEl = document.getElementById('list-select');
  const directionSelectEl = document.getElementById('direction-select');
  const setSizeSelectEl = document.getElementById('set-size-select');
  const customSetSizeEl = document.getElementById('custom-set-size');
  const startButtonEl = document.getElementById('start-button');
  const backButtonEl = document.getElementById('back-button');
  const quizContainerEl = document.getElementById('quiz-container');
  const questionEl = document.querySelector('.question');
  const optionsEl = document.querySelector('.options');
  const feedbackEl = document.querySelector('.feedback');
  const progressBarEl = document.querySelector('.progress-bar');
  const progressInfoEl = document.querySelector('.progress-info');
  const resultEl = document.querySelector('.result');

  setSizeSelectEl.addEventListener('change', () => {
    if (setSizeSelectEl.value === 'custom') {
      customSetSizeEl.style.display = 'block';
    } else {
      customSetSizeEl.style.display = 'none';
    }
  });

  startButtonEl.addEventListener('click', () => {
    oefenrichting = directionSelectEl.value;
    setSize =
      setSizeSelectEl.value === 'custom'
        ? parseInt(customSetSizeEl.value)
        : setSizeSelectEl.value === 'all'
        ? null
        : parseInt(setSizeSelectEl.value);
    const selectedList = listSelectEl.value;
    let fetchPromises;
    if (selectedList === 'all') {
      fetchPromises = lists[selectedList].map(url =>
        fetch(url).then(response => response.json())
      );
      Promise.all(fetchPromises)
        .then(dataArrays => {
          woordenlijst = [].concat(...dataArrays.map(data => data.spaans));
          startQuiz();
        })
        .catch(error =>
          console.error('Fout bij het laden van woordenlijsten:', error)
        );
    } else {
      fetch(lists[selectedList])
        .then(response => response.json())
        .then(data => {
          woordenlijst = data.spaans;
          startQuiz();
        })
        .catch(error =>
          console.error('Fout bij het laden van woordenlijst:', error)
        );
    }
  });

  function startQuiz() {
    currentIndex = 0;
    setIndex = 0;
    score = 0;
    fouten = {};
    quizContainerEl.style.display = 'block';
    resultEl.textContent = '';
    loadQuestion(currentIndex, woordenlijst.length);
  }

  // Functie om een set van woorden te laden
  function loadQuestionSet() {
    if (setIndex * setSize >= woordenlijst.length) {
      showResult();
      return;
    }

    const start = setIndex * setSize;
    const end = setSize
      ? Math.min(start + setSize, woordenlijst.length)
      : woordenlijst.length;
    currentIndex = start;
    loadQuestion(start, end);
  }

  // Functie om een nieuwe vraag te laden
  function loadQuestion(start, end) {
    if (currentIndex >= end) {
      setIndex++;
      loadQuestionSet();
      return;
    }

    const currentWord = woordenlijst[currentIndex];
    const vraag =
      oefenrichting === 'spaans-nederlands'
        ? currentWord.woord
        : currentWord.vertaling;
    const correctAntwoord =
      oefenrichting === 'spaans-nederlands'
        ? currentWord.vertaling
        : currentWord.woord;

    // Vraag instellen
    questionEl.innerHTML = `Wat is de vertaling van: <strong class='word'>${vraag}?</strong>`;

    // Opties instellen (multiple choice)
    const options = shuffleOptions(correctAntwoord, woordenlijst);
    optionsEl.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option;
      button.addEventListener('click', () =>
        checkAnswer(button, option, correctAntwoord)
      );
      optionsEl.appendChild(button);
    });

    // Voortgang bijwerken
    updateProgressBar(start, end);
    progressInfoEl.textContent = `Set ${setIndex + 1} van ${Math.ceil(
      woordenlijst.length / setSize
    )} - Vraag ${currentIndex - start + 1} van ${end - start}`;
  }

  // Antwoord controleren
  function checkAnswer(button, selectedOption, correctAnswer) {
    if (selectedOption === correctAnswer) {
      button.style.backgroundColor = '#3cba75';
      button.style.color = '#ffffff';
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = 'fa fa-solid fa-check';
      }
    } else {
      button.style.backgroundColor = '#bb3c63';
      button.style.color = '#ffffff';
      const icon = button.querySelector('i');
      if (icon) {
        icon.className = 'fa fa-solid fa-xmark';
      }

      // Markeer ook het juiste antwoord
      optionsEl.querySelectorAll('button').forEach(optButton => {
        if (optButton.textContent.trim() === correctAnswer) {
          optButton.style.backgroundColor = '#ffffff';
          optButton.style.border = '2px solid #3cba75';
          optButton.style.color = '#3cba75';
          const icon = optButton.querySelector('i');
          if (icon) {
            icon.className = 'fa fa-solid fa-check';
          }
        }
      });
    }
    currentIndex++;
    setTimeout(() => {
      feedbackEl.textContent = '';
      loadQuestion(currentIndex, woordenlijst.length);
    }, 1000);
  }

  // Voortgangsbalk bijwerken
  function updateProgressBar(start, end) {
    const progress = ((currentIndex - start + 1) / (end - start)) * 100;
    progressBarEl.style.width = `${progress}%`;
  }

  // Resultaten tonen
  function showResult() {
    resultEl.textContent = `Je hebt ${score} van de ${woordenlijst.length} goed!`;
    quizContainerEl.style.display = 'none';
    if (Object.keys(fouten).length > 0) {
      resultEl.textContent += `\nEr zijn ${
        Object.keys(fouten).length
      } woorden fout beantwoord.`;
      const foutenButton = document.createElement('button');
      foutenButton.textContent = 'Oefen foute antwoorden';
      foutenButton.addEventListener('click', () => {
        woordenlijst = Object.keys(fouten).map(key => {
          return woordenlijst.find(
            word => word.woord === key || word.vertaling === key
          );
        });
        setIndex = 0;
        score = 0;
        quizContainerEl.style.display = 'block';
        resultEl.textContent = '';
        loadQuestionSet();
      });
      resultEl.appendChild(foutenButton);
    }
  }

  // Opties random schudden (inclusief juiste antwoord)
  function shuffleOptions(correctAnswer, words) {
    let options = [correctAnswer];
    while (options.length < 4) {
      const randomWord =
        oefenrichting === 'spaans-nederlands'
          ? words[Math.floor(Math.random() * words.length)].vertaling
          : words[Math.floor(Math.random() * words.length)].woord;
      if (!options.includes(randomWord)) {
        options.push(randomWord);
      }
    }
    return options.sort(() => Math.random() - 0.5);
  }
});
