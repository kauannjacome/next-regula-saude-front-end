'use client'

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: number
  title: string
  message: string
  createdAt: string
  readAt: string | null
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=5')
      const data = await response.json()
      if (data.data) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar uma vez ao montar para exibir badge inicial
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Recarregar ao abrir o popover
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // Mark as read when clicking on a notification
  const markAsRead = async (id: number) => {
    try {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: [id] })
        })
        
        // Update local state
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
        )
    } catch (error) {
        console.error('Failed to mark as read', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10"
          data-tour="notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} não lidas
            </span>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {loading && notifications.length === 0 ? (
             <div className="flex items-center justify-center h-full p-4">
                <p className="text-sm text-muted-foreground">Carregando...</p>
             </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.readAt && markAsRead(notification.id)}
                  className={cn(
                    'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notification.readAt && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.readAt && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className={cn(!notification.readAt ? '' : 'ml-4')}>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button variant="ghost" className="w-full text-sm" size="sm" asChild>
            <Link href="/notifications" onClick={() => setOpen(false)}>
                Ver todas as notificações
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
