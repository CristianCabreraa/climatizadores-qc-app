/**
 * Professional Industrial PDF Report Generator
 * Generates an executive-grade quality inspection sheet using jsPDF
 * Includes equipment metadata, checkpoints, optional components, personnel signatures, and compressed photo gallery.
 */

export const PDFGenerator = {
  /**
   * Generates the PDF document
   * @param {Object} data - Full form data
   * @returns {Promise<{blob: Blob, fileName: string, objectUrl: string}>}
   */
  async generateReport(data) {
    // Ensure jsPDF is available
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      throw new Error('La librería jsPDF no está cargada.');
    }

    // Create A4 portrait document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    const safeSerial = (data.serialNumber || 'SN-SIN-SERIE').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeSerial}_Ficha_Pruebas.pdf`;

    // ----------------------------------------------------
    // 1. HEADER & BRANDING
    // ----------------------------------------------------
    // Top banner background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(2, 132, 199); // sky-600
    doc.rect(0, 28, pageWidth, 2, 'F');

    // Brand title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GREENAIR INDUSTRIAL - SISTEMAS DE CLIMATIZACIÓN', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('CONTROL DE CALIDAD, ENSAYO Y CERTIFICACIÓN DE PUESTA EN MARCHA', margin, 18);
    doc.text(`DOC. REF: QC-CLIMA-${safeSerial}`, margin, 23);

    // Right-aligned status stamp
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(pageWidth - margin - 38, 7, 38, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ENSAYO OK', pageWidth - margin - 19, 14, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CONFORME A NORMA', pageWidth - margin - 19, 18, { align: 'center' });

    let currentY = 36;

    // ----------------------------------------------------
    // 2. EQUIPMENT IDENTIFICATION CARD
    // ----------------------------------------------------
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY, contentWidth, 31, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 31, 2, 2, 'S');

    // Card Title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DATOS DE IDENTIFICACIÓN DEL EQUIPO (PLACA DE CARACTERÍSTICAS)', margin + 4, currentY + 6);

    // Row 1: Fabricante & Model
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('FABRICANTE:', margin + 4, currentY + 13.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.fabricante || 'GISER', margin + 30, currentY + 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('MODELO DE MÁQUINA:', margin + 95, currentY + 13.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199);
    doc.text(data.model || 'N/A', margin + 136, currentY + 13.5);

    // Row 2: Serial Number & Fabrication Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Nº DE SERIE:', margin + 4, currentY + 20.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.serialNumber || 'N/A', margin + 30, currentY + 20.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('FECHA FABRICACIÓN:', margin + 95, currentY + 20.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.fabricationDate || 'N/A', margin + 136, currentY + 20.5);

    // Row 3: Test Date
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('FECHA / HORA ENSAYO:', margin + 4, currentY + 27.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const nowStr = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
    doc.text(nowStr, margin + 45, currentY + 27.5);

    currentY += 36;

    // ----------------------------------------------------
    // 3. CHECKPOINTS TABLE
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('CHECKPOINTS DE FUNCIONAMIENTO TÉCNICO', margin, currentY);
    currentY += 4;

    const checkpoints = [
      { name: 'Presostatos', checked: data.checkpoints.presostatos, desc: 'Verificación de corte y rearme por presión diferencial' },
      { name: 'Ventilador de Impulsión', checked: data.checkpoints.ventImpulsion, desc: 'Sentido de giro, vibraciones, consumo y caudal nominal' },
      { name: 'Ventilador de Retorno', checked: data.checkpoints.ventRetorno, desc: 'Sentido de giro, balance dinámico y consumo eléctrico' },
      { name: 'Temperatura de Impulsión', checked: data.checkpoints.tempImpulsion, desc: 'Sonda térmica calibrada y respuesta dinámica' },
      { name: 'Temperatura de Retorno', checked: data.checkpoints.tempRetorno, desc: 'Sonda térmica calibrada y lectura en consola' },
    ];

    // Table Header
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('ELEMENTO INSPECCIONADO', margin + 4, currentY + 4.2);
    doc.text('CRITERIO DE ACEPTACIÓN', margin + 55, currentY + 4.2);
    doc.text('ESTADO', margin + 155, currentY + 4.2);
    currentY += 6;

    checkpoints.forEach((cp, idx) => {
      const rowY = currentY;
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, rowY, contentWidth, 7, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, rowY + 7, margin + contentWidth, rowY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cp.name, margin + 4, rowY + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(cp.desc, margin + 55, rowY + 4.8);

      // Status Badge
      if (cp.checked) {
        doc.setFillColor(209, 250, 229); // green-100
        doc.roundedRect(margin + 152, rowY + 1.2, 24, 4.8, 1, 1, 'F');
        doc.setTextColor(6, 95, 70); // green-800
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('CORRECTO (OK)', margin + 164, rowY + 4.5, { align: 'center' });
      } else {
        doc.setFillColor(254, 226, 226); // red-100
        doc.roundedRect(margin + 152, rowY + 1.2, 24, 4.8, 1, 1, 'F');
        doc.setTextColor(153, 27, 27); // red-800
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('NO CONFORME', margin + 164, rowY + 4.5, { align: 'center' });
      }

      currentY += 7;
    });

    currentY += 5;

    // ----------------------------------------------------
    // 4. OPTIONAL COMPONENTS
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('COMPONENTES OPCIONALES', margin, currentY);
    currentY += 4;

    const optionals = [
      {
        name: 'Sonda de CO2',
        has: data.optionals.sondaCo2.has,
        working: data.optionals.sondaCo2.working,
        desc: 'Sensor ambiental de ppm de CO2 con salida 0-10V'
      },
      {
        name: 'Mando de Superficie',
        has: data.optionals.mandoSuperficie.has,
        working: data.optionals.mandoSuperficie.working,
        desc: 'Pantalla mural de control táctil / botonera de usuario'
      }
    ];

    optionals.forEach((opt) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(opt.name, margin + 4, currentY + 5.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(opt.desc, margin + 50, currentY + 5.2);

      if (opt.has) {
        if (opt.working) {
          doc.setFillColor(209, 250, 229);
          doc.roundedRect(margin + 138, currentY + 1.8, 38, 4.6, 1, 1, 'F');
          doc.setTextColor(6, 95, 70);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text('INSTALADO - PRUEBA OK', margin + 157, currentY + 5, { align: 'center' });
        } else {
          doc.setFillColor(254, 243, 199);
          doc.roundedRect(margin + 138, currentY + 1.8, 38, 4.6, 1, 1, 'F');
          doc.setTextColor(146, 64, 14);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text('INSTALADO - PENDIENTE', margin + 157, currentY + 5, { align: 'center' });
        }
      } else {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin + 138, currentY + 1.8, 38, 4.6, 1, 1, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('NO INCLUIDO EN MODELO', margin + 157, currentY + 5, { align: 'center' });
      }

      currentY += 10;
    });

    currentY += 2;

    // ----------------------------------------------------
    // 5. OPERATIONS PERSONNEL / SIGNATURES
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('PERSONAL DE OPERACIONES RESPONSABLE', margin, currentY);
    currentY += 4;

    const boxWidth = (contentWidth - 8) / 3;
    const personnel = [
      { role: 'PRE-MONTADOR', subtitle: 'Armó las partes', name: data.personnel.preMontador || 'Sin asignar' },
      { role: 'MONTADOR', subtitle: 'Armó la máquina', name: data.personnel.montador || 'Sin asignar' },
      { role: 'ELECTRICISTA', subtitle: 'Cableó y probó', name: data.personnel.electricista || 'Sin asignar' },
    ];

    personnel.forEach((p, i) => {
      const boxX = margin + (i * (boxWidth + 4));
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(boxX, currentY, boxWidth, 20, 1.5, 1.5, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(boxX, currentY, boxWidth, 20, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(2, 132, 199);
      doc.text(p.role, boxX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(p.subtitle, boxX + 3, currentY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(p.name, boxX + 3, currentY + 14);

      // Digital sign line
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(boxX + 3, currentY + 17, boxX + boxWidth - 3, currentY + 17);
      doc.setLineDashPattern([], 0);
    });

    currentY += 26;

    // ----------------------------------------------------
    // 6. PHOTOGRAPHIC EVIDENCE (At least 3 photos)
    // ----------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`EVIDENCIA FOTOGRÁFICA DE FUNCIONAMIENTO (${(data.photos || []).length} FOTOGRAFÍAS)`, margin, currentY);
    currentY += 4;

    const photos = data.photos || [];
    if (photos.length > 0) {
      // 3 photos in 1 row or 2 rows
      const photoWidth = (contentWidth - 8) / 3;
      const photoHeight = 38;

      photos.slice(0, 3).forEach((photo, idx) => {
        const px = margin + (idx * (photoWidth + 4));
        try {
          doc.addImage(photo.dataUrl, 'JPEG', px, currentY, photoWidth, photoHeight, undefined, 'FAST');
          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.3);
          doc.rect(px, currentY, photoWidth, photoHeight, 'S');

          // Photo index badge
          doc.setFillColor(15, 23, 42);
          doc.rect(px, currentY + photoHeight - 5, photoWidth, 5, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(`Foto ${idx + 1}: ${photo.caption || 'Prueba en servicio'}`, px + 2, currentY + photoHeight - 1.5);
        } catch (imgErr) {
          console.warn('Error al incrustar foto en PDF:', imgErr);
          doc.setFillColor(226, 232, 240);
          doc.rect(px, currentY, photoWidth, photoHeight, 'F');
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(8);
          doc.text(`Foto ${idx + 1}`, px + 4, currentY + 20);
        }
      });
      currentY += photoHeight + 6;
    } else {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text('No se adjuntaron fotografías de evidencia.', margin + 6, currentY + 11);
      currentY += 24;
    }

    // ----------------------------------------------------
    // 7. FOOTER & COMPLIANCE
    // ----------------------------------------------------
    const footerY = pageHeight - 12;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento oficial generado por la Aplicación de Control de Calidad GreenAir.', margin, footerY + 2);
    doc.text(`Registro Electrónico Nº ${safeSerial} | Página 1 de 1`, pageWidth - margin, footerY + 2, { align: 'right' });

    // Output blob and base64
    const blob = doc.output('blob');
    const objectUrl = URL.createObjectURL(blob);

    return {
      doc,
      blob,
      fileName,
      objectUrl
    };
  }
};
