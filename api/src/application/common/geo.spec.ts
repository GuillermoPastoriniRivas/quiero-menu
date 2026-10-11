import { deriveGeoFromCity } from './geo.js';

describe('Directory geography', () => {
  it('classifies new cities without guessing homonyms', () => {
    expect(deriveGeoFromCity('Resistencia', 'AR').regionSlug).toBe('chaco');
    expect(deriveGeoFromCity('Rosario del Tala', 'AR').regionSlug).toBe(
      'entre-rios',
    );
    expect(deriveGeoFromCity('Florencio Varela', 'AR').regionSlug).toBe(
      'buenos-aires',
    );
    expect(deriveGeoFromCity('25 de Mayo', 'AR').regionSlug).toBe('');
    expect(deriveGeoFromCity('25 de Mayo', 'AR', 'La Pampa').regionSlug).toBe(
      'la-pampa',
    );
  });
  it('never classifies a foreign homonym as an Argentine city', () => {
    expect(deriveGeoFromCity('Victoria', 'CO')).toEqual({
      countrySlug: 'colombia',
      region: '',
      regionSlug: '',
    });
  });
});
