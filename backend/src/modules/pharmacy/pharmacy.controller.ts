import { Request, Response, NextFunction } from 'express';
import { PharmacyService } from './pharmacy.service';
import { sendSuccess } from '../../utils/response';

export class PharmacyController {
  // Items Catalogue
  static async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const items = await PharmacyService.listItems(req.user!.hospitalId, category);
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  }

  static async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await PharmacyService.createItem(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, item, 'Medication or consumable added to pharmacy catalogue', 201);
    } catch (error) {
      next(error);
    }
  }

  // Batches
  static async listBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacyItemId = req.query.pharmacyItemId as string | undefined;
      const batches = await PharmacyService.listBatches(req.user!.hospitalId, pharmacyItemId);
      return sendSuccess(res, batches);
    } catch (error) {
      next(error);
    }
  }

  static async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const batch = await PharmacyService.createBatch(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, batch, 'Inventory batch received and recorded', 201);
    } catch (error) {
      next(error);
    }
  }

  // Stock Movement
  static async recordMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const movement = await PharmacyService.recordStockMovement(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, movement, 'Inventory stock movement reconciled', 201);
    } catch (error) {
      next(error);
    }
  }

  // Dispensing
  static async dispense(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PharmacyService.dispenseMedication(
        req.user!.hospitalId,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return sendSuccess(res, result, 'Medications dispensed and inventory updated', 201);
    } catch (error) {
      next(error);
    }
  }

  // Metrics
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await PharmacyService.getInventoryMetrics(req.user!.hospitalId);
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}
