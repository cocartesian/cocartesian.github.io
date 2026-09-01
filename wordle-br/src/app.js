import { evaluateGuess, validateHardMode } from './engine.js';

// === CONFIGURAÇÕES & DICIONÁRIO ===
const DICTIONARY = window.WORD_DATA || { validGuesses: [], answerWords: [] };
if (DICTIONARY.answerWords.length === 0) {
    alert("Erro: Dicionário não carregado. Você rodou o script Python?");
}

const MODES_CONFIG = {
    infinito: { boards: 1, guesses: 6 },
    hard: { boards: 1, guesses: 6, hardMode: true },
    speed: { boards: 1, guesses: 6, isSpeed: true },
    maratona: { boards: 1, guesses: 6, isMarathon: true },
    dordle: { boards: 2, guesses: 6 },
    quordle: { boards: 4, guesses: 9 }
};

// === ESTADO DO JOGO ===
let currentMode = 'infinito';
let state = {
    answers: [],
    guesses: [],
    currentGuess: "",
    boardStatuses: [],
    gameOver: false,
};

// === GERENCIAMENTO DA BAG (50% Regra) ===
function getNextWord() {
    let bag = JSON.parse(localStorage.getItem('wordBag') || '[]');
    const maxBagSize = Math.floor(DICTIONARY.answerWords.length * 0.5);
    
    let candidate;
    do {
        const randomIndex = Math.floor(Math.random() * DICTIONARY.answerWords.length);
        candidate = DICTIONARY.answerWords[randomIndex];
    } while (bag.includes(candidate) && bag.length < DICTIONARY.answerWords.length);

    bag.push(candidate);
    if (bag.length > maxBagSize) bag.shift();

    localStorage.setItem('wordBag', JSON.stringify(bag));
    return candidate;
}

function initGame() {
    const config = MODES_CONFIG[currentMode];
    state = {
        answers: Array(config.boards).fill(0).map(() => getNextWord()),
        guesses: [],
        currentGuess: "",
        boardStatuses: Array(config.boards).fill('playing'),
        gameOver: false,
    };
    renderBoards();
    updateKeyboardColors();
}

// === INTERFACE ===
function renderBoards() {
    const wrapper = document.getElementById('boards-wrapper');
    wrapper.innerHTML = '';
    const config = MODES_CONFIG[currentMode];
    
    for (let b = 0; b < config.boards; b++) {
        const boardDiv = document.createElement('div');
        boardDiv.className = `board ${currentMode === 'quordle' ? 'board-quordle' : ''}`;
        boardDiv.style.gridTemplateRows = `repeat(${config.guesses}, 1fr)`;
        
        for (let r = 0; r < config.guesses; r++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            
            const isCurrentRow = r === state.guesses.length && state.boardStatuses[b] === 'playing';
            const wordToDraw = r < state.guesses.length ? state.guesses[r] : (isCurrentRow ? state.currentGuess : "");
            let feedback = null;
            
            if (r < state.guesses.length && state.guesses[r]) {
                feedback = evaluateGuess(state.guesses[r], state.answers[b]);
            }

            for (let c = 0; c < 5; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.textContent = wordToDraw[c] || "";
                if (feedback && state.boardStatuses[b] !== 'lost_early') {
                    const wonAt = state.guesses.findIndex(g => g === state.answers[b]);
                    if (wonAt === -1 || r <= wonAt) {
                         tile.classList.add(feedback[c]);
                    }
                }
                rowDiv.appendChild(tile);
            }
            boardDiv.appendChild(rowDiv);
        }
        wrapper.appendChild(boardDiv);
    }
}

function showMessage(msg) {
    const container = document.getElementById('message-container');
    const div = document.createElement('div');
    div.className = 'message';
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}

// === LÓGICA DE AUTO-SUBMIT E TECLADO ===
function attemptSubmit() {
    if (state.currentGuess.length !== 5) return;

    if (!DICTIONARY.validGuesses.includes(state.currentGuess)) {
        showMessage("Palavra não reconhecida");
        return;
    }
    
    if (MODES_CONFIG[currentMode].hardMode) {
        const validation = validateHardMode(state.currentGuess, state.guesses, state.answers[0]);
        if (!validation.valid) {
            showMessage(validation.error);
            return;
        }
    }
    
    commitGuess();
}

function handleInput(key) {
    if (state.gameOver) return;

    if (key === 'Backspace' || key === 'Del') {
        state.currentGuess = state.currentGuess.slice(0, -1);
        renderBoards();
    } else if (/^[a-zA-Z]$/.test(key) && state.currentGuess.length < 5) {
        state.currentGuess += key.toLowerCase();
        renderBoards();
        
        if (state.currentGuess.length === 5) {
            setTimeout(attemptSubmit, 50); 
        }
    }
}

function commitGuess() {
    state.guesses.push(state.currentGuess);
    const guess = state.currentGuess;
    state.currentGuess = "";

    state.answers.forEach((ans, idx) => {
        if (state.boardStatuses[idx] === 'won') return;

        if (guess === ans) {
            state.boardStatuses[idx] = 'won';
        } else if (state.guesses.length >= MODES_CONFIG[currentMode].guesses) {
            state.boardStatuses[idx] = 'lost';
        }
    });

    renderBoards();
    updateKeyboardColors();

    const allWon = state.boardStatuses.every(s => s === 'won');
    const anyLost = state.boardStatuses.some(s => s === 'lost');

    if (allWon) {
        state.gameOver = true;
        showMessage("Impressionante!");
        saveStats(true);
        setTimeout(initGame, 2500);
    } else if (anyLost) {
        state.gameOver = true;
        showMessage(state.answers.map(a => a.toUpperCase()).join(" / "));
        saveStats(false);
        setTimeout(initGame, 3000);
    }
}

