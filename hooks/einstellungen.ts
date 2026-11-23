// ─────────────────────────────────────────────────────────────────────────
//  EINSTELLUNGEN DER WINTERLANDSCHAFT
//
//  Hier kannst du alles anpassen, ohne den restlichen Code zu verstehen.
//  Ändere nur die Werte rechts vom Doppelpunkt und speichere die Datei.
//  Die Szene lädt sich danach von selbst neu.
//
//  Farben schreibst du als Hex-Wert mit sechs Stellen, z. B. '#c0392b'.
// ─────────────────────────────────────────────────────────────────────────

/** Mögliche Wetterlagen: 'klar', 'abendrot' oder 'nebel'. */
export type Wetter = 'klar' | 'abendrot' | 'nebel'

export const EINSTELLUNGEN = {
  /** Wie viele Tannen rechts stehen (0 bis 8). */
  anzahlTannen: 3,

  /** Grösse des Schneemanns bzw. der Vogelscheuche (0.6 bis 1.6). */
  figurGroesse: 1.1,

  /** Farben der Accessoires. */
  farben: {
    muetze: '#2f6a9a',
    bommel: '#ffffff',
    schal: '#c0392b',
    faeustlinge: '#c0392b',
    besenstiel: '#8a5a2b',
    besenreisig: '#c9a35a',
  },

  /** Ab wie viel Prozent Kontext ein Accessoire dazukommt. */
  stufen: {
    muetze: 25,
    schal: 50,
    besen: 75,
  },

  /** Anzahl Flocken (bzw. Blätter, Blüten) bei leerem und bei vollem Kontext. */
  flocken: {
    minimum: 12,
    maximum: 240,
  },

  /**
   * Wetter je Modell. Der Name links muss im Modellnamen vorkommen.
   * Ein Modell, das hier fehlt, bekommt 'klar'.
   */
  wetterProModell: {
    opus: 'klar',
    sonnet: 'abendrot',
    haiku: 'nebel',
  } as Record<string, Wetter>,

  /** Wie lange die Klick-Effekte (Gestöber, Smiley) sichtbar bleiben, in Sekunden. */
  klickDauerSekunden: 6,

  /** Welche Anlässe gezeigt werden: true = an, false = aus. */
  anlaesse: {
    ostern: true,
    nationalfeiertag: true,
    advent: true,
    weihnachten: true,
    silvester: true,
  },

  /**
   * Jahreszeiten-Kalender (Monat, Tag). Zwischen Start und Ende wird
   * jeweils fliessend übergeblendet.
   */
  kalender: {
    /** Erster Schnee fällt liegen … */
    schneeBeginnt: [11, 1] as [number, number],
    /** … und ab hier ist alles verschneit. */
    schneeKomplett: [11, 15] as [number, number],
    /** Der Schneemann wird in diesen Tagen gebaut (Kugel um Kugel). */
    schneemannBauBeginn: [11, 8] as [number, number],
    schneemannBauEnde: [11, 15] as [number, number],
    /** Tauwetter: Schnee und Schneemann schmelzen in diesem Zeitraum. */
    schmelzeBeginn: [3, 1] as [number, number],
    schmelzeEnde: [3, 31] as [number, number],
  },
}
