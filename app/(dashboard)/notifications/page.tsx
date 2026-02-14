'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Bell, Check, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  readAt: string | null;
  citizenName?: string;
  regulationId?: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
        setIsLoading(true);
        const response = await fetch('/api/notifications?limit=50');
        const data = await response.json();
        
        if (data.data) {
            setNotifications(data.data);
        }
    } catch {
        toast.error('Erro ao carregar notificações');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
        const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: [id] })
        });

        if (response.ok) {
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
            );
            toast.success('Notificação marcada como lida');
        }
    } catch {
        toast.error('Erro ao atualizar notificação');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
        const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAllAsRead: true })
        });

        if (response.ok) {
            setNotifications(prev => 
                prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
            );
            toast.success('Todas as notificações foram marcadas como lidas');
        }
    } catch {
        toast.error('Erro ao atualizar notificações');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.readAt;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Central de Notificações"
        description="Fique por dentro das atualizações do sistema"
        icon={Bell}
        actions={
            <div className="flex gap-2">
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        <Check className="mr-2 h-4 w-4" />
                        Marcar todas como lidas
                    </Button>
                )}
            </div>
        }
      />

      <div className="flex gap-2 border-b pb-2">
        <Button 
            variant={filter === 'all' ? 'default' : 'ghost'} 
            onClick={() => setFilter('all')}
            size="sm"
        >
            Todas
        </Button>
        <Button 
            variant={filter === 'unread' ? 'default' : 'ghost'} 
            onClick={() => setFilter('unread')}
            size="sm"
        >
            Não lidas
            {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                    {unreadCount}
                </Badge>
            )}
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Carregando...</div>
        ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                <Bell className="mx-auto h-10 w-10 mb-4 opacity-20" />
                <p>Nenhuma notificação encontrada</p>
            </div>
        ) : (
            filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`transition-all ${!notification.readAt ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}>
                    <CardContent className="p-4 flex gap-4 items-start">
                        <div className={`mt-1 h-2 w-2 rounded-full ${!notification.readAt ? 'bg-primary' : 'bg-gray-300'}`} />
                        
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-semibold ${!notification.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                </h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                                </span>
                            </div>
                            
                            <p className="text-sm text-foreground/80">{notification.message}</p>
                            
                            <div className="flex gap-4 pt-2 text-xs text-muted-foreground">
                                {notification.citizenName && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {notification.citizenName}
                                    </div>
                                )}
                                {notification.regulationId && (
                                    <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        Regulação #{notification.regulationId}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!notification.readAt && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Marcar como lida"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}

