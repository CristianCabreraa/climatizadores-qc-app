/**
 * Sharing Engine for WhatsApp, Gmail, Native Android Sheet, and Direct Download
 */

export const ShareEngine = {
  /**
   * Shares the PDF file using Android Native Web Share API if supported
   * Allows picking WhatsApp, Gmail, Drive, etc. directly from Android OS!
   */
  async shareNative(blob, fileName, meta = {}) {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Ficha Técnica - Nº ${meta.serialNumber || ''}`,
          text: `Ficha técnica de control y pruebas de equipo climatizador ${meta.model || ''} (Nº Serie: ${meta.serialNumber || ''}).`
        });
        return { success: true, method: 'native_files' };
      } else if (navigator.share) {
        await navigator.share({
          title: `Ficha Técnica - Nº ${meta.serialNumber || ''}`,
          text: `Ficha técnica de control y pruebas: Modelo ${meta.model || ''}, Serie: ${meta.serialNumber || ''}, Fecha: ${meta.fabricationDate || ''}.`
        });
        return { success: true, method: 'native_text' };
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web Share no disponible o cancelado:', err);
      }
    }
    return { success: false };
  },

  /**
   * Shares summary directly to WhatsApp
   */
  shareWhatsApp(meta = {}, fileName = '') {
    const text = 
`*GREENAIR / GISER - FICHA TÉCNICA DE CONTROL Y PRUEBAS*
━━━━━━━━━━━━━━━━━━━━━━
*Fabricante:* ${meta.fabricante || 'GISER'}
*Modelo:* ${meta.model || 'N/A'}
*Nº de Serie:* ${meta.serialNumber || 'N/A'}
*Fecha Fabricación:* ${meta.fabricationDate || 'N/A'}
*Fecha Ensayo:* ${new Date().toLocaleDateString('es-ES')}

*Personal Responsable:*
- Pre-montador: ${meta.personnel?.preMontador || 'N/A'}
- Montador: ${meta.personnel?.montador || 'N/A'}
- Electricista: ${meta.personnel?.electricista || 'N/A'}

*Estado de Inspección:* ✅ PRUEBAS CONFORMES (OK)
${fileName ? `*Archivo PDF generado:* ${fileName}` : ''}
━━━━━━━━━━━━━━━━━━━━━━`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  },

  /**
   * Shares via Gmail (Google Web Compose) or default mailto
   */
  shareEmail(meta = {}, fileName = '', useGmailWeb = false) {
    const subject = `Ficha Técnica Pruebas - Equipo Climatizador [Nº ${meta.serialNumber || 'SN'}] - ${meta.model || ''}`;
    const body = 
`Estimado equipo,

Se adjunta la ficha técnica y reporte de pruebas de control de calidad del equipo climatizador/recuperador:

DATOS DEL EQUIPO:
- Modelo: ${meta.model || 'N/A'}
- Nº de Serie: ${meta.serialNumber || 'N/A'}
- Fecha de Fabricación: ${meta.fabricationDate || 'N/A'}
- Fecha y Hora de Ensayo: ${new Date().toLocaleString('es-ES')}

PERSONAL ASIGNADO:
- Pre-montador: ${meta.personnel?.preMontador || 'N/A'}
- Montador: ${meta.personnel?.montador || 'N/A'}
- Electricista: ${meta.personnel?.electricista || 'N/A'}

ESTADO: PRUEBAS TÉCNICAS COMPLETADAS CON ÉXITO (OK)
Archivo PDF generado: ${fileName || 'Ficha_Tecnica.pdf'}

Saludos cordiales,
Control de Calidad en Planta`;

    if (useGmailWeb) {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, '_blank');
    } else {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    }
  },

  /**
   * Downloads the PDF file directly to device storage
   */
  downloadFile(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
};
