import { Download } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { displayShortUrl, qrFilename } from '../utils/format';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';

export default function QRCodeModal({ shortUrl, onClose }) {
  const [dataUrl, setDataUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const filename = qrFilename(shortUrl);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(shortUrl, { width: 512, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0b1020', light: '#ffffff' } })
      .then((url) => active && setDataUrl(url))
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [shortUrl]);

  return (
    <Modal title="QR code" onClose={onClose} labelledBy="qr-title" size="sm">
      <div className="qr-body">
        <div className="qr-frame">
          {dataUrl ? <img src={dataUrl} alt={`QR code for ${shortUrl}`} width="240" height="240" /> : failed ? <p className="form-error">Could not generate the QR code.</p> : <LoadingSpinner label="Generating QR code" />}
        </div>
        <p className="qr-url">{displayShortUrl(shortUrl)}</p>
        <p className="muted small">File name: <code>{filename}</code></p>
        {dataUrl ? (
          <a className="btn btn-primary btn-block" href={dataUrl} download={filename}><Download size={18} /> Download PNG</a>
        ) : (
          <button type="button" className="btn btn-primary btn-block" disabled><Download size={18} /> Download PNG</button>
        )}
      </div>
    </Modal>
  );
}
