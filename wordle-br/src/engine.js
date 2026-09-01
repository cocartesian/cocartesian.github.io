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
            answerArr[i] = null;
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
 * Valida regras do Hard Mode contra todas as dicas de palpites anteriores.
 */
export function validateHardMode(guess, previousGuesses, answer) {
    if (previousGuesses.length === 0) return { valid: true };

    for (const prevGuess of previousGuesses) {
        const feedback = evaluateGuess(prevGuess, answer);

        for (let i = 0; i < 5; i++) {
            // Regra 1: Letras verdes devem ser mantidas na mesma posição
            if (feedback[i] === 'green' && guess[i] !== prevGuess[i]) {
                return { 
                    valid: false, 
                    error: `A ${i + 1}ª letra deve ser ${prevGuess[i].toUpperCase()}` 
                };
            }

            // Regra 2: Letras amarelas devem continuar presentes
            if (feedback[i] === 'yellow' && !guess.includes(prevGuess[i])) {
                return { 
                    valid: false, 
                    error: `A palavra deve conter a letra ${prevGuess[i].toUpperCase()}` 
                };
            }

            // Regra 3: Letras cinzas (descartadas) não podem ser reutilizadas
            if (feedback[i] === 'gray') {
                const grayChar = prevGuess[i];
                const isPresentElsewhere = prevGuess.split('').some((char, idx) => 
                    char === grayChar && (feedback[idx] === 'green' || feedback[idx] === 'yellow')
                );

                if (!isPresentElsewhere && guess.includes(grayChar)) {
                    return { 
                        valid: false, 
                        error: `A letra ${grayChar.toUpperCase()} já foi descartada` 
                    };
                }
            }
        }
    }

    return { valid: true };
}
