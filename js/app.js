/**
 * Main Application Controller
 * Coordinates UI, OCR scanning, Personnel management, Photo evidence, and PDF report generation.
 */
import { ImageCompressor } from './compressor.js';
import { TagOCR } from './ocr.js';
import { PersonnelStorage } from './storage.js';
import { PDFGenerator } from './pdf-generator.js';
import { ShareEngine } from './share.js';

class AppController {
  constructor() {
    this.photos = [];
    this.currentPdfBlob = null;
    this.currentPdfFileName = '';
    this.activeManageRole = null;
  }

  init() {
    PersonnelStorage.init();
    this.renderPersonnelDropdowns();
    this.bindEvents();
    this.updatePhotoCounter();
    console.log('App QC Climatizadores iniciada con éxito.');
  }

  // ----------------------------------------------------
  // EVENT BINDINGS
  // ----------------------------------------------------
  bindEvents() {
    // OCR plate input (Camera or file)
    const plateInput = document.getElementById('plateFileInput');
    if (plateInput) {
      plateInput.addEventListener('change', (e) => this.handlePlateUpload(e));
    }

    // Demo Sample Plate Button
    const btnSamplePlate = document.getElementById('btnSamplePlate');
    if (btnSamplePlate) {
      btnSamplePlate.addEventListener('click', () => this.loadSamplePlateDemo());
    }

    // Real GISER Plate Photo Button
    const btnRealPlatePhoto = document.getElementById('btnRealPlatePhoto');
    if (btnRealPlatePhoto) {
      btnRealPlatePhoto.addEventListener('click', () => this.loadRealPlatePhoto());
    }

    // Photo evidence input
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
    }

    // Demo Photos Button
    const btnSamplePhotos = document.getElementById('btnSamplePhotos');
    if (btnSamplePhotos) {
      btnSamplePhotos.addEventListener('click', () => this.loadSamplePhotosDemo());
    }

    // Quick Check All Checkpoints
    const btnCheckAll = document.getElementById('btnCheckAll');
    if (btnCheckAll) {
      btnCheckAll.addEventListener('click', () => this.checkAllCheckpoints(true));
    }

    // Optional components toggles
    const chkSondaCo2 = document.getElementById('chkSondaCo2');
    if (chkSondaCo2) {
      chkSondaCo2.addEventListener('change', (e) => {
        const sub = document.getElementById('subSondaCo2Container');
        if (sub) sub.classList.toggle('hidden', !e.target.checked);
      });
    }

    const chkMando = document.getElementById('chkMando');
    if (chkMando) {
      chkMando.addEventListener('change', (e) => {
        const sub = document.getElementById('subMandoContainer');
        if (sub) sub.classList.toggle('hidden', !e.target.checked);
      });
    }

