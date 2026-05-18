export function shouldMeditate(missionStatus: string, isForced: boolean): boolean {
  if (isForced) {
    return true;
  }
  return missionStatus === 'completed' || missionStatus === 'failed';
}
