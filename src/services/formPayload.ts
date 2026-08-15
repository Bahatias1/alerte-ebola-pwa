import { isAuthUserId, newClientId } from '../lib/ids';

export interface FieldDefLike {
  id: string;
  type?: string;
  required?: boolean;
}

export interface SectionDefLike {
  fields?: FieldDefLike[];
}

const MVE_BOOLEAN_FIELDS = new Set([
  'source_community',
  'source_watch_post',
  'source_reco',
  'source_health_structure',
  'source_sbc',
  'source_morgue',
  'source_frontier',
  'source_airport_port',
  'source_cte_ct',
  'clinical_fever',
  'clinical_diarrhea',
  'clinical_vomiting',
  'clinical_hemorrhagic_signs',
  'alert_validated',
  'case_is_suspect',
  'patient_isolated',
  'patient_transferred',
  'patient_sampled',
  'patient_managed_in_community',
  'refused_transfer',
  'not_investigated',
]);

const MVE_NUMBER_FIELDS = new Set([
  'patient_age_years',
  'patient_age_months',
]);

/** Exact column names of public.mve_alert_notifications (plus additive client_submission_id). */
export const MVE_COLUMNS = new Set([
  'id',
  'notification_reference',
  'notification_date',
  'reception_hour',
  'province',
  'sector',
  'health_zone',
  'health_area',
  'village_quartier',
  'source_community',
  'source_watch_post',
  'source_reco',
  'source_health_structure',
  'source_sbc',
  'source_morgue',
  'source_frontier',
  'source_airport_port',
  'source_cte_ct',
  'source_other',
  'patient_last_name',
  'patient_first_name',
  'patient_age_years',
  'patient_age_months',
  'patient_sex',
  'patient_profession',
  'patient_address',
  'dds_date',
  'epi_link',
  'epi_link_known',
  'household_head_name',
  'zone_reticence',
  'chef_de_quartier_name',
  'alert_nature',
  'case_status',
  'death_date',
  'clinical_fever',
  'clinical_diarrhea',
  'clinical_vomiting',
  'clinical_hemorrhagic_signs',
  'clinical_other',
  'zone_securisee',
  'investigation_notified_team',
  'team_arrival_date',
  'team_arrival_hour',
  'investigation_start_hour',
  'investigator_name',
  'investigator_phone',
  'alert_validated',
  'alert_conclusion',
  'case_is_suspect',
  'patient_isolated',
  'patient_transferred',
  'patient_sampled',
  'patient_managed_in_community',
  'refused_transfer',
  'not_investigated',
  'others_action',
  'comments',
  'created_by',
  'client_submission_id',
]);

export function flattenFields(sections: SectionDefLike[]): FieldDefLike[] {
  return sections.flatMap((s) => s.fields || []);
}

export function missingRequiredFields(
  sections: SectionDefLike[],
  formData: Record<string, string>
): string[] {
  return flattenFields(sections)
    .filter((f) => f.required)
    .filter((f) => {
      const v = formData[f.id];
      return v === undefined || v === null || String(v).trim() === '';
    })
    .map((f) => f.id);
}

function coerceMveValue(fieldId: string, raw: string, fieldType?: string): unknown {
  if (raw === '') return undefined;
  if (MVE_BOOLEAN_FIELDS.has(fieldId) || fieldType === 'boolean') {
    return raw === 'true' || raw === 'OUI' || raw === '1';
  }
  if (MVE_NUMBER_FIELDS.has(fieldId) || fieldType === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return raw;
}

export function buildMveInsertPayload(input: {
  formData: Record<string, string>;
  sections: SectionDefLike[];
  userId?: string | null;
  clientSubmissionId: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: input.clientSubmissionId,
  };

  for (const field of flattenFields(input.sections)) {
    if (!MVE_COLUMNS.has(field.id)) continue;
    const raw = input.formData[field.id];
    if (raw === undefined || raw === '') continue;
    const value = coerceMveValue(field.id, raw, field.type);
    if (value !== undefined) payload[field.id] = value;
  }

  if (!payload.notification_reference) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    payload.notification_reference = `MVE-${stamp}-${input.clientSubmissionId.slice(0, 8).toUpperCase()}`;
  }

  if (!payload.notification_date) {
    payload.notification_date = new Date().toISOString();
  }

  if (isAuthUserId(input.userId)) {
    payload.created_by = input.userId;
  }

  return payload;
}

