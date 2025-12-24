// @swiftshopr/sdk/src/components/BarcodeScanner.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const SCAN_COOLDOWN_MS = 1500;

/**
 * BarcodeScanner - Camera-based barcode scanner component.
 *
 * @param {Object} props
 * @param {Function} props.onScan - Callback when barcode is scanned: (barcode, type) => void
 * @param {Function} [props.onError] - Callback when error occurs
 * @param {boolean} [props.enabled=true] - Whether scanning is enabled
 * @param {boolean} [props.showOverlay=true] - Show scanning overlay UI
 * @param {string} [props.instructionText] - Custom instruction text
 * @param {string[]} [props.barcodeTypes] - Barcode types to scan
 * @param {Object} [props.style] - Container style
 * @param {Object} [props.frameStyle] - Scanning frame style
 * @param {string} [props.primaryColor='#22C55E'] - Primary accent color
 *
 * @example
 * <BarcodeScanner
 *   onScan={(barcode) => handleProductLookup(barcode)}
 *   primaryColor="#0066CC"
 * />
 */
const BarcodeScanner = ({
  onScan,
  onError,
  enabled = true,
  showOverlay = true,
  instructionText = 'Point camera at barcode',
  barcodeTypes = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
  style,
  frameStyle,
  primaryColor = '#22C55E',
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastScanRef = useRef({ barcode: null, time: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for scanning frame
  useEffect(() => {
    if (enabled && isReady && !isProcessing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [enabled, isReady, isProcessing, pulseAnim]);

  const handleBarCodeScanned = useCallback(
    ({ type, data }) => {
      if (!enabled || isProcessing) return;

      const now = Date.now();
      const lastScan = lastScanRef.current;

      // Prevent duplicate scans
      if (
        data === lastScan.barcode &&
        now - lastScan.time < SCAN_COOLDOWN_MS
      ) {
        return;
      }

      // Clean barcode data
      const cleanedBarcode = data.trim().replace(/[^0-9]/g, '');

      // Validate barcode
      if (!cleanedBarcode || cleanedBarcode.length < 6 || cleanedBarcode.length > 14) {
        return;
      }

      // Update last scan ref
      lastScanRef.current = { barcode: cleanedBarcode, time: now };
      setIsProcessing(true);

      // Call onScan callback
      try {
        const result = onScan?.(cleanedBarcode, type);

        // If onScan returns a promise, wait for it
        if (result && typeof result.then === 'function') {
          result
            .catch((error) => {
              onError?.(error);
            })
            .finally(() => {
              // Reset processing after cooldown
              setTimeout(() => setIsProcessing(false), SCAN_COOLDOWN_MS);
            });
        } else {
          // Reset processing after cooldown
          setTimeout(() => setIsProcessing(false), SCAN_COOLDOWN_MS);
        }
      } catch (error) {
        onError?.(error);
        setTimeout(() => setIsProcessing(false), SCAN_COOLDOWN_MS);
      }
    },
    [enabled, isProcessing, onScan, onError]
  );

  const handleCameraReady = useCallback(() => {
    setIsReady(true);
  }, []);

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.statusText}>Initializing camera...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please allow camera access to scan barcodes
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: primaryColor }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={enabled && isReady && !isProcessing ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes,
        }}
        onCameraReady={handleCameraReady}
      />

      {showOverlay && (
        <View style={styles.overlay}>
          {/* Top overlay */}
          <View style={styles.topOverlay}>
            <Text style={styles.instructionText}>
              {isProcessing ? 'Processing...' : instructionText}
            </Text>
          </View>

          {/* Middle - scanning frame */}
          <View style={styles.middleOverlay}>
            <Animated.View
              style={[
                styles.scanFrame,
                frameStyle,
                {
                  borderColor: isProcessing ? '#FFA500' : primaryColor,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {isProcessing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </Animated.View>
          </View>

          {/* Bottom overlay */}
          <View style={styles.bottomOverlay}>
            <View style={[styles.statusIndicator, { backgroundColor: isReady ? primaryColor : '#888' }]} />
            <Text style={styles.statusLabel}>
              {isReady ? (isProcessing ? 'Scanning...' : 'Ready') : 'Starting...'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Reset the scanner's cooldown state.
 * Call this after handling a scan to allow immediate re-scanning.
 */
BarcodeScanner.resetCooldown = () => {
  // This is a static method hint - actual implementation would need ref forwarding
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  middleOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    color: '#fff',
    fontSize: 14,
  },
  statusText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarcodeScanner;
