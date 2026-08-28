import sys
import unicodedata
import re
import json
import urllib.request

# Fonte recomendada
DEFAULT_URL = "https://raw.githubusercontent.com/fserb/pt-br/refs/heads/master/lexico"

def normalize_word(word):
    """Remove acentos e converte para minúsculas."""
    word = str(word).strip().lower()
    nfkd_form = unicodedata.normalize('NFKD', word)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def process_content(text_content):
    """Filtra e normaliza o conteúdo em texto."""
    words = set()
    for line in text_content.splitlines():
        w = normalize_word(line)
        if len(w) == 5 and re.match(r'^[a-z]{5}$', w):
            words.add(w)
    return list(words)

def main():
    print(f"Baixando wordlist de: {DEFAULT_URL}...")
    
    try:
        # Baixa direto para a memória
        with urllib.request.urlopen(DEFAULT_URL) as response:
            content = response.read().decode('utf-8')
    except Exception as e:
        print(f"Erro ao baixar a wordlist: {e}")
        sys.exit(1)

    print("Processando e normalizando palavras...")
    valid_guesses = process_content(content)
    
    # Como não temos um arquivo separado de respostas neste pipeline, 
    # usamos todas como respostas (ou você pode injetar sua lógica aqui)
    answer_words = valid_guesses.copy()

    valid_guesses.sort()
    answer_words.sort()

    output_path = 'data/words.js'
    js_content = f"""// ARQUIVO GERADO AUTOMATICAMENTE. NÃO EDITE.
window.WORD_DATA = {{
    validGuesses: {json.dumps(valid_guesses)},
    answerWords: {json.dumps(answer_words)}
}};
"""
    
    # Salva direto na pasta do PWA
    import os
    os.makedirs('data', exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print("=== Relatório de Build ===")
    print(f"Palavras válidas (Guesses): {len(valid_guesses)}")
    print(f"Palavras respostas (Answers): {len(answer_words)}")
    print(f"Arquivo gerado com sucesso em: {output_path}")

if __name__ == "__main__":
    main()
