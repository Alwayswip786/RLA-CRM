export interface GenerateTokenParams {
  sessionTopic: string;
  userId: string;
  userName: string;
  roleType: 0 | 1; // 1 = Host (Faculty/Admin), 0 = Participant (Student)
  durationMinutes?: number;
  cloudRecordingOption?: number;
}

export interface VideoSessionTokenResult {
  token: string;
  sessionTopic: string;
  roleType: 0 | 1;
  expiresAt: number;
}

export interface WebhookValidationResult {
  isValid: boolean;
  event?: string;
  payload?: any;
  error?: string;
}

export interface IVideoProvider {
  readonly name: string;

  /**
   * Generates a signed real-time video session token for client-side joining.
   */
  generateToken(params: GenerateTokenParams): Promise<VideoSessionTokenResult>;

  /**
   * Verifies incoming webhook authenticity and signature.
   */
  verifyWebhook(headers: Record<string, any>, rawBody: string | any): WebhookValidationResult;

  /**
   * Handles webhook URL Challenge-Response Check (CRC).
   */
  handleCrcChallenge(plainToken: string): { plainToken: string; encryptedToken: string };
}
