import { TeamRole, RequestStatus } from '~/types'

export const teamRoleLabels: Record<TeamRole, string> = {
  [TeamRole.Head]: 'Глава',
  [TeamRole.Translator]: 'Переводчик',
  [TeamRole.Editor]: 'Редактор',
}

export const teamRoleBadge: Record<TeamRole, string> = {
  [TeamRole.Head]: 'bg-primary/15 text-primary ring-1 ring-primary/30',
  [TeamRole.Translator]: 'bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/30',
  [TeamRole.Editor]: 'bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30',
}

export const requestStatusLabels: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: 'Ожидает',
  [RequestStatus.Approved]: 'Одобрена',
  [RequestStatus.Rejected]: 'Отклонена',
}

export const requestStatusBadge: Record<RequestStatus, string> = {
  [RequestStatus.Pending]: 'bg-amber-500/15 text-amber-500',
  [RequestStatus.Approved]: 'bg-emerald-500/15 text-emerald-500',
  [RequestStatus.Rejected]: 'bg-red-500/15 text-red-500',
}
