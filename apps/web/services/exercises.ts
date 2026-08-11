import type {
  CheckIn,
  CheckInCreate,
  ExerciseCompliance,
  ExerciseItem,
  ExerciseItemCreate,
  ExerciseProgram,
  ExerciseProgramCreate,
  ExerciseProgramUpdate,
  Paginated,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api-client'

export interface ExerciseLibraryParams {
  category?: string
  search?: string
  page?: number
  size?: number
}

export function getExerciseLibrary(params: ExerciseLibraryParams = {}) {
  return apiGet<Paginated<ExerciseItem>>(`/exercise-library${buildQueryString(params)}`)
}

export function listPrograms(params: { patient_id?: string; page?: number; size?: number } = {}) {
  return apiGet<Paginated<ExerciseProgram>>(`/exercise-programs${buildQueryString(params)}`)
}

export function getProgram(programId: string) {
  return apiGet<ExerciseProgram>(`/exercise-programs/${programId}`)
}

export function createProgram(payload: ExerciseProgramCreate) {
  return apiPost<ExerciseProgram>('/exercise-programs', payload)
}

export function updateProgram(programId: string, payload: ExerciseProgramUpdate) {
  return apiPut<ExerciseProgram>(`/exercise-programs/${programId}`, payload)
}

export function deleteProgram(programId: string) {
  return apiDelete<void>(`/exercise-programs/${programId}`)
}

export function addProgramItem(programId: string, payload: ExerciseItemCreate) {
  return apiPost<ExerciseItem>(`/exercise-programs/${programId}/items`, payload)
}

export function updateProgramItem(programId: string, itemId: string, payload: ExerciseItemCreate) {
  return apiPut<ExerciseItem>(`/exercise-programs/${programId}/items/${itemId}`, payload)
}

export function deleteProgramItem(programId: string, itemId: string) {
  return apiDelete<void>(`/exercise-programs/${programId}/items/${itemId}`)
}

export function checkIn(programId: string, payload: CheckInCreate) {
  return apiPost<CheckIn>(`/exercise-programs/${programId}/check-in`, payload)
}

export function getProgramCompliance(programId: string) {
  return apiGet<ExerciseCompliance>(`/exercise-programs/${programId}/compliance`)
}

export function getPatientCompliance(patientId: string) {
  return apiGet<ExerciseCompliance[]>(`/patients/${patientId}/compliance`)
}
