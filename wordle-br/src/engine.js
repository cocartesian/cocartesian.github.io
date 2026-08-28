/**
 * Retorna array de cores ['green', 'yellow', 'gray'] baseado no palpite.
 */
export function evaluateGuess(guess, answer) {
    const result = Array(5).fill('gray');
    const answerArr = answer.split('');
    const guessArr = guess.split('');

    // Passagem 1: Letras Corretas (Verdes)
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] === answerArr[i]) {
            result[i] = 'green';
            answerArr[i] = null; // Marca como usada
            guessArr[i] = null;
        }
    }

    // Passagem 2: Posições Erradas (Amarelas)
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] !== null) {
            const index = answerArr.indexOf(guessArr[i]);
            if (index !== -1) {
                result[i] = 'yellow';
                answerArr[index] = null;
            }
        }
    }
    return result;
}

/**
 * Valida regras do Hard Mode contra as dicas anteriores.
 */
export function validateHardMode(guess, previousGuesses, answer) {
    if (previousGuesses.length === 0) return { valid: true };
    
    const lastGuess = previousGuesses[previousGuesses.length - 1];
    const lastFeedback = evaluateGuess(lastGuess, answer);
    
    for (let i = 0; i < 5; i++) {
        if (lastFeedback[i] === 'green' && guess[i] !== lastGuess[i]) {
            return { valid: false, error: `A ${i + 1}ª letra deve ser ${lastGuess[i].toUpperCase()}` };
        }
    }

    for (let i = 0; i < 5; i++) {
        if (lastFeedback[i] === 'yellow') {
            if (!guess.includes(lastGuess[i])) {
                return { valid: false, error: `A palavra deve conter a letra ${lastGuess[i].toUpperCase()}` };
            }
        }
    }
    
    return { valid: true };
}
