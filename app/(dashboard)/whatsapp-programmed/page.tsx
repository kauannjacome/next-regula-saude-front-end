'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Settings, FileText } from 'lucide-react'

import { SettingsTab } from './components/settings-tab'
import { NotificationPreferencesTab } from './components/notification-preferences-tab'
import { TemplatesTab } from './components/templates-tab'

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('preferences')

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Automático"
        description="Configure mensagens automáticas personalizadas para os cidadãos"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="preferences" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Mensagens Automáticas</span>
            <span className="sm:hidden">Automáticas</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Meus Templates</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="connection" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Conexão</span>
            <span className="sm:hidden">Conexão</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <NotificationPreferencesTab />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="connection" className="space-y-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
