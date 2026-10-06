const DRAFT_KEY = 'js-playground:draft';

export const readDraft = (): string | null => {
  try {
    return sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
};

export const writeDraft = (code: string): void => {
  try {
    sessionStorage.setItem(DRAFT_KEY, code);
  } catch {}
};
