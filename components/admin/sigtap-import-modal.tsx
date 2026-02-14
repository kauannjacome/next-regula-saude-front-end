'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Loader2, CheckCircle2, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { SIGTAP_DATA } from '@/lib/data/sigtap-data'

interface SigtapImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriberId: string
  subscriberName: string
}

interface UserOption {
  id: string
  name: string
}

export function SigtapImportModal({
  open,
  onOpenChange,
  subscriberId,
  subscriberName,
}: SigtapImportModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedSubGroups, setSelectedSubGroups] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [result, setResult] = useState<{
    groupsCreated: number
    subGroupsCreated: number
    proceduresCreated: number
    proceduresSkipped: number
  } | null>(null)

  // Buscar usuários do assinante
  useEffect(() => {
    if (open && subscriberId) {
      const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
          const response = await fetch(`/api/admin/subscribers/${subscriberId}/users`)
          if (response.ok) {
            const data = await response.json()
            setUsers(data.users || data || [])
          }
        } catch (error) {
          console.error('Erro ao buscar usuários:', error)
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchUsers()
    }
  }, [open, subscriberId])

  const handleGroupToggle = (groupCode: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupCode)
        ? prev.filter((c) => c !== groupCode)
        : [...prev, groupCode]
    )
  }

  const handleSubGroupToggle = (subGroupCode: string) => {
    setSelectedSubGroups((prev) =>
      prev.includes(subGroupCode)
        ? prev.filter((c) => c !== subGroupCode)
        : [...prev, subGroupCode]
    )
  }

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === SIGTAP_DATA.length) {
      setSelectedGroups([])
    } else {
      setSelectedGroups(SIGTAP_DATA.map((g) => g.code))
    }
  }

  const handleSelectAllSubGroups = (groupCode: string) => {
    const group = SIGTAP_DATA.find((g) => g.code === groupCode)
    if (!group) return

    const subGroupCodes = group.subGroups.map((sg) => sg.code)
    const allSelected = subGroupCodes.every((code) =>
      selectedSubGroups.includes(code)
    )

    if (allSelected) {
      setSelectedSubGroups((prev) =>
        prev.filter((code) => !subGroupCodes.includes(code))
      )
    } else {
      setSelectedSubGroups((prev) => [
        ...new Set([...prev, ...subGroupCodes]),
      ])
    }
  }

  const getTotalProcedures = () => {
    if (activeTab === 'all') {
      return SIGTAP_DATA.reduce(
        (total, g) =>
          total +
          g.subGroups.reduce((st, sg) => st + sg.procedures.length, 0),
        0
      )
    }
    if (activeTab === 'groups') {
      return SIGTAP_DATA.filter((g) => selectedGroups.includes(g.code)).reduce(
        (total, g) =>
          total +
          g.subGroups.reduce((st, sg) => st + sg.procedures.length, 0),
        0
      )
    }
    if (activeTab === 'subgroups') {
      let count = 0
      SIGTAP_DATA.forEach((g) => {
        g.subGroups.forEach((sg) => {
          if (selectedSubGroups.includes(sg.code)) {
            count += sg.procedures.length
          }
        })
      })
      return count
    }
    return 0
  }

  const handleImport = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      let body: any = {}

      if (activeTab === 'all') {
        body = { mode: 'all', responsibleUserId: selectedUserId || null }
      } else if (activeTab === 'groups') {
        if (selectedGroups.length === 0) {
          toast.error('Selecione pelo menos um grupo')
          setIsLoading(false)
          return
        }
        body = { mode: 'groups', groupCodes: selectedGroups, responsibleUserId: selectedUserId || null }
      } else if (activeTab === 'subgroups') {
        if (selectedSubGroups.length === 0) {
          toast.error('Selecione pelo menos um subgrupo')
          setIsLoading(false)
          return
        }
        body = { mode: 'subgroups', subGroupCodes: selectedSubGroups, responsibleUserId: selectedUserId || null }
      }

      const response = await fetch(
        `/api/admin/subscribers/${subscriberId}/import-sigtap`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar')
      }

      setResult({
        groupsCreated: data.groupsCreated,
        subGroupsCreated: data.subGroupsCreated,
        proceduresCreated: data.proceduresCreated,
        proceduresSkipped: data.proceduresSkipped,
      })

      toast.success('Importação concluída com sucesso!')
    } catch (error) {
      console.error('Erro ao importar SIGTAP:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao importar procedimentos'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setSelectedGroups([])
    setSelectedSubGroups([])
    setActiveTab('all')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Procedimentos SIGTAP
          </DialogTitle>
          <DialogDescription>
            Importar procedimentos do SIGTAP para <strong>{subscriberName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Seleção de Usuário Responsável */}
        {!result && (
          <div className="flex items-center gap-4 py-2 px-1 border-b">
            <div className="flex items-center gap-2 flex-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="responsibleUser" className="text-sm whitespace-nowrap">
                Usuário Responsável:
              </Label>
              <Select
                value={selectedUserId || '__none__'}
                onValueChange={(v) => setSelectedUserId(v === '__none__' ? '' : v)}
                disabled={loadingUsers}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={loadingUsers ? "Carregando..." : "Selecione um usuário (opcional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum (opcional)</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {result ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">Importação Concluída!</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">
                  {result.groupsCreated}
                </p>
                <p className="text-sm text-muted-foreground">Grupos criados</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">
                  {result.subGroupsCreated}
                </p>
                <p className="text-sm text-muted-foreground">Subgrupos criados</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">
                  {result.proceduresCreated}
                </p>
                <p className="text-sm text-muted-foreground">
                  Procedimentos criados
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                <p className="text-2xl font-bold text-orange-600">
                  {result.proceduresSkipped}
                </p>
                <p className="text-sm text-muted-foreground">
                  Já existentes (ignorados)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="groups">Por Grupo</TabsTrigger>
                <TabsTrigger value="subgroups">Por Subgrupo</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="flex-1 mt-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Importar todos os procedimentos
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Serão importados todos os{' '}
                    <strong>{getTotalProcedures()}</strong> procedimentos do SIGTAP,
                    organizados em {SIGTAP_DATA.length} grupos e{' '}
                    {SIGTAP_DATA.reduce((t, g) => t + g.subGroups.length, 0)}{' '}
                    subgrupos.
                  </p>
                </div>

                <ScrollArea className="h-[300px] mt-4 border rounded-lg">
                  <div className="p-4 space-y-3">
                    {SIGTAP_DATA.map((group) => (
                      <div
                        key={group.code}
                        className="border-b pb-3 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant="outline" className="mr-2">
                              {group.code}
                            </Badge>
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {group.subGroups.reduce(
                              (t, sg) => t + sg.procedures.length,
                              0
                            )}{' '}
                            procedimentos
                          </span>
                        </div>
                        <div className="mt-1 ml-10 text-xs text-muted-foreground">
                          {group.subGroups.length} subgrupos
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Selecione os grupos para importar
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllGroups}
                  >
                    {selectedGroups.length === SIGTAP_DATA.length
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </Button>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-4 space-y-2">
                    {SIGTAP_DATA.map((group) => (
                      <div
                        key={group.code}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer"
                        onClick={() => handleGroupToggle(group.code)}
                      >
                        <Checkbox
                          checked={selectedGroups.includes(group.code)}
                          onCheckedChange={() => handleGroupToggle(group.code)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{group.code}</Badge>
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.subGroups.length} subgrupos,{' '}
                            {group.subGroups.reduce(
                              (t, sg) => t + sg.procedures.length,
                              0
                            )}{' '}
                            procedimentos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedGroups.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedGroups.length} grupo(s) selecionado(s) -{' '}
                    {getTotalProcedures()} procedimentos
                  </p>
                )}
              </TabsContent>

              <TabsContent value="subgroups" className="flex-1 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Selecione os subgrupos para importar
                  </span>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-4 space-y-4">
                    {SIGTAP_DATA.map((group) => (
                      <div key={group.code} className="space-y-2">
                        <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-950 py-1">
                          <div className="flex items-center gap-2">
                            <Badge>{group.code}</Badge>
                            <span className="font-semibold text-sm">
                              {group.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleSelectAllSubGroups(group.code)}
                          >
                            {group.subGroups.every((sg) =>
                              selectedSubGroups.includes(sg.code)
                            )
                              ? 'Desmarcar'
                              : 'Selecionar grupo'}
                          </Button>
                        </div>
                        <div className="ml-4 space-y-1">
                          {group.subGroups.map((subGroup) => (
                            <div
                              key={subGroup.code}
                              className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg cursor-pointer"
                              onClick={() => handleSubGroupToggle(subGroup.code)}
                            >
                              <Checkbox
                                checked={selectedSubGroups.includes(
                                  subGroup.code
                                )}
                                onCheckedChange={() =>
                                  handleSubGroupToggle(subGroup.code)
                                }
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {subGroup.code}
                                  </Badge>
                                  <span className="text-sm">{subGroup.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {subGroup.procedures.length} procedimentos
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {selectedSubGroups.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedSubGroups.length} subgrupo(s) selecionado(s) -{' '}
                    {getTotalProcedures()} procedimentos
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Importar ({getTotalProcedures()} procedimentos)
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
