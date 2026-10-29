/**
 * Local Storage Manager for Manufacturers, Operations Personnel and Test Drafts
 * Manages dynamic rosters for:
 * - Fabricantes (Fabricante del equipo: GISER, etc.)
 * - Pre-montadores (Armado de partes)
 * - Montadores (Armado de máquina)
 * - Electricistas (Cableado y pruebas)
 * with persistence, add, and delete capabilities.
 */

const STORAGE_KEYS = {
  FABRICANTES: 'qc_fabricantes',
  PRE_MONTADORES: 'qc_pre_montadores',
  MONTADORES: 'qc_montadores',
  ELECTRICISTAS: 'qc_electricistas',
  LAST_DRAFT: 'qc_last_draft',
  SAVED_REPORTS: 'qc_saved_reports_history'
};

const DEFAULT_DATA = {
  fabricantes: ['GISER', 'GreenAir Industrial', 'Tecna Clima', 'Systemair', 'Salvador Escoda', 'Daikin Industrial'],
  preMontadores: ['Juan Antonio Pérez', 'Marcos Delgado', 'Lucas Santoro', 'Roberto Silva'],
  montadores: ['Carlos Rodríguez', 'David Martínez', 'Alejandro Morales', 'Javier Gómez'],
  electricistas: ['Miguel Ángel Rivas', 'Andrés Mendoza', 'Laura Fernández', 'Víctor Hugo Peña']
};

export const PersonnelStorage = {
  /**
   * Initializes local lists with defaults if empty
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.FABRICANTES)) {
      localStorage.setItem(STORAGE_KEYS.FABRICANTES, JSON.stringify(DEFAULT_DATA.fabricantes));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRE_MONTADORES)) {
      localStorage.setItem(STORAGE_KEYS.PRE_MONTADORES, JSON.stringify(DEFAULT_DATA.preMontadores));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MONTADORES)) {
      localStorage.setItem(STORAGE_KEYS.MONTADORES, JSON.stringify(DEFAULT_DATA.montadores));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ELECTRICISTAS)) {
      localStorage.setItem(STORAGE_KEYS.ELECTRICISTAS, JSON.stringify(DEFAULT_DATA.electricistas));
    }
  },

  /**
   * Get list by category: 'fabricante' | 'pre_montador' | 'montador' | 'electricista'
   */
  getList(role) {
    this.init();
    let key;
    switch (role) {
      case 'fabricante':
        key = STORAGE_KEYS.FABRICANTES;
        break;
      case 'pre_montador':
        key = STORAGE_KEYS.PRE_MONTADORES;
        break;
      case 'montador':
        key = STORAGE_KEYS.MONTADORES;
        break;
      case 'electricista':
        key = STORAGE_KEYS.ELECTRICISTAS;
        break;
      default:
        return [];
    }

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error al leer de localStorage:', e);
      return [];
    }
  },

  /**
   * Adds a new item/name to the given category
   */
  addName(role, rawName) {
    const name = rawName ? rawName.trim() : '';
    if (!name) return false;

    const list = this.getList(role);
    if (!list.includes(name)) {
      list.push(name);
      list.sort((a, b) => a.localeCompare(b));
      this.saveList(role, list);
      return true;
    }
    return false;
  },

  /**
   * Removes an item/name from the given category
   */
  removeName(role, name) {
    const list = this.getList(role);
    const updated = list.filter(item => item !== name);
    this.saveList(role, updated);
    return true;
  },

  /**
   * Persists list to localStorage
   */
  saveList(role, list) {
    let key;
    switch (role) {
      case 'fabricante':
        key = STORAGE_KEYS.FABRICANTES;
        break;
      case 'pre_montador':
        key = STORAGE_KEYS.PRE_MONTADORES;
        break;
      case 'montador':
        key = STORAGE_KEYS.MONTADORES;
        break;
      case 'electricista':
        key = STORAGE_KEYS.ELECTRICISTAS;
        break;
      default:
        return;
    }
    localStorage.setItem(key, JSON.stringify(list));
  },

  /**
   * Saves a completed test record into history
   */
  saveReportToHistory(report) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_REPORTS);
      const history = raw ? JSON.parse(raw) : [];
      const summary = {
        serialNumber: report.serialNumber,
        model: report.model,
        fabricante: report.fabricante || 'GISER',
        date: report.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        preMontador: report.preMontador,
        montador: report.montador,
        electricista: report.electricista,
        allCheckpointsOk: report.checkpointsOk,
        photosCount: report.photosCount || 0
      };
      history.unshift(summary);
      if (history.length > 50) history.pop();
      localStorage.setItem(STORAGE_KEYS.SAVED_REPORTS, JSON.stringify(history));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
  }
};
