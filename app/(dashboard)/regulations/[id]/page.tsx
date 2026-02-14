import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import RegulationHeaderCard from '../components/regulation-header-card'
import RegulationTabs from '../components/regulation-tabs'
import RegulationActionsSidebar from '../components/regulation-actions-sidebar'

// Fix for Next.js 15+ dynamic params
export default async function RegulationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const regulationId = parseInt(id)

  if (isNaN(regulationId)) {
    notFound()
  }

  // Fetch regulation with all related data
  const regulation = await prisma.regulation.findUnique({
    where: { id: regulationId },
    include: {
      citizen: true,
      responsible: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      analyzer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      printer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      folder: true,
      supplier: true,
      cares: {
        include: {
          care: {
            select: {
              id: true,
              name: true,
              acronym: true,
            },
          },
        },
      },
      notifications: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
      },
      uploads: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!regulation || regulation.deletedAt) {
    notFound()
  }

  if (!regulation.citizen) {
    return (
      <div className="container py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium">
            Os dados do cidadão não foram encontrados para esta regulação.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-7xl">
      {/* Header Card */}
      <RegulationHeaderCard
        citizen={regulation.citizen}
        responsible={regulation.responsible}
        relationship={regulation.relationship}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tabs */}
        <div className="lg:col-span-2">
          <RegulationTabs regulation={regulation} />
        </div>

        {/* Sidebar - Actions */}
        <div className="lg:col-span-1">
          <RegulationActionsSidebar
            regulationId={regulation.id}
            status={regulation.status}
            priority={regulation.priority}
            citizenName={regulation.citizen?.name}
            protocolNumber={regulation.idCode ?? String(regulation.id)}
          />
        </div>
      </div>
    </div>
  )
}

// Enable dynamic rendering for this page
export const dynamic = 'force-dynamic'
