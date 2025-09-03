"use client"
import { Button } from "@/components/ui/button"
import { XIcon, MessageSquareIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSession {
  id: string
  title: string
  timestamp: string
  lastUpdated: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  chatHistory: ChatSession[]
  onSelectChat: (sessionId: string) => void
  onNewChat: () => void
  currentSessionId: string
}

export function Sidebar({ isOpen, onToggle, chatHistory, onSelectChat, onNewChat, currentSessionId }: SidebarProps) {
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
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

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-background border-r border-border z-50 transition-transform duration-300 ease-in-out",
          "w-80 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
            <XIcon size={16} />
          </Button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Belum ada riwayat chat.
                <br />
                Mulai percakapan baru!
              </div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    currentSessionId === chat.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquareIcon size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(chat.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full bg-transparent" 
            size="sm"
            onClick={() => {
              onNewChat()
              onToggle() // Close sidebar on mobile after creating new chat
            }}
          >
            New Chat
          </Button>
        </div>
      </div>
    </>
  )
}
