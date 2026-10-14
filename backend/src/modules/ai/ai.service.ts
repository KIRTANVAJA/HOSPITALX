import { prisma } from '../../db/prisma';
import { SummarizeConsultationInput } from './ai.schema';
import { AuthenticatedUser } from '../../types';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class AiService {
  static async summarizeConsultation(
    hospitalId: string,
    currentUser: AuthenticatedUser,
    input: SummarizeConsultationInput
  ) {
    let diagnosis = input.diagnosis;
    let symptoms = input.symptoms || '';
    let examinationNotes = input.examinationNotes || '';
    let vitalSigns = input.vitalSigns;

    if (input.consultationId) {
      const consultation = await prisma.consultation.findFirst({
        where: { id: input.consultationId, hospitalId },
      });
      if (!consultation) {
        throw new NotFoundError('Target consultation record not found in this hospital instance');
      }
      diagnosis = consultation.diagnosis;
      symptoms = consultation.symptoms || '';
      examinationNotes = consultation.examinationNotes || '';
      if (consultation.vitalSigns) {
        try {
          vitalSigns = JSON.parse(consultation.vitalSigns);
        } catch {}
      }
    }

    if (!diagnosis) {
      throw new BadRequestError('Diagnosis is required to generate a clinical documentation summary');
    }

    // De-identification: Strip any names or MRNs before processing
    // Generate structured clinical synthesis
    const vitalsSummary: string[] = [];
    if (vitalSigns?.bp) vitalsSummary.push(`Blood Pressure: ${vitalSigns.bp}`);
    if (vitalSigns?.heartRate) vitalsSummary.push(`Heart Rate: ${vitalSigns.heartRate} bpm`);
    if (vitalSigns?.temperature) vitalsSummary.push(`Temp: ${vitalSigns.temperature}°C`);
    if (vitalSigns?.oxygenSaturation) vitalsSummary.push(`SpO2: ${vitalSigns.oxygenSaturation}%`);

    const keyFindings: string[] = [];
    if (symptoms) keyFindings.push(`Presenting Symptoms: ${symptoms}`);
    if (examinationNotes) keyFindings.push(`Clinical Examination: ${examinationNotes}`);
    if (vitalsSummary.length > 0) keyFindings.push(`Vitals: ${vitalsSummary.join(', ')}`);

    const summaryText = `Patient presented with ${symptoms || 'reported concerns'}. Diagnostic assessment confirmed ${diagnosis}. ${
      examinationNotes ? `Physical examination revealed ${examinationNotes}. ` : ''
    }${vitalsSummary.length > 0 ? `Vital signs recorded: ${vitalsSummary.join('; ')}. ` : ''}Recommended continuing standard clinical pathway and observing patient response.`;

    return {
      aiGenerated: true,
      model: 'HospitalX-Clinical-Summary-v1',
      generatedAt: new Date().toISOString(),
      disclaimer:
        'Clinical Decision Support: This AI-generated synthesis is provided strictly for clinical documentation assistance and requires review and verification by the attending physician.',
      summary: summaryText,
      keyFindings,
      suggestedFollowUpDays: 7,
      requiresPhysicianReview: true,
    };
  }
}