const keysLayout = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m','Del']
];

function buildKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    keysLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'key-row';
        row.forEach(key => {
            const btn = document.createElement('button');
            btn.className = `key ${key.length > 1 ? 'large' : ''}`;
            btn.textContent = key;
            btn.dataset.key = key.toLowerCase();
            btn.onclick = () => handleInput(key === 'Del' ? 'Backspace' : key);
            rowDiv.appendChild(btn);
        });
        kb.appendChild(rowDiv);
    });
}

function updateKeyboardColors() {
    const keyColors = {};
    state.guesses.forEach(guess => {
        state.answers.forEach((ans, b) => {
            if(state.boardStatuses[b] === 'won' && guess !== ans) return; 
            const feedback = evaluateGuess(guess, ans);
            for (let i = 0; i < 5; i++) {
                const letter = guess[i];
                const color = feedback[i];
                if (color === 'green' || (color === 'yellow' && keyColors[letter] !== 'green')) {
                    keyColors[letter] = color;
                } else if (color === 'gray' && !keyColors[letter]) {
                    keyColors[letter] = 'gray';
                }
            }
        });
    });

    document.querySelectorAll('.key').forEach(btn => {
        const k = btn.dataset.key;
        btn.classList.remove('green', 'yellow', 'gray');
        if (keyColors[k]) btn.classList.add(keyColors[k]);
    });
}

// === ESTATISTICAS E HISTÓRICO ===
function saveStats(won) {
    const runResult = {
        date: new Date().toISOString(),
        answers: state.answers,
        guesses: state.guesses.length,
        won: won
    };

    let stats = JSON.parse(localStorage.getItem(`stats_${currentMode}`) || '{"played":0, "won":0, "streak":0}');
    stats.played++;
    if (won) {
        stats.won++;
        stats.streak++;
    } else {
        stats.streak = 0;
    }
    localStorage.setItem(`stats_${currentMode}`, JSON.stringify(stats));

    let history = JSON.parse(localStorage.getItem(`history_${currentMode}`) || '[]');
    history.unshift(runResult);
    if (history.length > 50) history.pop();
    localStorage.setItem(`history_${currentMode}`, JSON.stringify(history));
}

// === PWA INSTALLATION ===
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('btn-install').style.display = 'block';
    document.getElementById('install-msg').style.display = 'none';
});

document.getElementById('btn-install').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('btn-install').style.display = 'none';
            document.getElementById('install-msg').style.display = 'block';
        }
        deferredPrompt = null;
    }
});

// === EVENTOS ===
const modalOverlay = document.getElementById('modal-overlay');
document.addEventListener('keydown', e => {
    if (!document.getElementById('modal-overlay').classList.contains('hidden')) return;
    handleInput(e.key);
});

document.getElementById('mode-selector').addEventListener('change', e => {
    currentMode = e.target.value;
    initGame();
});

document.getElementById('btn-settings').addEventListener('click', () => {
    modalOverlay.classList.remove('hidden');
    document.getElementById('settings-modal').classList.remove('hidden');
});

document.getElementById('btn-stats').addEventListener('click', () => {
    document.getElementById('stats-title').textContent = `Estatísticas - ${currentMode.toUpperCase()}`;
    
    const stats = JSON.parse(localStorage.getItem(`stats_${currentMode}`) || '{"played":0, "won":0, "streak":0}');
    const history = JSON.parse(localStorage.getItem(`history_${currentMode}`) || '[]');

    document.getElementById('stats-summary').innerHTML = `
        <div style="display: flex; justify-content: space-around; text-align: center; margin-bottom: 10px;">
            <div><div style="font-size:1.5rem; font-weight:bold;">${stats.played}</div><div style="font-size:0.8rem;">Jogos</div></div>
            <div><div style="font-size:1.5rem; font-weight:bold;">${stats.won}</div><div style="font-size:0.8rem;">Vitórias</div></div>
            <div><div style="font-size:1.5rem; font-weight:bold;">${stats.streak}</div><div style="font-size:0.8rem;">Streak</div></div>
        </div>
    `;

    const historyList = document.getElementById('stats-history');
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p style="text-align:center; color: #818384; margin-top: 10px;">Nenhum jogo registrado ainda.</p>';
    } else {
        history.forEach(run => {
            const item = document.createElement('div');
            item.className = `history-item ${run.won ? 'won' : 'lost'}`;
            
            const dateObj = new Date(run.date);
            const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
            const words = run.answers.map(w => w.toUpperCase()).join(' / ');
            const guessCount = run.won ? `${run.guesses} tent.` : 'X';
            
            item.innerHTML = `
                <div>
                    <div class="history-words">${words}</div>
                    <div class="history-date">${dateStr}</div>
                </div>
                <div class="history-score">${guessCount}</div>
            `;
            historyList.appendChild(item);
        });
    }

    modalOverlay.classList.remove('hidden');
    document.getElementById('stats-modal').classList.remove('hidden');
});

document.querySelectorAll('.close-modal, #modal-overlay').forEach(btn => {
    btn.addEventListener('click', () => {
        modalOverlay.classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
});

buildKeyboard();
initGame();
