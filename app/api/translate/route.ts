import { NextRequest, NextResponse } from 'next/server';

// Supported languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
];

// Tipo para cache de traduções
interface TranslationCacheItem {
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  timestamp: number;
}

// Cache simples para traduções recentes (limite de 100 itens)
const translationCache: TranslationCacheItem[] = [];
const MAX_CACHE_SIZE = 100;

// Função para buscar tradução no cache
function getCachedTranslation(text: string, targetLanguage: string): string | null {
  const cacheItem = translationCache.find(
    item => item.sourceText === text && item.targetLanguage === targetLanguage
  );
  
  if (cacheItem) {
    console.log('Cache hit for translation:', { 
      textLength: text.length,
      targetLanguage,
      age: Math.round((Date.now() - cacheItem.timestamp) / 1000) + 's'
    });
    return cacheItem.translatedText;
  }
  
  return null;
}

// Função para adicionar tradução ao cache
function cacheTranslation(sourceText: string, targetLanguage: string, translatedText: string): void {
  // Remover item mais antigo se o cache estiver cheio
  if (translationCache.length >= MAX_CACHE_SIZE) {
    translationCache.shift();
  }
  
  // Adicionar nova tradução ao cache
  translationCache.push({
    sourceText,
    targetLanguage,
    translatedText,
    timestamp: Date.now()
  });
  
  console.log('Added translation to cache, current size:', translationCache.length);
}

// Função para detectar o idioma do texto (simplificada)
function detectLanguage(text: string): string {
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
  
  console.log('Language detection scores:', scores);
  console.log('Detected language:', detectedLanguage);
  
  return detectedLanguage;
}

// Simple translation function that simulates AI translation
function translateText(text: string, targetLanguage: string, sourceLanguage: string = 'pt'): string {
  console.log('Translation request:', { 
    textLength: text?.length,
    textPreview: text?.substring(0, 50) + '...',
    sourceLanguage,
    targetLanguage,
    lineBreakCount: (text.match(/\n/g) || []).length
  });
  
  // Verificar cache primeiro
  const cachedTranslation = getCachedTranslation(text, targetLanguage);
  if (cachedTranslation) {
    return cachedTranslation;
  }
  
  // Get language name from code
  const languageName = languages.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
  console.log('Target language name:', languageName);
  
  // Handle multiline text by splitting, translating each line, and rejoining
  if (text.includes('\n')) {
    console.log('Text contains line breaks, processing line by line');
    const lines = text.split('\n');
    console.log(`Processing ${lines.length} lines`);
    
    const translatedLines = lines.map((line, index) => {
      // Skip empty lines or lines with just whitespace
      if (!line.trim()) {
        console.log(`Line ${index + 1} is empty, preserving`);
        return line;
      }
      console.log(`Translating line ${index + 1} (${line.length} chars): ${line.substring(0, 30)}...`);
      return translateTextLine(line, targetLanguage, sourceLanguage);
    });
    
    console.log(`Translated ${lines.length} lines, rejoining with line breaks`);
    const result = translatedLines.join('\n');
    
    // Adicionar ao cache
    cacheTranslation(text, targetLanguage, result);
    
    return result;
  }
  
  // For single-line text, translate directly
  const result = translateTextLine(text, targetLanguage, sourceLanguage);
  
  // Adicionar ao cache
  cacheTranslation(text, targetLanguage, result);
  
  return result;
}

