"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

import { cn } from "@/lib/utils"
import { ArrowUpIcon, MenuIcon, MicIcon, MicOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { AutoResizeTextarea } from "@/components/autoresize-textarea"
import { Sidebar } from "@/components/sidebar"

interface Source {
  filename: string
  score: number
  content_preview: string
  path: string
}

interface EnhancedFeatures {
  query_expansion?: boolean
  domain_relevant?: boolean
  response_time?: string
  confidence?: string
  reason?: string
  web_search_used?: boolean
  web_results_count?: number
  frontend_processing_time?: string
  total_processing_time?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  total_sources?: number
  enhanced_features?: EnhancedFeatures
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  timestamp: string
  lastUpdated: string
}

export function ChatForm({ className, ...props }: React.ComponentProps<"form">) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [recognition, setRecognition] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastResponseRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    "Apa itu DPMPTSP Jawa Tengah?",
    "Bagaimana cara mengurus izin usaha?", 
    "Syarat investasi di Jawa Tengah",
    "Prosedur perizinan online",
    "Layanan pelayanan terpadu satu pintu",
    "Dokumen yang diperlukan untuk izin",
    "Kontak DPMPTSP Jawa Tengah",
    "Biaya pengurusan izin usaha",
  ]

  // Chat history utility functions
  const generateSessionId = () => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} hari yang lalu`
    if (hours > 0) return `${hours} jam yang lalu`
    if (minutes > 0) return `${minutes} menit yang lalu`
    return 'Baru saja'
  }

  const generateChatTitle = (firstMessage: string) => {
    // Extract first 50 characters as title, or use first question
    const cleaned = firstMessage.replace(/\n/g, ' ').trim()
    return cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned
  }

  const saveChatHistory = (history: ChatSession[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ptsp_chat_history', JSON.stringify(history))
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  const loadChatHistory = (): ChatSession[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('ptsp_chat_history')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading chat history:', error)
      return []
    }
  }

  const saveCurrentSession = () => {
    if (!currentSessionId || messages.length === 0) return
    
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length === 0) return

    const history = loadChatHistory()
    const existingIndex = history.findIndex(h => h.id === currentSessionId)
    
    // Use existing title if session exists, otherwise generate new one
    const title = existingIndex >= 0 ? history[existingIndex].title : generateChatTitle(userMessages[0].content)
    const now = new Date()
    
    const session: ChatSession = {
      id: currentSessionId,
      title,
      messages: [...messages],
      timestamp: existingIndex >= 0 ? history[existingIndex].timestamp : now.toISOString(),
      lastUpdated: now.toISOString()
    }

    if (existingIndex >= 0) {
      history[existingIndex] = session
    } else {
      history.unshift(session)
    }
    
    // Keep only last 50 chats
    if (history.length > 50) {
      history.splice(50)
    }
    
    setChatHistory(history)
    saveChatHistory(history)
  }

  const loadChatSession = (sessionId: string) => {
    const history = loadChatHistory()
    const session = history.find(h => h.id === sessionId)
    if (session) {
      setMessages(session.messages)
      setCurrentSessionId(sessionId)
    }
  }

  const createNewChat = () => {
    setMessages([])
    setInput("")
    setCurrentSessionId(generateSessionId())
  }

  // Auto-scroll function - focus on response, not sources
  const scrollToBottom = () => {
    // If there's a recent assistant response, scroll to it
    if (lastResponseRef.current) {
      lastResponseRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      })
    } else {
      // Fallback to bottom if no response ref
      messagesEndRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      })
    }
  }

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Also scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      setTimeout(scrollToBottom, 100) // Small delay to ensure loading message is rendered
    }
  }, [isLoading])

  // Initialize chat history and current session on mount
  useEffect(() => {
    const history = loadChatHistory()
    setChatHistory(history)
    
    // Load the most recent chat if available, otherwise create new
    if (history.length > 0 && !currentSessionId) {
      const mostRecent = history[0]
      setMessages(mostRecent.messages)
      setCurrentSessionId(mostRecent.id)
    } else if (!currentSessionId) {
      setCurrentSessionId(generateSessionId())
    }
  }, [])

  // Auto-save current session when messages change
  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      const timeoutId = setTimeout(() => {
        saveCurrentSession()
      }, 1000) // Debounce saves by 1 second
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages, currentSessionId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // If this is the first message and we don't have a session, create one
    if (messages.length === 0 && !currentSessionId) {
      setCurrentSessionId(generateSessionId())
    }
    
    const userMessage: Message = { content: input, role: "user" }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    
    // // Add processing indicator
    // const processingMessage: Message = {
    //   role: 'assistant',
    //   content: 'Sedang memproses...',
    //   enhanced_features: {
    //     confidence: 'processing',
    //     response_time: 'processing...'
    //   }
    // }
    // setMessages([...newMessages, processingMessage])
    
    try {
      const startTime = Date.now()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        }),
      })
      
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2)
      
      if (response.ok) {
        const data = await response.json()
        
        // Update enhanced features with actual processing time
        const enhancedFeatures = {
          ...data.enhanced_features,
          frontend_processing_time: `${processingTime}s`,
          total_processing_time: data.enhanced_features.response_time
        }
        
        setMessages([...newMessages, { 
          role: 'assistant', 
          content: data.content,
          sources: data.sources,
          total_sources: data.total_sources,
          enhanced_features: enhancedFeatures
        }])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: '❌ Maaf, terjadi kesalahan saat memproses pertanyaan Anda.\n\nSilakan coba lagi dalam beberapa saat atau hubungi administrator sistem.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const startRecording = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsRecording(false)
      }

      recognition.onerror = () => {
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
      setRecognition(recognition)
    }
  }

  const stopRecording = () => {
    if (recognition) {
      recognition.stop()
      setIsRecording(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const handleNewChat = () => {
    // Create new chat session
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: []
    };
    
    // Save current session before switching
    saveCurrentSession();
    
    // Create new session in localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ptsp_chat_history');
      const chatHistory: ChatSession[] = stored ? JSON.parse(stored) : [];
      chatHistory.unshift(newSession);
      localStorage.setItem('ptsp_chat_history', JSON.stringify(chatHistory));
      setChatHistory(chatHistory);
    }
    
    // Switch to new session
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  const handleSelectChat = (sessionId: string) => {
    // Save current session before switching
    saveCurrentSession();
    
    // Load selected session
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ptsp_chat_history');
      if (stored) {
        const chatHistory: ChatSession[] = JSON.parse(stored);
        const session = chatHistory.find(s => s.id === sessionId);
        if (session) {
          setCurrentSessionId(sessionId);
          setMessages(session.messages);
          setChatHistory(chatHistory);
        }
      }
    }
  };

  const getChatHistory = (): ChatSession[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('ptsp_chat_history');
    return stored ? JSON.parse(stored) : [];
  };

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">PTSP Jawa Tengah Chatbot</h1>
      <p className="text-muted-foreground text-sm">
        Chatbot untuk informasi <span className="text-foreground">Pelayanan Terpadu Satu Pintu</span> dan data{" "}
        <span className="text-foreground">Pemerintah Jawa Tengah</span>.
      </p>
      <p className="text-muted-foreground text-sm">
        Ajukan pertanyaan tentang prosedur, anggaran, atau data pemerintahan Jawa Tengah.
      </p>
    </header>
  )

  const messageList = (
    <div 
      ref={chatContainerRef}
      className="my-4 flex h-fit min-h-full flex-col gap-4 chat-container scrollbar-hide"
    >
      {messages.map((message, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div
            data-role={message.role}
            className="max-w-[80%] rounded-xl px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-muted data-[role=user]:bg-primary data-[role=assistant]:text-foreground data-[role=user]:text-primary-foreground whitespace-pre-wrap"
            style={{ wordBreak: 'break-word' }}
          >
            {message.role === 'assistant' ? (
              <div 
                ref={index === messages.length - 1 ? lastResponseRef : null}
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/### (.*?)$/gm, '<h3 class="text-base font-semibold mb-2 mt-3">$1</h3>')
                    .replace(/#### (.*?)$/gm, '<h4 class="text-sm font-medium mb-1 mt-2">$1</h4>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^- (.*?)$/gm, '<div class="ml-2">• $1</div>')
                    .replace(/^\d+\. (.*?)$/gm, '<div class="ml-2">$1</div>')
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/\n/g, '<br>')
                }}
              />
            ) : (
              message.content
            )}
          </div>
          
          {/* Separate Sources Section */}
          {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
            <div className="self-start max-w-[80%] mt-3">
              {/* Sources Header */}
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  � Sumber Dokumen ({message.sources.length} dari {message.total_sources})
                </h4>
              </div>
              
              {/* Sources Grid */}
              <div className="grid gap-2">
                {message.sources.slice(0, 5).map((source, i) => {
                  const scoreDisplay = typeof source.score === 'number' && !Number.isNaN(source.score)
                    ? `${Math.round(source.score * 100)}%`
                    : 'n/a'
                  return (
                    <div 
                      key={i} 
                      className="border border-border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" title={source.filename}>
                            📄 {source.filename}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Relevansi: {scoreDisplay}
                          </p>
                        </div>
                      </div>
                      
                      {source.content_preview && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                          <p className="line-clamp-2">
                            {source.content_preview.length > 150 
                              ? `${source.content_preview.substring(0, 150)}...` 
                              : source.content_preview
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {message.sources.length > 5 && (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
                      +{message.sources.length - 5} dokumen lainnya tersedia
                    </p>
                  </div>
                )}
              </div>
              
              {/* Enhanced Features Tags */}
              {message.enhanced_features && (
                <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground mr-2">Fitur:</span>
                  {Object.entries(message.enhanced_features).filter(([,v]) => v).map(([k]) => (
                    <span key={k} className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                      {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm self-start bg-muted text-foreground">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <div className="w-2 h-2 bg-current rounded-full typing-dot-1"></div>
              <div className="w-2 h-2 bg-current rounded-full typing-dot-2"></div>
              <div className="w-2 h-2 bg-current rounded-full typing-dot-3"></div>
            </div>
            <span>Sedang mengetik...</span>
          </div>
        </div>
      )}
      {/* Auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  )

  return (
    <div className="flex h-svh">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chatHistory={chatHistory}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        currentSessionId={currentSessionId}
      />

      <div className="flex-1 flex flex-col">
        <header className="flex items-center gap-4 p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8 p-0">
            <MenuIcon size={16} />
          </Button>

          <div
            className={cn(
              "transition-transform duration-300 ease-in-out",
              sidebarOpen ? "translate-x-80" : "translate-x-0",
            )}
          >
            <h2 className="text-lg font-semibold">PTSP Jawa Tengah</h2>
          </div>

          <div className="ml-auto">
            {/* Theme toggle removed for simplicity */}
          </div>
        </header>

        <main
          className={cn(
            "ring-none mx-auto flex flex-1 max-h-[calc(100vh-80px)] w-full max-w-[35rem] flex-col items-stretch border-none",
            className,
          )}
          {...props}
        >
          <div className="flex-1 content-center overflow-y-auto px-6 scrollbar-hide">{messages.length ? messageList : header}</div>

          {!messages.length && (
            <div className="mx-6 mb-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="h-auto p-3 text-xs text-left justify-start whitespace-normal"
                >
                  {question}
                </Button>
              ))}
            </div>
          )}

          <TooltipProvider>
            <form
              onSubmit={handleSubmit}
              className="border-input bg-background focus-within:ring-ring/10 relative mx-6 mb-6 flex items-center rounded-[16px] border px-3 py-1.5 pr-16 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
            >
              <AutoResizeTextarea
                onKeyDown={handleKeyDown}
                onChange={(v) => setInput(v)}
                value={input}
                placeholder="Enter a message"
                className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "absolute bottom-1 right-9 size-6 rounded-full",
                      isRecording && "bg-red-500 text-white hover:bg-red-600",
                    )}
                  >
                    {isRecording ? <MicOffIcon size={16} /> : <MicIcon size={16} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={12}>{isRecording ? "Stop Recording" : "Voice Input"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="absolute bottom-1 right-1 size-6 rounded-full">
                    <ArrowUpIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={12}>Submit</TooltipContent>
              </Tooltip>
            </form>
          </TooltipProvider>
        </main>
      </div>
    </div>
  )
}