    // Add Technician Buttons (+)
    document.querySelectorAll('[data-add-role]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-add-role');
        this.openAddTechnicianModal(role);
      });
    });

    // Manage Personnel Buttons (gear icon)
    document.querySelectorAll('[data-manage-role]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.getAttribute('data-manage-role');
        this.openManagePersonnelModal(role);
      });
    });

    // Save Technician Modal Events
    const btnSaveNewTech = document.getElementById('btnSaveNewTech');
    if (btnSaveNewTech) {
      btnSaveNewTech.addEventListener('click', () => this.saveNewTechnician());
    }

    const btnCloseTechModal = document.getElementById('btnCloseTechModal');
    if (btnCloseTechModal) {
      btnCloseTechModal.addEventListener('click', () => this.closeAddTechnicianModal());
    }

    const btnCloseManageModal = document.getElementById('btnCloseManageModal');
    if (btnCloseManageModal) {
      btnCloseManageModal.addEventListener('click', () => this.closeManageModal());
    }

    // MAIN SAVE BUTTON: "Guardar Ficha"
    const btnSaveReport = document.getElementById('btnSaveReport');
    if (btnSaveReport) {
      btnSaveReport.addEventListener('click', () => this.saveAndGenerateReport());
    }

    // Share Modal Actions
    const btnShareNative = document.getElementById('btnShareNative');
    if (btnShareNative) {
      btnShareNative.addEventListener('click', () => this.sharePdfNative());
    }

    const btnShareWhatsapp = document.getElementById('btnShareWhatsapp');
    if (btnShareWhatsapp) {
      btnShareWhatsapp.addEventListener('click', () => this.sharePdfWhatsApp());
    }

    const btnShareEmail = document.getElementById('btnShareEmail');
    if (btnShareEmail) {
      btnShareEmail.addEventListener('click', () => this.sharePdfEmail());
    }

    const btnDownloadPdf = document.getElementById('btnDownloadPdf');
    if (btnDownloadPdf) {
      btnDownloadPdf.addEventListener('click', () => this.downloadCurrentPdf());
    }

    const btnCloseShareModal = document.getElementById('btnCloseShareModal');
    if (btnCloseShareModal) {
      btnCloseShareModal.addEventListener('click', () => this.closeShareModal());
    }
  }

  // ----------------------------------------------------
  // OCR PROCESSING
  // ----------------------------------------------------
  async handlePlateUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    await this.runOcrOnImage(file);
    event.target.value = '';
  }

  async loadSamplePlateDemo() {
    this.showToast('Generando etiqueta de muestra (GSR26 15/20 H-M)...', 'info');
    const sampleDataUrl = TagOCR.createSamplePlateDataUrl('GSR26 15/20 H-M', '2209946', '27/10/2026');
    await this.runOcrOnImage(sampleDataUrl);
  }

  async loadRealPlatePhoto() {
    this.showToast('Cargando fotografía real de la etiqueta GISER...', 'info');
    await this.runOcrOnImage('assets/sample-plate.jpg');
  }

  async runOcrOnImage(imageSource) {
    const ocrStatusContainer = document.getElementById('ocrStatusContainer');
    const ocrProgressBar = document.getElementById('ocrProgressBar');
    const ocrStatusText = document.getElementById('ocrStatusText');
    const platePreviewImg = document.getElementById('platePreviewImg');
    const platePreviewContainer = document.getElementById('platePreviewContainer');

    if (ocrStatusContainer) ocrStatusContainer.classList.remove('hidden');

    try {
      // Show local preview immediately
      if (typeof imageSource === 'string') {
        if (platePreviewImg) platePreviewImg.src = imageSource;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (platePreviewImg) platePreviewImg.src = e.target.result;
        };
        reader.readAsDataURL(imageSource);
      }
      if (platePreviewContainer) platePreviewContainer.classList.remove('hidden');

      // Process OCR
      const result = await TagOCR.processPlate(imageSource, (progress, message) => {
        if (ocrProgressBar) ocrProgressBar.style.width = `${progress}%`;
        if (ocrStatusText) ocrStatusText.innerText = message;
      });

      // Auto-populate inputs
      const modelInput = document.getElementById('modelInput');
      const serialInput = document.getElementById('serialInput');
      const fabDateInput = document.getElementById('fabDateInput');

      if (modelInput && result.model) {
        modelInput.value = result.model;
        this.highlightInput(modelInput);
      }
      if (serialInput && result.serialNumber) {
        serialInput.value = result.serialNumber;
        this.highlightInput(serialInput);
      }
      if (fabDateInput && result.fabricationDate) {
        fabDateInput.value = result.fabricationDate;
        this.highlightInput(fabDateInput);
      }

      const selectFabricante = document.getElementById('selectFabricante');
      if (selectFabricante && result.fabricante) {
        selectFabricante.value = result.fabricante;
        this.highlightInput(selectFabricante);
      }

      this.showToast(`OCR Exitoso: ${result.model} | Nº ${result.serialNumber}`, 'success');

      setTimeout(() => {
        if (ocrStatusContainer) ocrStatusContainer.classList.add('hidden');
      }, 2500);

    } catch (err) {
      console.error('Error OCR:', err);
      this.showToast('No se pudo leer la placa automáticamente. Ingrésela manualmente.', 'error');
      if (ocrStatusContainer) ocrStatusContainer.classList.add('hidden');
    }
  }

  highlightInput(inputEl) {
    inputEl.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50');
    setTimeout(() => {
      inputEl.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50');
    }, 2000);
  }

  // ----------------------------------------------------
  // CHECKPOINTS LOGIC
  // ----------------------------------------------------
  checkAllCheckpoints(status = true) {
    const ids = ['cpPresostatos', 'cpVentImpulsion', 'cpVentRetorno', 'cpTempImpulsion', 'cpTempRetorno'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = status;
    });
    this.showToast('Todos los checkpoints marcados como Correctos (OK)', 'success');
  }

  // ----------------------------------------------------
  // PERSONNEL & MANUFACTURER ROSTER MANAGEMENT
  // ----------------------------------------------------
  renderPersonnelDropdowns() {
    this.renderSingleDropdown('fabricante', 'selectFabricante');
    this.renderSingleDropdown('pre_montador', 'selectPreMontador');
    this.renderSingleDropdown('montador', 'selectMontador');
    this.renderSingleDropdown('electricista', 'selectElectricista');
  }

  renderSingleDropdown(role, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentVal = select.value;
    const list = PersonnelStorage.getList(role);

    select.innerHTML = '<option value="">-- Seleccionar de la lista --</option>';
    list.forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.innerText = name;
      if (name === currentVal) opt.selected = true;
      select.appendChild(opt);
    });

    // If no value selected and list has items, select the first by default (GISER for fabricante)
    if (!select.value && list.length > 0) {
      select.selectedIndex = 1;
    }
  }

  openAddTechnicianModal(role) {
    this.activeManageRole = role;
    const modal = document.getElementById('addTechModal');
    const input = document.getElementById('newTechNameInput');
    const roleTitle = document.getElementById('newTechRoleTitle');

    const roleNames = {
      fabricante: 'Fabricante del Equipo (ej: GISER)',
      pre_montador: 'Pre-montador (Armado de partes)',
      montador: 'Montador (Armado de máquina)',
      electricista: 'Electricista (Cableado y pruebas)'
    };

    if (roleTitle) roleTitle.innerText = roleNames[role] || role;
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
    if (modal) modal.classList.remove('hidden');
  }

  closeAddTechnicianModal() {
    const modal = document.getElementById('addTechModal');
    if (modal) modal.classList.add('hidden');
    this.activeManageRole = null;
  }

  saveNewTechnician() {
    const input = document.getElementById('newTechNameInput');
    const name = input ? input.value.trim() : '';

    if (!name) {
      this.showToast('Por favor escribe el nombre completo.', 'warning');
      return;
    }

    if (!this.activeManageRole) return;

    PersonnelStorage.addName(this.activeManageRole, name);
    this.renderPersonnelDropdowns();

    // Auto-select the newly added item
    const selectMap = {
      fabricante: 'selectFabricante',
      pre_montador: 'selectPreMontador',
      montador: 'selectMontador',
      electricista: 'selectElectricista'
    };
    const sel = document.getElementById(selectMap[this.activeManageRole]);
    if (sel) sel.value = name;

    const label = this.activeManageRole === 'fabricante' ? 'Fabricante' : 'Operario';
    this.showToast(`${label} "${name}" añadido y guardado localmente.`, 'success');
    this.closeAddTechnicianModal();
  }

  openManagePersonnelModal(role) {
    this.activeManageRole = role;
    const modal = document.getElementById('managePersonnelModal');
    const listContainer = document.getElementById('managePersonnelList');
    const title = document.getElementById('manageRoleTitle');

    const roleNames = {
      fabricante: 'Fabricantes',
      pre_montador: 'Pre-montadores',
      montador: 'Montadores',
      electricista: 'Electricistas'
    };

    if (title) title.innerText = `Gestionar lista de ${roleNames[role] || role}`;

    this.renderManageList();
    if (modal) modal.classList.remove('hidden');
  }

  renderManageList() {
    const listContainer = document.getElementById('managePersonnelList');
    if (!listContainer || !this.activeManageRole) return;

    const list = PersonnelStorage.getList(this.activeManageRole);
    listContainer.innerHTML = '';

    if (list.length === 0) {
      listContainer.innerHTML = '<p class="text-sm text-slate-500 py-3 text-center">No hay personal registrado en esta categoría.</p>';
      return;
    }

    list.forEach((name) => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200';
      item.innerHTML = `
        <span class="text-sm font-medium text-slate-800">${name}</span>
        <button class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition" title="Eliminar ${name}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      `;

      // Delete action
      item.querySelector('button').addEventListener('click', () => {
        if (confirm(`¿Estás seguro de eliminar a "${name}" de la lista local?`)) {
          PersonnelStorage.removeName(this.activeManageRole, name);
          this.renderManageList();
          this.renderPersonnelDropdowns();
          this.showToast(`"${name}" eliminado de la lista.`, 'info');
        }
      });

      listContainer.appendChild(item);
    });
  }

  closeManageModal() {
    const modal = document.getElementById('managePersonnelModal');
    if (modal) modal.classList.add('hidden');
    this.activeManageRole = null;
  }

  // ----------------------------------------------------
  // PHOTOGRAPHIC EVIDENCE MANAGEMENT
  // ----------------------------------------------------
  async handlePhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    this.showToast(`Comprimiendo y procesando ${files.length} fotografía(s)...`, 'info');

    for (const file of files) {
      try {
        const compressed = await ImageCompressor.compress(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.78
        });

        const defaultCaptions = [
          'Placa y Vista Frontal',
          'Cuadro Eléctrico y Ventiladores',
          'Ensayos de Flujo y Presión',
          'Detalle de Conexiones',
          'Inspección Final de Acabados'
        ];
        const caption = defaultCaptions[this.photos.length] || `Evidencia ${this.photos.length + 1}`;

        this.photos.push({
          dataUrl: compressed.dataUrl,
          sizeKb: compressed.sizeKb,
          caption,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error('Error al comprimir foto:', err);
      }
    }

    this.renderPhotoGallery();
    this.updatePhotoCounter();
    event.target.value = '';
  }

  loadSamplePhotosDemo() {
    this.showToast('Generando 3 fotografías de prueba optimizadas...', 'info');

    // Create 3 realistic synthetic photo canvases for demo
    const captions = [
      'Vista Frontal y Placa de Identificación',
      'Cuadro de Control y Conexión de Ventiladores',
      'Pruebas de Impulsión y Presostatos en Marcha'
    ];
    const colors = [
      ['#0284c7', '#0369a1', 'CLIMATIZADOR GSR26 EN BANCO DE ENSAYO'],
      ['#059669', '#047857', 'CUADRO ELÉCTRICO CABLEADO Y BORNERAS'],
      ['#7c3aed', '#6d28d9', 'MEDICIÓN TÉRMICA Y DIFERENCIAL DE PRESIÓN']
    ];

    this.photos = [];
    colors.forEach(([c1, c2, title], idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
        ctx.stroke();
      }
      for (let y = 0; y < 480; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Title & badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(20, 20, 600, 70);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(`FOTO ${idx + 1}: ${captions[idx]}`, 35, 62);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(title, 35, 130);
      ctx.fillText(`Fecha: ${new Date().toLocaleDateString('es-ES')} | Inspección QC`, 35, 160);

      // Watermark
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillText('GREENAIR QC TEST', 140, 300);

      this.photos.push({
        dataUrl: canvas.toDataURL('image/jpeg', 0.8),
        sizeKb: 65,
        caption: captions[idx],
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      });
    });

    this.renderPhotoGallery();
    this.updatePhotoCounter();
    this.showToast('3 fotos de prueba cargadas correctamente.', 'success');
  }

  renderPhotoGallery() {
    const gallery = document.getElementById('photoGalleryContainer');
    if (!gallery) return;

    gallery.innerHTML = '';

    this.photos.forEach((photo, idx) => {
      const card = document.createElement('div');
      card.className = 'relative group rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm';
      card.innerHTML = `
        <div class="aspect-video w-full bg-slate-100 overflow-hidden relative">
          <img src="${photo.dataUrl}" alt="${photo.caption}" class="w-full h-full object-cover">
          <span class="badge-step">Foto ${idx + 1}</span>
          <span class="absolute top-2 right-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
            ${photo.sizeKb} KB
          </span>
        </div>
        <div class="p-2.5 flex items-center justify-between gap-2">
          <input type="text" class="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-sky-500" value="${photo.caption}">
          <button class="btn-delete-photo text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 flex-shrink-0" title="Eliminar foto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `;

      // Update caption on input change
      const captionInput = card.querySelector('input');
      captionInput.addEventListener('change', (e) => {
        this.photos[idx].caption = e.target.value.trim() || `Evidencia ${idx + 1}`;
      });

      // Delete photo
      const deleteBtn = card.querySelector('.btn-delete-photo');
      deleteBtn.addEventListener('click', () => {
        this.photos.splice(idx, 1);
        this.renderPhotoGallery();
        this.updatePhotoCounter();
      });

      gallery.appendChild(card);
    });
  }

  updatePhotoCounter() {
    const badge = document.getElementById('photoCounterBadge');
    const warning = document.getElementById('photoMinWarning');
    const count = this.photos.length;

    if (badge) {
      badge.innerText = `${count} de 3 mínimas`;
      if (count >= 3) {
        badge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300';
      } else {
        badge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300';
      }
    }

    if (warning) {
      warning.classList.toggle('hidden', count >= 3);
    }
  }

  // ----------------------------------------------------
  // COLLECT FORM DATA & VALIDATE
  // ----------------------------------------------------
  getFormData() {
    const fabricante = (document.getElementById('selectFabricante')?.value || 'GISER').trim();
    const model = (document.getElementById('modelInput')?.value || '').trim();
    const serialNumber = (document.getElementById('serialInput')?.value || '').trim();
    const fabricationDate = (document.getElementById('fabDateInput')?.value || '').trim();

    const checkpoints = {
      presostatos: !!document.getElementById('cpPresostatos')?.checked,
      ventImpulsion: !!document.getElementById('cpVentImpulsion')?.checked,
      ventRetorno: !!document.getElementById('cpVentRetorno')?.checked,
      tempImpulsion: !!document.getElementById('cpTempImpulsion')?.checked,
      tempRetorno: !!document.getElementById('cpTempRetorno')?.checked,
    };

    const hasSondaCo2 = !!document.getElementById('chkSondaCo2')?.checked;
    const workingSondaCo2 = hasSondaCo2 && !!document.getElementById('chkSondaCo2Ok')?.checked;

    const hasMando = !!document.getElementById('chkMando')?.checked;
    const workingMando = hasMando && !!document.getElementById('chkMandoOk')?.checked;

    const personnel = {
      preMontador: document.getElementById('selectPreMontador')?.value || '',
      montador: document.getElementById('selectMontador')?.value || '',
      electricista: document.getElementById('selectElectricista')?.value || '',
    };

    return {
      fabricante,
      model,
      serialNumber,
      fabricationDate,
      checkpoints,
      optionals: {
        sondaCo2: { has: hasSondaCo2, working: workingSondaCo2 },
        mandoSuperficie: { has: hasMando, working: workingMando }
      },
      personnel,
      photos: this.photos
    };
  }

  validateForm(data) {
    if (!data.serialNumber) {
      this.showToast('El Número de Serie es obligatorio (ingréselo o léalo por OCR).', 'error');
      document.getElementById('serialInput')?.focus();
      return false;
    }

    if (!data.model) {
      this.showToast('El Modelo de la máquina es obligatorio.', 'error');
      document.getElementById('modelInput')?.focus();
      return false;
    }

    if (data.photos.length < 3) {
      this.showToast(`Se requieren al menos 3 fotografías de la máquina en funcionamiento (actualmente tiene ${data.photos.length}).`, 'warning');
      document.getElementById('photoSection')?.scrollIntoView({ behavior: 'smooth' });
      return false;
    }

    return true;
  }

  // ----------------------------------------------------
  // MAIN SAVE & REPORT GENERATION: "Guardar Ficha"
  // ----------------------------------------------------
  async saveAndGenerateReport() {
    const data = this.getFormData();
    if (!this.validateForm(data)) return;

    const btnSave = document.getElementById('btnSaveReport');
    const originalText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = `
      <svg class="w-5 h-5 animate-spin-fast mr-2 inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      Generando Ficha PDF y guardando...
    `;

    try {
      // 1. Generate PDF
      const result = await PDFGenerator.generateReport(data);
      this.currentPdfBlob = result.blob;
      this.currentPdfFileName = result.fileName;

      // 2. Save record to local history
      PersonnelStorage.saveReportToHistory({
        serialNumber: data.serialNumber,
        model: data.model,
        fabricante: data.fabricante,
        date: data.fabricationDate,
        preMontador: data.personnel.preMontador,
        montador: data.personnel.montador,
        electricista: data.personnel.electricista,
        checkpointsOk: Object.values(data.checkpoints).every(Boolean),
        photosCount: data.photos.length
      });

      // 3. Show Success & Sharing Dialog
      this.openShareModal(data, result.fileName);
      this.showToast(`¡Ficha guardada con éxito! Archivo: ${result.fileName}`, 'success');

    } catch (err) {
      console.error('Error al generar PDF:', err);
      this.showToast('Error al generar el documento PDF: ' + err.message, 'error');
    } finally {
      btnSave.disabled = false;
      btnSave.innerHTML = originalText;
    }
  }

  // ----------------------------------------------------
  // SHARING ACTIONS
  // ----------------------------------------------------
  openShareModal(data, fileName) {
    const modal = document.getElementById('shareModal');
    const labelFileName = document.getElementById('shareModalFileName');
    const labelSerial = document.getElementById('shareModalSerial');

    if (labelFileName) labelFileName.innerText = fileName;
    if (labelSerial) labelSerial.innerText = `Nº Serie: ${data.serialNumber}`;

    if (modal) modal.classList.remove('hidden');
  }

  closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.add('hidden');
  }

  async sharePdfNative() {
    if (!this.currentPdfBlob) return;
    const data = this.getFormData();
    await ShareEngine.shareNative(this.currentPdfBlob, this.currentPdfFileName, data);
  }

  sharePdfWhatsApp() {
    const data = this.getFormData();
    ShareEngine.shareWhatsApp(data, this.currentPdfFileName);
    // Also trigger download if user wants to attach the downloaded file manually in WA Web
    if (this.currentPdfBlob) {
      ShareEngine.downloadFile(this.currentPdfBlob, this.currentPdfFileName);
    }
  }

  sharePdfEmail() {
    const data = this.getFormData();
    ShareEngine.shareEmail(data, this.currentPdfFileName, true);
    if (this.currentPdfBlob) {
      ShareEngine.downloadFile(this.currentPdfBlob, this.currentPdfFileName);
    }
  }

  downloadCurrentPdf() {
    if (!this.currentPdfBlob) return;
    ShareEngine.downloadFile(this.currentPdfBlob, this.currentPdfFileName);
    this.showToast(`Descargando ${this.currentPdfFileName}...`, 'info');
  }

  // ----------------------------------------------------
  // TOAST NOTIFICATIONS
  // ----------------------------------------------------
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-500 text-slate-900',
      info: 'bg-slate-900 text-white'
    };

    toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all transform duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  window.__QC_APP__ = app;
});