// Helper function to translate a single line of text
function translateTextLine(text: string, targetLanguage: string, sourceLanguage: string = 'pt'): string {
  console.log('Translation request:', { text, targetLanguage, sourceLanguage });
  
  // Get language name from code
  const languageName = languages.find(lang => lang.code === targetLanguage)?.name || targetLanguage;
  
  // Simple translations for common product-related terms
  const translations: Record<string, Record<string, string>> = {
    'en': {
      'Produto': 'Product',
      'Descrição': 'Description',
      'Preço': 'Price',
      'Avaliações': 'Reviews',
      'Estoque': 'Stock',
      'Vendas': 'Sales',
      'Visualizações': 'Views',
      'Importado': 'Imported',
      'Ativo': 'Active',
      'Arquivado': 'Archived',
      'Compre': 'Buy',
      'Leve': 'Get',
      'Guia de Tamanho': 'Size Guide',
      'Tecido': 'Fabric',
      'com': 'with',
      'compressão': 'compression',
      'Body': 'Body',
      'Bodys': 'Bodies',
      'Bodies': 'Bodies',
      'Shaper': 'Shaper',
      'Canelado': 'Ribbed',
      'Ribbed': 'Ribbed',
      'Tamanho': 'Size',
      'Pequeno': 'Small',
      'Médio': 'Medium',
      'Grande': 'Large',
      'Cor': 'Color',
      'Preto': 'Black',
      'Branco': 'White',
      'Vermelho': 'Red',
      'Azul': 'Blue',
      'Verde': 'Green',
      'Amarelo': 'Yellow',
      'Rosa': 'Pink',
      'Laranja': 'Orange',
      'Roxo': 'Purple',
      'Cinza': 'Gray',
      'Marrom': 'Brown',
      'Bege': 'Beige',
      'média': 'medium',
    },
    'es': {
      'Produto': 'Producto',
      'Descrição': 'Descripción',
      'Preço': 'Precio',
      'Avaliações': 'Reseñas',
      'Estoque': 'Inventario',
      'Vendas': 'Ventas',
      'Visualizações': 'Visualizaciones',
      'Importado': 'Importado',
      'Ativo': 'Activo',
      'Arquivado': 'Archivado',
      'Compre': 'Compre',
      'Leve': 'Lleve',
      'Guia de Tamanho': 'Guía de Tallas',
      'Tecido': 'Tejido',
      'com': 'con',
      'compressão': 'compresión',
      'Body': 'Body',
      'Bodys': 'Bodies',
      'Bodies': 'Bodies',
      'Shaper': 'Moldeador',
      'Canelado': 'Acanalado',
      'Ribbed': 'Acanalado',
      'Tamanho': 'Talla',
      'Pequeno': 'Pequeño',
      'Médio': 'Mediano',
      'Grande': 'Grande',
      'Cor': 'Color',
      'Preto': 'Negro',
      'Branco': 'Blanco',
      'Vermelho': 'Rojo',
      'Azul': 'Azul',
      'Verde': 'Verde',
      'Amarelo': 'Amarillo',
      'Rosa': 'Rosa',
      'Laranja': 'Naranja',
      'Roxo': 'Morado',
      'Cinza': 'Gris',
      'Marrom': 'Marrón',
      'Bege': 'Beige',
    },
    'fr': {
      'Produto': 'Produit',
      'Descrição': 'Description',
      'Preço': 'Prix',
      'Avaliações': 'Avis',
      'Estoque': 'Stock',
      'Vendas': 'Ventes',
      'Visualizações': 'Vues',
      'Importado': 'Importé',
      'Ativo': 'Actif',
      'Arquivado': 'Archivé',
      'Compre': 'Achetez',
      'Leve': 'Obtenez',
      'Guia de Tamanho': 'Guide des Tailles',
      'Tecido': 'Tissu',
      'com': 'avec',
      'compressão': 'compression',
      'Body': 'Body',
      'Bodys': 'Bodies',
      'Bodies': 'Bodies',
      'Shaper': 'Gainant',
      'Canelado': 'Côtelé',
      'Ribbed': 'Côtelé',
      'Tamanho': 'Taille',
      'Pequeno': 'Petit',
      'Médio': 'Moyen',
      'Grande': 'Grand',
      'Cor': 'Couleur',
      'Preto': 'Noir',
      'Branco': 'Blanc',
      'Vermelho': 'Rouge',
      'Azul': 'Bleu',
      'Verde': 'Vert',
      'Amarelo': 'Jaune',
      'Rosa': 'Rose',
      'Laranja': 'Orange',
      'Roxo': 'Violet',
      'Cinza': 'Gris',
      'Marrom': 'Marron',
      'Bege': 'Beige',
      'média': 'moyenne',
      'Size Guide': 'Guide des Tailles',
      'Fabric': 'Tissu',
      'with': 'avec',
      'compression': 'compression',
      'medium': 'moyenne',
      'Buy': 'Achetez',
      'Get': 'Obtenez',
      // Additional Portuguese terms
      'ajudando': 'aidant',
      'a': 'à',
      'modelar': 'modeler',
      'região': 'région',
      'abdominal': 'abdominale',
      'das': 'du',
      'costas': 'dos',
      'Design': 'Design',
      'anatômico': 'anatomique',
      'e': 'et',
      'alças': 'bretelles',
      'ajustáveis': 'ajustables',
      'proporcionando': 'offrant',
      'conforto': 'confort',
      'um': 'un',
      'ajuste': 'ajustement',
      'perfeito': 'parfait',
      'ao': 'au',
      'corpo': 'corps',
      'Sem': 'Sans',
      'costuras': 'coutures',
      'aparentes': 'apparentes',
      'ideal': 'idéal',
      'para': 'pour',
      'uso': 'utilisation',
      'sob': 'sous',
      'qualquer': 'tout',
      'roupa': 'vêtement',
      'sem': 'sans',
      'marcar': 'marquer',
      'Versátil': 'Polyvalent',
      'pode': 'peut',
      'ser': 'être',
      'usado': 'utilisé',
      'como': 'comme',
      'peça': 'pièce',
      'única': 'unique',
      'ou': 'ou',
    },
    'de': {
      'Produto': 'Produkt',
      'Descrição': 'Beschreibung',
      'Preço': 'Preis',
      'Avaliações': 'Bewertungen',
      'Estoque': 'Lagerbestand',
      'Vendas': 'Verkäufe',
      'Visualizações': 'Ansichten',
      'Importado': 'Importiert',
      'Ativo': 'Aktiv',
      'Arquivado': 'Archiviert',
      'Compre': 'Kaufen',
      'Leve': 'Erhalten',
      'Guia de Tamanho': 'Größentabelle',
      'Tecido': 'Stoff',
      'com': 'mit',
      'compressão': 'Kompression',
      'Body': 'Body',
      'Bodys': 'Bodys',
      'Bodies': 'Bodys',
      'Shaper': 'Former',
      'Canelado': 'Gerippt',
      'Ribbed': 'Gerippt',
      'Tamanho': 'Größe',
      'Pequeno': 'Klein',
      'Médio': 'Mittel',
      'Grande': 'Groß',
      'Cor': 'Farbe',
      'Preto': 'Schwarz',
      'Branco': 'Weiß',
      'Vermelho': 'Rot',
      'Azul': 'Blau',
      'Verde': 'Grün',
      'Amarelo': 'Gelb',
      'Rosa': 'Rosa',
      'Laranja': 'Orange',
      'Roxo': 'Lila',
      'Cinza': 'Grau',
      'Marrom': 'Braun',
      'Bege': 'Beige',
    },
    'it': {
      'Produto': 'Prodotto',
      'Descrição': 'Descrizione',
      'Preço': 'Prezzo',
      'Avaliações': 'Recensioni',
      'Estoque': 'Inventario',
      'Vendas': 'Vendite',
      'Visualizações': 'Visualizzazioni',
      'Importado': 'Importato',
      'Ativo': 'Attivo',
      'Arquivado': 'Archiviato',
      'Compre': 'Compra',
      'Leve': 'Ottieni',
      'Guia de Tamanho': 'Guida alle Taglie',
      'Tecido': 'Tessuto',
      'com': 'con',
      'compressão': 'compressione',
      'Body': 'Body',
      'Bodys': 'Body',
      'Bodies': 'Body',
      'Shaper': 'Modellante',
      'Canelado': 'Costolato',
      'Ribbed': 'Costolato',
      'Tamanho': 'Taglia',
      'Pequeno': 'Piccolo',
      'Médio': 'Medio',
      'Grande': 'Grande',
      'Cor': 'Colore',
      'Preto': 'Nero',
      'Branco': 'Bianco',
      'Vermelho': 'Rosso',
      'Azul': 'Blu',
      'Verde': 'Verde',
      'Amarelo': 'Giallo',
      'Rosa': 'Rosa',
      'Laranja': 'Arancione',
      'Roxo': 'Viola',
      'Cinza': 'Grigio',
      'Marrom': 'Marrone',
      'Bege': 'Beige',
    },
  };

  // If we have translations for this language
  if (translations[targetLanguage]) {
    console.log(`Found translation dictionary for ${targetLanguage}`);
    let translatedText = text;
    let replacements: Record<string, string> = {};
    
    // Detect if text is already partially translated (e.g., from English to French)
    const isPartiallyTranslated = sourceLanguage !== targetLanguage && 
      sourceLanguage !== 'pt' &&
      Object.keys(translations[sourceLanguage]).some(key => 
        translations[sourceLanguage][key] !== key && 
        text.includes(translations[sourceLanguage][key])
      );
    
    if (isPartiallyTranslated) {
      console.log(`Text appears to be partially translated from ${sourceLanguage}`);
      
      // First, add SourceLang->Target mappings to handle already translated text
      if (targetLanguage !== sourceLanguage) {
        const sourceDict = translations[sourceLanguage];
        const targetDict = translations[targetLanguage];
        
        // For each source translation, create a mapping to target language
        for (const [original, sourceTrans] of Object.entries(sourceDict)) {
          // If we have a translation for this term in target language
          if (targetDict[original]) {
            // Map the source translation to target language translation
            targetDict[sourceTrans] = targetDict[original];
          }
        }
      }
    }
    
    // Sort dictionary entries by length (longest first) to avoid partial word replacements
    const sortedEntries = Object.entries(translations[targetLanguage])
      .sort((a, b) => b[0].length - a[0].length);
    
    // Replace known words with their translations
    for (const [original, translated] of sortedEntries) {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      translatedText = translatedText.replace(regex, match => {
        const replacement = match === match.toUpperCase() ? translated.toUpperCase() : 
                           match[0] === match[0].toUpperCase() ? translated.charAt(0).toUpperCase() + translated.slice(1) : 
                           translated;
        replacements[match] = replacement;
        return replacement;
      });
    }
    
    // Special case for numbers and product-specific terms that might not have word boundaries
    translatedText = translatedText
      .replace(/Compre (\d+) Leve (\d+)/gi, (match, p1, p2) => {
        if (targetLanguage === 'en') return `Buy ${p1} Get ${p2}`;
        if (targetLanguage === 'es') return `Compre ${p1} Lleve ${p2}`;
        if (targetLanguage === 'fr') return `Achetez ${p1} Obtenez ${p2}`;
        if (targetLanguage === 'de') return `Kaufen ${p1} Erhalten ${p2}`;
        if (targetLanguage === 'it') return `Compra ${p1} Ottieni ${p2}`;
        return match;
      })
      .replace(/Buy (\d+) Get (\d+)/gi, (match, p1, p2) => {
        if (targetLanguage === 'en') return match;
        if (targetLanguage === 'es') return `Compre ${p1} Lleve ${p2}`;
        if (targetLanguage === 'fr') return `Achetez ${p1} Obtenez ${p2}`;
        if (targetLanguage === 'de') return `Kaufen ${p1} Erhalten ${p2}`;
        if (targetLanguage === 'it') return `Compra ${p1} Ottieni ${p2}`;
        return match;
      });
    
    console.log('Replacements made:', replacements);
    console.log('Original text:', text);
    console.log('Translated text:', translatedText);
    
    return translatedText;
  }
  
  // For languages we don't have translations for, add a prefix
  console.log(`No translation dictionary found for ${targetLanguage}, using placeholder`);
  return `[Translated to ${languageName}] ${text}`;
}

