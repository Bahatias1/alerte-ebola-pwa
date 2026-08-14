import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAuthUserId, isUniqueViolation, newClientId } from '../src/lib/ids.ts';
import {
  buildFormSubmissionPayload,
  buildMveInsertPayload,
  buildReportedCasePayload,
  missingRequiredFields,
  resolveDiseaseCode,
} from '../src/services/formPayload.ts';

describe('ids', () => {
  it('rejects offline placeholder ids', () => {
    assert.equal(isAuthUserId('admin-uuid-offline'), false);
    assert.equal(isAuthUserId('test-uuid-offline'), false);
    assert.equal(isAuthUserId(null), false);
    assert.equal(isAuthUserId(''), false);
  });

  it('accepts a real UUID', () => {
    assert.equal(isAuthUserId('296ad69c-ee90-4c41-8476-69a57f3bf789'), true);
  });

  it('detects unique violations', () => {
    assert.equal(isUniqueViolation('duplicate key value violates unique constraint'), true);
    assert.equal(isUniqueViolation('23505'), true);
    assert.equal(isUniqueViolation('permission denied'), false);
  });

  it('generates a uuid-shaped client id', () => {
    assert.equal(isAuthUserId(newClientId()), true);
  });
});

describe('formPayload', () => {
  const sections = [
    {
      fields: [
        { id: 'province', type: 'text', required: true },
        { id: 'health_zone', type: 'text', required: true },
        { id: 'health_area', type: 'text', required: true },
        { id: 'clinical_fever', type: 'boolean' },
        { id: 'patient_age_years', type: 'number' },
        { id: 'investigator_email', type: 'text' },
      ],
    },
  ];

  it('lists missing required fields', () => {
    assert.deepEqual(
      missingRequiredFields(sections, { province: 'Nord-Kivu' }),
      ['health_zone', 'health_area']
    );
  });

  it('maps MVE fields to existing columns only and skips fake created_by', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const payload = buildMveInsertPayload({
      formData: {
        province: 'Nord-Kivu',
        health_zone: 'Goma',
        health_area: 'Katindo',
        village_quartier: 'Centre',
        clinical_fever: 'true',
        patient_age_years: '32',
        investigator_email: 'should-not-be-a-column@test.cd',
        patient_last_name: 'TESTEUR',
        patient_first_name: 'FICTIF',
      },
      sections,
      userId: 'admin-uuid-offline',
      clientSubmissionId: id,
    });

    assert.equal(payload.id, id);
    assert.equal(payload.province, 'Nord-Kivu');
    assert.equal(payload.clinical_fever, true);
    assert.equal(payload.patient_age_years, 32);
    assert.equal('investigator_email' in payload, false);
    assert.equal('created_by' in payload, false);
    assert.equal(typeof payload.notification_reference, 'string');
  });

  it('sets created_by only for a real auth UUID', () => {
    const uid = '296ad69c-ee90-4c41-8476-69a57f3bf789';
    const payload = buildMveInsertPayload({
      formData: { province: 'Ituri', health_zone: 'Bunia', health_area: 'AS-1' },
      sections,
      userId: uid,
      clientSubmissionId: newClientId(),
    });
    assert.equal(payload.created_by, uid);
  });

  it('routes MVE template code to EBOV', () => {
    assert.equal(resolveDiseaseCode('FICHE_NOTIF_MVE_V1', null), 'EBOV');
  });

  it('builds form_submissions payload without fake submitted_by', () => {
    const id = newClientId();
    const payload = buildFormSubmissionPayload({
      templateId: newClientId(),
      templateCode: 'FICHE_IDSR_GENERIC_V1',
      formData: { patient_last_name: 'TESTEUR', patient_first_name: 'FICTIF', province: 'Kinshasa' },
      userId: 'test-uuid-offline',
      userName: 'Testeur',
      clientSubmissionId: id,
    });
    assert.equal(payload.submitted_by, null);
    assert.equal(payload.id, id);
    const data = payload.form_data as Record<string, unknown>;
    assert.equal(data.full_name, 'TESTEUR FICTIF');
    assert.equal(data._disease_code, 'UNKNOWN');
  });

  it('maps citizen reports to snake_case columns', () => {
    const id = newClientId();
    const payload = buildReportedCasePayload({
      clientSubmissionId: id,
      fullName: 'Cas Fictif',
      phone: '000000000',
      symptoms: 'Fièvre ≥ 38°C',
      description: 'Données de test',
      latitude: -1.68,
      longitude: 29.22,
      userId: 'admin-uuid-offline',
    });
    assert.equal(payload.full_name, 'Cas Fictif');
    assert.equal(payload.geom, 'POINT(29.22 -1.68)');
    assert.equal('user_id' in payload, false);
    assert.equal('fullName' in payload, false);
  });
});
