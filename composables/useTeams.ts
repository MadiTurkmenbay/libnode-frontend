import type {
  TeamDto,
  TeamDetailDto,
  CreateTeamDto,
  UpdateTeamDto,
  AddTeamMemberDto,
  TeamTitleRequestDto,
  TeamInviteDto,
  TeamRole,
  RequestStatus,
} from '~/types'

/** API-обёртки для команд переводчиков (admin + team-scoped). */
export function useTeams() {
  // Admin
  const listTeams = () => executeApiRequest<TeamDto[]>('/api/admin/teams', { key: 'admin-teams' })
  const createTeam = (body: CreateTeamDto) => executeApiRequest<TeamDto>('/api/admin/teams', { method: 'POST', body })
  const updateTeam = (id: string, body: UpdateTeamDto) => executeApiRequest<TeamDto>(`/api/admin/teams/${id}`, { method: 'PUT', body })
  const deleteTeam = (id: string) => executeApiRequest<void>(`/api/admin/teams/${id}`, { method: 'DELETE' })

  const listRequests = (status?: RequestStatus) =>
    executeApiRequest<TeamTitleRequestDto[]>(
      `/api/admin/team-requests${status !== undefined ? `?status=${status}` : ''}`,
      { key: `admin-team-requests:${status ?? 'all'}` },
    )
  const decideRequest = (id: string, approve: boolean) =>
    executeApiRequest<TeamTitleRequestDto>(`/api/admin/team-requests/${id}/decide?approve=${approve}`, { method: 'POST' })

  // Team scoped
  const getTeam = (id: string) => executeApiRequest<TeamDetailDto>(`/api/teams/${id}`, { key: `team:${id}` })
  const myTeams = () => executeApiRequest<TeamDto[]>('/api/teams/mine', { key: 'my-teams' })
  const inviteMember = (teamId: string, body: AddTeamMemberDto) =>
    executeApiRequest<void>(`/api/teams/${teamId}/invites`, { method: 'POST', body })
  const updateMember = (teamId: string, userId: string, role: TeamRole) =>
    executeApiRequest<void>(`/api/teams/${teamId}/members/${userId}`, { method: 'PUT', body: { role } })
  const removeMember = (teamId: string, userId: string) =>
    executeApiRequest<void>(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
  const requestTitle = (teamId: string, bookId: string, message?: string | null) =>
    executeApiRequest<TeamTitleRequestDto>(`/api/teams/${teamId}/requests`, { method: 'POST', body: { bookId, message } })

  // Public
  const publicTeams = () => executeApiRequest<TeamDto[]>('/api/public/teams', { key: 'public-teams' })
  const publicTeam = (id: string) => executeApiRequest<TeamDetailDto>(`/api/public/teams/${id}`, { key: `public-team:${id}` })

  // Invites (invitee side)
  const myInvites = () => executeApiRequest<TeamInviteDto[]>('/api/invites/mine', { key: 'my-invites' })
  const acceptInvite = (id: string) => executeApiRequest<void>(`/api/invites/${id}/accept`, { method: 'POST' })
  const declineInvite = (id: string) => executeApiRequest<void>(`/api/invites/${id}/decline`, { method: 'POST' })

  return {
    listTeams, createTeam, updateTeam, deleteTeam, listRequests, decideRequest,
    getTeam, myTeams, inviteMember, updateMember, removeMember, requestTitle,
    publicTeams, publicTeam, myInvites, acceptInvite, declineInvite,
  }
}
