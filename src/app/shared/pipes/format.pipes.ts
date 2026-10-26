import { Pipe, PipeTransform } from '@angular/core';
import * as f from '../utils/format';

@Pipe({ name: 'nombre' })
export class NombrePipe implements PipeTransform {
  transform(v?: number | null, decimales = 0): string { return f.nombre(v, decimales); }
}

@Pipe({ name: 'dateCourte' })
export class DateCourtePipe implements PipeTransform {
  transform(v?: string | null): string { return f.dateCourte(v); }
}

@Pipe({ name: 'dateMoyenne' })
export class DateMoyennePipe implements PipeTransform {
  transform(v?: string | null): string { return f.dateMoyenne(v); }
}

@Pipe({ name: 'dateHeure' })
export class DateHeurePipe implements PipeTransform {
  transform(v?: string | null): string { return f.dateHeure(v); }
}

@Pipe({ name: 'heure' })
export class HeurePipe implements PipeTransform {
  transform(v?: string | null): string { return f.heure(v); }
}

@Pipe({ name: 'relatif' })
export class RelatifPipe implements PipeTransform {
  transform(v?: string | null, court = false): string { return court ? f.relatifCourt(v) : f.relatif(v); }
}

@Pipe({ name: 'taille' })
export class TaillePipe implements PipeTransform {
  transform(v?: number | null): string { return f.taille(v); }
}

@Pipe({ name: 'telMasque' })
export class TelMasquePipe implements PipeTransform {
  transform(v?: string | null): string { return f.telMasque(v); }
}

@Pipe({ name: 'telephone' })
export class TelephonePipe implements PipeTransform {
  transform(v?: string | null): string { return f.telephone(v); }
}

export const PIPES = [NombrePipe, DateCourtePipe, DateMoyennePipe, DateHeurePipe, HeurePipe, RelatifPipe, TaillePipe, TelMasquePipe, TelephonePipe] as const;
