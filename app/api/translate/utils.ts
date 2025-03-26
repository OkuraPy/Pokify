// Função para detectar o idioma do texto (simplificada)
export function detectLanguage(text: string): string {
  // Detecção simples baseada em palavras comuns
  const commonWords = {
    pt: ['de', 'para', 'com', 'e', 'ou', 'em', 'um', 'uma', 'o', 'a', 'os', 'as', 'no', 'na', 'nos', 'nas'],
    en: ['the', 'of', 'and', 'to', 'in', 'a', 'is', 'that', 'for', 'it', 'with', 'as', 'was', 'on'],
    es: ['el', 'la', 'los', 'las', 'de', 'en', 'y', 'a', 'que', 'por', 'con', 'para', 'un', 'una'],
    fr: ['le', 'la', 'les', 'de', 'des', 'et', 'en', 'un', 'une', 'du', 'qui', 'que', 'dans', 'pour'],
    de: ['der', 'die', 'das', 'und', 'in', 'zu', 'den', 'mit', 'von', 'für', 'auf', 'ist', 'im', 'dem'],
    it: ['il', 'la', 'i', 'le', 'di', 'e', 'che', 'a', 'in', 'un', 'una', 'per', 'con', 'su'],
  };
  
  // Normalizar texto para detecção
  const normalizedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  const words = normalizedText.split(/\s+/);
  
  // Contar ocorrências de palavras comuns por idioma
  const scores: Record<string, number> = {};
  
  for (const [lang, commonWordsList] of Object.entries(commonWords)) {
    scores[lang] = 0;
    for (const word of words) {
      if (commonWordsList.includes(word)) {
        scores[lang]++;
      }
    }
    // Normalizar pela quantidade de palavras comuns do idioma
    scores[lang] = scores[lang] / commonWordsList.length;
  }
  
  // Encontrar idioma com maior pontuação
  let detectedLanguage = 'pt'; // Default para português
  let highestScore = 0;
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      detectedLanguage = lang;
    }
  }
  
  return detectedLanguage;
}

// Exportar também os idiomas suportados
export const supportedLanguages = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano'
}; 