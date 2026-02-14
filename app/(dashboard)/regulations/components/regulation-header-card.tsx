'use client'

import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, MapPin, UserCheck } from 'lucide-react';
import { formatPhone } from '@/lib/format';

interface RegulationHeaderCardProps {
  citizen: any
  responsible: any
  relationship?: string | null
}

export default function RegulationHeaderCard({
  citizen,
  responsible,
  relationship,
}: RegulationHeaderCardProps) {
  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CIDAD?O */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Cidadão</h3>
            </div>

            <div className="pl-7 space-y-2">
              <div>
                <p className="font-medium text-lg">{citizen.name}</p>
                <p className="text-sm text-muted-foreground">CPF: {citizen.cpf || 'Não informado'}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{citizen.phone ? formatPhone(citizen.phone) : '-'}</span>
              </div>

              {citizen.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{citizen.city}/{citizen.state}</span>
                </div>
              )}
            </div>
          </div>

          {/* RESPONSÁVEL (SE HOUVER) */}
          {responsible && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Responsável</h3>
                {relationship && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                    {relationship.toLowerCase()}
                  </span>
                )}
              </div>

              <div className="pl-7 space-y-2">
                <div>
                  <p className="font-medium text-lg">{responsible.name}</p>
                  <p className="text-sm text-muted-foreground">CPF: {responsible.cpf || 'Não informado'}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{responsible.phone ? formatPhone(responsible.phone) : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