// Endpoint para tradução única
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage, sourceLanguage } = body;

    console.log('Translation API request received:', { 
      text: text?.substring(0, 50) + '...',
      targetLanguage,
      sourceLanguage,
      availableLanguages: languages.map(l => l.code)
    });

    if (!text || !targetLanguage) {
      console.error('Missing required parameters');
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // Check if the target language is supported
    const isLanguageSupported = languages.some(lang => lang.code === targetLanguage);
    console.log(`Language ${targetLanguage} supported: ${isLanguageSupported}`);
    
    if (!isLanguageSupported) {
      console.warn(`Unsupported language code: ${targetLanguage}, falling back to English`);
      // Fall back to English if language is not supported
      const translatedText = translateText(text, 'en', sourceLanguage || detectLanguage(text));
      return NextResponse.json({
        translatedText,
        detectedLanguage: sourceLanguage || 'pt',
        fallbackLanguage: 'en'
      });
    }

    // Detectar idioma de origem se não fornecido
    const detectedSourceLanguage = sourceLanguage || detectLanguage(text);
    
    // Perform the translation
    const translatedText = translateText(text, targetLanguage, detectedSourceLanguage);
    console.log('Translation completed:', { 
      originalLength: text.length, 
      translatedLength: translatedText.length,
      targetLanguage,
      sourceLanguage: detectedSourceLanguage
    });

    return NextResponse.json({
      translatedText,
      detectedLanguage: detectedSourceLanguage
    });
  } catch (error) {
    console.error('Error translating text:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}

// Endpoint para tradução em lote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguages, sourceLanguage } = body;

    console.log('Batch translation API request received:', { 
      text: text?.substring(0, 50) + '...',
      targetLanguages,
      sourceLanguage,
      languageCount: targetLanguages?.length
    });

    if (!text || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
      console.error('Missing required parameters for batch translation');
      return NextResponse.json(
        { error: 'Text and targetLanguages array are required' },
        { status: 400 }
      );
    }

    // Detectar idioma de origem se não fornecido
    const detectedSourceLanguage = sourceLanguage || detectLanguage(text);
    
    // Filtrar idiomas suportados
    const supportedLanguages = targetLanguages.filter(lang => 
      languages.some(l => l.code === lang)
    );
    
    if (supportedLanguages.length === 0) {
      console.warn('No supported languages in request, falling back to English');
      supportedLanguages.push('en');
    }
    
    // Realizar traduções em lote
    const translations: Record<string, string> = {};
    
    for (const lang of supportedLanguages) {
      translations[lang] = translateText(text, lang, detectedSourceLanguage);
    }
    
    console.log('Batch translation completed for', Object.keys(translations).length, 'languages');

    return NextResponse.json({
      translations,
      detectedLanguage: detectedSourceLanguage
    });
  } catch (error) {
    console.error('Error in batch translation:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch translation' },
      { status: 500 }
    );
  }
}
