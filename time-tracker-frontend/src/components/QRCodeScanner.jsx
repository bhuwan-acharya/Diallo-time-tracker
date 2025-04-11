import React from "react";
import QrScanner from "react-qr-scanner";

const QRCodeScanner = ({ onScan }) => {
    const handleScan = (data) => {
        if (data) {
            console.log("QR Code Scanned:", data.text);
            if (onScan) {
                onScan(data.text); // Pass the scanned data to the parent component
            }
        }
    };

    const handleError = (error) => {
        console.error("QR Scan Error:", error);
    };

    const previewStyle = {
        height: 400,
        width: 500,
    };

    return (
        <div className="scanner-container">
            <QrScanner
                delay={300}
                style={previewStyle}
                onError={handleError}
                onScan={handleScan}
            />
        </div>
    );
};

export default QRCodeScanner;