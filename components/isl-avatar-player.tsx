'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Square, Loader2, Mic, MicOff } from 'lucide-react'
import Script from 'next/script'
import { DatasetViewer } from '@/components/dataset-viewer'
import { ISL_DATASET } from '@/isl-dataset'

// Build comprehensive word-to-sign mapping from real ISL datasets
const buildWordToSignMap = () => {
  const map: Record<string, string> = {}
  for (const entry of ISL_DATASET) {
    map[entry.word.toLowerCase()] = entry.sign
  }
  return map
}

const WORD_TO_SIGN_MAP = buildWordToSignMap()

declare global {
  interface Window {
    CWASA: any
    tuavatarLoaded: boolean
    playerAvailableToPlay: boolean
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

// Common word translations for Tamil and Hindi to English
const WORD_TRANSLATIONS: Record<string, string> = {
  // Tamil
  'வணக்கம்': 'hello',
  'நன்றி': 'thankyou',
  'வாருங்கள்': 'come',
  'போ': 'go',
  'ஆம்': 'yes',
  'இல்லை': 'no',
  'நல்ல': 'good',
  'கெட்ட': 'bad',
  'பெரிய': 'big',
  'சிறிய': 'small',
  
  // Hindi
  'नमस्ते': 'hello',
  'धन्यवाद': 'thankyou',
  'आओ': 'come',
  'जाओ': 'go',
  'हाँ': 'yes',
  'नहीं': 'no',
  'अच्छा': 'good',
  'बुरा': 'bad',
  'बड़ा': 'big',
  'छोटा': 'small',
}

// SiGML word list from the repository
const SIGML_WORDS = [
  "0", "1", "10", "100", "11", "12", "13", "2", "3", "4", "5", "6", "7", "8", "9",
  "a", "about", "above", "absorb", "accept", "access", "accident", "accuse", "across",
  "act", "acting", "active", "actor", "actress", "add", "advice", "advise", "aeroplane",
  "afraid", "africa", "after", "afternoon", "age", "agree", "alive", "all", "allah",
  "allow", "alone", "always", "ambulance", "america", "among", "angry", "announce",
  "answer", "any", "anything", "appear", "apple", "appointment", "april", "are", "area",
  "argue", "around", "arrange", "arrest", "arrive", "art", "asia", "askanything",
  "askquestion", "at", "attend", "available", "avoid", "awful", "b", "bad", "badminton",
  "bag", "ball", "bat", "bath", "beautiful", "become", "before", "begin", "behind",
  "bell", "below", "bench", "best", "better", "between", "big", "bird", "black",
  "blackboard", "blue", "boat", "body", "book", "borrow", "bowl", "boxing", "boy",
  "break", "bridge", "bring", "britain", "broom", "brown", "brush", "build", "building",
  "busy", "bye", "c", "call", "can", "cancel", "cannot", "car", "carry", "catch",
  "center", "certificate", "chair", "chalk", "check", "chemistry", "child", "children",
  "christian", "christmas", "church", "cinema", "circle", "circus", "clap", "class",
  "classroom", "climb", "close", "cloud", "clown", "collect", "college", "colour",
  "come", "communicate", "communication", "compare", "computer", "concentrate", "confuse",
  "congratulations", "contact", "continue", "control", "cook", "copy", "correct",
  "council", "count", "cover", "crash", "cricket", "cry", "cup", "cut", "cycle",
  "d", "dance", "date", "day", "deaf", "decrease", "delete", "desk", "detail",
  "develop", "different", "difficult", "discuss", "divide", "doctor", "down", "draw",
  "dream", "drinking", "e", "easy", "eat", "education", "eight", "eighteen", "eleven",
  "email", "empty", "encourage", "end", "engineer", "england", "english", "enjoy",
  "enter", "equal", "eraser", "escape", "evening", "every", "everyday", "exam",
  "examination", "examine", "example", "expensive", "experience", "f", "factory",
  "fail", "fall", "far", "farmer", "fat", "father", "fear", "february", "feed",
  "feel", "few", "fifteen", "fight", "fill", "finish", "five", "flood", "floor",
  "fly", "food", "forever", "forgive", "form", "four", "fourteen", "france", "friday",
  "fruit", "g", "germany", "get", "girl", "give-me", "go", "gold", "good", "greece",
  "green", "grey", "h", "half-past", "hang", "hardofhearing", "havealook", "he",
  "health", "hearing", "hello", "help-me", "help-you", "her", "here", "hers", "hill",
  "him", "himself", "hindi", "hindu", "his", "hockey", "hold", "home", "hospital",
  "hot", "hour", "house", "how", "howareyou", "howmany", "howmuch", "hundred", "hungry",
  "i", "idea", "ignore", "important", "impossible", "improve", "in", "increase",
  "informus", "injection", "intelligent", "interesting", "internet", "interpreter",
  "iunderstand", "j", "january", "jealous", "jesus", "join", "jump", "june", "k",
  "keep", "key", "keyboard", "kite", "know", "knowledge", "l", "laboratory", "ladder",
  "languages", "late", "later", "laugh", "learn", "leave", "lecturer", "lend", "less",
  "letter", "level", "library", "light", "like", "line", "list", "little", "lock",
  "long", "lose", "loss", "loud", "love", "m", "man", "mango", "many", "march",
  "married", "may", "maybe", "me", "meet", "mind", "mistake", "monday", "money",
  "more", "morning", "mother", "my", "n", "name", "namewhat", "national", "near",
  "need", "needle", "never", "new", "news", "next", "nextyear", "nice", "night",
  "nine", "nineteen", "no", "none", "not", "now", "number", "nurse", "o", "offer",
  "office", "officer", "often", "old", "olympics", "on", "one", "onion", "open",
  "operation", "or", "orange", "order", "our", "ourself", "out", "over", "own",
  "p", "pay", "pen", "person", "phone", "pick", "pink", "plan", "please", "possible",
  "practice", "prayer", "pretend", "print", "problem", "profit", "provide", "purple",
  "q", "question", "quick", "quiet", "quote", "r", "rain", "reach", "read", "ready",
  "receive", "reception", "rectangle", "red", "regular", "relate", "relation", "remind",
  "remove", "repeat", "research", "responsibility", "responsible", "result", "roof",
  "run", "s", "sad", "same", "save", "say", "science", "scotland", "screen", "search",
  "see", "send", "seven", "seventeen", "shake", "short", "sign", "silver", "six",
  "sixteen", "slow", "small", "soft", "sorry", "spelling", "stay", "stop", "stubborn",
  "stupid", "sunday", "switzerland", "t", "table", "tablet", "take", "talk", "tall",
  "taste", "taxi", "teach", "teacher", "teachme", "teachyou", "tear", "tease",
  "technical", "teeth", "temple", "ten", "tennis", "thankyou", "that", "their",
  "them", "themselves", "then", "there", "these", "they", "think", "thirsty", "thirteen",
  "this", "those", "thread", "three", "throw", "thumb", "thursday", "ticket", "tie",
  "tight", "time", "today", "together", "tomato", "tomorrow", "tools", "touch", "toward",
  "town", "track", "train", "transport", "travel", "tree", "trophy", "truck", "truth",
  "try", "tuesday", "turn", "tv", "twelve", "twenty", "two", "u", "ugly", "umbrella",
  "under", "understand", "uniform", "university", "until", "up", "us", "v", "van",
  "vegetable", "vegetables", "very", "video", "visit", "volleyball", "w", "wait",
  "walk", "want", "was", "wash", "waste", "water", "we", "weapon", "wear", "weather",
  "wednesday", "week", "weigh", "weight", "welcome", "well", "west", "what", "wheat",
  "when", "where", "which", "white", "who", "why", "wide", "will", "win", "wire",
  "wish", "with", "without", "woman", "word", "work", "worry", "worse", "worst",
  "write", "wrong", "x", "y", "yeah", "yellow", "yes", "yesterday", "you", "your",
  "yours", "yourself", "yourselves", "z", "zebra-crossing", "zero", "zoo"
]

interface ISLAvatarPlayerProps {
  className?: string
}

export function ISLAvatarPlayer({ className }: ISLAvatarPlayerProps) {
  const [inputText, setInputText] = useState('')
  const [islText, setIslText] = useState<string[]>([]) // Internal sign names to play
  const [displayText, setDisplayText] = useState<string[]>([]) // User's words in SOV format (shown to user)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [playerAvailableToPlay, setPlayerAvailableToPlay] = useState(true)
  const [signInfo, setSignInfo] = useState({ sign: '0', frame: '0', gloss: '[none]' })
  const [statusMessage, setStatusMessage] = useState('Loading')
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'hi-IN' | 'ta-IN'>('en-US')
  const [isListening, setIsListening] = useState(false)
  const [recognitionSupported, setRecognitionSupported] = useState(true)
  const [activeTab, setActiveTab] = useState<'main' | 'dataset'>('main')
  
  const avatarContainerRef = useRef<HTMLDivElement>(null)
  const cwaRef = useRef<any>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentIndexRef = useRef(-1)
  const recognitionRef = useRef<any>(null)

  // Initialize CWASA when scripts are loaded
  useEffect(() => {
    let checkInterval: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout
    
    const initializeCWASA = () => {
      console.log('[ISL] Starting CWASA initialization check...')
      let attempts = 0
      const maxAttempts = 300 // 30 seconds max
      
      const initializeCWASANow = () => {
        // Initialize CWASA configuration (uses default ./jas/loc2021)
        const initCfg = {
          avsbsl: ["luna", "siggi", "anna", "marc", "francoise"],
          avSettings: { avList: "avsbsl", initAv: "marc" }
        }
        
        try {
          console.log('[ISL] Calling CWASA.init with config:', initCfg)
          window.tuavatarLoaded = false
          window.playerAvailableToPlay = true
          window.CWASA.init(initCfg)
          cwaRef.current = window.CWASA
          console.log('[ISL] CWASA.init() completed')
          
          // Expose playSign function globally for dataset viewer
          window.playSign = async (signFile: string) => {
            if (cwaRef.current) {
              try {
                console.log('[ISL] Global playSign called for:', signFile)
                setStatusMessage('Playing')
                await cwaRef.current.playSiGMLURL(signFile)
              } catch (error) {
                console.error('[ISL] Error in global playSign:', error)
              }
            } else {
              console.warn('[ISL] CWASA not initialized yet')
            }
          }
          console.log('[ISL] Exposed window.playSign function')
          
          // Check what CWASA created in the avatar container
          setTimeout(() => {
            const container = document.querySelector('.CWASAAvatar.av0')
            console.log('[ISL] Avatar container after init:', container)
            console.log('[ISL] Container children:', container?.children)
            console.log('[ISL] Container innerHTML length:', container?.innerHTML.length)
            
            // Look for avatar elements
            const checkAvatarRendering = setInterval(() => {
              const canvas = container?.querySelector('canvas')
              const iframe = container?.querySelector('iframe')
              const hasContent = (container?.innerHTML.length || 0) > 100
              
              console.log('[ISL] Checking avatar - canvas:', !!canvas, 'iframe:', !!iframe, 'hasContent:', hasContent)
              
              if (canvas || iframe || hasContent) {
                clearInterval(checkAvatarRendering)
                window.tuavatarLoaded = true
                setAvatarLoaded(true)
                setIsLoading(false)
                setStatusMessage('Ready')
                console.log('[ISL] ✓ Avatar rendered successfully! Type:', canvas ? 'canvas' : iframe ? 'iframe' : 'other')
                
                // Ensure avatar container is visible (no function calls)
                if (container && container instanceof HTMLElement) {
                  container.style.visibility = 'visible'
                  container.style.opacity = '1'
                  console.log('[ISL] ✓ Avatar container is now visible')
                }
              }
            }, 200)
            
            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkAvatarRendering)
              if (!avatarLoaded) {
                // Even if no canvas/iframe, set as loaded if container has content
                const container = document.querySelector('.CWASAAvatar.av0')
                const hasContent = (container?.innerHTML.length || 0) > 100
                
                setAvatarLoaded(hasContent)
                setIsLoading(false)
                setStatusMessage(hasContent ? 'Ready' : 'Render timeout')
                console.log('[ISL] Avatar check timeout. HasContent:', hasContent)
              }
            }, 5000)
          }, 1000)
        } catch (error) {
          console.error('[ISL] CWASA initialization error:', error)
          setIsLoading(false)
          setAvatarLoaded(false)
          setStatusMessage('Error loading avatar')
        }
      }
      
      checkInterval = setInterval(() => {
        attempts++
        
        // Check for both CWASA and the avatar container
        const avatarContainer = document.querySelector('.CWASAAvatar.av0')
        
        if (typeof window !== 'undefined' && window.CWASA && avatarContainer) {
          console.log('[ISL] CWASA object and container found, initializing...')
          clearInterval(checkInterval)
          clearTimeout(timeoutId)
          
          console.log('[ISL] Avatar container found:', avatarContainer)
          initializeCWASANow()
        } else if (attempts >= maxAttempts) {
          console.error('[ISL] Timeout waiting for CWASA and container. CWASA:', !!window.CWASA, 'Container:', !!avatarContainer)
          clearInterval(checkInterval)
          setIsLoading(false)
          setAvatarLoaded(false)
          setStatusMessage('Timeout - Setup failed')
        } else if (attempts % 10 === 0) {
          // Log every second
          console.log('[ISL] Waiting... CWASA:', !!window.CWASA, 'Container:', !!avatarContainer, 'Attempt:', attempts)
        }
      }, 100)
      
      // Set overall timeout
      timeoutId = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
        }
        if (isLoading) {
          console.error('[ISL] Overall timeout - CWASA failed to load')
          setIsLoading(false)
          setAvatarLoaded(false)
          setStatusMessage('Failed to load')
        }
      }, 30000) // 30 second overall timeout for large library
    }

    // Start checking immediately - script will load in background
    const initTimeout = setTimeout(initializeCWASA, 100)

    return () => {
      clearTimeout(initTimeout)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.warn('[ISL] Speech Recognition not supported in this browser')
        setRecognitionSupported(false)
        return
      }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.lang = selectedLanguage

      recognition.onstart = () => {
        console.log('[ISL] Voice recognition started for language:', selectedLanguage)
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        const confidence = event.results[0][0].confidence
        console.log('[ISL] Voice input:', transcript, 'Confidence:', confidence, 'Language:', selectedLanguage)
        setInputText(transcript)
        setIsListening(false)
      }

      recognition.onerror = (event: any) => {
        console.error('[ISL] Voice recognition error:', event.error)
        if (event.error === 'no-speech') {
          console.log('[ISL] No speech detected, please try again')
        } else if (event.error === 'language-not-supported') {
          console.error('[ISL] Language not supported:', selectedLanguage)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        console.log('[ISL] Voice recognition ended')
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [selectedLanguage])

  // Update recognition language when selected language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage
      console.log('[ISL] Recognition language updated to:', selectedLanguage)
      
      // Log available languages for debugging
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices()
        const langVoices = voices.filter(v => v.lang.startsWith(selectedLanguage.split('-')[0]))
        console.log('[ISL] Available voices for', selectedLanguage, ':', langVoices.length)
      }
    }
  }, [selectedLanguage])

  // Convert text to ISL format with SOV (Subject-Object-Verb) grammar
  // Returns: { display: user's words in SOV, signs: internal sign names to play }
  const convertToISL = (text: string): { display: string[], signs: string[] } => {
    const words = text.trim().split(/\s+/)
    const signs: string[] = []
    const translatedWords: string[] = []

    // First pass: translate words for display (keep original words mostly intact)
    for (const word of words) {
      const lowerWord = word.toLowerCase()
      
      // Check if we have a direct translation for Tamil/Hindi words
      if (WORD_TRANSLATIONS[word]) {
        translatedWords.push(WORD_TRANSLATIONS[word])
      } else {
        // Keep the original word for display
        translatedWords.push(lowerWord)
      }
    }

    // Apply SOV grammar conversion for display
    const displayWords = convertToSOV(translatedWords)
    
    // Second pass: convert to SiGML signs for avatar playback (internal only)
    for (const word of displayWords) {
      if (SIGML_WORDS.includes(word)) {
        // Use the exact sign from dictionary
        signs.push(word)
      } else {
        // For unknown words, use a mapped action from dataset or fallback
        const fallbackSign = getFallbackSign(word)
        console.log('[ISL] Unknown word "' + word + '" -> using fallback:', fallbackSign)
        signs.push(fallbackSign)
      }
    }

    console.log('[ISL] Input:', text)
    console.log('[ISL] Display (SOV):', displayWords)
    console.log('[ISL] Internal signs:', signs)
    
    return {
      display: displayWords.length > 0 ? displayWords : ['hello'],
      signs: signs.length > 0 ? signs : ['hello']
    }
  }

  // Get fallback sign for unknown words - uses real ISL dataset (CISLR, INCLUDE, ISLTranslate)
  // Maps 1,722+ action words to CHARACTER ACTIONS
  const getFallbackSign = (word: string): string => {
    const lowerWord = word.toLowerCase()
    
    // First try: Direct lookup in comprehensive ISL dataset
    if (WORD_TO_SIGN_MAP[lowerWord]) {
      console.log('[ISL Dataset] Found mapping:', lowerWord, '→', WORD_TO_SIGN_MAP[lowerWord])
      return WORD_TO_SIGN_MAP[lowerWord]
    }
    
    // Second try: Word variations (remove suffixes)
    const variations = [
      lowerWord.replace(/ing$/, ''),     // running → run
      lowerWord.replace(/ed$/, ''),      // walked → walk
      lowerWord.replace(/s$/, ''),       // walks → walk
      lowerWord.replace(/es$/, ''),      // watches → watch
      lowerWord.replace(/ies$/, 'y'),    // tries → try
    ]
    
    for (const variant of variations) {
      if (WORD_TO_SIGN_MAP[variant]) {
        console.log('[ISL Dataset] Found variant mapping:', lowerWord, '→', variant, '→', WORD_TO_SIGN_MAP[variant])
        return WORD_TO_SIGN_MAP[variant]
      }
    }
    
    // Third try: Check if word contains known words
    for (const sign of SIGML_WORDS) {
      if (sign.length > 3 && lowerWord.includes(sign)) {
        console.log('[ISL] Word contains known sign:', lowerWord, '→', sign)
        return sign
      }
    }
    
    // Final fallback: Category-based intelligent mapping
    console.log('[ISL] Using intelligent fallback for:', lowerWord)
    
    // Action suffixes → generic action
    if (lowerWord.endsWith('ing')) return 'do'
    if (lowerWord.endsWith('ed')) return 'do'
    
    // People-related suffixes
    if (lowerWord.endsWith('er') || lowerWord.endsWith('or')) return 'person'
    
    // Abstract nouns
    if (lowerWord.endsWith('tion') || lowerWord.endsWith('sion')) return 'do'
    if (lowerWord.endsWith('ness') || lowerWord.endsWith('ity')) return 'good'
    if (lowerWord.endsWith('ment')) return 'work'
    
    // Adverbs
    if (lowerWord.endsWith('ly')) return 'good'
    
    // Alphabet-based fallback for completely unknown words
    const fallbackSigns = ['hello', 'thankyou', 'good', 'yes', 'help', 'please', 'welcome', 'ok']
    const index = lowerWord.charCodeAt(0) % fallbackSigns.length
    return fallbackSigns[index]
  }

  // Convert SVO (Subject-Verb-Object) to SOV (Subject-Object-Verb)
  const convertToSOV = (words: string[]): string[] => {
    if (words.length < 2) return words

    // Expanded verb list to catch more patterns
    const verbs = ['eat', 'drink', 'go', 'come', 'take', 'give', 'help', 'teach', 
                   'learn', 'read', 'write', 'play', 'work', 'see', 'hear', 'say',
                   'want', 'need', 'like', 'love', 'have', 'get', 'make', 'do',
                   'sleep', 'wake', 'run', 'walk', 'sit', 'stand', 'think', 'know',
                   'tell', 'ask', 'call', 'use', 'find', 'leave', 'feel', 'try',
                   'start', 'stop', 'open', 'close', 'watch', 'listen', 'speak',
                   'buy', 'sell', 'pay', 'meet', 'wait', 'talk', 'understand', 'thank']
    
    const auxiliaries = ['am', 'is', 'are', 'was', 'were', 'will', 'shall', 'would',
                        'can', 'could', 'should', 'may', 'might', 'must', 'do', 'does', 'did',
                        'has', 'have', 'had', 'been', 'being']
    
    const questionWords = ['how', 'what', 'when', 'where', 'why', 'who', 'which', 'whose']
    
    const contractions: {[key: string]: string[]} = {
      "i'm": ['i', 'am'],
      "i'll": ['i', 'will'],
      "i'd": ['i', 'would'],
      "you're": ['you', 'are'],
      "you'll": ['you', 'will'],
      "he's": ['he', 'is'],
      "she's": ['she', 'is'],
      "it's": ['it', 'is'],
      "we're": ['we', 'are'],
      "they're": ['they', 'are'],
      "isn't": ['is', 'not'],
      "aren't": ['are', 'not'],
      "wasn't": ['was', 'not'],
      "weren't": ['were', 'not'],
      "don't": ['do', 'not'],
      "doesn't": ['does', 'not'],
      "didn't": ['did', 'not'],
      "won't": ['will', 'not'],
      "wouldn't": ['would', 'not'],
      "can't": ['can', 'not'],
      "couldn't": ['could', 'not'],
      "shouldn't": ['should', 'not'],
      "gonna": ['going', 'to'],
      "wanna": ['want', 'to'],
      "gotta": ['got', 'to']
    }
    
    // Expand contractions first
    let expandedWords: string[] = []
    for (const word of words) {
      const lowerWord = word.toLowerCase()
      if (contractions[lowerWord]) {
        expandedWords.push(...contractions[lowerWord])
      } else {
        expandedWords.push(lowerWord)
      }
    }
    
    console.log('[ISL] After expansion:', expandedWords)
    
    // Step 1: Remove all auxiliaries and identify key components
    let subject: string[] = []
    let verb: string | null = null
    let objects: string[] = []
    let questionWord: string | null = null
    
    // Check for question word at start
    if (questionWords.includes(expandedWords[0])) {
      questionWord = expandedWords[0]
      expandedWords = expandedWords.slice(1) // Remove question word temporarily
    }
    
    // Find the first auxiliary or verb
    let mainVerbIdx = -1
    let auxIdx = -1
    
    for (let i = 0; i < expandedWords.length; i++) {
      const word = expandedWords[i]
      
      if (auxiliaries.includes(word) && auxIdx === -1) {
        auxIdx = i
      } else if ((verbs.includes(word) || word.endsWith('ing') || word.endsWith('ed')) && mainVerbIdx === -1) {
        mainVerbIdx = i
        verb = word
      }
    }
    
    // Extract subject, verb, and objects based on structure
    if (auxIdx !== -1) {
      // Has auxiliary: "I am sleeping", "You are eating food"
      subject = expandedWords.slice(0, auxIdx)
      
      // Find verb after auxiliary
      if (mainVerbIdx > auxIdx) {
        verb = expandedWords[mainVerbIdx]
        objects = expandedWords.slice(mainVerbIdx + 1)
      } else {
        // No verb after auxiliary, check if auxiliary itself can be verb-like
        if (auxIdx < expandedWords.length - 1) {
          const nextWord = expandedWords[auxIdx + 1]
          if (nextWord.endsWith('ing') || nextWord.endsWith('ed') || verbs.includes(nextWord)) {
            verb = nextWord
            objects = expandedWords.slice(auxIdx + 2)
          } else {
            // No clear verb, treat rest as objects
            objects = expandedWords.slice(auxIdx + 1)
          }
        }
      }
    } else if (mainVerbIdx !== -1) {
      // No auxiliary but has verb: "I eat food"
      subject = expandedWords.slice(0, mainVerbIdx)
      verb = expandedWords[mainVerbIdx]
      objects = expandedWords.slice(mainVerbIdx + 1)
    } else {
      // No clear verb structure, keep as is
      console.log('[ISL] No verb found, keeping original order:', expandedWords)
      return questionWord ? [...expandedWords, questionWord] : expandedWords
    }
    
    // Build SOV order: Subject + Objects + Verb
    let result: string[] = []
    
    if (subject.length > 0) {
      result.push(...subject)
    }
    
    if (objects.length > 0) {
      result.push(...objects)
    }
    
    if (verb) {
      result.push(verb)
    }
    
    // Add question word at end if present
    if (questionWord) {
      result.push(questionWord)
    }
    
    console.log('[ISL] SOV Conversion:')
    console.log('[ISL]   Input:', words)
    console.log('[ISL]   Expanded:', expandedWords)
    console.log('[ISL]   Subject:', subject)
    console.log('[ISL]   Objects:', objects)
    console.log('[ISL]   Verb:', verb)
    console.log('[ISL]   Question:', questionWord)
    console.log('[ISL]   Result (SOV):', result)
    
    return result.length > 0 ? result : expandedWords
  }

  // Set SiGML URL
  const setSiGMLURL = (sigmlURL: string) => {
    const urlInput = document.getElementById("URLText") as HTMLInputElement
    if (urlInput) {
      urlInput.value = sigmlURL
    }
    return sigmlURL
  }

  // Play SiGML animation
  const playSiGMLAnimation = async (word: string) => {
    if (!cwaRef.current) return

    try {
      const sigmlURL = `/SignFiles/${word.toLowerCase()}.sigml`
      setSiGMLURL(sigmlURL)
      console.log('[ISL] Playing SiGML:', sigmlURL)
      
      // Use CWASA to play the SiGML animation
      setStatusMessage('Playing')
      await cwaRef.current.playSiGMLURL(sigmlURL)
      
      setSignInfo({
        sign: (currentIndexRef.current + 1).toString(),
        frame: '0',
        gloss: word
      })
    } catch (error) {
      console.log('[ISL] Error playing SiGML:', error)
      setStatusMessage('Error')
    }
  }

  // Monitor status for animation completion
  useEffect(() => {
    const statusCheckInterval = setInterval(() => {
      const statusInput = document.querySelector('.statusExtra') as HTMLInputElement
      if (statusInput && statusInput.value) {
        const statusText = statusInput.value.toLowerCase()
        
        if (statusText.indexOf('invalid') !== -1) {
          setPlayerAvailableToPlay(true)
          setStatusMessage('Error')
        } else if (statusText.indexOf('ready') !== -1 || statusText.indexOf('frame') === -1) {
          if (isPlaying && !playerAvailableToPlay) {
            setPlayerAvailableToPlay(true)
          }
        }
      }
    }, 100)

    return () => clearInterval(statusCheckInterval)
  }, [isPlaying, playerAvailableToPlay])

  // Play each word sequentially
  const playEachWord = () => {
    if (islText.length === 0) return

    setIsPlaying(true)
    setPlayerAvailableToPlay(false)
    currentIndexRef.current = 0
    setCurrentWordIndex(0)

    playIntervalRef.current = setInterval(() => {
      const currentIdx = currentIndexRef.current
      const totalWords = islText.length

      if (currentIdx >= totalWords) {
        // Playback complete
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current)
          playIntervalRef.current = null
        }
        setIsPlaying(false)
        setPlayerAvailableToPlay(true)
        setCurrentWordIndex(-1)
        currentIndexRef.current = -1
        setStatusMessage('Ready')
        console.log('[ISL] Playback complete')
      } else if (playerAvailableToPlay) {
        // Play next word
        setPlayerAvailableToPlay(false)
        const word = islText[currentIdx]
        setCurrentWordIndex(currentIdx)
        
        playSiGMLAnimation(word).then(() => {
          console.log('[ISL] Currently playing:', word)
        })
        
        currentIndexRef.current++
      } else {
        // Check for errors
        const statusInput = document.querySelector('.statusExtra') as HTMLInputElement
        if (statusInput) {
          const statusText = statusInput.value.toLowerCase()
          if (statusText.indexOf('invalid') !== -1) {
            console.log('[ISL] Error: Invalid SiGML file')
            setPlayerAvailableToPlay(true)
            setStatusMessage('Error - Invalid SiGML file')
          }
        }
      }
    }, 1000)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isPlaying) return

    const converted = convertToISL(inputText)
    setDisplayText(converted.display) // Show user's words in SOV
    setIslText(converted.signs) // Use for avatar playback
    
    // Auto-start playback after conversion
    setTimeout(() => {
      if (converted.signs.length > 0) {
        playEachWord()
      }
    }, 100)
  }

  const handlePlay = () => {
    if (islText.length > 0 && !isPlaying) {
      playEachWord()
    }
  }

  // Start voice recognition
  const startVoiceRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('[ISL] Error starting recognition:', error)
      }
    }
  }

  // Stop voice recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleStop = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    
    setCurrentWordIndex(-1)
    setIsPlaying(false)
    setPlayerAvailableToPlay(true)
    currentIndexRef.current = -1
    setStatusMessage('Ready')
    
    if (cwaRef.current) {
      try {
        cwaRef.current.stopAvatar()
      } catch (error) {
        console.log('[ISL] Error stopping avatar:', error)
      }
    }
  }

  return (
    <>
      {/* Load CWASA library scripts - ALWAYS LOAD */}
      <Script 
        src="/js/allcsa.js" 
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[ISL] CWASA script loaded successfully (5.5MB)')
        }}
        onError={(e) => {
          console.error('[ISL] Failed to load CWASA script:', e)
          setIsLoading(false)
          setStatusMessage('Script load failed')
        }}
      />
      <link rel="stylesheet" href="/css/cwasa.css" />

      {/* Avatar Container - ALWAYS IN DOM (shown on both tabs) */}
      <div className={`max-w-4xl mx-auto mb-6 ${activeTab === 'dataset' ? 'fixed bottom-6 right-6 z-50 shadow-2xl' : ''}`} 
           style={activeTab === 'dataset' ? { width: '400px' } : {}}>
        <Card className="p-6">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg p-6 min-h-[350px] relative">
            {/* CWASA Avatar Container - Must always be in DOM */}
            <div 
              ref={avatarContainerRef}
              className="CWASAAvatar av0"
              style={{ 
                width: '100%', 
                height: activeTab === 'dataset' ? '280px' : '450px',
                minHeight: activeTab === 'dataset' ? '280px' : '450px'
              }}
            />
            
            {/* Loading State Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-semibold">Loading avatar...</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto mb-4 flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'main'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          suppressHydrationWarning
        >
          ISL Translator
        </button>
        <button
          onClick={() => setActiveTab('dataset')}
          className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'dataset'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          suppressHydrationWarning
        >
          Real ISL Dataset (1,722 Actions)
        </button>
      </div>

      {/* Avatar Container - ALWAYS RENDERED (hidden when on dataset tab) */}
      <div style={{ display: activeTab === 'main' ? 'block' : 'none' }}>
        {/* Main Translator Tab */}
        <>          
          <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
        
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">
            Text to Indian Sign Language
          </h1>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="CWASAAvMenu av0" />
            <Button
              onClick={handlePlay}
              disabled={islText.length === 0 || isPlaying || currentWordIndex >= 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Sign
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isPlaying && currentWordIndex === -1}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <span className="CWASASpeed av0" />
          </div>

          {/* Sign Information */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-muted-foreground">Sign/Frame:</span>
              <Input 
                className="txtSF av0 mt-1" 
                value={`${signInfo.sign}/${signInfo.frame}`}
                readOnly
                suppressHydrationWarning
              />
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Input 
                className="statusExtra av0 mt-1" 
                value={statusMessage}
                readOnly
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Language Selection */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-2">
                Select Language:
              </label>
              <Select 
                value={selectedLanguage} 
                onValueChange={(value: any) => setSelectedLanguage(value)}
                disabled={isPlaying || isListening}
              >
                <SelectTrigger className="w-full" suppressHydrationWarning>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="en-US" className="cursor-pointer">English</SelectItem>
                  <SelectItem value="hi-IN" className="cursor-pointer">Hindi (हिन्दी)</SelectItem>
                  <SelectItem value="ta-IN" className="cursor-pointer">Tamil (தமிழ்)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text/Voice Input */}
            <div>
              <label htmlFor="text" className="block text-sm font-medium mb-2">
                Input Text or Use Voice:
              </label>
              <div className="flex gap-2">
                <Input
                  id="text"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Enter text in ${selectedLanguage === 'en-US' ? 'English' : selectedLanguage === 'hi-IN' ? 'Hindi' : 'Tamil'}...`}
                  className="flex-1"
                  autoComplete="off"
                  suppressHydrationWarning
                  disabled={isPlaying || isListening}
                />
                {recognitionSupported && (
                  <Button
                    type="button"
                    onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                    disabled={isPlaying}
                    variant={isListening ? "destructive" : "secondary"}
                    className="gap-2"
                    suppressHydrationWarning
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Voice
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" disabled={!inputText.trim() || !avatarLoaded || isPlaying || isListening} suppressHydrationWarning>
                  Submit
                </Button>
              </div>
              {isListening && (
                <p className="text-sm text-blue-600 mt-2 animate-pulse">
                  🎤 Listening... Speak now in {selectedLanguage === 'en-US' ? 'English' : selectedLanguage === 'hi-IN' ? 'Hindi' : 'Tamil'}
                </p>
              )}
              {!recognitionSupported && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Voice input not supported in this browser. Please use Chrome, Edge, or Safari.
                </p>
              )}
            </div>
          </form>

          {/* Current Word Display */}
          {currentWordIndex >= 0 && displayText.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 mb-1">Current Word:</p>
              <p className="text-2xl font-bold text-yellow-900">
                {displayText[currentWordIndex]}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Word {currentWordIndex + 1} of {displayText.length}
              </p>
            </div>
          )}

          {/* ISL Text Output */}
          {displayText.length > 0 && (
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium">ISL Text:</label>
              <div className="flex flex-wrap gap-2 bg-muted p-4 rounded-lg">
                {displayText.map((word, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      index < currentWordIndex
                        ? 'bg-green-500 text-white'
                        : index === currentWordIndex
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 View all {SIGML_WORDS.length}+ available signs in the "Complete Dataset" tab above!
              </p>
            </div>
          )}

          {/* Hidden CWASA URL input */}
          <input type="text" id="URLText" className="txtSiGMLURL av0 hidden" suppressHydrationWarning />
        </Card>
      </div>
        </>
      </div>

      {/* Dataset Tab - ALWAYS RENDERED (hidden when on main tab) */}
      <div style={{ display: activeTab === 'dataset' ? 'block' : 'none' }} className="max-w-4xl mx-auto">
        <DatasetViewer />
      </div>
    </>
  )
}
