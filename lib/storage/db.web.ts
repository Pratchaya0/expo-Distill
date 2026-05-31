// Web stub — expo-sqlite is native-only.
// All functions return empty data so the UI renders in browser preview.
import type { Recording, Note, PromptTemplate } from '@/types';

export async function initDB(): Promise<void> {}
export async function saveRecording(_r: Omit<Recording, 'id'>): Promise<number> { return 0; }
export async function getRecording(_id: number): Promise<(Recording & { id: number }) | null> { return null; }
export async function listRecordings(_favoritesOnly?: boolean): Promise<(Recording & { id: number })[]> { return []; }
export async function updateRecording(_id: number, _patch: Partial<Omit<Recording, 'id'>>): Promise<void> {}
export async function deleteRecording(_id: number): Promise<void> {}
export async function saveNote(_n: Omit<Note, 'id'>): Promise<number> { return 0; }
export async function getNotes(_recordingId: number): Promise<(Note & { id: number })[]> { return []; }
export async function updateNote(_id: number, _patch: Partial<Pick<Note, 'content' | 'imagePaths'>>): Promise<void> {}
export async function deleteNote(_id: number): Promise<void> {}
export async function listTemplates(): Promise<PromptTemplate[]> { return []; }
export async function saveTemplate(_t: PromptTemplate): Promise<void> {}
export async function deleteTemplate(_id: string): Promise<void> {}
