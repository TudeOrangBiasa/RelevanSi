// Simple stopwords list (English) - moderate set
const englishStopwords = [
  'a','about','above','after','again','against','all','am','an','and','any','are','as','at',
  'be','because','been','before','being','below','between','both','but','by','can','cannot',
  'could','did','do','does','doing','down','during','each','few','for','from','further',
  'had','has','have','having','he','her','here','hers','him','his','how','i','if','in','into',
  'is','it','its','me','more','most','my','no','nor','not','of','off','on','once','only','or',
  'other','our','out','over','own','same','she','should','so','some','such','than','that','the',
  'their','them','then','there','these','they','this','those','through','to','too','under','until',
  'up','very','was','we','were','what','when','where','which','while','who','will','with','you'
]

// Simple stopwords list (Indonesian) - moderate set
const indonesianStopwords = [
  'yang','di','ke','dari','pada','untuk','dengan','adalah','ini','itu','dan','atau','juga',
  'sebagai','dalam','oleh','kami','kita','anda','dia','sebagai','ke','sebuah','seumur','selama',
  'sering','saat','tetapi','karena','oleh','adalah','apa','siapa','bagaimana','mengapa','atau'
]

// very small stemmer heuristics
function stemmerEn(word: string): string {
  return word.replace(/(ing|edly|edly|edly|edly|edly|ly|ed|ious|ies|ive|es|s)$/, '')
}
function stemmerId(word: string): string {
  return word.replace(/(kan|an|i|lah|kah|nya|ku|mu)$/, '')
}

export function preprocess(text: string, language: 'en' | 'id' = 'en'): string {
  if (!text) return ''
  // normalize
  let t = String(text).toLowerCase()
  // remove punctuation (preserve spaces)
  t = t.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  // collapse spaces
  t = t.replace(/\s+/g, ' ').trim()
  if (!t) return ''

  const tokens = t.split(' ').filter(Boolean)

  const stopwords = language === 'id' ? indonesianStopwords : englishStopwords
  const filtered = tokens.filter(tok => !stopwords.includes(tok))

  const stemmed = filtered.map(tok => language === 'id' ? stemmerId(tok) : stemmerEn(tok))

  return stemmed.join(' ')
}