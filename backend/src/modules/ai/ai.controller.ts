import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { sendSuccess } from '../../utils/response';

export class AiController {
  static async summarizeConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AiService.summarizeConsultation(
        req.user!.hospitalId,
        req.user!,
        req.body
      );
      return sendSuccess(res, summary, 'Clinical summary generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
