import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RiskLevel } from '../src/pages/MapPage.tsx';

function computeProvinceRisk(stats: { confirmed: number; newCases: number; deaths: number; suspected: number; recordAgeDays?: number }): RiskLevel {
  const { confirmed, newCases, deaths, suspected, recordAgeDays = 0 } = stats;
  const isSurveillanceActive = recordAgeDays <= 30;

  if (confirmed > 50 || newCases > 10 || deaths > 20) return 'VERY_HIGH';
  if (confirmed > 10 || suspected > 10) return 'HIGH';
  if (confirmed > 0 || suspected > 0) return 'MODERATE';
  if (isSurveillanceActive) return 'LOW';
  return 'NOT_ASSESSED';
}

function resolveRiskState(dbDataAvailable: boolean, queryFailed: boolean, stats?: { confirmed: number; newCases: number; deaths: number; suspected: number; recordAgeDays?: number }): RiskLevel {
  if (queryFailed) return 'DATA_UNAVAILABLE';
  if (!dbDataAvailable || !stats) return 'NOT_ASSESSED';
  return computeProvinceRisk(stats);
}

describe('PWA GIS Map Risk State & Active Surveillance Coverage Tests', () => {
  it('returns DATA_UNAVAILABLE when database query fails or network error occurs', () => {
    const risk = resolveRiskState(false, true);
    assert.equal(risk, 'DATA_UNAVAILABLE');
  });

  it('returns NOT_ASSESSED when province has no records in database (zero rows without coverage)', () => {
    const risk = resolveRiskState(false, false);
    assert.equal(risk, 'NOT_ASSESSED');
  });

  it('returns NOT_ASSESSED when zero cases reported but surveillance record is stale (> 30 days old)', () => {
    const risk = resolveRiskState(true, false, { confirmed: 0, newCases: 0, deaths: 0, suspected: 0, recordAgeDays: 45 });
    assert.equal(risk, 'NOT_ASSESSED');
  });

  it('returns LOW only when database actively confirms 0 cases with current surveillance coverage (<= 30 days)', () => {
    const risk = resolveRiskState(true, false, { confirmed: 0, newCases: 0, deaths: 0, suspected: 0, recordAgeDays: 2 });
    assert.equal(risk, 'LOW');
  });

  it('returns MODERATE when 1-10 confirmed or suspected cases are reported', () => {
    const risk = resolveRiskState(true, false, { confirmed: 3, newCases: 0, deaths: 0, suspected: 0 });
    assert.equal(risk, 'MODERATE');
  });

  it('returns HIGH when >10 confirmed or suspected cases are reported', () => {
    const risk = resolveRiskState(true, false, { confirmed: 15, newCases: 2, deaths: 1, suspected: 5 });
    assert.equal(risk, 'HIGH');
  });

  it('returns VERY_HIGH when >50 confirmed, >10 new cases, or >20 deaths', () => {
    const risk = resolveRiskState(true, false, { confirmed: 55, newCases: 12, deaths: 25, suspected: 10 });
    assert.equal(risk, 'VERY_HIGH');
  });
});
