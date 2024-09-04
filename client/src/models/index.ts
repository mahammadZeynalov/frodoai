export enum GameStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum AnswerType {
  CORRECT = "CORRECT",
  NOT_CORRECT = "NOT_CORRECT",
}
export interface Game {
  id: number;
  wallet_address: string;
  npc_name: string;
  question_number: number;
  current_question_text: string;
  correct_answered: number;
  status: GameStatus;
}