export function resolveDiseaseCode(templateCode: string, diseaseCode?: string | null): string {
  if (diseaseCode && diseaseCode !== 'UNKNOWN') return diseaseCode;
  const code = templateCode.toUpperCase();
  if (code.includes('MVE') || code.includes('EBOV') || code.includes('EVD')) return 'EBOV';
  if (code.includes('CHOLERA') || code.includes('CHO')) return 'CHOLERA';
  if (code.includes('MPOX')) return 'MPOX';
  if (code.includes('MEASLES')) return 'MEASLES';
  return diseaseCode || 'UNKNOWN';
}

export function buildFormSubmissionPayload(input: {
  templateId: string;
  templateCode: string;
  templateVersion?: number;
  formData: Record<string, string>;
  userId?: string | null;
  userName?: string | null;
  diseaseId?: string | null;
  diseaseCode?: string | null;
  clientSubmissionId: string;
}): Record<string, unknown> {
  const resolvedDiseaseCode = resolveDiseaseCode(input.templateCode, input.diseaseCode);
  const submittedBy = isAuthUserId(input.userId) ? input.userId : null;

  return {
    id: input.clientSubmissionId,
    form_template_id: input.templateId,
    entity_type: 'INVESTIGATION',
    entity_id: newClientId(),
    submitted_by: submittedBy,
    form_data: {
      ...input.formData,
      _form_code: input.templateCode,
      _form_version: input.templateVersion || 1,
      _submitted_by_name: input.userName || input.formData.investigator_name || 'Anonyme',
      _disease_id: input.diseaseId || null,
      _disease_code: resolvedDiseaseCode,
      _client_submission_id: input.clientSubmissionId,
      full_name:
        input.formData.full_name ||
        [input.formData.patient_last_name, input.formData.patient_first_name].filter(Boolean).join(' ') ||
        undefined,
    },
    submitted_at: new Date().toISOString(),
  };
}

export function buildReportedCasePayload(input: {
  clientSubmissionId: string;
  fullName: string;
  phone: string;
  symptoms: string;
  description: string;
  location?: string;
  diseaseId?: string | null;
  userId?: string | null;
  latitude?: number;
  longitude?: number;
  provinceName?: string;
  healthZoneName?: string;
  healthAreaName?: string;
  village?: string;
}): Record<string, unknown> {
  // Always ensure location is non-null (DB NOT NULL constraint)
  const locationParts = [
    input.provinceName,
    input.healthZoneName,
    input.healthAreaName,
    input.village,
  ].filter(Boolean);
  const resolvedLocation = input.location
    || (locationParts.length > 0 ? locationParts.join(' / ') : 'Localisation non renseignée');

  const locationSource = (input.latitude != null && input.longitude != null)
    ? 'GPS'
    : input.provinceName
      ? 'MANUAL'
      : 'UNKNOWN';

  const payload: Record<string, unknown> = {
    id: input.clientSubmissionId,
    full_name: input.fullName,
    phone: input.phone,
    symptoms: input.symptoms,
    description: input.description,
    // DB CHECK constraint: status IN ('nouveau', 'en_cours', 'validé', 'rejeté', 'Suspect', 'Confirmed')
    status: 'nouveau',
    // DB column is suspected_disease_id, NOT disease_id
    suspected_disease_id: input.diseaseId || null,
    location_source: locationSource,
    // location column is NOT NULL in the DB
    location: resolvedLocation,
  };

  if (input.provinceName)    payload.province_name    = input.provinceName;
  if (input.healthZoneName)  payload.health_zone_name = input.healthZoneName;
  if (input.healthAreaName)  payload.health_area_name = input.healthAreaName;
  if (input.village)         payload.village          = input.village;
  // Note: location is already set above — do NOT double-set it
  if (isAuthUserId(input.userId)) payload.user_id = input.userId;
  if (input.latitude != null && input.longitude != null) {
    payload.latitude  = input.latitude;
    payload.longitude = input.longitude;
    payload.geom      = `POINT(${input.longitude} ${input.latitude})`;
  }
  return payload;
}
