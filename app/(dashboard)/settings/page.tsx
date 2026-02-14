'use client'

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Building2, Palette, Sun, Moon, Monitor, Check, Lock, Key, Phone, Pencil, Save, X, Camera, Loader2 } from 'lucide-react';
import { TwoFactorSettings } from '@/components/settings/two-factor-settings';
import { PasswordInput, validatePassword } from '@/components/shared/password-strength';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  interface UserData {
    name?: string
    email?: string
    phoneNumber?: string
    image?: string
    avatarUpload?: { fileUrl: string } | null
    [key: string]: unknown
  }

  const [userData, setUserData] = useState<UserData | null>(null)

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Carrega dados completos do usuário
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserData(data)
          setEditName(data.name || '')
          setEditPhone(data.phoneNumber || '')
        })
        .catch(err => console.error('Erro ao carregar dados do usuário:', err))
    }
  }, [session?.user?.id])

  // Evita erro de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-8 dark:bg-slate-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Função para salvar alterações do perfil
  const handleProfileSave = async () => {
    if (!session?.user?.id) return

    setIsSavingProfile(true)
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phoneNumber: editPhone,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil')
      }

      const updatedUser = await response.json()
      setUserData(updatedUser)
      setIsEditingProfile(false)
      toast.success('Perfil atualizado com sucesso!')

      // Atualiza a sessão com o novo nome
      await updateSession({ name: editName })
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Cancelar edição do perfil
  const handleCancelEdit = () => {
    setEditName(userData?.name || session?.user?.name || '')
    setEditPhone(userData?.phoneNumber || '')
    setIsEditingProfile(false)
  }

  // Calcular iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Função para fazer upload do avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setIsUploadingAvatar(true)

    try {
      // Fazer upload do arquivo com categoria user-avatar
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'user-avatar')
      formData.append('userId', session?.user?.id || '')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        console.error('Upload error:', uploadData)
        throw new Error(uploadData.error || 'Erro ao fazer upload da imagem')
      }

      // Atualizar o usuário com a nova imagem
      const updateResponse = await fetch(`/api/users/${session?.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadData.url,
        }),
      })

      const updatedData = await updateResponse.json()

      if (!updateResponse.ok) {
        console.error('Update error:', updatedData)
        throw new Error(updatedData.error || 'Erro ao atualizar perfil')
      }

      // Usar dados do PUT response diretamente (sem re-fetch)
      setUserData((prev) => prev ? { ...prev, image: uploadData.url, ...updatedData } : updatedData)

      setAvatarPreview(null)
      toast.success('Foto de perfil atualizada com sucesso!')
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar foto de perfil')
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Função para abrir o seletor de arquivo
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar senha com os novos requisitos
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      toast.error('A nova senha nao atende todos os requisitos de seguranca')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmacao nao coincidem')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao alterar senha')
      }

      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Claro',
      description: 'Interface com fundo branco e texto escuro',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Escuro',
      description: 'Interface com fundo escuro e texto claro',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'Sistema',
      description: 'Seguir preferência do sistema operacional',
      icon: Monitor,
    },
  ]

  const currentTheme = theme || 'system'
  const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme

  return (
    <div className="p-8 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-slate-100">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground dark:text-slate-400 mt-1">
          Gerencie suas informações e preferências
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Informações do Usuário */}
        <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
                Informações Pessoais
              </h2>
              <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                Dados do seu perfil no sistema
              </p>
            </div>
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleProfileSave}
                  disabled={isSavingProfile}
                  className="gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            {/* Avatar e Nome Principal */}
            <div className="flex items-center gap-4 pb-4 border-b border-border dark:border-slate-700">
              {/* Avatar com botão de upload */}
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={avatarPreview || userData?.image || session?.user?.image || ''}
                    alt={userData?.name || session?.user?.name || 'Usuário'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(userData?.name || session?.user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay com botão de câmera */}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>

                {/* Input de arquivo oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                {isEditingProfile ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome Completo</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="max-w-md"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-foreground dark:text-slate-200">
                      {userData?.name || session?.user?.name || 'Usuário'}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-400">
                      {session?.user?.roleDisplayName || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                      Passe o mouse sobre a foto para alterar
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Email</p>
                <p className="font-medium text-foreground dark:text-slate-200">
                  {session?.user?.email || 'Não informado'}
                </p>
              </div>
            </div>

            {/* Telefone */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground dark:text-slate-400">Telefone</p>
                {isEditingProfile ? (
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="max-w-md mt-1"
                  />
                ) : (
                  <p className="font-medium text-foreground dark:text-slate-200">
                    {userData?.phoneNumber || 'Não informado'}
                  </p>
                )}
              </div>
            </div>

            {/* Organização */}
            {session?.user?.subscriberName && (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Organização</p>
                  <p className="font-medium text-foreground dark:text-slate-200">
                    {session?.user?.subscriberName}
                  </p>
                </div>
              </div>
            )}

            {/* Função/Role */}
            {session?.user?.roleDisplayName && (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground dark:text-slate-400">Função</p>
                  <p className="font-medium text-foreground dark:text-slate-200">
                    {session?.user?.roleDisplayName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alterar Senha section */}
        <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
                  Segurança
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                  Atualize sua senha de acesso
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Senha Atual
                </label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Sua senha atual"
                    className="pl-9"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Nova Senha
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Digite sua nova senha"
                  showStrength={true}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Confirmar Nova Senha
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Digite a nova senha novamente"
                  showStrength={false}
                  required
                  error={confirmPassword && newPassword !== confirmPassword ? 'As senhas nao coincidem' : undefined}
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !validatePassword(newPassword).isValid || newPassword !== confirmPassword}
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Senha'
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Autenticação de Dois Fatores */}
        <TwoFactorSettings />

        {/* Preferências de Tema */}
        <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-slate-700 bg-muted/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-foreground dark:text-slate-200">
                  Aparência
                </h2>
                <p className="text-sm text-muted-foreground dark:text-slate-400 mt-1">
                  Escolha como o sistema deve ser exibido
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = currentTheme === option.value
                const isEffective = effectiveTheme === option.value

                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${isSelected
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                      }`}
                  >
                    <div
                      className={`p-3 rounded-lg ${isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/40'
                        : 'bg-slate-100 dark:bg-slate-700'
                        }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-600 dark:text-slate-400'
                          }`}
                      />
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold ${isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-foreground dark:text-slate-200'
                            }`}
                        >
                          {option.label}
                        </p>
                        {isEffective && currentTheme === 'system' && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-1 ${isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-muted-foreground dark:text-slate-400'
                          }`}
                      >
                        {option.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Informação adicional */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex gap-3">
                <div className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Tema ativo: {effectiveTheme === 'dark' ? 'Escuro' : 'Claro'}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {currentTheme === 'system'
                      ? 'O tema está seguindo as configurações do seu sistema operacional'
                      : 'O tema foi definido manualmente'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dica */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 <strong>Dica:</strong> Você também pode alternar rapidamente entre os temas usando o botão
            de sol/lua no canto superior direito do editor de templates.
          </p>
        </div>
      </div>
    </div>
  )
}
