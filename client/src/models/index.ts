export enum GameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  WIN = "WIN",
  LOST = "LOST",
}

export enum AnswerType {
  CORRECT = "CORRECT",
  NOT_CORRECT = "NOT_CORRECT",
}

export interface Game {
  id: number;
  wallet_address: string;
  mode: string;
  question_number: number;
  correct_answered: number;
  status: GameStatus;
}
