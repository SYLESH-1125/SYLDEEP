'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Square, Loader2 } from 'lucide-react'

interface AnimationState {
  isPlaying: boolean
  currentWord: string
  currentSignIndex: number
  currentFrameIndex: number
  status: string
  speed: number
}

export function ISLAnimationPlayer() {
  const [inputText, setInputText] = useState('')
  const [islText, setIslText] = useState<string[]>([])
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentWord: '',
    currentSignIndex: 0,
    currentFrameIndex: 0,
    status: 'Ready',
    speed: 1.0,
  })
  const [availableWords] = useState([
    'hello', 'thank', 'you', 'please', 'sorry', 'yes', 'no', 
    'good', 'bad', 'morning', 'evening', 'night', 'day',
    'help', 'water', 'food', 'name', 'where', 'when', 'what',
    'how', 'who', 'mother', 'father', 'brother', 'sister',
    'friend', 'love', 'like', 'want', 'need', 'come', 'go'
  ])
  
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Simulate the avatar animation
  const animateAvatar = (words: string[]) => {
    if (words.length === 0) return

    setAnimationState(prev => ({
      ...prev,
      isPlaying: true,
      currentSignIndex: 0,
      status: 'Playing',
    }))

    let currentIndex = 0
    
    const playNextWord = () => {
      if (currentIndex < words.length) {
        const word = words[currentIndex]
        
        setAnimationState(prev => ({
          ...prev,
          currentWord: word,
          currentSignIndex: currentIndex + 1,
          currentFrameIndex: Math.floor(Math.random() * 50) + 1, // Simulate frame progression
        }))

        // Simulate animation duration based on word length
        const duration = word.length === 1 ? 1500 : 2000 / animationState.speed
        
        animationTimeoutRef.current = setTimeout(() => {
          currentIndex++
          playNextWord()
        }, duration)
      } else {
        // Animation complete
        setAnimationState(prev => ({
          ...prev,
          isPlaying: false,
          currentWord: '',
          status: 'Complete',
        }))
      }
    }

    playNextWord()
  }

  const stopAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current)
    }
    setAnimationState(prev => ({
      ...prev,
      isPlaying: false,
      currentWord: '',
      status: 'Stopped',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setIsProcessing(true)
    
    // Simulate backend processing
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Convert text to ISL word order (simplified)
    const words = inputText.toLowerCase().trim().split(/\s+/)
    const processedWords: string[] = []
    
    // Remove common stop words and process
    const stopWords = ['am', 'are', 'is', 'was', 'were', 'be', 'the', 'a', 'an']
    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]/g, '')
      if (!stopWords.includes(cleanWord) && cleanWord.length > 0) {
        // If word not in available list, split into letters
        if (!availableWords.includes(cleanWord)) {
          cleanWord.split('').forEach(letter => {
            if (letter.match(/[a-z]/i)) {
              processedWords.push(letter.toUpperCase())
            }
          })
        } else {
          processedWords.push(cleanWord)
        }
      }
    })
    
    setIslText(processedWords)
    setIsProcessing(false)
    
    // Auto-start animation
    setTimeout(() => animateAvatar(processedWords), 300)
  }

  const handlePlaySign = () => {
    if (islText.length > 0) {
      animateAvatar(islText)
    }
  }

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-900 mb-2">TEXT TO ISL</h1>
        <p className="text-gray-600">Indian Sign Language Animation Player</p>
      </div>

      <div className="grid gap-6">
        {/* Avatar Player Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardTitle className="text-center">Animation Player</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Avatar Display */}
            <div className="relative bg-gradient-to-b from-blue-200 to-blue-100 rounded-lg p-8 mb-4 min-h-[400px] flex items-center justify-center">
              <div className="relative">
                {/* Avatar Image */}
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-IMyeEUtvoqtBwU7YYftad25OiOWl0l.png"
                  alt="ISL Avatar"
                  className={`w-80 h-auto transition-all duration-300 ${
                    animationState.isPlaying ? 'scale-105 animate-pulse' : 'scale-100'
                  }`}
                />
                
                {/* Animated overlay when playing */}
                {animationState.isPlaying && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        {/* Hand gesture indicators */}
                        <div className="absolute -left-16 top-8 w-12 h-12 bg-yellow-400 rounded-full opacity-70 animate-ping" />
                        <div className="absolute -right-16 top-8 w-12 h-12 bg-yellow-400 rounded-full opacity-70 animate-ping" style={{ animationDelay: '150ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Current word display */}
                {animationState.currentWord && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full shadow-lg animate-bounce">
                    <span className="text-xl font-bold">{animationState.currentWord}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
              <Button
                onClick={handlePlaySign}
                disabled={animationState.isPlaying || islText.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Sign
              </Button>
              <Button
                onClick={stopAnimation}
                disabled={!animationState.isPlaying}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Speed:</label>
                <select
                  className="border rounded px-2 py-1"
                  value={animationState.speed}
                  onChange={(e) =>
                    setAnimationState(prev => ({ ...prev, speed: parseFloat(e.target.value) }))
                  }
                  disabled={animationState.isPlaying}
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <span className="font-semibold">Sign/Frame:</span>
                <div className="text-gray-700">
                  {animationState.currentSignIndex}/{islText.length} / {animationState.currentFrameIndex}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="font-semibold">Gloss:</span>
                <div className="text-gray-700 truncate">
                  {animationState.currentWord || '[none]'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded col-span-2 md:col-span-1">
                <span className="font-semibold">Status:</span>
                <div className="text-gray-700">{animationState.status}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Card */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter English text..."
                className="flex-1"
                disabled={isProcessing || animationState.isPlaying}
              />
              <Button 
                type="submit" 
                disabled={isProcessing || animationState.isPlaying || !inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Word Display */}
        {animationState.currentWord && (
          <Card className="shadow-lg border-2 border-yellow-400 animate-pulse">
            <CardContent className="p-4">
              <div className="text-center">
                <span className="text-sm font-semibold text-gray-600">Current Word:</span>
                <p className="text-3xl font-bold text-indigo-700 mt-1">
                  {animationState.currentWord}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ISL Output */}
        {islText.length > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2">
                <span className="font-semibold text-gray-700">ISL text:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {islText.map((word, index) => (
                  <span
                    key={index}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      index < animationState.currentSignIndex
                        ? 'bg-green-500 text-white'
                        : index === animationState.currentSignIndex && animationState.isPlaying
                        ? 'bg-yellow-400 text-gray-900 scale-110 shadow-lg'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Words */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Available Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableWords.map((word) => (
                <span
                  key={word}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition-colors cursor-default"
                >
                  {word}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Words not in this list will be spelled out letter by letter
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
